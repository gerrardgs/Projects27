// Run with: node --test

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { classify, hasBlockingFindings, parseEvents } from "./review-outcome.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "review-outcome.mjs");
const lines = (...events) => events.map((event) => JSON.stringify(event)).join("\n");
const finding = (severity) => ({ type: "finding", severity, fileName: "src/a.ts", comment: "x" });
const complete = (findings, extra = {}) => ({
  type: "complete",
  status: "review_completed",
  findings,
  message: "Review completed",
  ...extra,
});

test("counts malformed lines and keeps typed events", () => {
  assert.deepEqual(parseEvents('{"type":"heartbeat"}\nnot json\n[1]\n\n'), {
    events: [{ type: "heartbeat" }],
    malformed: 2,
  });
});

test("a completed review reports findings by severity", () => {
  const summary = classify(
    lines({ type: "status", status: "reviewing" }, finding("major"), finding("minor"), finding("odd"), complete(3)),
  );
  assert.equal(summary.outcome, "completed");
  assert.equal(summary.findings, 3);
  assert.deepEqual(summary.bySeverity, { critical: 0, major: 1, minor: 1, trivial: 0, info: 0, none: 1 });
  assert.equal(hasBlockingFindings(summary, "major"), true);
  assert.equal(hasBlockingFindings(summary, "critical"), false);
});

test("a heartbeat without completion is incomplete, never clean", () => {
  assert.equal(classify(lines({ type: "heartbeat" })).outcome, "incomplete");
});

test("a skipped review is skipped, even with status review_completed and the no-fresh-review message", () => {
  assert.equal(
    classify(lines({ type: "complete", status: "review_skipped", findings: 0, message: "No changes" })).outcome,
    "skipped",
  );
  const noFresh = complete(0, {
    message: "No fresh detailed file review was performed in this run. Using cached results.",
  });
  assert.equal(classify(lines(noFresh)).outcome, "skipped");
});

test("inconsistent counts, duplicate completions and malformed lines make the run incomplete", () => {
  assert.equal(classify(lines(finding("minor"), complete(2))).outcome, "incomplete");
  assert.equal(classify(lines(complete(0), complete(0))).outcome, "incomplete");
  assert.equal(classify(`${lines(complete(0))}\n{truncated`).outcome, "incomplete");
});

test("errors, a failing exit status and sign-in failures are failures", () => {
  assert.equal(classify(lines({ type: "error", errorType: "rate_limit" })).outcome, "failed");
  assert.equal(classify(lines(complete(0)), 1).outcome, "failed");
  assert.equal(classify(lines({ type: "error", phase: "auth" })).outcome, "failed-auth");
});

test("sign-in events before a review do not count as review events", () => {
  const summary = classify(lines({ type: "complete", phase: "auth", status: "authenticated" }, complete(0)));
  assert.equal(summary.outcome, "completed");
});

test("a paid-continuation offer waits for confirmation", () => {
  assert.equal(
    classify(lines({ type: "action_required", status: "awaiting_confirmation" })).outcome,
    "awaiting-confirmation",
  );
});

test("the command line maps outcomes to exit codes", (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "review-outcome-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const write = (name, text) => {
    const file = path.join(directory, name);
    writeFileSync(file, text);
    return file;
  };
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
  assert.equal(run(write("clean.ndjson", lines(complete(0)))).status, 0);
  const blocking = write("major.ndjson", lines(finding("major"), complete(1)));
  assert.equal(run(blocking).status, 1);
  assert.equal(run(blocking, "--fail-on", "critical").status, 0);
  assert.equal(run(write("skip.ndjson", lines({ type: "complete", status: "review_skipped", findings: 0 }))).status, 3);
  assert.equal(run(blocking, "--exit-status", "1").status, 3);
  assert.equal(run(blocking, "--fail-on", "severe").status, 2);
  assert.equal(JSON.parse(run(blocking).stdout).outcome, "completed");
});
