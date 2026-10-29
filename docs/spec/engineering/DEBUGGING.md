# Debugging

How to investigate failures of the validators, scripts, templates and CI in this repository.

## Run locally

```bash
git clone https://github.com/gerrardgs/Projects23.git && cd Projects23
node --version                                         # 22 or later
node scripts/agents-sync.mjs --check --all-markdown    # what the spec job runs first
node --test "scripts/*.test.mjs"
```

For a template, copy its folder to a scratch directory and run the commands from its CI job there.

## Logs, metrics and traces

There is no running service. Evidence comes from command output: each validator prints one `error:` line per problem with the file path, and the GitHub Actions log of the failing step shows the same. Scheduled runs (`validate.yml`, `codeql.yml`, `freshness.yml`) report through the repository's Actions tab and the owner's notifications; `freshness.yml` also writes its table to the job summary.

## Common problems

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| `.claude/skills/<name>: differs from .agents/skills` | A skill was edited without regenerating the mirror | `node scripts/agents-sync.mjs`, then commit both |
| `broken link "..."` | A relative link points to a file that does not exist from that folder; template placeholders written as links | Fix the path; in templates write the path as code, not as a link |
| Frontmatter rejected, or the PyYAML cross-check fails | An unquoted value containing `: `, or a description over 1,024 characters | Quote the value; shorten the description |
| `.agents/SKILLS.md does not list skill "<name>"` | A new skill is not in the skills index | Add a row to `.agents/SKILLS.md` |
| `always-on context is about <n> tokens, within 5% of the 20000 budget` | `AGENTS.md` plus the always-on rules are close to Antigravity's budget | Move detail into an on-demand rule, a skill or `.agents/SKILLS.md` before adding more |
| ESLint `complexity` or `max-depth` error | A function grew past the limits in [CODE_STYLE.md](CODE_STYLE.md) | Split the function |
| `freshness.yml` fails | A pin passed its cooldown, or a registry lookup failed | Update the pin (and its checksum), or re-run after the outage |
| `tech-lookup` reports `HTTP 403` for `github:` | GitHub's anonymous rate limit of 60 requests per hour | Wait, or look the release up on the release page |
| A test passes alone and fails in the suite, or fails one run in many | A race or shared state (for example a socket reset arriving instead of end of stream) | Repeat the run until it fails, then fix the cause ([TESTING.md](TESTING.md)) |
| `__pycache__` or `.ruff_cache` appear in template folders | Python tools were run inside the repository | They are ignored by Git; run templates in a scratch copy |

## Debugging tools

- `node --test --test-name-pattern "<name>" <file>` to run one Node.js test; `python -m unittest -v <module>.<Class>.<test>` for one Python test.
- `node --inspect-brk scripts/<script>.mjs` with Chrome DevTools or the editor's debugger.
- `node scripts/tech-lookup.mjs <spec> --json` to see the raw facts a lookup returned.
- `bash scripts/install.sh --source . --dry-run <dir>` to see what the installer would write.

## Feature flags and configuration

No feature flags. Script options and environment variables are listed in [CONFIGURATION.md](CONFIGURATION.md).

## Escalation

Open an issue in the repository with the failing command and its output (no secrets). Report security problems privately as described in the root `SECURITY.md`.
