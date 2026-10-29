// Run with: node --test

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { nextStory, remainingStories, storyProblems } from "./check-stories.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECKER = path.join(HERE, "check-stories.mjs");
const EXAMPLE = path.join(HERE, "stories.example.json");

const story = (id, priority, extra = {}) => ({
  id,
  title: `Story ${id}`,
  description: "As a user, I want a thing so that I benefit.",
  acceptanceCriteria: ["The thing exists", "Typecheck and tests pass"],
  priority,
  passes: false,
  ...extra,
});
const file = (stories, extra = {}) => ({
  project: "Demo",
  branchName: "agent/demo",
  verifyCommand: "npm run verify",
  userStories: stories,
  ...extra,
});

test("the shipped example is valid and starts with its first story", () => {
  const example = JSON.parse(readFileSync(EXAMPLE, "utf8"));
  assert.deepEqual(storyProblems(example), { errors: [], warnings: [] });
  assert.equal(nextStory(example).id, "US-001");
});

test("rejects protected branches, missing verify commands and empty story lists", () => {
  const { errors } = storyProblems({ project: "Demo", branchName: "main", userStories: [] });
  assert.ok(errors.some((message) => message.includes("protected branch")));
  assert.ok(errors.some((message) => message.includes("verifyCommand")));
  assert.ok(errors.some((message) => message.includes("non-empty array")));
});

test("requires a criterion a machine can check", () => {
  const { errors } = storyProblems(file([story("US-1", 1, { acceptanceCriteria: ["Looks nice"] })]));
  assert.deepEqual(errors, ['US-1: add a criterion a machine can check, for example "Typecheck and tests pass"']);
});

test("rejects duplicate ids and priorities, unknown and out-of-order dependencies", () => {
  const { errors } = storyProblems(
    file([
      story("US-1", 2, { dependsOn: ["US-2"] }),
      story("US-2", 1),
      story("US-2", 1),
      story("US-3", 3, { dependsOn: ["US-9"] }),
    ]),
  );
  assert.ok(errors.includes("US-2: duplicate id"));
  assert.ok(errors.includes("US-2: priority 1 is used twice"));
  assert.ok(errors.includes('US-3: depends on unknown story "US-9"'));
  const ordering = storyProblems(file([story("US-1", 1, { dependsOn: ["US-2"] }), story("US-2", 2)])).errors;
  assert.deepEqual(ordering, ["US-1: depends on US-2, which must have a lower priority number"]);
});

test("rejects a passing story whose dependency does not pass", () => {
  const { errors } = storyProblems(file([story("US-1", 1), story("US-2", 2, { passes: true, dependsOn: ["US-1"] })]));
  assert.deepEqual(errors, ["US-2: passes while its dependency US-1 does not"]);
});

test("warns about stories too big for one iteration and UI stories without a browser check", () => {
  const big = story("US-1", 1, { description: "One. Two. Three. Four." });
  const screen = story("US-2", 2, { title: "Add a filter button to the list page" });
  const { errors, warnings } = storyProblems(file([big, screen]));
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 2);
});

test("picks the next ready story in priority order and skips blocked ones", () => {
  const document = file(
    [story("US-1", 1, { passes: true }), story("US-2", 2, { dependsOn: ["US-3"] }), story("US-3", 3)].map((item) =>
      item.id === "US-2" ? { ...item, priority: 4 } : item,
    ),
  );
  assert.deepEqual(
    remainingStories(document).map((item) => item.id),
    ["US-3", "US-2"],
  );
  assert.equal(nextStory(document).id, "US-3");
  assert.equal(nextStory(file([story("US-1", 1, { passes: true })])), undefined);
});

test("the command line prints a summary, the next id, and exits 2 on unreadable input", () => {
  assert.match(
    execFileSync(process.execPath, [CHECKER, EXAMPLE], { encoding: "utf8" }),
    /^4 stories, 0 passing, next: US-001$/m,
  );
  assert.equal(execFileSync(process.execPath, [CHECKER, EXAMPLE, "--next"], { encoding: "utf8" }).trim(), "US-001");
  assert.throws(
    () => execFileSync(process.execPath, [CHECKER, path.join(HERE, "missing.json")], { stdio: "pipe" }),
    (error) => error.status === 2,
  );
});
