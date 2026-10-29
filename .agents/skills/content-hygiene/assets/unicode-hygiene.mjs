#!/usr/bin/env node
// Finds invisible and bidirectional Unicode characters in text files, and removes the ones that are
// never needed. Node.js 22+, no dependencies.
//
//   node unicode-hygiene.mjs [--fix] [--json] <file or directory>...
//
// Classes:
//   remove  never needed in text: zero-width space, word joiner, invisible math operators, a byte-order
//           mark after the start, interlinear annotation marks, Unicode tag characters (U+E0000-E007F,
//           used to hide text from readers and to smuggle instructions to AI models), and a zero-width
//           joiner or non-joiner outside the scripts and emoji that need them. --fix deletes these.
//   bidi    bidirectional controls (U+202A-202E, U+2066-2069). In source code they can make code read
//           differently from how it compiles ("Trojan Source", CVE-2021-42574): reported as errors and
//           never removed automatically. In prose they may be needed for right-to-left text: reported.
//   review  reported only: left-to-right and right-to-left marks, soft hyphens, variation selectors
//           outside emoji, line and paragraph separators.
// Exit code 1 when a "remove" finding is left (without --fix) or a bidi control is found in code.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { parseArgs } from "node:util";

const CODE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".dart",
  ".c",
  ".h",
  ".cpp",
  ".cs",
  ".rb",
  ".php",
  ".sh",
  ".sql",
  ".yml",
  ".yaml",
  ".toml",
  ".css",
]);
const SKIP_DIRECTORIES = new Set(["node_modules", ".git", "dist", "build", ".build", ".dart_tool"]);

const NAMES = new Map([
  [0x00ad, "SOFT HYPHEN"],
  [0x180e, "MONGOLIAN VOWEL SEPARATOR"],
  [0x200b, "ZERO WIDTH SPACE"],
  [0x200c, "ZERO WIDTH NON-JOINER"],
  [0x200d, "ZERO WIDTH JOINER"],
  [0x200e, "LEFT-TO-RIGHT MARK"],
  [0x200f, "RIGHT-TO-LEFT MARK"],
  [0x2028, "LINE SEPARATOR"],
  [0x2029, "PARAGRAPH SEPARATOR"],
  [0x202a, "LEFT-TO-RIGHT EMBEDDING"],
  [0x202b, "RIGHT-TO-LEFT EMBEDDING"],
  [0x202c, "POP DIRECTIONAL FORMATTING"],
  [0x202d, "LEFT-TO-RIGHT OVERRIDE"],
  [0x202e, "RIGHT-TO-LEFT OVERRIDE"],
  [0x2060, "WORD JOINER"],
  [0x2061, "FUNCTION APPLICATION"],
  [0x2062, "INVISIBLE TIMES"],
  [0x2063, "INVISIBLE SEPARATOR"],
  [0x2064, "INVISIBLE PLUS"],
  [0x2066, "LEFT-TO-RIGHT ISOLATE"],
  [0x2067, "RIGHT-TO-LEFT ISOLATE"],
  [0x2068, "FIRST STRONG ISOLATE"],
  [0x2069, "POP DIRECTIONAL ISOLATE"],
  [0xfeff, "ZERO WIDTH NO-BREAK SPACE (BYTE ORDER MARK)"],
  [0xfff9, "INTERLINEAR ANNOTATION ANCHOR"],
  [0xfffa, "INTERLINEAR ANNOTATION SEPARATOR"],
  [0xfffb, "INTERLINEAR ANNOTATION TERMINATOR"],
]);

const ALWAYS_REMOVE = new Set([0x180e, 0x200b, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0xfff9, 0xfffa, 0xfffb]);
const BIDI = new Set([0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]);
const REVIEW = new Set([0x00ad, 0x200e, 0x200f, 0x2028, 0x2029]);

