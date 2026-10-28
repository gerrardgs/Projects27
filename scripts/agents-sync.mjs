#!/usr/bin/env node
// Mirrors .agents/skills into .claude/skills and validates the agent instruction files.
//
// Usage (Node.js 22+, no dependencies):
//   node scripts/agents-sync.mjs           sync the mirror, then validate
//   node scripts/agents-sync.mjs --check   validate only; exit 1 on errors or mirror drift (for CI)
//   add --all-markdown to check links in every Markdown file of the repository, not only the spec files

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_SKILLS = path.join(ROOT, ".agents", "skills");
const RULES_DIR = path.join(ROOT, ".agents", "rules");
const MIRRORS = [path.join(ROOT, ".claude", "skills")];
const MANIFEST_NAME = ".agents-sync.json";
const IGNORED_NAMES = new Set([".DS_Store", "node_modules", "__pycache__", ".venv", ".mypy_cache", ".ruff_cache"]);
const LINK_SCAN_EXCLUDES = new Set([".git", ".archive", "node_modules", ".claude"]);

// Limits from the Agent Skills specification (https://agentskills.io/specification).
const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKILL_NAME_MAX = 64;
const SKILL_DESCRIPTION_MAX = 1024;
const SKILL_COMPATIBILITY_MAX = 500;
const SKILL_BODY_MAX_LINES = 500;
// Claude's Agent Skills (API and claude.ai) reject names containing these words; keep skills portable to them.
// https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
const SKILL_NAME_RESERVED_WORDS = ["anthropic", "claude"];
// Rule activation values shared by Antigravity (.agents/rules) and Windsurf (.windsurf/rules).
const RULE_TRIGGERS = new Set(["always_on", "model_decision", "glob", "manual"]);
// Windsurf caps workspace rule files at 12,000 characters; Antigravity at 24,000 bytes. Use the stricter one.
const RULE_MAX_CHARS = 12_000;
// Claude Code recommends CLAUDE.md files under 200 lines; AGENTS.md is imported into it.
const AGENTS_MD_MAX_LINES = 200;
// Antigravity budgets 20,000 tokens for always-on rules; estimate tokens as characters / 4.
const ALWAYS_ON_TOKEN_BUDGET = 20_000;
const LEGACY_FILES = [".cursorrules", ".windsurfrules"];

const errors = [];
const warnings = [];
const relative = (absolutePath) => path.relative(ROOT, absolutePath) || ".";
const fail = (where, message) => errors.push(`${relative(where)}: ${message}`);
const warn = (where, message) => warnings.push(`${relative(where)}: ${message}`);

/**
 * Parses the YAML subset used in frontmatter: plain and quoted scalars, block scalars, string maps and lists.
 * It is deliberately strict: anything a real YAML parser could read differently (for example an unquoted
 * value containing ": ") is an error, because tools such as Antigravity drop files with invalid frontmatter.
 */
/** The indented (or blank) lines that belong to the key on line `index`. */
function indentedLinesAfter(lines, index) {
  const nested = [];
  for (let next = index + 1; next < lines.length; next += 1) {
    if (!/^\s+\S/.test(lines[next]) && lines[next].trim() !== "") break;
    nested.push(lines[next]);
  }
  return nested;
}

export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (match === null) {
    return { data: null, body: text };
  }
  const lines = match[1].split(/\r?\n/);
  const data = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const pair = /^([A-Za-z0-9_-]+):(?:\s+(.*))?$/.exec(line);
    if (pair === null) {
      throw new Error(`unsupported frontmatter line ${index + 1}: "${line}"`);
    }
    const [, key, rawValue = ""] = pair;
    if (Object.hasOwn(data, key)) throw new Error(`duplicate key "${key}"`);
    const nested = indentedLinesAfter(lines, index);
    index += nested.length;
    data[key] = parseValue(key, rawValue.trim(), nested);
  }
  return { data, body: text.slice(match[0].length) };
}

