#!/usr/bin/env node
// Audits a build output you own before it ships: a web dist folder, or an extracted APK, IPA, AAB,
// Electron ASAR or archive. It reports what anyone who downloads the artifact could read: secrets and
// private keys, environment files, source maps, local databases, and URLs pointing at internal hosts.
// Secret values are never printed in full. It reads files only; it never executes or uploads anything.
//
// Usage (Node.js 22+, no dependencies):
//   unzip -q app-release.apk -d /tmp/apk            (extract archives first)
//   node audit-artifact.mjs <directory> [--fail-on error|warning] [--max-file-mib 256]
// Prints one JSON object. Exit code 0 when nothing at or above --fail-on (default: error) is found,
// 1 when something is, 2 on usage errors.

import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SEVERITIES = ["error", "warning", "info"];

// Content patterns. Each match is reported with its line; secret values are masked, locations are not.
export const CONTENT_RULES = [
  {
    id: "private-key",
    severity: "error",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g,
  },
  { id: "aws-access-key-id", severity: "error", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: "github-token", severity: "error", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { id: "anthropic-api-key", severity: "error", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { id: "openai-style-api-key", severity: "error", pattern: /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{32,}/g },
  { id: "google-api-key", severity: "warning", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: "slack-token", severity: "error", pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
  { id: "stripe-live-key", severity: "error", pattern: /\b(?:sk|rk)_live_[0-9A-Za-z]{16,}/g },
  { id: "jwt", severity: "warning", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { id: "inline-source-map", severity: "warning", pattern: /[#@] ?sourceMappingURL=data:/g },
  { id: "source-map-reference", severity: "info", reveal: true, pattern: /[#@] ?sourceMappingURL=(?!data:)[^\s'"*]+/g },
  {
    id: "internal-url",
    severity: "warning",
    reveal: true,
    pattern:
      /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?/g,
  },
];

// File-name patterns, matched against the path relative to the audited directory.
export const NAME_RULES = [
  {
    id: "env-file",
    severity: "error",
    test: (name) => /^\.env(?:\.(?!example$|sample$|template$)[\w.-]+)?$/.test(name),
  },
  {
    id: "key-file",
    severity: "error",
    test: (name) => /\.(?:pem|key|p12|pfx|jks|keystore)$|^id_(?:rsa|ecdsa|ed25519)$/.test(name),
  },
  { id: "source-map-file", severity: "warning", test: (name) => name.endsWith(".map") },
  { id: "database-file", severity: "warning", test: (name) => /\.(?:sqlite3?|db|realm)$/.test(name) },
  {
    id: "git-metadata",
    severity: "error",
    test: (_name, relativePath) => relativePath.split(path.sep).includes(".git"),
  },
];

/** Masks a matched value so reports never carry a usable secret. Pure. */
export function mask(value) {
  return value.length <= 8 ? `${value.slice(0, 2)}…` : `${value.slice(0, 6)}…(${value.length} chars)`;
}

/** Content findings for one file's text. Pure. */
export function scanText(text, file) {
  const findings = [];
  const lineStarts = [0];
  for (let index = text.indexOf("\n"); index !== -1; index = text.indexOf("\n", index + 1)) lineStarts.push(index + 1);
  for (const rule of CONTENT_RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      findings.push({
        severity: rule.severity,
        rule: rule.id,
        file,
        line: lineOf(lineStarts, match.index),
        excerpt: rule.reveal ? match[0] : mask(match[0]),
      });
    }
  }
  return findings;
}

function lineOf(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (lineStarts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low + 1;
}

/** Name findings for one relative path. Pure. */
export function scanName(relativePath) {
  const name = path.basename(relativePath);
  return NAME_RULES.filter((rule) => rule.test(name, relativePath)).map((rule) => ({
    severity: rule.severity,
    rule: rule.id,
    file: relativePath,
  }));
}

async function* walk(root, directory = root) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) yield* walk(root, full);
    else if (entry.isFile()) yield full;
  }
}

/** Audits a directory; returns findings, skipped files and counts. */
export async function auditDirectory(root, { maxFileBytes = 256 * 1024 * 1024 } = {}) {
  const findings = [];
  const skipped = [];
  let files = 0;
  for await (const full of walk(root)) {
    const relativePath = path.relative(root, full);
    files += 1;
    findings.push(...scanName(relativePath));
    const { size } = await lstat(full);
    if (size > maxFileBytes) {
      skipped.push({ file: relativePath, reason: `larger than ${maxFileBytes} bytes` });
      continue;
    }
    // latin1 keeps every byte, so strings inside binaries (dex, Mach-O, wasm) are scanned too.
    findings.push(...scanText((await readFile(full)).toString("latin1"), relativePath));
  }
  return { files, findings, skipped };
}

/** Counts findings per severity and decides the exit code. Pure. */
export function verdict(findings, failOn) {
  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const finding of findings) counts[finding.severity] += 1;
  const blocking = SEVERITIES.slice(0, SEVERITIES.indexOf(failOn) + 1).some((severity) => counts[severity] > 0);
  return { counts, exitCode: blocking ? 1 : 0 };
}

function parseOptions(argv) {
  const options = { directory: undefined, failOn: "error", maxFileMib: 256 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--fail-on") options.failOn = argv[++index];
    else if (argv[index] === "--max-file-mib") options.maxFileMib = Number(argv[++index]);
    else if (!options.directory) options.directory = argv[index];
    else throw new Error(`unexpected argument ${argv[index]}`);
  }
  if (!options.directory) throw new Error("give the extracted artifact directory");
  if (!["error", "warning"].includes(options.failOn)) throw new Error("--fail-on must be error or warning");
  if (!(options.maxFileMib > 0)) throw new Error("--max-file-mib must be a positive number");
  return options;
}

async function main(argv) {
  let options;
  try {
    options = parseOptions(argv);
    if (!(await lstat(options.directory)).isDirectory()) throw new Error(`${options.directory} is not a directory`);
  } catch (error) {
    console.error(`audit-artifact: ${error.message}`);
    return 2;
  }
  const result = await auditDirectory(options.directory, { maxFileBytes: options.maxFileMib * 1024 * 1024 });
  const { counts, exitCode } = verdict(result.findings, options.failOn);
  console.log(JSON.stringify({ directory: path.resolve(options.directory), files: result.files, counts, ...result }));
  return exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`audit-artifact: ${error.message}`);
      process.exit(2);
    },
  );
}
