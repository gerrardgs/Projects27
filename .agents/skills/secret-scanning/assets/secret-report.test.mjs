// Run with: node --test
// Report fixtures follow the tools' JSON shapes; the "secret" values are placeholders assembled at run time.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { fromGitleaks, fromTrufflehog, merge, verdict } from "./secret-report.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "secret-report.mjs");
const placeholder = `PLACEHOLDER-${"x".repeat(24)}`;

const gitleaksFinding = (extra = {}) => ({
  RuleID: "generic-api-key",
  Description: "Generic API Key",
  StartLine: 12,
  Match: `token = "${placeholder}"`,
  Secret: placeholder,
  File: "src/config.ts",
  Commit: "abc123",
  Fingerprint: "abc123:src/config.ts:generic-api-key:12",
  ...extra,
});
const truffleResult = (extra = {}) => ({
  SourceMetadata: {
    Data: { Git: { commit: "abc123", file: "src/config.ts", line: 12, email: "dev <dev@example.test>" } },
  },
  DetectorName: "AWS",
  Verified: false,
  Raw: placeholder,
  RawV2: placeholder,
  Redacted: placeholder.slice(0, 6),
  ExtraData: { account: "000000000000" },
  ...extra,
});

test("gitleaks findings keep location and fingerprint and drop the secret", () => {
  const [finding] = fromGitleaks([gitleaksFinding()]);
  assert.deepEqual(finding, {
    tools: ["gitleaks"],
    rule: "generic-api-key",
    file: "src/config.ts",
    line: 12,
    commit: "abc123",
    fingerprint: "abc123:src/config.ts:generic-api-key:12",
    status: "unverified",
  });
  assert.throws(() => fromGitleaks({}), /JSON array/);
});

test("TruffleHog results map verified, unknown and unverified, for git and filesystem sources", () => {
  const lines = [
    truffleResult({ Verified: true }),
    truffleResult({
      VerificationError: "dial tcp: timeout",
      SourceMetadata: { Data: { Filesystem: { file: "dist/app.js", line: 3 } } },
    }),
    truffleResult({ SourceMetadata: { Data: { Git: { file: "README.md", line: 1, commit: "def456" } } } }),
    { level: "info", msg: "finished scanning" },
  ].map((value) => JSON.stringify(value));
  const { findings, malformed } = fromTrufflehog(`${lines.join("\n")}\nnot json\n`);
  assert.equal(malformed, 1);
  assert.deepEqual(
    findings.map((finding) => [finding.status, finding.file, finding.line]),
    [
      ["verified", "src/config.ts", 12],
      ["unknown", "dist/app.js", 3],
      ["unverified", "README.md", 1],
    ],
  );
});

test("merging joins both tools at one location, keeps the worst status and sorts by severity", () => {
  const merged = merge([
    ...fromGitleaks([gitleaksFinding(), gitleaksFinding({ File: "a.env", StartLine: 1, Commit: "x" })]),
    ...fromTrufflehog(JSON.stringify(truffleResult({ Verified: true }))).findings,
  ]);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0].tools, ["gitleaks", "trufflehog"]);
  assert.deepEqual(merged[0].rules, ["generic-api-key", "AWS"]);
  assert.equal(merged[0].status, "verified");
  assert.match(merged[0].action, /revoke and rotate now/);
  assert.equal(merged[1].file, "a.env");
});

test("the threshold decides the exit code", () => {
  const findings = merge(fromGitleaks([gitleaksFinding()]));
  assert.deepEqual(verdict(findings, "any"), { counts: { verified: 0, unknown: 0, unverified: 1 }, exitCode: 1 });
  assert.equal(verdict(findings, "verified").exitCode, 0);
  assert.equal(verdict([], "any").exitCode, 0);
});

test("the command line never prints a secret and maps outcomes to exit codes", (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "secret-report-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const gitleaks = path.join(directory, "gitleaks.json");
  const truffle = path.join(directory, "trufflehog.jsonl");
  writeFileSync(gitleaks, JSON.stringify([gitleaksFinding()]));
  writeFileSync(truffle, `${JSON.stringify(truffleResult({ Verified: true }))}\n`);
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
  const both = run("--gitleaks", gitleaks, "--trufflehog", truffle);
  assert.equal(both.status, 1);
  assert.ok(!both.stdout.includes("PLACEHOLDER"));
  assert.ok(!both.stdout.includes("000000000000"));
  assert.deepEqual(JSON.parse(both.stdout).counts, { verified: 1, unknown: 0, unverified: 0 });
  writeFileSync(gitleaks, "[]");
  assert.equal(run("--gitleaks", gitleaks, "--fail-on", "verified").status, 0);
  writeFileSync(truffle, "{broken\n");
  assert.equal(run("--trufflehog", truffle).status, 2);
  assert.equal(run().status, 2);
  assert.equal(run("--gitleaks", path.join(directory, "missing.json")).status, 2);
  assert.equal(run("--gitleaks", gitleaks, "--fail-on", "all").status, 2);
});
