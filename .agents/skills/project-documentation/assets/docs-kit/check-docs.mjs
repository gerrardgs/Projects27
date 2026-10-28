#!/usr/bin/env node
// Checks that a project's docs/ folder holds the complete documentation set and that every document has
// real content: an owner, a review date, a status, every required section filled, enough substance, no
// leftover template markers, and working relative links. Optional documents are checked only when present.
// Node.js 22+, no dependencies.
//
// Usage:
//   node check-docs.mjs [--dir docs] [--strict] [--max-age 180]
//     --dir      documentation folder (default: docs)
//     --strict   treat warnings (draft status, stale review date, TBD/TODO) as errors
//     --max-age  days after which "Last reviewed" is reported as stale (default: 180)
// A document that does not apply sets "Status: not-applicable" and a "Reason:" line instead of sections.
// Exit code 1 when any error (or, with --strict, any warning) is found.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LONG = 150;
const SHORT = 80;
const MIN_SECTION_WORDS = 8;

/** The documentation set: file, required level-2 sections (in any order), minimum words, and whether optional. */
export const DOC_SET = [
  { file: "README.md", minWords: SHORT, sections: ["Purpose", "Documents", "Keeping docs current"] },
  { file: "AGENTS.md", minWords: SHORT, sections: ["Scope", "Rules for editing docs", "Verification"] },
  { file: "CLAUDE.md", minWords: 0, sections: [], mustContain: "@AGENTS.md" },
  {
    file: "PRD.md",
    minWords: LONG,
    sections: [
      "Problem",
      "Users and jobs",
      "Goals and success metrics",
      "Scope",
      "Requirements",
      "User flows",
      "Acceptance criteria",
      "Risks and open questions",
    ],
  },
  {
    file: "ARCHITECTURE.md",
    minWords: LONG,
    sections: ["Context", "Building blocks", "Data flow", "Quality attributes", "Decisions", "Constraints"],
  },
  {
    file: "TECHSTACKS.md",
    minWords: SHORT,
    sections: [
      "Languages and runtimes",
      "Frameworks and libraries",
      "Tooling",
      "Services and hosting",
      "Upgrade policy",
    ],
  },
  {
    file: "CODE_STYLE.md",
    minWords: SHORT,
    sections: [
      "Formatting and linting",
      "Naming",
      "Project structure",
      "Components",
      "Comments",
      "Commits and branches",
    ],
  },
  {
    file: "RULES.md",
    minWords: SHORT,
    sections: ["Non-negotiables", "Business rules", "Agent and contributor rules", "Exceptions"],
  },
  {
    file: "DESIGN.md",
    minWords: SHORT,
    sections: ["Identity", "Audience and tone", "Visual direction", "Dials", "Do and avoid", "References"],
  },
  {
    file: "DESIGN_SYSTEM.md",
    minWords: LONG,
    sections: ["Tokens", "Themes", "Components", "Accessibility", "Contribution and versioning", "Tools"],
  },
  {
    file: "ASSETS.md",
    minWords: SHORT,
    sections: ["Inventory", "Fonts", "Icons", "Images and media", "Export specifications", "Source files"],
  },
  {
    file: "API.md",
    minWords: LONG,
    sections: ["Overview", "Authentication", "Endpoints", "Errors", "Limits", "Versioning", "Examples"],
  },
  {
    file: "DATABASE.md",
    minWords: LONG,
    sections: [
      "Engine and version",
      "Environments",
      "Migrations",
      "Backup and restore",
      "Access and roles",
      "Performance",
      "Retention and privacy",
    ],
  },
  {
    file: "SCHEMA.md",
    minWords: LONG,
    sections: ["Entities", "Tables", "Relationships", "Enumerations", "Validation", "Schema changes"],
  },
  {
    file: "SECURITY.md",
    minWords: LONG,
    sections: [
      "Threat model",
      "Authentication and authorization",
      "Secrets",
      "Data protection",
      "Supply chain",
      "Browser security",
      "Incidents and reporting",
    ],
  },
  {
    file: "TESTING.md",
    minWords: LONG,
    sections: [
      "Strategy",
      "Commands",
      "Coverage",
      "Test data",
      "Accessibility and visual tests",
      "Continuous integration",
    ],
  },
  {
    file: "DEBUGGING.md",
    minWords: SHORT,
    sections: ["Local setup", "Logs and tools", "Common problems", "Escalation"],
  },
  {
    file: "DEPLOYMENT.md",
    minWords: LONG,
    sections: ["Environments", "Pipeline", "Configuration and secrets", "Release steps", "Rollback", "After a deploy"],
  },
  {
    file: "DOCUMENTATION.md",
    minWords: SHORT,
    sections: ["Document types", "Where docs live", "Ownership and review", "Writing style", "Checks"],
  },
  {
    file: "ACCESSIBILITY.md",
    minWords: LONG,
    sections: [
      "Target and scope",
      "Conformance status",
      "Known issues",
      "Testing",
      "Accessibility statement",
      "Design and content",
    ],
  },
  {
    file: "PERFORMANCE.md",
    minWords: SHORT,
    sections: ["Budgets", "Measurement", "Current results", "Optimisations in place", "Regressions and alerts"],
  },
  {
    file: "PRIVACY.md",
    minWords: LONG,
    sections: [
      "Personal data",
      "Purposes and legal basis",
      "Consent and cookies",
      "Third parties and transfers",
      "Retention and deletion",
      "User rights",
      "Assessments",
    ],
  },
  { file: "GLOSSARY.md", minWords: SHORT, sections: ["Terms", "Avoid"] },
  // Optional: checked only when the file exists (add them when the project has the concern).
  {
    file: "ANALYTICS.md",
    optional: true,
    minWords: SHORT,
    sections: ["Questions", "Events", "Consent", "Data quality", "Tools and access"],
  },
  {
    file: "I18N.md",
    optional: true,
    minWords: SHORT,
    sections: ["Locales", "Translation workflow", "Formatting", "Right-to-left", "Testing"],
  },
  {
    file: "SEO.md",
    optional: true,
    minWords: SHORT,
    sections: ["Indexing", "Metadata", "Structured data", "Performance", "Monitoring"],
  },
  {
    file: "RUNBOOK.md",
    optional: true,
    minWords: SHORT,
    sections: ["Services and owners", "Alerts", "Procedures", "Incident response", "Contacts"],
  },
];

