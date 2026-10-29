# Claude Code instructions for docs/

## Instructions

@AGENTS.md

Follow [docs/AGENTS.md](AGENTS.md) for this folder and the repository's [AGENTS.md](../AGENTS.md) everywhere.

## Claude Code notes

- Run the three checks in [AGENTS.md](AGENTS.md) through the Bash tool after editing; `npm run verify` at the repository root runs the spec checks.
- When a document describes code, read the code first (`apps/api/src`, `apps/web/src`, `apps/android/lib`, `apps/ios`) instead of relying on memory or another document.
- Do not create files outside `docs/` while editing documentation, and do not remove sections ([01-core-principles](../.agents/rules/01-core-principles.md) section 8).
