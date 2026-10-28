// Run with: node --test scripts/
// Pure logic only: no network. The scripts themselves run daily in .github/workflows/freshness.yml.
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAcceptances, blockingAdvisories } from "./audit-lockfiles.mjs";
import { compareVersions, evaluateMatrix, evaluateVersion, readPin } from "./check-freshness.mjs";

test("compares dotted versions numerically", () => {
  assert.equal(compareVersions("1.10.0", "1.9.3"), 1);
  assert.equal(compareVersions("v8.30.1", "8.30.1"), 0);
  assert.equal(compareVersions("0.17.1", "0.18.0"), -1);
  assert.equal(compareVersions("2.4", "2.4.0"), 0);
});

test("reads single pins and comma-separated matrices by plain string search", () => {
  assert.equal(readPin("GITLEAKS_VERSION: 8.30.1\n", { after: "GITLEAKS_VERSION: " }), "8.30.1");
  assert.equal(readPin('dev = ["mypy==2.4.0", "ruff==0.17.1"]', { after: '"ruff==', until: '"' }), "0.17.1");
  assert.deepEqual(readPin('python-version: ["3.11", "3.12"]', { after: "python-version: [", until: "]" }), [
    "3.11",
    "3.12",
  ]);
  assert.throws(() => readPin("nothing here", { after: "VERSION: " }), /not found/);
  assert.throws(() => readPin("VERSION: \n", { after: "VERSION: " }), /no value/);
});

test("flags a pin behind its latest release", () => {
  assert.equal(evaluateVersion("ruff", "0.17.1", "0.17.1").status, "ok");
  assert.equal(evaluateVersion("ruff", "0.17.1", "0.18.0").status, "outdated");
});

test("flags end-of-life runtimes and notes untested newer ones", () => {
  const releases = [
    { name: "26", isEol: false },
    { name: "25", isEol: true },
    { name: "24", isEol: false },
    { name: "20", isEol: true },
  ];
  assert.equal(evaluateMatrix("Node.js", ["22", "24", "26"], releases).status, "ok");
  assert.equal(evaluateMatrix("Node.js", ["20", "24", "26"], releases).status, "outdated");
  assert.equal(evaluateMatrix("Node.js", ["24"], releases).status, "notice");
});

const auditReport = {
  vulnerabilities: {
    braces: {
      severity: "high",
      via: [{ source: 1, url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm", title: "ReDoS", severity: "high" }],
    },
    micromatch: { severity: "high", via: ["braces"] },
    lodash: {
      severity: "moderate",
      via: [{ source: 2, url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc", title: "x", severity: "moderate" }],
    },
  },
};

test("keeps only high and critical advisories, once each", () => {
  const advisories = blockingAdvisories(auditReport);
  assert.deepEqual(
    advisories.map((advisory) => advisory.id),
    ["GHSA-vfj7-8cjw-p6xm"],
  );
  assert.deepEqual(blockingAdvisories({}), []);
});

test("an acceptance covers only its directory and only until it expires", () => {
  const advisories = blockingAdvisories(auditReport);
  const accepted = [{ id: "GHSA-vfj7-8cjw-p6xm", directories: ["site"], expires: "2026-11-30" }];
  assert.equal(applyAcceptances(advisories, "site", accepted, "2026-10-22").blocking.length, 0);
  assert.equal(applyAcceptances(advisories, "other", accepted, "2026-10-22").blocking.length, 1);
  assert.equal(applyAcceptances(advisories, "site", accepted, "2026-12-01").blocking.length, 1, "expired");
});
