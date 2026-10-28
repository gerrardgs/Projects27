# Project rules

Rules specific to maintaining Projects 23. The rules that the spec gives to every project are in `AGENTS.md` and `.agents/rules/`; they apply here too.

## Domain rules and invariants

- Every rule and skill is linked from the indexes in `AGENTS.md`; every always-on rule is imported by `CLAUDE.md`. Checked by `agents-sync.mjs`.
- `.claude/skills/` is byte-identical to `.agents/skills/`. Checked by `agents-sync.mjs --check`.
- Processes run through the CLI and agents read summaries, not whole logs (rule 15 section 2; `npm run verify`).
- Every runnable asset has a CI job or test step that runs it; nothing in `assets/` is presented as working without having run.
- Every version, limit, standard or quotation in a rule or skill is verified at its source and dated; content adapted from another project names it, its licence and the commit read.
- `AGENTS.md` plus the always-on rules stay under 20,000 tokens; skill bodies under 500 lines; rules at most 12,000 characters.
- Files that tools load as instructions (`AGENTS.md`, `CLAUDE.md`) appear in templates only under `.template.md` names.
- Only the human author is credited: no commit, tag, release note or pull request carries an AI identity, co-author trailer or "Generated with" line (`AGENTS.md` non-negotiable 10, checked by `scripts/check-authorship.mjs` in CI).

## Compliance and legal constraints

- The repository is MIT-licensed (`LICENSE`). Material adapted from other projects must be compatible (MIT, Apache-2.0 or similar) and attributed; text from sources without a licence is paraphrased, not copied.
- No personal data, credentials or customer data in any file or commit ([rule 06](../../../.agents/rules/06-security.md) section 9).

## Protected areas

- `scripts/install.sh`: users pipe it into a shell from the `main` branch; any change needs a review of the full diff and the installer tests in CI.
- `.github/workflows/`: SHA-pinned actions and least-privilege permissions; changes must pass actionlint and zizmor.
- Git history and tags: no rewriting, force-pushing or tag deletion.
- Existing content of rules and skills: never delete or rewrite it on your own; propose and wait ([AGENTS.md](../../../AGENTS.md) non-negotiable 9).

## Approvals

| Change | Approval |
| :--- | :--- |
| Commit, push, tag or release | The repository owner, explicitly, each time |
| Removing or rewriting existing rules, skills or templates | The repository owner, after a proposal |
| History rewrite, force-push, repository settings | The repository owner; irreversible or outward-facing. Removing an already pushed AI attribution follows rule 08 section 3: identical tree, backup branch, tags moved, `--force-with-lease` |
| Enabling the Claude Code guard hook in this repository | The repository owner (it changes every session) |

## Exceptions

- `tools/lint` uses TypeScript 6.0.3 instead of the latest because of typescript-eslint's peer range (owner: repository owner, review when typescript-eslint supports TypeScript 6.1 or later).
- The `.archive/` tarball is tracked although it contains a local username; removing it from history is pending the owner's decision ([SECURITY.md](SECURITY.md)).
