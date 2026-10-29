#!/usr/bin/env node
// Creates and inspects Git worktrees for parallel or unattended agent work, with plain Git and no
// other tools. Output follows the record format of coderabbitai/git-worktree-runner (`git gtr`,
// Apache-2.0, v2.11.1): one "key<TAB>value" record per line, with backslash, tab and newline escaped.
// It never removes worktrees or branches: that stays a human decision.
//
// Usage (Node.js 22+, Git 2.17+), from anywhere inside the repository:
//   node worktrees.mjs new <branch> [--from <ref>] [--root <dir>]   create; prints path and branch records
//   node worktrees.mjs list                                         one line per worktree: path, branch, head
//   node worktrees.mjs status                                       one line per worktree: path, branch, changed files
// Exit code 0 on success, 1 when Git refuses or a guard trips, 2 on usage errors.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROTECTED_BRANCHES = new Set(["main", "master", "trunk", "develop", "production", "release"]);

class UsageError extends Error {}

/** Escapes a record value the way `git gtr --porcelain` does. Pure. */
export function escapeValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("\t", "\\t").replaceAll("\n", "\\n");
}

/** Folder name for a branch: path separators become hyphens. Pure. */
export function folderName(branch) {
  return branch.replace(/[/\\]+/g, "-");
}

/** Parses `git worktree list --porcelain` into objects. Pure. */
export function parseWorktreeList(text) {
  const worktrees = [];
  for (const block of text.split(/\n\s*\n/)) {
    const entry = {};
    for (const line of block.split("\n").filter(Boolean)) {
      const [key, ...rest] = line.split(" ");
      entry[key] = rest.length > 0 ? rest.join(" ") : true;
    }
    if (typeof entry.worktree !== "string") continue;
    const branch = typeof entry.branch === "string" ? entry.branch.replace(/^refs\/heads\//, "") : "(detached)";
    worktrees.push({ path: entry.worktree, branch, head: entry.HEAD ?? "", bare: entry.bare === true });
  }
  return worktrees;
}

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { ok: result.status === 0, stdout: result.stdout.trim(), stderr: (result.stderr ?? "").trim() };
}

function mustGit(args, cwd) {
  const result = git(args, cwd);
  if (!result.ok) throw new Error(`git ${args[0]} failed: ${result.stderr}`);
  return result.stdout;
}

function listAll() {
  return parseWorktreeList(mustGit(["worktree", "list", "--porcelain"]));
}

function parseNewOptions(args) {
  const [branch, ...flags] = args;
  if (!branch || branch.startsWith("--")) throw new UsageError("new needs a branch name");
  const options = { branch };
  for (let index = 0; index < flags.length; index += 2) {
    if (!["--from", "--root"].includes(flags[index]) || flags[index + 1] === undefined) {
      throw new UsageError(`unknown or incomplete option ${flags[index]}`);
    }
    options[flags[index].slice(2)] = flags[index + 1];
  }
  return options;
}

function createWorktree(args) {
  const { branch, from, root } = parseNewOptions(args);
  if (PROTECTED_BRANCHES.has(branch)) throw new Error(`refusing to create a worktree for protected branch "${branch}"`);
  mustGit(["check-ref-format", "--branch", branch]);
  const primary = listAll()[0].path;
  const base = root ? path.resolve(root) : path.join(path.dirname(primary), `${path.basename(primary)}-worktrees`);
  const target = path.join(base, folderName(branch));
  if (existsSync(target)) throw new Error(`${target} already exists`);
  const exists = git(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).ok;
  if (exists && from) throw new Error(`branch "${branch}" exists; --from applies only to new branches`);
  const addArgs = exists
    ? ["worktree", "add", target, branch]
    : ["worktree", "add", "-b", branch, target, ...(from ? [from] : [])];
  mustGit(addArgs, primary);
  console.log(`path\t${escapeValue(target)}`);
  console.log(`branch\t${escapeValue(branch)}`);
}

function listWorktrees() {
  for (const worktree of listAll()) {
    console.log([worktree.path, worktree.branch, worktree.head].map(escapeValue).join("\t"));
  }
}

function statusWorktrees() {
  for (const worktree of listAll().filter((entry) => !entry.bare)) {
    const status = git(["status", "--porcelain"], worktree.path);
    const changes = status.ok ? String(status.stdout.split("\n").filter(Boolean).length) : "unavailable";
    console.log([worktree.path, worktree.branch, `changes=${changes}`].map(escapeValue).join("\t"));
  }
}

function main([command, ...args]) {
  const commands = { new: () => createWorktree(args), list: listWorktrees, status: statusWorktrees };
  if (!commands[command])
    throw new UsageError("usage: worktrees.mjs new <branch> [--from <ref>] [--root <dir>] | list | status");
  commands[command]();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`worktrees: ${error.message}`);
    process.exit(error instanceof UsageError ? 2 : 1);
  }
}
