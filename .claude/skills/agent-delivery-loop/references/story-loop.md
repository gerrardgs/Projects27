# Story loop: running an agent unattended, safely

Adapted from [snarktank/ralph](https://github.com/snarktank/ralph) (MIT, commit `6c53cb0`, read on 2026-10-29), which builds on Geoffrey Huntley's [Ralph pattern](https://ghuntley.com/ralph/). The method is kept. The upstream script's use of `--dangerously-skip-permissions` (Claude Code) and `--dangerously-allow-all` (Amp) on the host machine is replaced by the guards below.

## Contents

1. When the loop fits
2. Write the stories
3. Prepare an isolated place to run
4. Choose the agent command
5. Run, watch and stop
6. Finish: review the whole branch

## 1. When the loop fits

Use it only when all of these hold:

- the work splits into stories that each fit one fresh context (rule of thumb: describable in two or three sentences);
- the repository has fast feedback that a machine can judge: type checker, tests, and an end-to-end test for UI stories;
- the user approved the stories file as the plan, including the iteration limit and the agent command ([AGENTS.md](../../../../AGENTS.md) non-negotiable 13).

Do not use it for exploratory work, design decisions, security-sensitive changes without tests, migrations against shared data, or anything outward-facing (deploy, publish, send). Those need a person at each step. Stories that touch money, ledgers, periods, tax or the audit trail need acceptance criteria that assert exact amounts and balanced journals, and a person reviews each of them before merge ([17-financial-integrity](../../../rules/17-financial-integrity.md)).

## 2. Write the stories

1. Write the specification first ([feature-specification](../../feature-specification/SKILL.md)), or run the Discuss and Plan steps ([phase-loop](phase-loop.md)).
2. Convert it into a stories file shaped like [stories.example.json](../assets/stories.example.json):
   - `branchName`: a feature branch, never `main`, `master`, `trunk`, `develop`, `production` or `release`;
   - `verifyCommand`: the one command that proves the branch is green (`npm run verify` and similar);
   - per story: `id`, `title`, `description`, `acceptanceCriteria`, `priority` (unique, lower runs first), `passes: false`, `notes`, and optionally `dependsOn`.
3. Order by dependency: schema and migrations, then server logic, then UI, then summary views. A story may depend only on stories with a lower priority number.
4. Every story needs a criterion a machine can check ("Typecheck and tests pass"). A web UI story also needs an end-to-end check with an axe scan (`apps/web`, `npm run e2e`); an API story needs the API tests (`apps/api`, `npm test` with `TEST_DATABASE_URL`); iOS and Android stories name their own test commands.
5. Split anything too big: "build the dashboard" becomes schema, queries, components and filters.
6. Check it: `node check-stories.mjs stories.json`. It exits 1 on errors and warns about stories that look too big or UI stories without a browser check.

## 3. Prepare an isolated place to run

An unattended agent must not be able to damage anything a person cares about.

- **Own worktree and branch.** Create a worktree on `branchName` ([git-worktrees](../../git-worktrees/SKILL.md)). Your main checkout stays untouched.
- **Sandbox.** Prefer a container or VM with only the repository mounted, no credentials, no SSH keys, no cloud CLIs logged in, and network limited to the package registry and the model API ([06-security](../../../rules/06-security.md) section 10; [security-hardening](../../security-hardening/SKILL.md) section 9). On a workstation, at least use the agent's own sandbox and permission rules, and never a mode that skips permission checks.
- **Guard hooks.** For Claude Code, install the tested guard hook ([security-hardening](../../security-hardening/SKILL.md) section 8). It blocks destructive Git commands, edits to `.env` files and similar actions.
- **Budget.** Set an iteration limit, a per-iteration timeout and, where the agent supports one, a spending cap.
- **Files the loop writes**: the stories file and `progress.md` next to it. Keep them on the feature branch. Remove them before merging, or keep them as the record, as the user prefers.

## 4. Choose the agent command

[story-loop.mjs](../assets/story-loop.mjs) passes [loop-prompt.md](../assets/loop-prompt.md), followed by the current story id, to the agent on standard input. The agent must run non-interactively, read the prompt from standard input, and exit when the iteration ends.

Claude Code (flags checked in the [CLI reference](https://code.claude.com/docs/en/cli-reference) on 2026-10-29):

```bash
node story-loop.mjs --stories stories.json --prompt loop-prompt.md --max-iterations 10 -- \
  claude -p --permission-mode acceptEdits \
    --allowedTools "Bash(npm run *)" "Bash(git status *)" "Bash(git diff *)" "Bash(git log *)" "Bash(git add *)" "Bash(git commit *)" \
    --disallowedTools "Bash(git push *)" \
    --max-turns 80 --max-budget-usd 5
```

- `-p` runs once and exits. `--permission-mode acceptEdits` accepts file edits and common filesystem commands (`mkdir`, `touch`, `mv`, `cp`). Other shell commands run only when `--allowedTools` lists them: in a `-p` run with no permission host, a call that would need a prompt is denied ([headless documentation](https://code.claude.com/docs/en/headless), checked on 2026-10-29). Adding `--permission-prompts none` (Claude Code 2.1.259 or later) also tells the agent not to retry denied calls.
- Do not add `--bare` when you rely on the repository's guard hooks: bare mode skips hooks, `CLAUDE.md` and skills.
- Adjust `--allowedTools` to the project's own scripts (`Bash(pnpm *)`, `Bash(pytest *)` and so on). Never add `Bash(*)`, and never use `--dangerously-skip-permissions` or `--permission-mode bypassPermissions` outside a disposable sandbox.
- `--max-turns` and `--max-budget-usd` bound each iteration. The budget is the client's estimate, not the bill, so leave headroom.

For any other agent CLI, check its `--help` for the version installed. Look for a non-interactive mode, a way to read the prompt from standard input, an allow-list of commands, and a turn or spending limit. If it has no allow-list, run it only inside a disposable sandbox.

## 5. Run, watch and stop

Each iteration, the loop:

1. picks the next ready story (lowest priority number, `passes: false`, every `dependsOn` passing);
2. starts the agent in a new process, so the agent starts with an empty context;
3. runs `verifyCommand`, then checks that the branch is unchanged and the working tree is clean.

It stops with exit code 1 on the first problem: the agent failed or timed out, the verify command failed, changes were left uncommitted, the branch changed, the stories file became invalid, the remaining stories are blocked, or the iteration limit was reached. Exit code 0 means every story passes.

When it stops, read the tail of the output, `progress.md` and `git log --oneline`. Fix the cause, or adjust the stories with the user, and start again. A story that does not progress over two iterations is too big or underspecified: split or clarify it rather than raising the limit.

## 6. Finish: review the whole branch

A passing loop is not a reviewed change. Before anything merges:

- run the full verify command on the branch yourself;
- review the whole diff against the specification ([rigorous-code-audit](../../rigorous-code-audit/SKILL.md)). Add an external review when the project uses one ([coderabbit-review](../../coderabbit-review/SKILL.md));
- check that each story's acceptance criteria are actually met, not only marked as passing;
- report to the user what passed, what was skipped and what is unverified. Merging and pushing happen only when the user asks ([08-git-workflow](../../../rules/08-git-workflow.md)).
