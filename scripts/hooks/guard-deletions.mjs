#!/usr/bin/env node
// Claude Code PreToolUse hook that enforces rule R-01 section 8: existing work is never deleted without the
// person's approval. It never blocks anything; it turns a tool call that would delete existing code, files or
// Git history into a confirmation prompt ("ask"), with the reason shown to the person.
//
// Configured in .claude/settings.json (matcher "Bash|Edit|Write"). Reads the hook input as JSON on standard
// input and prints a decision as JSON on standard output, or nothing when the call deletes nothing.
//   - Bash: commands that delete files or discard Git work (rm, rmdir, unlink, find -delete, git rm, git clean,
//     git reset --hard, git checkout -- <path>, git restore, git stash drop/clear, git branch -D, force-push).
//   - Edit: replacing existing text with nothing, or with text that has at least NET_REMOVED_LINES fewer lines.
//   - Write: overwriting an existing file in the project so that at least NET_REMOVED_LINES of its lines are gone.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// A fix that rewrites one or two lines is an ordinary edit; three or more existing lines removed beyond what is
// added is a deletion a person should look at. Lower it to 1 for the strictest reading of the rule.
export const NET_REMOVED_LINES = 3;

// `git`, then any global options (-C <dir>, -c <key=value>, --long-option), then the subcommand, so that words
// inside a commit message ("git commit -m 'clean up'") do not match.
const GIT = String.raw`\bgit(?:\s+(?:-[Cc]\s+\S+|--\S+))*\s+`;

const DESTRUCTIVE_COMMANDS = [
  { pattern: /(?:^|[\s;&|()])(?:rm|rmdir|unlink|shred)(?=\s)/, label: "deletes files" },
  { pattern: /\bfind\b[^;&|]*\s-delete\b/, label: "deletes files found by find" },
  { pattern: new RegExp(`${GIT}(?:rm|clean|restore)\\b`), label: "removes or discards files in Git" },
  { pattern: new RegExp(`${GIT}reset\\b[^;&|]*--hard\\b`), label: "discards uncommitted work (git reset --hard)" },
  {
    pattern: new RegExp(`${GIT}checkout\\b[^;&|]*\\s--(?:\\s|$)`),
    label: "discards changes to files (git checkout --)",
  },
  { pattern: new RegExp(`${GIT}stash\\s+(?:drop|clear)\\b`), label: "deletes stashed work" },
  { pattern: new RegExp(`${GIT}branch\\b[^;&|]*\\s-D\\b`), label: "force-deletes a branch" },
  {
    pattern: new RegExp(`${GIT}push\\b[^;&|]*(?:--force\\b|--force-with-lease\\b|\\s-f\\b)`),
    label: "rewrites remote history",
  },
];

/** Non-blank, trimmed lines of a text. */
function contentLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** How many lines of `before` have no counterpart in `after` (each line of `after` matches at most once). */
export function removedLineCount(before, after) {
  const available = new Map();
  for (const line of contentLines(after)) available.set(line, (available.get(line) ?? 0) + 1);
  let removed = 0;
  for (const line of contentLines(before)) {
    const count = available.get(line) ?? 0;
    if (count === 0) removed += 1;
    else available.set(line, count - 1);
  }
  return removed;
}

/** The reason a shell command needs confirmation, or undefined when it deletes nothing. */
export function commandReason(command) {
  const match = DESTRUCTIVE_COMMANDS.find(({ pattern }) => pattern.test(command));
  return match === undefined ? undefined : `This command ${match.label}.`;
}

/** The reason an Edit needs confirmation, or undefined when it is an ordinary change. */
export function editReason(oldString, newString) {
  const removed = removedLineCount(oldString, newString);
  if (contentLines(newString).length === 0 && removed > 0) return `This edit deletes ${removed} existing line(s).`;
  const net = removed - removedLineCount(newString, oldString);
  return net >= NET_REMOVED_LINES ? `This edit removes ${net} more existing line(s) than it adds.` : undefined;
}

/** The reason a Write needs confirmation, or undefined. `existing` is the current file content, if any. */
export function writeReason(existing, content) {
  if (existing === undefined) return undefined;
  const removed = removedLineCount(existing, content);
  return removed >= NET_REMOVED_LINES
    ? `This write overwrites the file and drops ${removed} existing line(s).`
    : undefined;
}

function isInside(file, directory) {
  const relative = path.relative(directory, file);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function readExisting(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

/** A tool input field as text; missing fields read as empty. */
const field = (toolInput, name) => String(toolInput[name] ?? "");

const FILE_TOOLS = {
  Edit: (toolInput) => editReason(field(toolInput, "old_string"), field(toolInput, "new_string")),
  Write: (toolInput, file, readFile) => writeReason(readFile(file), field(toolInput, "content")),
};

/** Decides for one hook input. Returns the reason to ask, or undefined to let the normal permission flow run. */
export function decide(input, projectDir, readFile = readExisting) {
  const { tool_name: toolName, tool_input: toolInput = {} } = input ?? {};
  if (toolName === "Bash") return commandReason(field(toolInput, "command"));
  const check = Object.hasOwn(FILE_TOOLS, toolName) ? FILE_TOOLS[toolName] : undefined;
  if (check === undefined || typeof toolInput.file_path !== "string") return undefined;
  const file = path.resolve(toolInput.file_path);
  return isInside(file, projectDir) ? check(toolInput, file, readFile) : undefined;
}

export function askOutput(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: `${reason} Rule R-01 section 8: existing work is deleted only with your explicit approval.`,
    },
  };
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  let reason;
  try {
    const input = JSON.parse(raw);
    reason = decide(input, path.resolve(process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()));
  } catch (error) {
    // Fail safe: if the input cannot be read, ask the person instead of letting a possible deletion through.
    reason = `The deletion guard could not read this tool call (${error.message}).`;
  }
  if (reason !== undefined) process.stdout.write(`${JSON.stringify(askOutput(reason))}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
