// Run with: node --test scripts/
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parseArgs, runStep, stripAnsi, summarize } from "./run-quiet.mjs";

test("parses a command, npm steps and options", () => {
  assert.deepEqual(parseArgs(["--", "npm", "test"]).command, ["npm", "test"]);
  assert.deepEqual(parseArgs(["--steps", "check,test"]).steps, ["check", "test"]);
  assert.equal(parseArgs(["--lines", "5", "--", "x"]).lines, 5);
  assert.throws(() => parseArgs([]), /give a command/);
  assert.throws(() => parseArgs(["--lines", "0", "--", "x"]), /positive/);
  assert.throws(() => parseArgs(["--bogus"]), /unknown option/);
});

test("strips colour codes and carriage-return progress", () => {
  assert.equal(stripAnsi("\u001b[32mok\u001b[0m"), "ok");
  assert.equal(stripAnsi("10%\r50%\r100%\n"), "10%\n50%\n100%\n");
});

test("prints one line for a passing step and counts warnings", () => {
  const base = { label: "test", seconds: 1.234, logPath: "/tmp/x.log" };
  assert.equal(summarize({ ...base, code: 0, output: "a\nb\n" }), "PASS test (1.2s)");
  assert.match(
    summarize({ ...base, code: 0, output: "warning: x\nok\n" }),
    /PASS test \(1\.2s, 1 warning line\(s\); log: \/tmp\/x\.log\)/,
  );
  assert.match(summarize({ ...base, code: 0, output: "npm warn deprecated x\n⚠ slow\nok\n" }), /2 warning line/);
  assert.equal(summarize({ ...base, code: 0, output: "✔ counts warnings (1ms)\n" }), "PASS test (1.2s)");
});

test("prints the tail and the log path for a failing step", () => {
  const output = Array.from({ length: 100 }, (_, index) => `line ${index + 1}`).join("\n");
  const text = summarize({ label: "lint", code: 1, seconds: 2, output, logPath: "/tmp/l.log", lines: 3 });
  assert.equal(text, "FAIL lint (exit 1, 2.0s; full log: /tmp/l.log)\nline 98\nline 99\nline 100");
});

test("runs a real command, keeps the full output in the log and reports the exit code", async () => {
  const ok = await runStep("ok", process.execPath, ["-e", "console.log('hello'); console.error('noise')"]);
  assert.equal(ok.code, 0);
  assert.match(await readFile(ok.logPath, "utf8"), /hello[\s\S]*noise/);
  const bad = await runStep("bad", process.execPath, ["-e", "process.exit(3)"]);
  assert.equal(bad.code, 3);
  const missing = await runStep("missing", "definitely-not-a-command-xyz", []);
  assert.equal(missing.code, 127);
});
