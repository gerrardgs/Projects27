#!/usr/bin/env node
// Checks a story file for the autonomous story loop: every story is small, ordered after the
// stories it depends on, and ends in a machine check, so a fresh agent can finish one per iteration.
// Format adapted from snarktank/ralph prd.json (MIT, commit 6c53cb0), plus "dependsOn" and "verifyCommand".
//
// Usage (Node.js 22+, no dependencies):
//   node check-stories.mjs [stories.json]          validate and print a one-line summary
//   node check-stories.mjs [stories.json] --next   print the id of the next ready story (empty when none)
// Exit code 0 when valid, 1 when the file has errors, 2 on usage or read errors.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const PROTECTED_BRANCHES = new Set(["main", "master", "trunk", "develop", "production", "release"]);
const MACHINE_CHECK =
  /typecheck|type-check|type check|tests? pass|lint|build|verify|check passes|npm run|pytest|go test|cargo test/i;
const USER_INTERFACE = /\b(ui|page|screen|button|form|dialog|component|view|layout)\b/i;
const BROWSER_CHECK = /browser|screenshot|playwright|e2e|end-to-end|visual/i;
const MAX_SENTENCES = 3;
const MAX_CRITERIA = 8;

const isText = (value) => typeof value === "string" && value.trim().length > 0;

/** Problems with the file's top-level fields. Pure. */
function documentErrors(document) {
  const errors = [];
  if (!isText(document.project)) errors.push("project must be a non-empty string");
  if (!isText(document.verifyCommand))
    errors.push('verifyCommand must name the project\'s check command, for example "npm run verify"');
  if (!isText(document.branchName)) errors.push("branchName must be a non-empty string");
  else if (PROTECTED_BRANCHES.has(document.branchName))
    errors.push(`branchName "${document.branchName}" is a protected branch; use a feature branch`);
  if (!Array.isArray(document.userStories) || document.userStories.length === 0)
    errors.push("userStories must be a non-empty array");
  return errors;
}

/** Problems with one story's own fields. Pure. */
function storyFieldErrors(story) {
  const errors = [];
  const label = isText(story.id) ? story.id : "a story";
  if (!isText(story.id)) errors.push("every story needs an id");
  if (!isText(story.title)) errors.push(`${label}: title is required`);
  if (!Number.isSafeInteger(story.priority) || story.priority < 1)
    errors.push(`${label}: priority must be a positive integer`);
  if (typeof story.passes !== "boolean") errors.push(`${label}: passes must be true or false`);
  const criteriaError = criteriaProblem(story.acceptanceCriteria);
  if (criteriaError) errors.push(`${label}: ${criteriaError}`);
  return errors;
}

function criteriaProblem(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0 || !criteria.every(isText)) {
    return "acceptanceCriteria must be a non-empty list of sentences";
  }
  if (!criteria.some((criterion) => MACHINE_CHECK.test(criterion))) {
    return 'add a criterion a machine can check, for example "Typecheck and tests pass"';
  }
  return undefined;
}

/** Advisories that a story may not fit one context window or lacks a browser check. Pure. */
function storyWarnings(story) {
  const warnings = [];
  const sentences = String(story.description ?? "")
    .split(/[.!?](\s|$)/)
    .filter(isText).length;
  const criteria = Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [];
  if (sentences > MAX_SENTENCES || criteria.length > MAX_CRITERIA) {
    warnings.push(`${story.id}: may be too big for one iteration; split it (rule of thumb: 2-3 sentences)`);
  }
  const text = `${story.title ?? ""} ${story.description ?? ""}`;
  if (USER_INTERFACE.test(text) && !criteria.some((criterion) => BROWSER_CHECK.test(criterion))) {
    warnings.push(`${story.id}: looks like a UI story; add a browser or end-to-end check`);
  }
  return warnings;
}

/** Problems with ids, priorities and dependency order across stories. Pure. */
function relationErrors(stories) {
  const errors = [];
  const byId = new Map();
  const priorities = new Set();
  for (const story of stories) {
    if (byId.has(story.id)) errors.push(`${story.id}: duplicate id`);
    if (priorities.has(story.priority)) errors.push(`${story.id}: priority ${story.priority} is used twice`);
    byId.set(story.id, story);
    priorities.add(story.priority);
  }
  for (const story of stories) errors.push(...dependencyErrors(story, byId));
  return errors;
}

function dependencyErrors(story, byId) {
  if (story.dependsOn === undefined) return [];
  if (!Array.isArray(story.dependsOn)) return [`${story.id}: dependsOn must be a list of story ids`];
  const errors = [];
  for (const id of story.dependsOn) {
    const dependency = byId.get(id);
    if (!dependency || id === story.id) errors.push(`${story.id}: depends on unknown story "${id}"`);
    else if (dependency.priority >= story.priority)
      errors.push(`${story.id}: depends on ${id}, which must have a lower priority number`);
    else if (story.passes === true && dependency.passes !== true)
      errors.push(`${story.id}: passes while its dependency ${id} does not`);
  }
  return errors;
}

/** All errors and warnings for a parsed story file. Pure. */
export function storyProblems(document) {
  if (document === null || typeof document !== "object" || Array.isArray(document)) {
    return { errors: ["the file must contain a JSON object"], warnings: [] };
  }
  const errors = documentErrors(document);
  if (!Array.isArray(document.userStories)) return { errors, warnings: [] };
  const stories = document.userStories.filter((story) => story !== null && typeof story === "object");
  if (stories.length !== document.userStories.length) errors.push("every story must be an object");
  for (const story of stories) errors.push(...storyFieldErrors(story));
  errors.push(...relationErrors(stories));
  return { errors, warnings: stories.flatMap(storyWarnings) };
}

/** Stories that do not pass yet, in priority order. Pure. */
export function remainingStories(document) {
  return document.userStories.filter((story) => story.passes !== true).sort((a, b) => a.priority - b.priority);
}

/** The first remaining story whose dependencies all pass, or undefined. Pure. */
export function nextStory(document) {
  const passing = new Set(document.userStories.filter((story) => story.passes === true).map((story) => story.id));
  return remainingStories(document).find((story) => (story.dependsOn ?? []).every((id) => passing.has(id)));
}

/** Reads and parses a story file; throws with a readable message. */
export async function readStories(file) {
  const text = await readFile(file, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`, { cause: error });
  }
}

async function main(argv) {
  const file = argv.find((argument) => !argument.startsWith("--")) ?? "stories.json";
  const document = await readStories(file);
  const { errors, warnings } = storyProblems(document);
  for (const message of warnings) console.warn(`warning: ${message}`);
  for (const message of errors) console.error(`error: ${message}`);
  if (errors.length > 0) return 1;
  console.log(argv.includes("--next") ? (nextStory(document)?.id ?? "") : summary(document));
  return 0;
}

/** One-line progress summary. Pure. */
export function summary(document) {
  const total = document.userStories.length;
  const remaining = remainingStories(document).length;
  const next = nextStory(document)?.id ?? (remaining ? "blocked" : "none");
  return `${total} stories, ${total - remaining} passing, next: ${next}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`error: ${error.message}`);
      process.exit(2);
    },
  );
}
