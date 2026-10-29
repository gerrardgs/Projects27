#!/usr/bin/env node
// Merges gitleaks and TruffleHog reports into one summary that never contains a secret, so it can be
// printed in CI logs, pasted into an issue or handed to an agent. Field names follow the tools' own
// source: gitleaks report/finding.go (v8.30.1) and TruffleHog pkg/output/json.go (v3.99.7).
//
// Usage (Node.js 22+, no dependencies):
//   gitleaks git . --redact --report-format json --report-path gitleaks.json
//   trufflehog git file://. --results=verified,unknown,unverified --json > trufflehog.jsonl
//   node secret-report.mjs [--gitleaks gitleaks.json] [--trufflehog trufflehog.jsonl] [--fail-on any|verified]
// Prints one JSON object. Exit code 0 when nothing at or above --fail-on (default: any) was found,
// 1 when something was, 2 on usage errors or unreadable reports.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Most severe first. "verified" means TruffleHog logged in with the credential: it is live.
export const STATUSES = ["verified", "unknown", "unverified"];
const ACTIONS = {
  verified: "live credential: revoke and rotate now, then investigate its use",
  unknown: "verification failed: treat as live until proven otherwise",
  unverified: "review: rotate if real, otherwise mark it as a false positive with a reason",
};

/** Normalises a gitleaks JSON report (an array of findings). Secret, Match and Line are dropped. Pure. */
export function fromGitleaks(report) {
  if (!Array.isArray(report)) throw new Error("the gitleaks report must be a JSON array");
  return report.map((finding) => ({
    tools: ["gitleaks"],
    rule: String(finding.RuleID ?? "unknown"),
    file: String(finding.File ?? ""),
    line: Number.isInteger(finding.StartLine) ? finding.StartLine : null,
    commit: finding.Commit ? String(finding.Commit) : null,
    fingerprint: finding.Fingerprint ? String(finding.Fingerprint) : null,
    status: "unverified",
  }));
}

function truffleLocation(metadata) {
  const data = metadata?.Data ?? {};
  const source = data.Git ?? data.Filesystem ?? Object.values(data)[0] ?? {};
  return {
    file: String(source.file ?? ""),
    line: Number.isInteger(source.line) ? source.line : null,
    commit: source.commit ? String(source.commit) : null,
  };
}

function truffleStatus(result) {
  if (result.Verified === true) return "verified";
  return result.VerificationError ? "unknown" : "unverified";
}

/** Normalises TruffleHog --json output (one JSON object per line). Raw, Redacted and ExtraData are dropped. Pure. */
export function fromTrufflehog(text) {
  const findings = [];
  let malformed = 0;
  for (const line of text.split("\n").filter((candidate) => candidate.trim())) {
    let result;
    try {
      result = JSON.parse(line);
    } catch {
      malformed += 1;
      continue;
    }
    if (!result || typeof result !== "object" || !("DetectorName" in result)) continue;
    const location = truffleLocation(result.SourceMetadata);
    findings.push({
      tools: ["trufflehog"],
      rule: String(result.DetectorName),
      ...location,
      fingerprint: null,
      status: truffleStatus(result),
    });
  }
  return { findings, malformed };
}

/** Merges findings at the same file, line and commit; keeps the most severe status. Pure. */
export function merge(findings) {
  const byLocation = new Map();
  for (const finding of findings) {
    const key = `${finding.file}\u0000${finding.line}\u0000${finding.commit ?? ""}`;
    const existing = byLocation.get(key);
    if (!existing) {
      byLocation.set(key, { ...finding, rules: [finding.rule] });
      continue;
    }
    existing.tools = [...new Set([...existing.tools, ...finding.tools])];
    existing.rules = [...new Set([...existing.rules, finding.rule])];
    if (STATUSES.indexOf(finding.status) < STATUSES.indexOf(existing.status)) existing.status = finding.status;
    existing.fingerprint ??= finding.fingerprint;
  }
  return [...byLocation.values()]
    .map((finding) => {
      const summary = { ...finding, action: ACTIONS[finding.status] };
      delete summary.rule;
      return summary;
    })
    .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.file.localeCompare(b.file));
}

/** Counts per status and the exit code for a threshold. Pure. */
export function verdict(findings, failOn) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const finding of findings) counts[finding.status] += 1;
  const blocking = failOn === "verified" ? counts.verified > 0 : findings.length > 0;
  return { counts, exitCode: blocking ? 1 : 0 };
}

function parseOptions(argv) {
  const options = { gitleaks: undefined, trufflehog: undefined, failOn: "any" };
  for (let index = 0; index < argv.length; index += 2) {
    const value = argv[index + 1];
    if (value === undefined) throw new Error(`${argv[index]} needs a value`);
    if (argv[index] === "--gitleaks") options.gitleaks = value;
    else if (argv[index] === "--trufflehog") options.trufflehog = value;
    else if (argv[index] === "--fail-on") options.failOn = value;
    else throw new Error(`unknown option ${argv[index]}`);
  }
  if (!options.gitleaks && !options.trufflehog) throw new Error("give --gitleaks and/or --trufflehog");
  if (!["any", "verified"].includes(options.failOn)) throw new Error("--fail-on must be any or verified");
  return options;
}

async function collect(options) {
  const findings = [];
  let malformed = 0;
  if (options.gitleaks) findings.push(...fromGitleaks(JSON.parse(await readFile(options.gitleaks, "utf8"))));
  if (options.trufflehog) {
    const result = fromTrufflehog(await readFile(options.trufflehog, "utf8"));
    findings.push(...result.findings);
    malformed = result.malformed;
  }
  return { findings: merge(findings), malformed };
}

async function main(argv) {
  let options;
  let collected;
  try {
    options = parseOptions(argv);
    collected = await collect(options);
  } catch (error) {
    console.error(`secret-report: ${error.message}`);
    return 2;
  }
  const { counts, exitCode } = verdict(collected.findings, options.failOn);
  console.log(JSON.stringify({ counts, malformedLines: collected.malformed, findings: collected.findings }));
  if (collected.malformed > 0)
    console.error(`secret-report: ${collected.malformed} unreadable TruffleHog line(s); the report may be incomplete`);
  return collected.malformed > 0 ? 2 : exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