function parseValue(key, value, nested) {
  const content = nested.map((line) => line.trim()).filter((line) => line !== "");
  if (/^[>|][-+]?$/.test(value)) {
    return value.startsWith(">") ? content.join(" ") : content.join("\n");
  }
  if (content.length > 0 && value !== "") {
    throw new Error(`key "${key}" has both an inline value and indented lines`);
  }
  if (value === "" && content.length > 0) {
    if (content.every((line) => line.startsWith("- "))) {
      return content.map((line) => parseScalar(key, line.slice(2)));
    }
    return Object.fromEntries(
      content.map((line) => {
        const entry = /^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/.exec(line);
        if (entry === null) throw new Error(`unsupported nested line under "${key}": "${line}"`);
        return [entry[1], parseScalar(`${key}.${entry[1]}`, entry[2] ?? "")];
      }),
    );
  }
  if (value.startsWith("[")) {
    const flow = /^\[(.*)\]\s*(?:#.*)?$/.exec(value);
    if (flow === null) throw new Error(`key "${key}" has an unterminated flow list`);
    return flow[1]
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .map((item) => parseScalar(key, item));
  }
  return parseScalar(key, value);
}

const DOUBLE_QUOTE_ESCAPES = { n: "\n", t: "\t", '"': '"', "\\": "\\", "/": "/" };

/** Parses one scalar, rejecting plain values that YAML would parse differently or not at all. */
export function parseScalar(key, raw) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    const quoted = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(value);
    if (quoted === null) throw new Error(`key "${key}" has a malformed double-quoted string`);
    return quoted[1].replace(/\\(.)/g, (_, escaped) => {
      if (!Object.hasOwn(DOUBLE_QUOTE_ESCAPES, escaped))
        throw new Error(`key "${key}" uses unsupported escape \\${escaped}`);
      return DOUBLE_QUOTE_ESCAPES[escaped];
    });
  }
  if (value.startsWith("'")) {
    const quoted = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(value);
    if (quoted === null) throw new Error(`key "${key}" has a malformed single-quoted string`);
    return quoted[1].replaceAll("''", "'");
  }
  const plain = value.replace(/\s+#.*$/, "");
  if (/^[-?:,[\]{}#&*!|>%@`]/.test(plain)) {
    throw new Error(`key "${key}": a plain value cannot start with "${plain[0]}"; wrap the value in double quotes`);
  }
  if (/:\s/.test(plain) || plain.endsWith(":")) {
    throw new Error(
      `key "${key}": unquoted value contains ": ", which is invalid YAML; wrap the value in double quotes`,
    );
  }
  return plain;
}

async function listFiles(directory) {
  if (!existsSync(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files.sort();
}

async function treeFingerprint(directory) {
  const hash = createHash("sha256");
  for (const file of await listFiles(directory)) {
    hash.update(path.relative(directory, file));
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function sourceSkillNames() {
  if (!existsSync(SOURCE_SKILLS)) return [];
  const entries = await readdir(SOURCE_SKILLS, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !IGNORED_NAMES.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function readManifest(mirror) {
  const manifestPath = path.join(mirror, MANIFEST_NAME);
  if (!existsSync(manifestPath)) return [];
  const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
  return Array.isArray(parsed.skills) ? parsed.skills.filter((name) => typeof name === "string") : [];
}

/** Copies each source skill into the mirror. Removes only skills this script created earlier (tracked in the manifest). */
async function syncMirror(mirror, skillNames) {
  await mkdir(mirror, { recursive: true });
  const previouslySynced = await readManifest(mirror);
  for (const staleName of previouslySynced.filter((name) => !skillNames.includes(name))) {
    if (!SKILL_NAME_PATTERN.test(staleName)) continue;
    await rm(path.join(mirror, staleName), { recursive: true, force: true });
    console.log(`removed stale mirror ${relative(path.join(mirror, staleName))}`);
  }
  for (const name of skillNames) {
    const target = path.join(mirror, name);
    const unmanaged = existsSync(target) && !previouslySynced.includes(name);
    if (unmanaged) {
      fail(target, "exists but was not created by this script; rename one of the two skills, then re-run");
      continue;
    }
    await rm(target, { recursive: true, force: true });
    await cp(path.join(SOURCE_SKILLS, name), target, {
      recursive: true,
      filter: (source) => !IGNORED_NAMES.has(path.basename(source)),
    });
  }
  const manifest = { generatedBy: "scripts/agents-sync.mjs", source: ".agents/skills", skills: skillNames };
  await writeFile(path.join(mirror, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`synced ${skillNames.length} skill(s) to ${relative(mirror)}`);
}

async function checkMirror(mirror, skillNames) {
  for (const name of skillNames) {
    const target = path.join(mirror, name);
    if (!existsSync(target)) {
      fail(target, "missing; run `node scripts/agents-sync.mjs`");
    } else if ((await treeFingerprint(target)) !== (await treeFingerprint(path.join(SOURCE_SKILLS, name)))) {
      fail(target, "differs from .agents/skills; edit the source and run `node scripts/agents-sync.mjs`");
    }
  }
  for (const staleName of (await readManifest(mirror)).filter((name) => !skillNames.includes(name))) {
    fail(path.join(mirror, staleName), "mirror of a deleted skill; run `node scripts/agents-sync.mjs`");
  }
}

/** Parses frontmatter, reporting a failure and returning undefined when it is invalid. */
function frontmatterOrFail(file, text) {
  try {
    return parseFrontmatter(text);
  } catch (error) {
    fail(file, `invalid frontmatter: ${error.message}`);
    return undefined;
  }
}

function skillNameProblem(name, directoryName) {
  if (typeof name !== "string" || name.length === 0 || name.length > SKILL_NAME_MAX) {
    return `name must be 1-${SKILL_NAME_MAX} characters`;
  }
  if (!SKILL_NAME_PATTERN.test(name)) {
    return "name may contain only lowercase letters, digits and single hyphens, not at the start or end";
  }
  const reserved = SKILL_NAME_RESERVED_WORDS.find((word) => name.includes(word));
  if (reserved !== undefined) return `name must not contain the reserved word "${reserved}"`;
  return name === directoryName ? null : `name "${name}" must match its directory name "${directoryName}"`;
}

function descriptionProblem(description) {
  if (typeof description !== "string" || description.length === 0) return "description is required";
  return description.length > SKILL_DESCRIPTION_MAX
    ? `description is ${description.length} characters; maximum is ${SKILL_DESCRIPTION_MAX}`
    : null;
}

function optionalFieldsProblems({ compatibility, metadata }) {
  const problems = [];
  if (
    compatibility !== undefined &&
    (typeof compatibility !== "string" || compatibility.length > SKILL_COMPATIBILITY_MAX)
  ) {
    problems.push(`compatibility must be a string of at most ${SKILL_COMPATIBILITY_MAX} characters`);
  }
  if (metadata !== undefined && (typeof metadata !== "object" || Array.isArray(metadata))) {
    problems.push("metadata must be a map of string keys to string values");
  }
  return problems;
}

/** Pure checks of a skill's frontmatter against the Agent Skills specification. Returns error messages. */
export function skillFrontmatterProblems(data, directoryName) {
  return [
    skillNameProblem(data.name, directoryName),
    descriptionProblem(data.description),
    ...optionalFieldsProblems(data),
  ].filter((problem) => problem !== null);
}

async function validateSkill(name) {
  const skillFile = path.join(SOURCE_SKILLS, name, "SKILL.md");
  if (!existsSync(skillFile)) {
    fail(path.join(SOURCE_SKILLS, name), "missing SKILL.md");
    return;
  }
  const parsed = frontmatterOrFail(skillFile, await readFile(skillFile, "utf8"));
  if (parsed === undefined) return;
  if (parsed.data === null) {
    fail(skillFile, "missing YAML frontmatter");
    return;
  }
  for (const problem of skillFrontmatterProblems(parsed.data, name)) fail(skillFile, problem);
  const bodyLines = parsed.body.split("\n").length;
  if (bodyLines > SKILL_BODY_MAX_LINES) {
    warn(
      skillFile,
      `SKILL.md body has ${bodyLines} lines; keep it under ${SKILL_BODY_MAX_LINES} and move detail to references/`,
    );
  }
}

/** Pure checks of a rule's activation frontmatter (Antigravity and Windsurf format). Returns error messages. */
export function ruleFrontmatterProblems(data) {
  if (data === null || !RULE_TRIGGERS.has(data.trigger)) {
    return [
      `needs frontmatter "trigger: ${[...RULE_TRIGGERS].join(" | ")}" (Antigravity silently ignores rules without it)`,
    ];
  }
  const problems = [];
  if (data.trigger === "model_decision" && !data.description) problems.push("model_decision rules need a description");
  if (data.trigger === "glob" && !data.globs && !data.glob) problems.push("glob rules need globs");
  return problems;
}

async function validateRules() {
  let alwaysOnChars = 0;
  const alwaysOnFiles = [];
  const ruleFiles = [];
  for (const file of (await listFiles(RULES_DIR)).filter((candidate) => candidate.endsWith(".md"))) {
    const text = await readFile(file, "utf8");
    if (text.length > RULE_MAX_CHARS)
      fail(file, `${text.length} characters; keep rule files at or under ${RULE_MAX_CHARS}`);
    const parsed = frontmatterOrFail(file, text);
    if (parsed === undefined) continue;
    ruleFiles.push(file);
    const problems = ruleFrontmatterProblems(parsed.data);
    for (const problem of problems) fail(file, problem);
    if (problems.length === 0 && parsed.data.trigger === "always_on") {
      alwaysOnChars += text.length;
      alwaysOnFiles.push(file);
    }
  }
  return { alwaysOnChars, alwaysOnFiles, ruleFiles };
}

/** AGENTS.md is the router for tools that do not load .agents/ natively, so it must link every rule and skill. */
async function validateIndex(ruleFiles, skillNames) {
  const agentsFile = path.join(ROOT, "AGENTS.md");
  if (!existsSync(agentsFile)) return;
  const agentsText = await readFile(agentsFile, "utf8");
  for (const file of ruleFiles) {
    const link = `(${path.relative(ROOT, file).split(path.sep).join("/")})`;
    if (!agentsText.includes(link)) fail(agentsFile, `does not link rule ${relative(file)}; add it to the rules index`);
  }
  for (const name of skillNames) {
    if (!agentsText.includes(`(.agents/skills/${name}/SKILL.md)`)) {
      fail(agentsFile, `does not link skill "${name}"; add it to the skills index`);
    }
  }
}

/** Claude Code reads CLAUDE.md instead of AGENTS.md, so CLAUDE.md should import AGENTS.md and the always-on rules. */
async function validateClaudeImports(alwaysOnFiles) {
  const claudeFile = path.join(ROOT, "CLAUDE.md");
  if (!existsSync(claudeFile)) return;
  const importLines = new Set(
    (await readFile(claudeFile, "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("@")),
  );
  if (!importLines.has("@AGENTS.md"))
    fail(claudeFile, 'must contain the line "@AGENTS.md" so Claude Code loads the shared rules');
  for (const file of alwaysOnFiles) {
    const expected = `@${path.relative(ROOT, file).split(path.sep).join("/")}`;
    if (!importLines.has(expected)) warn(claudeFile, `does not import always-on rule "${expected}"`);
  }
}

async function validateAlwaysOnBudget({ alwaysOnChars: alwaysOnRuleChars }) {
  const agentsFile = path.join(ROOT, "AGENTS.md");
  if (!existsSync(agentsFile)) {
    fail(agentsFile, "missing");
    return;
  }
  const agentsText = await readFile(agentsFile, "utf8");
  const lineCount = agentsText.split("\n").length;
  if (lineCount > AGENTS_MD_MAX_LINES) {
    warn(agentsFile, `${lineCount} lines; keep it under ${AGENTS_MD_MAX_LINES} and move detail into rules or skills`);
  }
  const estimatedTokens = Math.round((agentsText.length + alwaysOnRuleChars) / 4);
  if (estimatedTokens > ALWAYS_ON_TOKEN_BUDGET) {
    warn(agentsFile, `always-on context is about ${estimatedTokens} tokens; budget is ${ALWAYS_ON_TOKEN_BUDGET}`);
  }
  console.log(`always-on context: AGENTS.md ${lineCount} lines, about ${estimatedTokens} tokens with always_on rules`);
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (LINK_SCAN_EXCLUDES.has(entry.name) || IGNORED_NAMES.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(fullPath)));
    else if (entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files;
}

const SPEC_MARKDOWN = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", path.join(".github", "copilot-instructions.md")];

async function linkScanTargets(allMarkdown) {
  if (allMarkdown) return markdownFiles(ROOT);
  const files = SPEC_MARKDOWN.map((name) => path.join(ROOT, name)).filter((file) => existsSync(file));
  const agentsDir = path.join(ROOT, ".agents");
  if (existsSync(agentsDir)) files.push(...(await markdownFiles(agentsDir)));
  return files;
}

async function validateLinks(allMarkdown) {
  const linkPattern = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const file of await linkScanTargets(allMarkdown)) {
    const text = (await readFile(file, "utf8")).replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
    for (const [, target] of text.matchAll(linkPattern)) {
      if (target.startsWith("file:")) {
        fail(file, `"${target}" is a machine-specific file: link; use a relative path`);
        continue;
      }
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
      const targetPath = decodeURIComponent(target.split("#")[0]);
      if (!existsSync(path.resolve(path.dirname(file), targetPath))) {
        fail(file, `broken link "${target}"`);
      }
    }
  }
}

async function validateLegacyFiles() {
  for (const name of LEGACY_FILES) {
    if (existsSync(path.join(ROOT, name))) {
      warn(
        path.join(ROOT, name),
        "legacy file; its tool also reads AGENTS.md, so this duplicates instructions. Remove it",
      );
    }
  }
  const rootSkills = path.join(ROOT, "skills");
  if (existsSync(rootSkills) && (await stat(rootSkills)).isDirectory()) {
    warn(
      rootSkills,
      "duplicates .agents/skills; coding agents load skills from .agents/skills or .claude/skills, not from here (a root skills/ folder is only a convention for publishing skill repositories)",
    );
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const skillNames = await sourceSkillNames();
  for (const mirror of MIRRORS) {
    if (checkOnly) await checkMirror(mirror, skillNames);
    else await syncMirror(mirror, skillNames);
  }
  for (const name of skillNames) await validateSkill(name);
  const rules = await validateRules();
  await validateAlwaysOnBudget(rules);
  await validateIndex(rules.ruleFiles, skillNames);
  await validateClaudeImports(rules.alwaysOnFiles);
  await validateLinks(process.argv.includes("--all-markdown"));
  await validateLegacyFiles();

  for (const message of warnings) console.warn(`warning: ${message}`);
  for (const message of errors) console.error(`error: ${message}`);
  console.log(`${skillNames.length} skill(s) checked, ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exitCode = errors.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
