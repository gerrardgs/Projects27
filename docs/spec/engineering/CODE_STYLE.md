# Code style

Conventions for this repository's own scripts, templates and Markdown, beyond what the tools enforce. The general rules for any project are in [rule 02](../../../.agents/rules/02-clean-code.md).

## Enforced by tools

- `tools/lint/eslint.config.mjs`: cyclomatic complexity at most 10, nesting depth at most 3, at most 4 parameters, at most 60 lines per function (tests exempt from the length limit). Run `npm ci --prefix tools/lint && npm run --prefix tools/lint lint`; it covers `scripts/`, the Node.js template, the guard hook and the docs check.
- Each Python template's `pyproject.toml` (the machine-learning baseline uses `ruff.toml`): Ruff with line length 100, rule sets E, F, W, B, UP, SIM, C90 and N, plus S for security in the service and kit templates or NPY in the machine-learning template, and complexity at most 10; mypy in strict mode for every template except the machine-learning baseline.
- `.editorconfig`: indentation, line endings and final newlines; `.gitattributes`: `* text=auto eol=lf`.
- `scripts/agents-sync.mjs`: frontmatter format, name and description limits, index completeness, links.

## Naming

- Skill folders and `name` fields: lowercase words joined by single hyphens, identical to each other (`chaos-engineering`).
- Rules: `NN-topic.md` with a two-digit number; references and assets inside the skill that uses them.
- Templates that a user copies are named `NAME.template.md` (or `env.example`, `editorconfig` without the dot), so tools never load them as live configuration in this repository.
- JavaScript: `camelCase` functions and variables, `UPPER_SNAKE_CASE` for module-level constants, verbs for functions (`parsePyprojectPins`, `classify`).

## Project structure

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.aider.conf.yml`, `.gemini/`, `.github/copilot-instructions.md`: the core and the per-tool adapters.
- `.agents/rules/`, `.agents/skills/`: the source of truth. `.claude/skills/` is generated; never edit it by hand.
- `scripts/`: dependency-free Node.js tools and the installer, each with a `*.test.mjs` beside it.
- `tools/lint`, `tools/ci`: pinned development tools for CI only; never installed into user projects.
- `docs/`: documentation of this repository; [README.md](README.md) indexes it.

## Error handling and logging

- Scripts exit `0` on success, `1` when a check finds problems or a lookup fails, `2` on usage errors, and write errors to standard error ([rule 09](../../../.agents/rules/15-clean-execution.md) section 5).
- Network calls have a timeout (`tech-lookup.mjs` uses 20 seconds) and report failures per item instead of aborting the batch.
- Command-line output tolerates a closed pipe (EPIPE) so `| head` works.

## Comments and documentation

- A short header comment in each script states what it does, its usage line and its exit codes.
- Comments explain why; no banners, narration or emoji ([anti-slop code comments](../../../.agents/skills/anti-slop/references/code-comments.md)).
- Every external fact in a rule or skill carries its source link and the date it was checked.

## Testing conventions

Tests sit next to the code (`scripts/x.mjs` and `scripts/x.test.mjs`) and use `node:test` or `unittest` with no network: pure functions are tested directly, command-line behaviour through a child process. Details in [TESTING.md](TESTING.md).

## Commits and pull requests

Conventional Commits, one logical change per commit, and a `CHANGELOG.md` entry for every user-visible change. Commits carry only the owner's identity: no AI co-author trailer or "Generated with" line, checked by `scripts/check-authorship.mjs` ([rule 08](../../../.agents/rules/08-git-workflow.md) section 2). Release commits are named `feat: release vX.Y.Z - <summary>`.
