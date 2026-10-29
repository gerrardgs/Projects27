#!/usr/bin/env node
// Classifies the saved output of `coderabbit review --agent` (NDJSON, one event per line) so that a
// skipped, failed or truncated run is never reported as a clean review. The event contract follows
// CodeRabbit's own plugin code (coderabbitai/skills, MIT, commit 8eef103, mods/coderabbit/hooks/review.js):
// "finding" events, exactly one "complete" event whose "findings" count matches, "error" events,
// "action_required" for paid continuation, and "phase": "auth" for sign-in events.
//
// Usage (Node.js 22+, no dependencies):
//   coderabbit review --agent > review.ndjson; echo $? > review.status
//   node review-outcome.mjs review.ndjson [--exit-status <cli exit code>] [--fail-on <severity>]
// Prints one JSON line. Exit code 0 when the review completed with nothing at or above --fail-on
// (default: major), 1 when it completed with such findings, 3 when no complete review happened
// (skipped, failed, incomplete, awaiting confirmation), 2 on usage errors.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const SEVERITIES = ["critical", "major", "minor", "trivial", "info", "none"];
const NO_FRESH_REVIEW = "No fresh detailed file review was performed in this run.";

/** Parses NDJSON into events; lines that are not JSON objects with a string "type" are counted. Pure. */
export function parseEvents(text) {
  const events = [];
  let malformed = 0;
  for (const line of text.split("\n").filter((candidate) => candidate.trim())) {
    try {
      const event = JSON.parse(line);
      if (event && typeof event === "object" && typeof event.type === "string") events.push(event);
      else malformed += 1;
    } catch {
      malformed += 1;
    }
  }
  return { events, malformed };
}

function countBySeverity(findings) {
  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const finding of findings) {
    const severity = SEVERITIES.includes(finding.severity) ? finding.severity : "none";
    counts[severity] += 1;
  }
  return counts;
}

function wasSkipped(complete, findings) {
  if (complete.status === "review_skipped" && findings.length === 0) return true;
  return (
    complete.status === "review_completed" &&
    typeof complete.message === "string" &&
    complete.message.startsWith(NO_FRESH_REVIEW)
  );
}

function outcomeOf({ events, malformed, exitStatus, findings, completes }) {
  const review = events.filter((event) => event.phase !== "auth");
  if (exitStatus !== 0 || events.some((event) => event.type === "error")) {
    return events.some((event) => event.type === "error" && event.phase === "auth") ? "failed-auth" : "failed";
  }
  if (review.some((event) => event.type === "action_required")) return "awaiting-confirmation";
  const complete = completes[0];
  if (malformed > 0 || completes.length !== 1 || complete.findings !== findings.length) return "incomplete";
  if (wasSkipped(complete, findings)) return "skipped";
  return complete.status === "review_completed" ? "completed" : "unknown";
}

/** Summarises a review run. Only "completed" means code was analysed. Pure. */
export function classify(text, exitStatus = 0) {
  const { events, malformed } = parseEvents(text);
  const review = events.filter((event) => event.phase !== "auth");
  const findings = review.filter((event) => event.type === "finding");
  const completes = review.filter((event) => event.type === "complete");
  const outcome = outcomeOf({ events, malformed, exitStatus, findings, completes });
  const message = completes.length === 1 && typeof completes[0].message === "string" ? completes[0].message : "";
  return { outcome, findings: findings.length, bySeverity: countBySeverity(findings), message };
}

/** True when any finding is at or above the threshold severity. Pure. */
export function hasBlockingFindings(summary, threshold) {
  const limit = SEVERITIES.indexOf(threshold);
  return SEVERITIES.slice(0, limit + 1).some((severity) => summary.bySeverity[severity] > 0);
}

function parseOptions(argv) {
  const options = { file: undefined, exitStatus: 0, failOn: "major" };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--exit-status") options.exitStatus = Number(argv[++index]);
    else if (argument === "--fail-on") options.failOn = argv[++index];
    else if (!options.file) options.file = argument;
    else throw new Error(`unexpected argument ${argument}`);
  }
  if (!options.file) throw new Error("give the saved NDJSON file");
  if (!Number.isInteger(options.exitStatus)) throw new Error("--exit-status must be an integer");
  if (!SEVERITIES.includes(options.failOn)) throw new Error(`--fail-on must be one of ${SEVERITIES.join(", ")}`);
  return options;
}

async function main(argv) {
  let options;
  try {
    options = parseOptions(argv);
  } catch (error) {
    console.error(`review-outcome: ${error.message}`);
    return 2;
  }
  const summary = classify(await readFile(options.file, "utf8"), options.exitStatus);
  console.log(JSON.stringify(summary));
  if (summary.outcome !== "completed") return 3;
  return hasBlockingFindings(summary, options.failOn) ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`review-outcome: ${error.message}`);
      process.exit(2);
    },
  );
}
