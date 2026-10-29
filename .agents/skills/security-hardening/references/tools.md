# Security scanning tools

Commands were checked against each tool's official documentation or `--help` output on 2026-10-14. Tools change, so confirm with `<tool> --help` for the installed version.

## Secret scanning

Layers, TruffleHog verification, GitHub push protection and the leaked-secret runbook: [secret-scanning](../../secret-scanning/SKILL.md).

| Tool | Command |
| :--- | :--- |
| gitleaks (v8.19+ syntax) | Whole history: `gitleaks git -v .`; a directory or file: `gitleaks dir -v <path>`. The older `detect` and `protect` commands are deprecated |
| gitleaks as a pre-commit hook | In `.pre-commit-config.yaml`: repo `https://github.com/gitleaks/gitleaks`, `rev: v8.30.1`, hook `id: gitleaks`; then `pre-commit install` |
| GitHub | Enable secret scanning and push protection in the repository settings |

## Static analysis (SAST)

| Tool | Command |
| :--- | :--- |
| Semgrep CE (any language) | `semgrep scan` (open-source community rules); a specific rule set: `semgrep scan --config "p/<ruleset>"`. Install with `pipx install semgrep` or `uv tool install semgrep` |
| CodeQL (GitHub) | `github/codeql-action` in CI (see [ci-cd-pipeline](../../ci-cd-pipeline/SKILL.md)) |
| Bandit (Python) | `bandit -r <package> -ll` (report medium severity and above) |
| gosec (Go) | `gosec ./...` |
| ESLint security rules (JS/TS) | `eslint-plugin-security` with the project's ESLint |

## Dependency vulnerabilities (SCA)

| Ecosystem | Command |
| :--- | :--- |
| npm | `npm audit --audit-level=high` |
| Python | `pip-audit` (current environment) or `pip-audit -r requirements.txt`; add `--strict` in CI |
| Go | `govulncheck ./...` (install: `go install golang.org/x/vuln/cmd/govulncheck@latest`) |
| Rust | `cargo audit`; policy, licences and bans: `cargo deny check` |
| .NET | `dotnet list package --vulnerable --include-transitive` |
| Any (OSV database) | OSV-Scanner v2: `osv-scanner scan -r .`; one lockfile: `osv-scanner scan -L package-lock.json` |

## Containers, infrastructure as code, SBOM

| Task | Command |
| :--- | :--- |
| Scan a project directory | `trivy fs .` (vulnerability and secret scanners are on by default; add `--scanners vuln,secret,misconfig` for IaC and Dockerfile checks) |
| Scan an image | `trivy image <name>:<tag>` or `osv-scanner scan image <name>:<tag>` |
| Fail CI on serious findings | `trivy image --severity HIGH,CRITICAL --exit-code 1 <name>:<tag>` |
| SBOM | `syft <name>:<tag> -o cyclonedx-json=sbom.cdx.json`, or `syft ./ -o spdx-json`; Trivy: `trivy image --format cyclonedx --output sbom.cdx.json <name>:<tag>` |
| Dockerfile lint | `hadolint Dockerfile` |

## CI/CD configuration

| Tool | Command |
| :--- | :--- |
| zizmor (GitHub Actions security) | `zizmor .` or `zizmor --collect=workflows .`; install with `pipx install zizmor` or `uvx zizmor` |
| actionlint (workflow correctness) | `actionlint` in the repository root |
| OpenSSF Scorecard | `ossf/scorecard-action` in CI for a public repository's security posture |

## Editor support (VS Code extension IDs, checked on the Marketplace)

`sonarsource.sonarlint-vscode` (SonarQube for IDE), `snyk-security.snyk-vulnerability-scanner` (Snyk Security), `github.vscode-github-actions` (workflow editing and validation).