const STATUSES = new Set(["current", "draft", "not-applicable"]);
const META_PATTERNS = [
  ["Owner", /^Owner:[ \t]*(.*)$/im],
  ["Last reviewed", /^Last reviewed:[ \t]*(.*)$/im],
  ["Status", /^Status:[ \t]*(.*)$/im],
  ["Reason", /^Reason:[ \t]*(.*)$/im],
];
const TEMPLATE_MARKER = /<!--\s*doc:/i;
const FILLER = /lorem ipsum/i;
const UNFINISHED = /\b(TBD|TODO|FIXME)\b/;

const words = (text) => text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
const withoutCode = (text) => text.replace(/```[\s\S]*?```/g, " ");

/** Title, metadata lines (Owner, Last reviewed, Status, Reason) and level-2 sections of a Markdown document. */
export function parseDoc(text) {
  const title = /^# (.+)$/m.exec(text)?.[1]?.trim();
  const meta = {};
  for (const [key, pattern] of META_PATTERNS) {
    const match = pattern.exec(text);
    if (match) meta[key] = match[1].trim();
  }
  const sections = new Map();
  const parts = text.split(/^## /m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf("\n");
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1).split(/^# /m)[0];
    sections.set(heading.toLowerCase(), body);
  }
  return { title, meta, sections };
}

/** Relative link targets in a Markdown document (external, anchor-only and mail links are skipped). */
export function relativeLinks(text) {
  const targets = [];
  for (const match of withoutCode(text).matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    targets.push(target.split("#")[0]);
  }
  return targets.filter((target) => target.length > 0);
}

function reviewDateIssues(value, today, maxAgeDays) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || Number.isNaN(Date.parse(value))) {
    return [{ level: "error", message: 'needs "Last reviewed: YYYY-MM-DD"' }];
  }
  if (value > today) return [{ level: "error", message: `"Last reviewed" ${value} is in the future` }];
  const ageDays = (Date.parse(today) - Date.parse(value)) / 86_400_000;
  return ageDays > maxAgeDays
    ? [{ level: "warning", message: `last reviewed ${value}, more than ${maxAgeDays} days ago` }]
    : [];
}

