# Configuration

Every environment variable, configuration file and option that this repository's scripts and adapters read.

## Environment variables

| Name | Meaning | Type | Default | Required | Secret | Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UCNA_REF` | Branch, tag or commit `install.sh` downloads (same as `--ref`) | Git ref | `main` | No | No | `v2.16.0` |
| `UCNA_SOURCE_DIR` | Install from a local checkout instead of downloading (same as `--source`) | Path | empty | No | No | `/path/to/Projects23` |
| `UCNA_SHA256` | Expected SHA-256 of the downloaded archive (same as `--sha256`) | Hex string | empty | No | No | `3f1c...` |
| `TOOLBOX_BIN` | Path to the MCP Toolbox binary for the MCP example's test | Path | none | Only for that test | No | `$RUNNER_TEMP/toolbox` |
| `CATALOG_DB` | SQLite file for the MCP example's `tools.yaml` | Path | none | Only for that example | No | `$PWD/catalog.db` |

The Node.js scripts read no environment variables. CI also sets `GITLEAKS_VERSION`, `TOOLBOX_VERSION` and `TOOLBOX_SHA256` inside `validate.yml`.

## Configuration files

- `.gemini/settings.json`: `context.fileName` is `["AGENTS.md", "GEMINI.md"]`, so Gemini CLI loads `AGENTS.md`.
- `.aider.conf.yml`: `read: [AGENTS.md]`, so Aider loads `AGENTS.md` as read-only context.
- `.github/copilot-instructions.md`: the essentials for Copilot surfaces that read only that file.
- `.github/dependabot.yml`: update ecosystems, daily schedule, 7-day cooldown.
- `.claude/skills/.agents-sync.json`: generated manifest of mirrored skills; written by `agents-sync.mjs`.
- `tools/lint/eslint.config.mjs`, each template's `pyproject.toml` or `package.json`: lint and type-check settings ([CODE_STYLE.md](CODE_STYLE.md)).

## Per-environment values

There is one environment: a checkout of the repository, locally or in CI. CI differs only in running the template matrices and downloading checksum-verified tools; see [DEPLOYMENT.md](DEPLOYMENT.md).

## Feature flags

None. Script behaviour is chosen with command-line options:

| Script | Options |
| :--- | :--- |
| `install.sh` | `--ref`, `--source`, `--sha256`, `--force`, `--dry-run`, `-h` |
| `agents-sync.mjs` | `--check` (no writes, fail on drift), `--all-markdown` (check links in every Markdown file) |
| `tech-lookup.mjs` | `<ecosystem>:<name>` arguments, `--json` |
| `check-updates.mjs` | `--cooldown-days N` (default 7) |
| `check-docs.mjs` | `[docs-dir]` (default `docs`) |
| `check-authorship.mjs` | `[range]` (default `HEAD`, the whole history; for example `origin/main..` for a branch) |
| `run-quiet.mjs` | `--lines N` (default 40), `--name <label>`, `--steps <npm scripts>` or `-- <command> [args]` |

## Validation

`install.sh` stops with a message when `curl`, `tar` or the target directory is missing, and when `--sha256` does not match. `tech-lookup.mjs` exits 1 for an unknown ecosystem or a name that is not found and 2 when called without arguments; `check-updates.mjs` and `check-docs.mjs` exit 2 on invalid options; `check-authorship.mjs` exits 1 when a commit credits an AI agent and 2 when the Git range cannot be read.
