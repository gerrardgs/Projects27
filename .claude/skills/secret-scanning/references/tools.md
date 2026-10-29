# gitleaks and TruffleHog

Facts below were checked on 2026-10-29 against each project's README, hook definitions and source: [gitleaks](https://github.com/gitleaks/gitleaks) v8.30.1 (MIT, commit `5f6ec56`) and [TruffleHog](https://github.com/trufflesecurity/trufflehog) v3.99.7 (AGPL-3.0, tag commit `31ce31e`). Before relying on a flag, check it against `gitleaks --help` or `trufflehog --help` for the version you install.

## 1. Which one, when

| | gitleaks | TruffleHog |
| :--- | :--- | :--- |
| Detection | 222 built-in regex and entropy rules in v8.30.1, extendable in `.gitleaks.toml` | More than 800 classified secret types |
| Verification | None. It reports candidates | Logs in to the provider to classify each result as `verified`, `unverified` or `unknown` (verification failed, for example on a network error) |
| Network | None about findings | Verification sends each candidate credential to its provider's API |
| Sources | Git history, directories and files, standard input | Git, GitHub and GitLab, filesystems, S3 and GCS, Docker images, CI systems, Postman and more |
| Best use | Every commit (pre-commit) and full history in CI. Fast and offline | Pull requests and releases, to know which findings are live; periodic history audits |
| Licence | MIT | AGPL-3.0. Using the CLI as a tool is fine; embedding or redistributing it in a product brings AGPL obligations |

Use both: gitleaks as the fast offline gate, TruffleHog to tell live credentials from noise. Normalise their reports with [secret-report.mjs](../assets/secret-report.mjs).

## 2. gitleaks

| Task | Command |
| :--- | :--- |
| Full history, all branches | `gitleaks git --log-opts="--all" --redact --no-banner .` |
| A commit range | `gitleaks git --log-opts="<base>..<head>" --redact .` |
| Working tree or a build folder | `gitleaks dir --redact <path>` |
| Standard input | `<command> \| gitleaks stdin --redact` |
| JSON report for `secret-report.mjs` | add `--report-format json --report-path gitleaks.json` (also `csv`, `junit`, `sarif`, `template`) |
| Only findings not in an accepted baseline | `gitleaks git --baseline-path baseline.json --report-path new.json` |
| Pre-commit (staged changes) | hook `id: gitleaks` (runs `gitleaks git --pre-commit --redact --staged --verbose`) |

- The default exit code on findings is 1 (`--exit-code`). `--redact` keeps secrets out of logs; use it everywhere, including CI.
- The older `detect` and `protect` commands are deprecated in favour of `git`, `dir` and `stdin`.
- Configuration lives in `.gitleaks.toml`, or `--config`. `[extend] useDefault = true` keeps the built-in rules ([gitleaks.example.toml](../assets/gitleaks.example.toml)). Since v8.25.0 allowlists are `[[allowlists]]` and `[[rules.allowlists]]`. Rule regexes are Go RE2, so there are no lookaheads.
- **Suppressing a finding**, narrowest first:
  1. `.gitleaksignore` with the finding's `Fingerprint` (`commit:file:rule:line`). It suppresses one finding, and you add a reason in the pull request.
  2. A `gitleaks:allow` comment on the line, for deliberate test values only. `--ignore-gitleaks-allow` audits these comments.
  3. A path or regex allowlist in the configuration, with a `description`. This is for whole classes of files that cannot hold secrets.
- `--max-decode-depth` finds base64 and similar encoded secrets. `--max-archive-depth` scans inside archives. Both are off by default.

## 3. TruffleHog

| Task | Command |
| :--- | :--- |
| Local repository, live results only | `trufflehog git file://. --results=verified,unknown` |
| Changes of a pull request in CI | `trufflehog git file://. --since-commit <base sha> --branch HEAD --results=verified,unknown --fail` |
| A folder or files | `trufflehog filesystem <path>...` |
| A container image | `trufflehog docker --image file://image.tar --results=verified` |
| JSON for `secret-report.mjs` | add `--json` (one object per line); `--sarif` for code scanning |
| Without contacting providers | add `--no-verification` (every result is then `unverified`) |
| Pre-commit or pre-push | hook `id: trufflehog` (runs `trufflehog git file://. --since-commit HEAD --results=verified --fail --trust-local-git-config`) |

- `--fail` makes exit code 183 mean "results found"; 0 means none; anything else is an error.
- `--results` takes `verified`, `unknown`, `unverified` and `filtered_unverified`.
- `trufflehog:ignore` on a line suppresses it, and `--no-ignore-tag` audits those suppressions.
- **Verification is an outward action.** It sends the candidate credential to the service it belongs to (for AWS, a `GetCallerIdentity` call). For your own repositories this is usually acceptable and valuable, but the owner decides ([AGENTS.md](../../../../AGENTS.md) non-negotiable 5). Never verify credentials found in someone else's systems without authorization.
- For local repositories TruffleHog clones to a temporary directory before scanning, to guard against malicious Git configuration (CVE-2025-41390). `--trust-local-git-config` turns that off; use it only on your own working copy, as the pre-commit hook does.
- The upstream examples pin the GitHub Action to `@main`. Pin a released version and verify the download's checksum instead ([secret-scan.example.yml](../assets/secret-scan.example.yml)).

## 4. Installing

- Install from the official releases with the published checksum, or from a package manager the project already uses: `brew install gitleaks trufflehog`, the `zricethezav/gitleaks` or `trufflesecurity/trufflehog` container images pinned by digest, or pre-commit's own build.
- Never pipe a remote install script into a shell without reading it first ([06-security](../../../rules/06-security.md) section 1). TruffleHog's install script supports checksum and signature verification (`-v`, with cosign).
