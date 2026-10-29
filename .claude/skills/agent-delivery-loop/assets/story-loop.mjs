#!/usr/bin/env node
// Runs a coding agent once per story, each time in a fresh process (fresh context), until every story
// passes, a guard trips, or the iteration limit is reached. Adapted from snarktank/ralph ralph.sh
// (MIT, commit 6c53cb0) with guards that file lacks: feature branch only, clean tree before and after
// each iteration, the project's verify command after each iteration, and no permission bypass.
//
// Usage (Node.js 22+, no dependencies), from the repository or worktree root:
//   node story-loop.mjs --stories <stories.json> --prompt <loop-prompt.md> [--max-iterations 10]
//                       [--timeout-minutes 60] -- <agent command and arguments>
// The agent receives the prompt on standard input, followed by the current story id.
// Exit code 0 when every story passes, 1 when a guard stops the loop or the limit is reached,
// 2 on usage errors.

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nextStory, PROTECTED_BRANCHES, readStories, remainingStories, storyProblems } from "./check-stories.mjs";

const DEFAULTS = { maxIterations: 10, timeoutMinutes: 60 };

/** Parses the command line into options; throws on usage errors. Pure. */
export function parseArguments(argv) {
  const separator = argv.indexOf("--");
  if (separator === -1 || separator === argv.length - 1) throw new Error("give the agent command after --");
  const options = { ...DEFAULTS, agent: argv.slice(separator + 1) };
  const flags = argv.slice(0, separator);
  for (let index = 0; index < flags.length; index += 2) {
    const value = flags[index + 1];
    if (value === undefined) throw new Error(`${flags[index]} needs a value`);
    assignFlag(options, flags[index], value);
  }
  if (!options.stories || !options.prompt) throw new Error("--stories and --prompt are required");
  return options;
}

function assignFlag(options, flag, value) {
  const numbers = { "--max-iterations": "maxIterations", "--timeout-minutes": "timeoutMinutes" };
  if (flag === "--stories" || flag === "--prompt") {
    options[flag.slice(2)] = value;
  } else if (numbers[flag]) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1) throw new Error(`${flag} must be a positive integer`);
    options[numbers[flag]] = number;
  } else {
    throw new Error(`unknown option ${flag}`);
  }
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  return result.stdout.trim();
}

/** Returns the reason the repository is not safe for an iteration, or undefined. */
function repositoryProblem(branchName) {
  const branch = git(["branch", "--show-current"]);
  if (PROTECTED_BRANCHES.has(branch)) return `refusing to run on protected branch "${branch}"`;
  if (branch !== branchName)
    return `current branch is "${branch}", stories expect "${branchName}"; create or switch to it first`;
  if (git(["status", "--porcelain"]) !== "") return "working tree has uncommitted changes; commit or stash them first";
  return undefined;
}

async function loadValidStories(file) {
  const document = await readStories(file);
  const { errors } = storyProblems(document);
  if (errors.length > 0) throw new Error(`${file} is invalid: ${errors.join("; ")}`);
  return document;
}

function runAgent(options, input) {
  const [command, ...args] = options.agent;
  const result = spawnSync(command, args, {
    input,
    stdio: ["pipe", "inherit", "inherit"],
    timeout: options.timeoutMinutes * 60_000,
  });
  if (result.error) return `agent could not run: ${result.error.message}`;
  return result.status === 0 ? undefined : `agent exited with status ${result.status ?? result.signal}`;
}

function runVerify(command) {
  // The verify command is the repository owner's own script (for example "npm run verify").
  const result = spawnSync(command, { shell: true, stdio: ["ignore", "inherit", "inherit"] });
  return result.status === 0
    ? undefined
    : `verify command "${command}" failed after the iteration; fix the branch before continuing`;
}

/** Runs one iteration; returns a stop reason, or undefined to continue. */
async function iterate(options, prompt, story, branchName) {
  console.error(`story-loop: ${story.id} ${story.title}`);
  const input = `${prompt}\n\nCurrent story: ${story.id}\nStories file: ${options.stories}\n`;
  const problem = runAgent(options, input) ?? runVerify((await loadValidStories(options.stories)).verifyCommand);
  return problem ?? repositoryProblem(branchName);
}

async function run(options) {
  let document = await loadValidStories(options.stories);
  const prompt = await readFile(options.prompt, "utf8");
  const startProblem = repositoryProblem(document.branchName);
  if (startProblem) return stop(startProblem);
  for (let iteration = 1; iteration <= options.maxIterations; iteration += 1) {
    const story = nextStory(document);
    if (!story)
      return remainingStories(document).length === 0
        ? done(iteration - 1)
        : stop("remaining stories are blocked by dependencies");
    const problem = await iterate(options, prompt, story, document.branchName);
    if (problem) return stop(problem);
    document = await loadValidStories(options.stories);
  }
  const left = remainingStories(document).length;
  return left === 0 ? done(options.maxIterations) : stop(`iteration limit reached with ${left} stories left`);
}

function done(iterations) {
  console.log(`story-loop: every story passes after ${iterations} iteration(s)`);
  return 0;
}

function stop(reason) {
  console.error(`story-loop: stopped: ${reason}`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    options.stories = path.resolve(options.stories);
  } catch (error) {
    console.error(`story-loop: ${error.message}`);
    process.exit(2);
  }
  run(options).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`story-loop: ${error.message}`);
      process.exit(1);
    },
  );
}
