# Technology stack

The single place for the runtimes, tools and pinned versions this repository uses. Versions were read from the manifests on 2026-10-23; end-of-life dates come from `node scripts/tech-lookup.mjs eol:nodejs eol:python` (endoflife.date) on the same day.

## Runtimes and languages

| Name | Version | End of life | Source of the version |
| :--- | :--- | :--- | :--- |
| Node.js (scripts, validators, guard hook, docs check) | 22 or later; CI uses 24 | 22: 2027-04-30, 24: 2028-04-30 | `package.json` and template `engines` (`>=22.18.0`), `validate.yml` |
| Node.js (Node.js template matrix) | 22, 24, 26 | 26: 2029-04-30 | `validate.yml` job `node-template` |
| Python (templates and kits) | 3.11 to 3.14 | 3.11: 2027-10-31, 3.12: 2028-10-31, 3.13: 2029-10-31, 3.14: 2030-10-31 | `requires-python = ">=3.11"` in each `pyproject.toml`, `validate.yml` matrices |
| Bash | Any version with `set -euo pipefail` | Not tracked | `scripts/install.sh` |
| TypeScript | 7.0.2 (templates); 6.0.3 for the lint parser | Not tracked | template `package.json`; `tools/lint/package.json` |

## Frameworks and libraries

| Dependency | Version | Purpose | Licence |
| :--- | :--- | :--- | :--- |
| (none at runtime) | | The scripts use only the Node.js standard library; the Python kits use only the Python standard library | |
| scikit-learn | 1.9.1 | The machine-learning baseline template | BSD-3-Clause |
| @types/node | ^22.18.0 (root and Node.js template), 22.20.5 (lint) | Type definitions | MIT |

## Infrastructure and services

- GitHub: hosting, Actions CI, Dependabot, CodeQL code scanning, and the private vulnerability reporting channel named in the root `SECURITY.md` (enabling it is a repository setting; see [PRD.md](PRD.md) open questions).
- Distroless base images for the service templates: `gcr.io/distroless/nodejs24-debian13:nonroot` and `gcr.io/distroless/python3-debian13:nonroot`, pinned by digest in each Dockerfile (Debian 13.7 on 2026-10-22).
- MCP Toolbox for Databases 1.14.0, downloaded by CI for the MCP example (SHA-256 pinned in `validate.yml`).
- External lookups used by the scripts: [INTEGRATIONS.md](INTEGRATIONS.md).

## Tooling

| Purpose | Tool | Command |
| :--- | :--- | :--- |
| Spec validation and mirror | `scripts/agents-sync.mjs` | `node scripts/agents-sync.mjs --check --all-markdown` |
| Clean-code lint (JavaScript) | ESLint 10.12.0, typescript-eslint 8.71.2, @eslint/js 10.0.1, globals 17.13.0 | `npm ci --prefix tools/lint && npm run --prefix tools/lint lint` |
| Python format and lint | Ruff 0.17.0 | `ruff format --check . && ruff check .` (per template) |
| Python types | mypy 2.4.0 | `mypy <files>` (strict, per template) |
| Workflow lint and audit | actionlint-py 1.7.12.25, zizmor 1.30.1 | `actionlint`, `zizmor --offline .` |
| Shell lint | shellcheck-py 0.11.0.1 | `shellcheck --severity=style scripts/install.sh` |
| Dependency audit | pip-audit 2.10.1, `npm audit` | per template job |
| YAML cross-check | PyYAML 6.0.3 | inline step in `validate.yml` |
| Secret scan | gitleaks 8.30.1 (checksum-verified) | `gitleaks git --log-opts="--all" --redact .` |
| Live versions and end of life | `scripts/tech-lookup.mjs` | `node scripts/tech-lookup.mjs <ecosystem>:<name>` |
| Pins outside Dependabot | `scripts/check-updates.mjs` | `node scripts/check-updates.mjs` |
| Commit authorship | `scripts/check-authorship.mjs` | `node scripts/check-authorship.mjs` |
| All checks with a summary | `scripts/run-quiet.mjs` | `npm run verify` |

The CI tool pins live in `tools/ci/requirements.txt` and `tools/lint/package.json`; template tool pins in each template's `pyproject.toml` or `package.json`.

## Why these choices

- Standard library only for the scripts and kits: nothing to install, nothing to audit, runs anywhere Node.js 22 or Python 3.11 runs ([rule 04](../../../.agents/rules/04-dependencies.md)).
- TypeScript 6.0.3 for the lint parser: typescript-eslint 8 declares the peer range `typescript >=4.8.4 <6.1.0`; Dependabot ignores TypeScript 6.1 and later for `tools/lint` until that changes.
- Distroless runtime images: no shell or package manager; a Trivy scan found fewer vulnerabilities than the slim images (figures in the Dockerfiles).

## Upgrade policy

Dependabot checks every ecosystem daily and proposes version updates after a 7-day cooldown; security updates are not delayed. Pins Dependabot cannot read (workflow `env:` versions, PEP 735 dependency groups) are checked daily by `freshness.yml`. Runtime end-of-life dates above are re-checked when a matrix changes. Details in [DEPLOYMENT.md](DEPLOYMENT.md) and [security-hardening](../../../.agents/skills/security-hardening/SKILL.md) section 7.