function metadataIssues(doc, today, maxAgeDays) {
  const issues = [];
  if (!doc.title) issues.push({ level: "error", message: "needs a level-1 title (# Title)" });
  if (!doc.meta.Owner) issues.push({ level: "error", message: 'needs "Owner: <person or team>"' });
  if (!STATUSES.has(doc.meta.Status ?? "")) {
    issues.push({ level: "error", message: 'needs "Status: current", "draft" or "not-applicable"' });
  }
  if (doc.meta.Status === "draft") issues.push({ level: "warning", message: "status is draft" });
  return [...issues, ...reviewDateIssues(doc.meta["Last reviewed"], today, maxAgeDays)];
}

function contentIssues(text, doc, spec) {
  const issues = [];
  if (spec.mustContain && !text.includes(spec.mustContain)) {
    issues.push({ level: "error", message: `must contain ${spec.mustContain}` });
  }
  for (const heading of spec.sections) {
    const body = doc.sections.get(heading.toLowerCase());
    if (body === undefined) issues.push({ level: "error", message: `missing section "## ${heading}"` });
    else if (words(withoutCode(body)) < MIN_SECTION_WORDS) {
      issues.push({ level: "error", message: `section "${heading}" has no real content` });
    }
  }
  const total = words(withoutCode(text));
  if (total < spec.minWords)
    issues.push({ level: "error", message: `only ${total} words; needs at least ${spec.minWords}` });
  return issues;
}

function hygieneIssues(text) {
  const issues = [];
  if (TEMPLATE_MARKER.test(text))
    issues.push({ level: "error", message: "template guidance (<!-- doc: ... -->) left in" });
  if (FILLER.test(text)) issues.push({ level: "error", message: "contains lorem ipsum filler" });
  if (UNFINISHED.test(withoutCode(text))) issues.push({ level: "warning", message: "contains TBD, TODO or FIXME" });
  return issues;
}

/** All issues for one document's text against its specification. */
export function checkDoc(text, spec, { today, maxAgeDays = 180 }) {
  const doc = parseDoc(text);
  const issues = [...metadataIssues(doc, today, maxAgeDays), ...hygieneIssues(text)];
  if (doc.meta.Status === "not-applicable") {
    if (!doc.meta.Reason) issues.push({ level: "error", message: 'not-applicable needs a "Reason:" line' });
    return issues;
  }
  return [...issues, ...contentIssues(text, doc, spec)];
}

function parseArgs(argv) {
  const options = { dir: "docs", strict: false, maxAgeDays: 180 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--strict") options.strict = true;
    else if (arg === "--dir") options.dir = argv[++index];
    else if (arg === "--max-age") options.maxAgeDays = Number(argv[++index]);
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!options.dir || !Number.isFinite(options.maxAgeDays)) throw new Error("--dir and --max-age need a value");
  return options;
}

async function checkFile(dir, spec, options) {
  const file = path.join(dir, spec.file);
  if (!existsSync(file)) {
    return spec.optional ? [] : [{ level: "error", message: "missing (create it, or mark it not-applicable)" }];
  }
  const text = await readFile(file, "utf8");
  const issues = checkDoc(text, spec, options);
  for (const target of relativeLinks(text)) {
    if (!existsSync(path.resolve(dir, decodeURI(target)))) {
      issues.push({ level: "error", message: `broken link ${target}` });
    }
  }
  return issues;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const dir = path.resolve(options.dir);
  const today = new Date().toISOString().slice(0, 10);
  let errors = 0;
  let warnings = 0;
  const checked = DOC_SET.filter((spec) => !spec.optional || existsSync(path.join(dir, spec.file)));
  for (const spec of checked) {
    for (const issue of await checkFile(dir, spec, { ...options, today })) {
      const failing = issue.level === "error" || options.strict;
      if (failing) errors += 1;
      else warnings += 1;
      (failing ? console.error : console.warn)(`${failing ? "error" : "warning"}: ${spec.file}: ${issue.message}`);
    }
  }
  console.log(`${checked.length} document(s) checked in ${options.dir}: ${errors} error(s), ${warnings} warning(s)`);
  process.exitCode = errors > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`check-docs: ${error.message}`);
    process.exitCode = 2;
  });
}
