// Run with: node --test scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import { findAiAttribution } from "./check-authorship.mjs";

const human = {
  hash: "0".repeat(40),
  name: "Gerrard Sebastian",
  email: "gerrard@example.com",
  committerName: "Gerrard Sebastian",
  committerEmail: "gerrard@example.com",
};
const commit = (message, overrides = {}) => ({ ...human, message, ...overrides });

test("accepts a commit by the human author, including topics that name AI tools", () => {
  assert.deepEqual(findAiAttribution(commit("feat: add Claude Design and Copilot guidance\n\nCovers Gemini too.")), []);
});

test("does not flag Dependabot or GitHub's own bots", () => {
  const bot = { name: "dependabot[bot]", email: "49699333+dependabot[bot]@users.noreply.github.com" };
  assert.deepEqual(
    findAiAttribution(
      commit("build(deps): bump x", { ...bot, committerName: "GitHub", committerEmail: "noreply@github.com" }),
    ),
    [],
  );
});

test("flags AI co-author and sign-off trailers in any letter case", () => {
  assert.equal(
    findAiAttribution(commit("fix: x\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>")).length,
    1,
  );
  assert.equal(
    findAiAttribution(commit("fix: x\n\nco-authored-by: Copilot <copilot@users.noreply.github.com>")).length,
    1,
  );
  assert.equal(
    findAiAttribution(commit("fix: x\n\nSigned-off-by: Devin AI <devin-ai-integration[bot]@users.noreply.github.com>"))
      .length,
    1,
  );
  assert.equal(findAiAttribution(commit("fix: x\n\nCo-authored-by: Someone <bot@openai.com>")).length, 1);
});

test("keeps human co-authors, including people who share a name with an AI product", () => {
  assert.deepEqual(findAiAttribution(commit("fix: x\n\nCo-authored-by: Ana Putri <ana@example.com>")), []);
  assert.deepEqual(findAiAttribution(commit("fix: x\n\nCo-authored-by: Devin Lee <devin@example.com>")), []);
});

test("flags generated-with lines", () => {
  assert.equal(
    findAiAttribution(commit("docs: y\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)")).length,
    1,
  );
  assert.equal(findAiAttribution(commit("docs: y\n\nCreated using ChatGPT")).length, 1);
  assert.deepEqual(findAiAttribution(commit("docs: y\n\nGenerated with the docs-kit templates")), []);
});

test("flags an AI author or committer identity", () => {
  assert.equal(findAiAttribution(commit("x", { name: "Cursor Agent", email: "cursoragent@cursor.com" })).length, 1);
  assert.equal(
    findAiAttribution(commit("x", { committerName: "claude", committerEmail: "noreply@anthropic.com" })).length,
    1,
  );
});
