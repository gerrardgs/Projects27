---
name: git-worktrees
description: Isolate parallel and unattended agent work in Git worktrees - one branch and one folder per task, created with plain git worktree, the tested worktrees.mjs helper, git-worktree-runner (git gtr) or Claude Code --worktree; per-worktree setup without copying secrets, separate ports and databases, machine-readable output, status before handoff, and removal only with the user's approval. Use when running several agents or sub-agents at once, reviewing a pull request without disturbing current work, running an autonomous loop, or when the user mentions worktrees or gtr.
license: MIT
metadata:
  version: "1.0.0"
---

# Git Worktrees for Agents

A worktree is a second working folder of the same repository with its own branch checked out. Parallel agents in one folder overwrite each other's files. With one worktree per task, each agent works on its own branch, and the main checkout stays untouched. Worktrees share one object store, so they cost little disk and no clone time.

The policy below is adapted from the agent guide of [coderabbitai/git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) (`git gtr`, Apache-2.0, v2.11.1, `docs/agent-usage.md`, read on 2026-10-29). The commands work with plain Git 2.17 or newer, so no tool is required.

## 1. Policy

1. **One task, one branch, one worktree.** Create it from the integration branch, and work only inside the returned path.
2. **Never on a protected branch.** No worktree task on `main`, `master`, `trunk`, `develop`, `production` or `release`.
3. **Machine-readable results.** Parse records or exit codes, not human-readable logs. A non-zero exit is a failure.
4. **Status before handoff.** Before reporting, run `git status --short --branch` in the worktree and report its branch, changes and check results.
5. **Removal is the user's decision.** Do not remove worktrees, delete branches, force-remove or run bulk cleanup without explicit approval for that scope ([15-clean-execution](../../rules/15-clean-execution.md) section 2). Uncommitted work in a worktree is lost when it is removed.
6. **Do not trust on someone's behalf.** Setup hooks committed to a repository are code. A person reviews them before they run, and an agent never approves them (`git gtr trust`).

## 2. Create, use and inspect

Pick the first tool that is available:

| Action | Plain Git | Helper (`assets/worktrees.mjs`) | `git gtr` |
| :--- | :--- | :--- | :--- |
| Create | `git worktree add -b agent/x ../app-worktrees/agent-x main` | `node worktrees.mjs new agent/x [--from main]` | `git gtr new agent/x --porcelain` |
| List | `git worktree list --porcelain` | `node worktrees.mjs list` | `git gtr list --porcelain` |
| Status of all | `git -C <path> status --short --branch` | `node worktrees.mjs status` | `git gtr run <branch> git status --short` |
| Run a command | `git -C <path> <command>`, or `cd` into the path | | `git gtr run <branch> <command>` |
| Remove (approved only) | `git worktree remove <path>` | not provided, on purpose | `git gtr rm <branch>` |

- The helper is tested and has no dependencies. It writes `path` and `branch` records as `key<TAB>value` lines, the same format as `git gtr --porcelain`, so callers parse both the same way. It creates folders beside the repository (`../<repo>-worktrees/<branch with / as ->`), refuses protected branches and existing folders, and never removes anything.
- `git gtr new --porcelain` also prints `hook_status`: `disabled`, `none`, `ran`, `skipped-untrusted` or `partial`. Report `skipped-untrusted` and `partial` to the user. For a bare worktree without copying, hooks or network, add `--no-copy --no-hooks --no-fetch`.
- Claude Code can start a session in its own worktree with `claude --worktree <name>` (`-w`), which creates `<repo>/.claude/worktrees/<name>` ([CLI reference](https://code.claude.com/docs/en/cli-reference), checked on 2026-10-29). Keep that folder out of version control.
- Install `git gtr` only from its official sources (the `coderabbitai/tap` Homebrew tap or the repository's `install.sh` after reading it), and only when the user wants it ([04-dependencies](../../rules/04-dependencies.md)).

## 3. Set up each worktree

A new worktree has the tracked files only: no dependencies, no `.env`, no build output.

- **Dependencies**: run the project's reproducible install in the worktree (`npm ci`, `uv sync`, `go mod download` and so on). `git gtr` can do this with a reviewed `postCreate` hook ([gtrconfig.example](assets/gtrconfig.example)).
- **Configuration and secrets**: copy `.env.example`, never real `.env` files, and fill in development values. Copying secrets into many folders multiplies the places they can leak ([06-security](../../rules/06-security.md) section 2).
- **Shared resources**: parallel worktrees collide on ports, databases, caches, queues and local storage. Give each worktree its own port (an environment variable per worktree) and its own database or schema, or serialise the tasks that need the shared resource. In this repository the API listens on 8080, the web app on 5173 and PostgreSQL on 5433 with the development database `projects27_dev` ([CONFIGURATION](../../../docs/CONFIGURATION.md), [DATABASE](../../../docs/DATABASE.md)). A worktree that runs the app gets its own ports and its own database (for example `createdb -p 5433 projects27_dev_<task>`, then `DATABASE_URL=postgres://localhost:5433/projects27_dev_<task> npm run migrate` in `apps/api`); the API tests create their own databases from `TEST_DATABASE_URL`.
- **Generated and lock files**: when two tasks would both change a lockfile, a migration sequence or generated code, put them in different waves instead of running them in parallel.

## 4. Merge back and finish

1. In the worktree: the project's verify command passes, and the work is committed on its branch.
2. Merge or rebase the branch into the integration branch in the order the plan defines (one wave at a time, see [agent-delivery-loop](../agent-delivery-loop/SKILL.md)), then run the checks again on the integration branch.
3. Review the integration branch as a whole ([rigorous-code-audit](../rigorous-code-audit/SKILL.md)).
4. Report each worktree's path, branch and state, and propose removal. Remove only after the user agrees, and only worktrees without uncommitted work.

## Done when

- [ ] Each parallel or unattended task ran in its own worktree on its own non-protected branch
- [ ] Each worktree was set up without copying real secrets and without port or database collisions
- [ ] Results were read from records and exit codes, and `git status` was reported per worktree
- [ ] Branches were merged in plan order and the integration branch passed the checks and a review
- [ ] Nothing was removed, trusted or force-cleaned without the user's approval
