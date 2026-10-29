# Configuring CodeRabbit for a repository

Facts below come from the published schema (`https://coderabbit.ai/integrations/schema.v2.json`), the [CLI documentation](https://docs.coderabbit.ai/cli), the [FAQ](https://docs.coderabbit.ai/faq) and the `cli-workflows` reference of [coderabbitai/skills](https://github.com/coderabbitai/skills) (commit `8eef103`), all read on 2026-10-29. Check them again before relying on them, because the product changes often.

## 1. Decide first (owner decisions)

- **Whether to use it at all.** The CodeRabbit GitHub App reviews every pull request automatically once installed. That sends code to CodeRabbit, which shares it with OpenAI and/or Anthropic for the review. The FAQ states that customer code is never used for training. It also lists cached encrypted code archives, vector indexes of code and stored "learnings" as data it can retain. Some of that can be opted out of, and self-hosted Enterprise can disable retention completely.
- **Which repositories.** Private code and personal data need the owner's consent and a check against the project's privacy rules ([06-security](../../../rules/06-security.md) section 9).
- **Plan and limits.** Plans differ in rate limits and features, so check the current pricing page rather than assuming.

## 2. The configuration file

- Path: `.coderabbit.yaml` in the repository root, on the branch being reviewed. Put the first line `# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json` so editors validate it.
- Start from [coderabbit.example.yaml](../assets/coderabbit.example.yaml) and adjust the paths.
- Useful keys (all in schema v2):
  - `reviews.profile`: `quiet`, `chill` (default) or `assertive`.
  - `reviews.path_filters`: globs. A leading `!` excludes generated or vendored output.
  - `reviews.path_instructions`: `path` and `instructions` pairs that carry the project's own review rules.
  - `reviews.pre_merge_checks`: `title`, `description`, `docstrings`, `issue_assessment`, and up to 50 `custom_checks`. Each has a `mode` of `off`, `warning` or `error`.
  - `reviews.tools`: linters and scanners run during review, for example `gitleaks` (secrets), `actionlint` and `zizmor` (GitHub Actions), `shellcheck`, `markdownlint`, `eslint`, `ruff`, `biome`, `squawk` (Postgres migrations), `swiftlint`, `presidio` (personal identifiers), `osvScanner` (dependencies), `skillspector` (agent skills).
  - `knowledge_base.code_guidelines.filePatterns`: guideline files CodeRabbit applies during review. The defaults already include `**/AGENTS.md`, `**/CLAUDE.md`, `**/GEMINI.md`, `**/.cursor/rules/*` and `.github/copilot-instructions.md`. Add `.agents/rules/*.md` so the on-demand rules count too.
  - `reviews.request_changes_workflow` is marked deprecated in schema v2 (a legacy alias for `reviews.auto_approvals.enabled`). Do not add it to new files.
- Validate before committing. Load the YAML and check it against the schema with any JSON Schema 2020-12 validator, or use the CLI (below). A key the schema does not know is a typo or a removed option.

## 3. Changing the file with the CLI

On CLI versions that support it, configuration changes go through a guarded proposal:

1. `coderabbit config --agent` inspects the current state without writing. Note `writable` and `baseHash`.
2. `coderabbit config --agent --generate` proposes YAML. Save only its `after` string to a separate file.
3. `coderabbit config validate <proposal.yaml>` checks it.
4. `coderabbit config apply <proposal.yaml> --base <baseHash> --dry-run` previews the change. After the user approves, run the same command with `--yes` instead of `--dry-run`.

A stale base hash, a failed schema fetch or a non-writable file means stop and resolve. Never overwrite the file directly to get around the guard. If the installed CLI lacks these commands, report the version gap.

## 4. Other CLI facts worth knowing

- Install: `brew install coderabbit`, or the official install script after reading it. Never pipe a remote script straight into a shell. Windows has its own PowerShell installer.
- Sign-in: `coderabbit auth login` opens a browser (`--region eu` for EU accounts). `coderabbit auth status --agent` reports the state. API keys are for headless environments and go through the CLI's own credential store, never through prompts, files or chat.
- Usage: `coderabbit usage --agent`. Missing credit fields mean unknown, not zero. `--use-credits` authorises spending and needs the user's explicit approval.
- Saved results: `coderabbit review findings --dir <path>` shows the last run that had findings. That does not prove the latest run was clean.
- The short command `cr` is an alias of `coderabbit`.
