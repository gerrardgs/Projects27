// Run with: node --test scripts/
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  commandReason,
  decide,
  editReason,
  NET_REMOVED_LINES,
  removedLineCount,
  writeReason,
} from "./hooks/guard-deletions.mjs";

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "hooks", "guard-deletions.mjs");

/** Runs the hook as Claude Code does: JSON on standard input, decision (if any) on standard output. */
function runHook(input, projectDir) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath,
      [HOOK],
      { env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir } },
      (error, stdout) => (error ? reject(error) : resolve(stdout)),
    );
    child.stdin.end(typeof input === "string" ? input : JSON.stringify(input));
  });
}

describe("deletion guard: shell commands", () => {
  test("asks before commands that delete files or discard Git work", () => {
    for (const command of [
      "rm -rf dist",
      "cd src && rm old.ts",
      "rmdir assets",
      "find . -name '*.orig' -delete",
      "git rm src/legacy.ts",
      "git -C ../app clean -fdx",
      "git reset --hard HEAD~1",
      "git checkout -- src/app.ts",
      "git restore src/app.ts",
      "git stash drop",
      "git branch -D feature",
      "git push --force origin main",
      "git push -f origin main",
    ]) {
      assert.ok(commandReason(command), command);
    }
  });

  test("lets ordinary commands through", () => {
    for (const command of [
      "npm test",
      "git status",
      "git checkout main",
      "git push origin main",
      "ls -la",
      "npx biome ci",
    ]) {
      assert.equal(commandReason(command), undefined, command);
    }
  });
});

describe("deletion guard: edits and writes", () => {
  test("counts removed lines, ignoring blank lines and indentation", () => {
    assert.equal(removedLineCount("a\nb\n\nc", "  a\nc"), 1);
    assert.equal(removedLineCount("a\na\nb", "a\nb"), 1, "each surviving line matches once");
    assert.equal(removedLineCount("", "a\nb"), 0);
  });

  test("asks when an edit deletes text or removes several lines net", () => {
    assert.match(editReason("console.log(x);", ""), /deletes 1 existing line/);
    const block = ["function a() {", "  one();", "  two();", "  three();", "}"].join("\n");
    assert.match(editReason(block, "function a() {}"), /removes \d+ more existing line/);
  });

  test("allows edits that change or add lines", () => {
    assert.equal(editReason("const total = a - b;", "const total = a + b;"), undefined, "a one-line fix");
    assert.equal(editReason("a();\nb();", "a();\nb();\nc();"), undefined, "an addition");
    assert.equal(editReason("x\ny", "x2\ny2"), undefined, "rewording below the threshold");
  });

  test("asks when a write overwrites a file and drops existing lines; new files pass", () => {
    const existing = Array.from({ length: NET_REMOVED_LINES + 2 }, (_, index) => `line ${index}`).join("\n");
    assert.match(writeReason(existing, "line 0"), /overwrites the file/);
    assert.equal(writeReason(existing, `${existing}\nline added`), undefined, "appending keeps every line");
    assert.equal(writeReason(undefined, "new file"), undefined);
  });

  test("ignores files outside the project, such as scratch files", () => {
    const outside = {
      tool_name: "Edit",
      tool_input: { file_path: "/tmp/scratch.txt", old_string: "a\nb\nc\nd", new_string: "" },
    };
    assert.equal(decide(outside, "/work/project"), undefined);
    const inside = { ...outside, tool_input: { ...outside.tool_input, file_path: "/work/project/src/a.ts" } };
    assert.ok(decide(inside, "/work/project"));
  });
});

describe("deletion guard: as a Claude Code hook", () => {
  let project = "";
  before(async () => {
    project = await mkdtemp(path.join(tmpdir(), "guard-"));
    await writeFile(path.join(project, "app.ts"), "one();\ntwo();\nthree();\nfour();\n");
  });
  after(() => rm(project, { recursive: true, force: true }));

  test("prints an ask decision for a destructive write and nothing for a harmless one", async () => {
    const file = path.join(project, "app.ts");
    const output = JSON.parse(
      await runHook({ tool_name: "Write", tool_input: { file_path: file, content: "one();\n" } }, project),
    );
    assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
    assert.equal(output.hookSpecificOutput.permissionDecision, "ask");
    assert.match(output.hookSpecificOutput.permissionDecisionReason, /R-01 section 8/);
    const harmless = { tool_name: "Write", tool_input: { file_path: path.join(project, "new.ts"), content: "x();\n" } };
    assert.equal(await runHook(harmless, project), "");
  });

  test("asks instead of failing open when the input is not valid JSON", async () => {
    const output = JSON.parse(await runHook("not json", project));
    assert.equal(output.hookSpecificOutput.permissionDecision, "ask");
  });
});
