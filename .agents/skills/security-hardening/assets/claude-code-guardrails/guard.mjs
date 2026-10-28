#!/usr/bin/env node
// Claude Code PreToolUse hook: deterministically denies tool calls that read or modify secret files
// or run a small set of destructive shell commands, including git commands that discard uncommitted work.
// Instructions ask; this enforces.
//
// Input (stdin, from Claude Code): {"tool_name": "Read" | "Edit" | "Write" | "NotebookEdit" | "Bash", "tool_input": {...}}
// Output: a "deny" decision as JSON on stdout, or nothing (the normal permission flow continues).
// Docs: https://code.claude.com/docs/en/hooks
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_ENV_TEMPLATES = new Set([".env.example", ".env.sample", ".env.template"]);
const SECRET_FILE_PATTERNS = [
  /^\.env(\..+)?$/,
  /\.(pem|key|p12|pfx|jks|keystore)$/i,
  /^id_(rsa|ecdsa|ed25519|dsa)$/,
  /^(\.npmrc|\.pypirc|\.netrc|credentials\.json|kubeconfig)$/,
  /\.(tfstate|tfvars)$/,
  /\.tfstate\.backup$/,
];
const SECRET_DIRECTORIES = [
  /(^|\/)\.ssh\//,
  /(^|\/)\.aws\//,
  /(^|\/)\.gnupg\//,
  /(^|\/)\.config\/gcloud\//,
  /(^|\/)\.kube\//,
];
const DANGEROUS_COMMANDS = [
  {
    pattern: /\bgit\s+push\b(?=.*(\s--force(?!-with-lease)\b|\s-f\b))/,
    reason: "force-push rewrites shared history; use --force-with-lease after approval",
  },
  {
    pattern: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?[a-zA-Z]*\s+(\/|~|\$HOME)(\s|\/?$)/,
    reason: "recursive delete of the root or home directory",
  },
  {
    pattern: /\b(curl|wget)\b[^|;&]*\|\s*(sudo\s+)?(ba|z)?sh\b/,
    reason: "piping a download into a shell runs unreviewed code",
  },
  { pattern: /\bgit\s+commit\b.*\s--no-verify\b/, reason: "bypassing commit hooks skips secret scanning and checks" },
  { pattern: /\bchmod\s+(-R\s+)?0?777\b/, reason: "world-writable permissions" },
  // Commands that discard uncommitted work or delete branches (rule 08 section 3, rule 09 section 2).
  { pattern: /\bgit\s+reset\b[^|;&]*\s--hard\b/, reason: "git reset --hard discards uncommitted work" },
  { pattern: /\bgit\s+clean\b[^|;&]*\s(-[a-zA-Z]*f|--force\b)/, reason: "git clean -f deletes untracked files" },
  {
    pattern: /\bgit\s+checkout\b[^|;&]*\s(--|\.)(\s|$)/,
    reason: "git checkout -- <path> or . discards uncommitted changes",
  },
  { pattern: /\bgit\s+restore\b(?![^|;&]*\s(--staged|-S)\b)/, reason: "git restore discards uncommitted changes" },
  {
    pattern: /\bgit\s+restore\b[^|;&]*\s(--worktree|-W)\b/,
    reason: "git restore --worktree discards uncommitted changes",
  },
  { pattern: /\bgit\s+stash\s+(drop|clear)\b/, reason: "git stash drop or clear deletes stashed work" },
  {
    pattern: /\bgit\s+branch\b[^|;&]*\s(-D|--delete\b[^|;&]*--force)(\s|$)/,
    reason: "deleting a branch that may not be merged",
  },
];

/** True when a path points at a file that commonly holds secrets. Pure; exported for tests. */
export function isSecretPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const name = path.posix.basename(normalized);
  if (ALLOWED_ENV_TEMPLATES.has(name) || name.endsWith(".pub")) return false;
  return (
    SECRET_FILE_PATTERNS.some((pattern) => pattern.test(name)) ||
    SECRET_DIRECTORIES.some((pattern) => pattern.test(normalized))
  );
}

function commandTouchesSecretFile(command) {
  return command.split(/[\s'"`;|&<>()=]+/).some((token) => token !== "" && isSecretPath(token));
}

function fileDenial(input) {
  const filePath = input.file_path ?? input.notebook_path;
  if (typeof filePath !== "string" || !isSecretPath(filePath)) return undefined;
  return `access to a secret file is blocked: ${path.basename(filePath)}`;
}

function commandDenial(command) {
  const dangerous = DANGEROUS_COMMANDS.find(({ pattern }) => pattern.test(command));
  if (dangerous) return `blocked command: ${dangerous.reason}`;
  return commandTouchesSecretFile(command) ? "the command references a secret file" : undefined;
}

/** Returns a reason to deny the tool call, or undefined to let the normal permission flow decide. */
export function denialReason(event) {
  const input = event?.tool_input ?? {};
  const fileReason = fileDenial(input);
  if (fileReason !== undefined) return fileReason;
  if (event?.tool_name !== "Bash" || typeof input.command !== "string") return undefined;
  return commandDenial(input.command);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  let event;
  try {
    event = JSON.parse(await readStdin());
  } catch {
    // Fail closed: input we cannot read is not allowed through silently.
    process.stderr.write("guard: could not parse hook input\n");
    process.exitCode = 2;
    return;
  }
  const reason = denialReason(event);
  if (reason === undefined) return;
  const decision = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `${reason}. Ask the user to do this manually if it is really intended.`,
    },
  };
  process.stdout.write(`${JSON.stringify(decision)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
