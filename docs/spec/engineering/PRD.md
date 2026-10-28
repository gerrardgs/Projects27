# Product requirements

What Projects 23 is, for whom, and how success is judged. How it is built is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Problem

AI coding agents produce plausible but wrong output: invented APIs, packages and versions, untested code, insecure defaults, unrequested rewrites and deleted code. Each tool (Claude Code, Codex, Gemini CLI, Antigravity, Cursor, Windsurf, Copilot, Cline, Aider) reads instructions from a different file, so teams copy rules between files and the copies drift. Long instruction files are also followed less reliably (sources in [ARCHITECTURE.md](ARCHITECTURE.md) section 1).

## Users and scenarios

- Developer or team using any AI coding agent: installs the spec into a project with `scripts/install.sh` and gets the same rules in every tool.
- AI agent: reads `AGENTS.md` at the start of each session, loads a rule or skill when the task matches, and follows the verification protocol before writing code.
- Maintainer of this repository: adds or updates rules, skills and templates, and keeps every fact and pinned version current.

## Goals and non-goals

- Goal: one model-agnostic specification (`AGENTS.md`, `.agents/rules/`, `.agents/skills/`) that every supported tool loads natively or through a thin adapter.
- Goal: every runnable template and script passes in CI, and every external fact is verified at its source with a date.
- Goal: the always-on context stays within Antigravity's documented 20,000-token budget for rules.
- Non-goal: replacing a project's own README, licence, workflows or documentation; the installer never writes them.
- Non-goal: legal, compliance or security certification; the spec gives verified pointers and procedures, not legal advice.
- Non-goal: a hosted service; Projects 23 is files in a Git repository.

## Requirements

| ID | Requirement | Acceptance criteria |
| :--- | :--- | :--- |
| R1 | Every rule and skill is indexed and valid | Given any change, when `node scripts/agents-sync.mjs --check --all-markdown` runs, then it reports 0 errors |
| R2 | The installer never overwrites a project's files | Given a project with its own `README.md` and `AGENTS.md`, when `scripts/install.sh` runs, then both files are unchanged (tested in the `spec` CI job) |
| R3 | Templates run | Given each template under `.agents/skills/*/assets/`, when its CI job runs on the listed runtimes, then format, lint, type check and tests pass |
| R4 | No secrets in the repository | Given any commit, when gitleaks scans the full history, then it finds no leaks |
| R5 | Pins stay current | Given a newer release past the 7-day cooldown, when the daily Dependabot or freshness check runs, then an update is proposed or the run fails visibly |
| R6 | Facts are sourced | Given a version, limit or standard named in a skill, when a reviewer follows its link or runs `tech-lookup.mjs`, then the source confirms it |

## Non-functional requirements

- Context budget: `AGENTS.md` plus always-on rules under 20,000 tokens (about 12,300 on 2026-10-26); each skill body under 500 lines; each rule at most 12,000 characters.
- Portability: scripts need only Node.js 22 or later (no dependencies); the installer needs Bash, `curl` and `tar`.
- Security: workflows pinned to commit SHAs with read-only default permissions; downloaded binaries verified by checksum.
- Clean code: the repository's own JavaScript passes ESLint with cyclomatic complexity at most 10, nesting depth at most 3 and at most 4 parameters.

## Success metrics

- CI: every job in `validate.yml`, `codeql.yml` and `freshness.yml` green on `main`; baseline on 2026-10-23: all local equivalents pass.
- Coverage: 30 skills and 9 rules, each listed in `AGENTS.md`; target: every new practice lands in an existing skill or a justified new one, never as an unindexed file.
- Freshness: no pin older than its newest eligible release for more than one day after the cooldown, as reported by `freshness.yml`.

## Release plan

Changes accumulate under a version heading in `CHANGELOG.md` and ship as a `feat: release vX.Y.Z` commit on `main`, tagged `vX.Y.Z` (details in [DEPLOYMENT.md](DEPLOYMENT.md)). Users pin a tag with `install.sh --ref`.

## Open questions

- Enable the repository settings that code cannot change: Dependabot alerts and security updates, secret scanning with push protection, private vulnerability reporting, branch protection (owner: repository owner).
- Decide whether to rewrite Git history to remove the public commit email and the tracked `.archive/` file, which contains a local username (owner: repository owner; irreversible, see [SECURITY.md](SECURITY.md)).
