// Run with: node --test

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseArguments } from "./story-loop.mjs";

const LOOP = path.join(path.dirname(fileURLToPath(import.meta.url)), "story-loop.mjs");

// A stand-in agent: marks the current story as passing and commits, or misbehaves on request.
const FAKE_AGENT = `
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const input = readFileSync(0, "utf8");
const id = input.match(/Current story: (\\S+)/)[1];
const file = input.match(/Stories file: (.+)/)[1].trim();
const mode = process.argv[2] ?? "good";
if (mode === "noop") process.exit(0);
const document = JSON.parse(readFileSync(file, "utf8"));
document.userStories.find((story) => story.id === id).passes = true;
writeFileSync(file, JSON.stringify(document, null, 2));
if (mode !== "dirty") execFileSync("git", ["commit", "-qam", "feat: " + id]);
`;

function story(id, priority) {
  return {
    id,
    title: `Story ${id}`,
    description: "Small.",
    acceptanceCriteria: ["Tests pass"],
    priority,
    passes: false,
  };
}

function fixture({ branch = "agent/demo", verify = 'node -e "process.exit(0)"' } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), "story-loop-"));
  const repository = path.join(directory, "repo");
  const run = (args) => execFileSync("git", args, { cwd: repository, stdio: "pipe" });
  execFileSync("git", ["init", "-q", "-b", "main", repository]);
  run(["config", "user.name", "Test"]);
  run(["config", "user.email", "test@example.test"]);
  const stories = {
    project: "Demo",
    branchName: "agent/demo",
    verifyCommand: verify,
    userStories: [story("US-1", 1), story("US-2", 2)],
  };
  writeFileSync(path.join(repository, "stories.json"), JSON.stringify(stories, null, 2));
  writeFileSync(path.join(directory, "prompt.md"), "Implement the current story.\n");
  writeFileSync(path.join(directory, "agent.mjs"), FAKE_AGENT);
  run(["add", "."]);
  run(["commit", "-qm", "init"]);
  if (branch !== "main") run(["switch", "-qc", branch]);
  return { directory, repository, log: () => run(["log", "--format=%s"]).toString() };
}

function loop(context, agentMode, extra = []) {
  const args = [
    LOOP,
    "--stories",
    "stories.json",
    "--prompt",
    path.join(context.directory, "prompt.md"),
    ...extra,
    "--",
    process.execPath,
    path.join(context.directory, "agent.mjs"),
    agentMode,
  ];
  return spawnSync(process.execPath, args, { cwd: context.repository, encoding: "utf8" });
}

test("parses options and rejects bad usage", () => {
  const options = parseArguments([
    "--stories",
    "s.json",
    "--prompt",
    "p.md",
    "--max-iterations",
    "3",
    "--",
    "claude",
    "-p",
  ]);
  assert.deepEqual(options, {
    stories: "s.json",
    prompt: "p.md",
    maxIterations: 3,
    timeoutMinutes: 60,
    agent: ["claude", "-p"],
  });
  assert.throws(() => parseArguments(["--stories", "s.json", "--prompt", "p.md"]), /after --/);
  assert.throws(
    () => parseArguments(["--stories", "s.json", "--prompt", "p.md", "--max-iterations", "0", "--", "x"]),
    /positive integer/,
  );
  assert.throws(() => parseArguments(["--prompt", "p.md", "--", "x"]), /required/);
});

test("runs one fresh agent per story until every story passes", (t) => {
  const context = fixture();
  t.after(() => rmSync(context.directory, { recursive: true, force: true }));
  const result = loop(context, "good");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /every story passes after 2 iteration/);
  assert.deepEqual(context.log().trim().split("\n"), ["feat: US-2", "feat: US-1", "init"]);
});

test("refuses to start on a protected branch", (t) => {
  const context = fixture({ branch: "main" });
  t.after(() => rmSync(context.directory, { recursive: true, force: true }));
  const result = loop(context, "good");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /protected branch "main"/);
});

test("stops when the agent leaves uncommitted changes", (t) => {
  const context = fixture();
  t.after(() => rmSync(context.directory, { recursive: true, force: true }));
  const result = loop(context, "dirty");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /uncommitted changes/);
});

test("stops when the verify command fails after an iteration", (t) => {
  const context = fixture({ verify: 'node -e "process.exit(3)"' });
  t.after(() => rmSync(context.directory, { recursive: true, force: true }));
  const result = loop(context, "good");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /verify command .* failed/);
  assert.equal(context.log().trim().split("\n").length, 2);
});

test("stops at the iteration limit when stories do not progress", (t) => {
  const context = fixture();
  t.after(() => rmSync(context.directory, { recursive: true, force: true }));
  const result = loop(context, "noop", ["--max-iterations", "2"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /iteration limit reached with 2 stories left/);
});
