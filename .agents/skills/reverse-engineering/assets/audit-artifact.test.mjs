// Run with: node --test
// Secret-shaped fixtures are assembled at run time so that no scanner flags this file.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { auditDirectory, mask, scanName, scanText, verdict } from "./audit-artifact.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "audit-artifact.mjs");
const fake = {
  aws: `AKIA${"Q".repeat(16)}`,
  anthropic: `sk-ant-${"a1".repeat(20)}`,
  privateKey: `-----BEGIN ${"PRIVATE KEY"}-----`,
  jwt: `eyJ${"h".repeat(12)}.eyJ${"p".repeat(12)}.${"s".repeat(12)}`,
};
const rules = (findings) => findings.map((finding) => finding.rule).sort();

test("masks values so a report never carries a usable secret", () => {
  assert.equal(mask(fake.aws), "AKIAQQ…(20 chars)");
  assert.equal(mask("abc"), "ab…");
});

test("finds secrets, source maps and internal URLs with their line numbers", () => {
  const text = `ok\nconst k="${fake.anthropic}";\n${fake.privateKey}\n//# sourceMappingURL=app.js.map\nfetch("http://localhost:8080/v1")`;
  const findings = scanText(text, "app.js");
  assert.deepEqual(rules(findings), ["anthropic-api-key", "internal-url", "private-key", "source-map-reference"]);
  assert.deepEqual(findings.find((finding) => finding.rule === "private-key").line, 3);
  assert.ok(findings.every((finding) => !finding.excerpt.includes(fake.anthropic)));
  assert.equal(findings.find((finding) => finding.rule === "internal-url").excerpt, "http://localhost:8080");
});

test("ignores public URLs, short look-alikes and the Anthropic prefix in the generic key rule", () => {
  assert.deepEqual(scanText("https://example.com sk-short AKIA123 192.0.2.1", "a.js"), []);
  assert.deepEqual(rules(scanText(fake.anthropic, "a.js")), ["anthropic-api-key"]);
});

test("flags risky file names but not environment examples", () => {
  assert.deepEqual(rules(scanName(".env")), ["env-file"]);
  assert.deepEqual(rules(scanName(".env.production")), ["env-file"]);
  assert.deepEqual(scanName(".env.example"), []);
  assert.deepEqual(rules(scanName(path.join("assets", "index.js.map"))), ["source-map-file"]);
  assert.deepEqual(rules(scanName(path.join("res", "release.keystore"))), ["key-file"]);
  assert.deepEqual(rules(scanName(path.join("data", "cache.sqlite"))), ["database-file"]);
  assert.deepEqual(rules(scanName(path.join(".git", "config"))), ["git-metadata"]);
});

test("decides the exit code from the threshold", () => {
  const findings = [{ severity: "warning" }, { severity: "info" }];
  assert.deepEqual(verdict(findings, "error"), { counts: { error: 0, warning: 1, info: 1 }, exitCode: 0 });
  assert.equal(verdict(findings, "warning").exitCode, 1);
});

test("walks a directory, scans binaries as bytes, skips symlinks and large files", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "audit-artifact-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "assets"));
  writeFileSync(path.join(root, "assets", "index.js"), `x=1;\n//# sourceMappingURL=index.js.map\n`);
  writeFileSync(
    path.join(root, "classes.dex"),
    Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from(fake.aws), Buffer.from([0])]),
  );
  writeFileSync(path.join(root, "big.bin"), Buffer.alloc(2048, 65));
  symlinkSync("/etc/hosts", path.join(root, "link"));
  const result = await auditDirectory(root, { maxFileBytes: 1024 });
  assert.equal(result.files, 3);
  assert.deepEqual(rules(result.findings), ["aws-access-key-id", "source-map-reference"]);
  assert.deepEqual(
    result.skipped.map((entry) => entry.file),
    ["big.bin"],
  );
});

test("the command line prints JSON and maps findings to exit codes", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "audit-artifact-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, "token.txt"), fake.jwt);
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
  const clean = run(root);
  assert.equal(clean.status, 0);
  assert.deepEqual(JSON.parse(clean.stdout).counts, { error: 0, warning: 1, info: 0 });
  assert.equal(run(root, "--fail-on", "warning").status, 1);
  writeFileSync(path.join(root, ".env"), "TOKEN=x\n");
  assert.equal(run(root).status, 1);
  assert.equal(run(path.join(root, "missing")).status, 2);
  assert.equal(run(root, "--fail-on", "info").status, 2);
});