const isTag = (cp) => cp >= 0xe0000 && cp <= 0xe007f;
const isVariationSelector = (cp) => (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef);
const isEmoji = (ch) => ch !== undefined && /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u{FE0F}/u.test(ch);
// Scripts that use the joiners in ordinary words (Arabic, Persian, Indic, Sinhala, Khmer and others).
const isJoiningScript = (ch) => ch !== undefined && /\p{L}|\p{M}/u.test(ch) && !/\p{Script=Latin}/u.test(ch);

/** A tag sequence after a black flag spells a subdivision flag (for example Scotland). */
function isFlagTag(chars, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const cp = chars[i].codePointAt(0);
    if (!isTag(cp)) return cp === 0x1f3f4;
  }
  return false;
}

/** A joiner stays inside emoji sequences and in scripts that join letters with it. */
function classifyJoiner(cp, before, after) {
  if (cp === 0x200d) return (isEmoji(before) && isEmoji(after)) || isJoiningScript(before) ? null : "remove";
  return isJoiningScript(before) || isJoiningScript(after) ? null : "remove";
}

/** Joiners, the byte-order mark and variation selectors are kept only where they do something. */
function classifyInContext(cp, chars, index) {
  const before = chars[index - 1];
  if (cp === 0xfeff) return index === 0 ? null : "remove";
  if (cp === 0x200d || cp === 0x200c) return classifyJoiner(cp, before, chars[index + 1]);
  if (!isVariationSelector(cp)) return null;
  return isEmoji(before) || /\p{Script=Han}/u.test(before ?? "") ? null : "review";
}

function classify(chars, index) {
  const cp = chars[index].codePointAt(0);
  if (isTag(cp)) return isFlagTag(chars, index) ? null : "remove";
  if (ALWAYS_REMOVE.has(cp)) return "remove";
  if (BIDI.has(cp)) return "bidi";
  if (REVIEW.has(cp)) return "review";
  return classifyInContext(cp, chars, index);
}

const label = (cp) =>
  `U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${NAMES.get(cp) ?? (isTag(cp) ? "TAG CHARACTER" : "VARIATION SELECTOR")}`;

/** Findings for one text, and the text with "remove" characters deleted. */
export function scanText(text, { code = false } = {}) {
  const chars = [...text];
  const findings = [];
  let line = 1;
  let column = 1;
  let fixed = "";
  for (let i = 0; i < chars.length; i += 1) {
    const kind = classify(chars, i);
    if (kind !== null) {
      const cp = chars[i].codePointAt(0);
      findings.push({ line, column, codePoint: cp, name: label(cp), kind, error: kind === "bidi" && code });
    }
    if (kind !== "remove") fixed += chars[i];
    if (chars[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { findings, fixed };
}

function* files(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    yield* files(join(path, entry.name));
  }
}

const describe = (f) =>
  `${f.path}:${f.line}:${f.column} ${f.name} ${f.error ? "error (bidi control in code)" : f.kind}${f.fixed ? " (removed)" : ""}`;

/** Scans one file, fixing it when asked; returns its findings with the path. Binary files are skipped. */
function scanFile(path, fix) {
  const bytes = readFileSync(path);
  if (bytes.includes(0)) return [];
  const { findings, fixed } = scanText(bytes.toString("utf8"), { code: CODE_EXTENSIONS.has(extname(path)) });
  const removable = findings.some((f) => f.kind === "remove");
  if (fix && removable) writeFileSync(path, fixed);
  return findings.map((f) => ({ path, ...f, fixed: fix && f.kind === "remove" }));
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { fix: { type: "boolean", default: false }, json: { type: "boolean", default: false } },
  });
  if (positionals.length === 0) {
    process.stderr.write("usage: node unicode-hygiene.mjs [--fix] [--json] <file or directory>...\n");
    process.exit(2);
  }
  const report = positionals.flatMap((p) => [...files(p)]).flatMap((path) => scanFile(path, values.fix));
  if (values.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else if (report.length === 0) process.stdout.write("no invisible or bidirectional characters found\n");
  else process.stdout.write(`${report.map(describe).join("\n")}\n`);
  const failing = report.some((f) => (f.kind === "remove" && !f.fixed) || f.error);
  process.exitCode = failing ? 1 : 0;
}

if (import.meta.main) main();
