// Run with: node --test

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { escapeValue, folderName, parseWorktreeList } from "./worktrees.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "worktrees.mjs");

function fixture() {
  const directory = realpathSync(mkdtempSync(path.join(tmpdir(), "worktrees-")));
  const repository = path.join(directory, "app");
  execFileSync("git", ["init", "-q", "-b", "main", repository]);
  const run = (args) => execFileSync("git", args, { cwd: repository, stdio: "pipe" });
  run(["config", "user.name", "Test"]);
  run(["config", "user.email", "test@example.test"]);
  writeFileSync(path.join(repository, "README.md"), "app\n");
  run(["add", "."]);
  run(["commit", "-qm", "init"]);
  return { directory, repository };
}

const cli = (cwd, ...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });
const records = (stdout) =>
  Object.fromEntries(
    stdout
      .trim()
      .split("\n")
      .map((line) => line.split("\t")),
  );

test("escapes record values and derives folder names", () => {
  assert.equal(escapeValue("a\tb\nc\\d"), "a\\tb\\nc\\\\d");
  assert.equal(folderName("agent/US-001/fix"), "agent-US-001-fix");
});

test("parses git worktree list --porcelain, including detached and bare entries", () => {
  const text =
    "worktree /r\nHEAD abc\nbranch refs/heads/main\n\nworktree /r-w/x\nHEAD def\ndetached\n\nworktree /bare\nbare\n";
  assert.deepEqual(parseWorktreeList(text), [
    { path: "/r", branch: "main", head: "abc", bare: false },
    { path: "/r-w/x", branch: "(detached)", head: "def", bare: false },
    { path: "/bare", branch: "(detached)", head: "", bare: true },
  ]);
});

test("creates a worktree beside the repository and prints path and branch records", (t) => {
  const { directory, repository } = fixture();
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const result = cli(repository, "new", "agent/task-1");
  assert.equal(result.status, 0, result.stderr);
  const created = records(result.stdout);
  assert.deepEqual(created, { path: path.join(directory, "app-worktrees", "agent-task-1"), branch: "agent/task-1" });
  const again = cli(repository, "new", "agent/task-1");
  assert.equal(again.status, 1);
  assert.match(again.stderr, /already exists/);
});

test("reuses an existing branch and rejects --from for it", (t) => {
  const { directory, repository } = fixture();
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  execFileSync("git", ["branch", "agent/existing"], { cwd: repository });
  assert.equal(cli(repository, "new", "agent/existing", "--from", "main").status, 1);
  const result = cli(repository, "new", "agent/existing", "--root", path.join(directory, "elsewhere"));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(records(result.stdout).path, path.join(directory, "elsewhere", "agent-existing"));
});

test("refuses protected branches and reports usage errors with exit code 2", (t) => {
  const { directory, repository } = fixture();
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const protectedBranch = cli(repository, "new", "main");
  assert.equal(protectedBranch.status, 1);
  assert.match(protectedBranch.stderr, /protected branch/);
  assert.equal(cli(repository, "remove", "x").status, 2);
  assert.equal(cli(repository, "new").status, 2);
});

test("lists worktrees and counts changed files in each", (t) => {
  const { directory, repository } = fixture();
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const created = records(cli(repository, "new", "agent/task-2").stdout);
  writeFileSync(path.join(created.path, "new-file.txt"), "work in progress\n");
  const list = cli(created.path, "list").stdout.trim().split("\n");
  assert.equal(list.length, 2);
  assert.match(list[1], /^.*agent-task-2\tagent\/task-2\t[0-9a-f]{40}$/);
  const status = cli(repository, "status").stdout.trim().split("\n");
  assert.deepEqual(
    status.map((line) => line.split("\t").slice(1)),
    [
      ["main", "changes=0"],
      ["agent/task-2", "changes=1"],
    ],
  );
});
