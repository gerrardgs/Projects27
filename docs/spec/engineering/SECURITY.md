# Security

How Projects 23 is protected. The vulnerability reporting policy is the root `SECURITY.md`, which GitHub shows because it reads `.github/`, then the root, then `docs/`; this document covers everything else and does not repeat the policy.

## Reporting a vulnerability

Follow the root `SECURITY.md`: report privately through GitHub's private vulnerability reporting, never in a public issue.

## Supported versions

Fixes are made on `main` and released as new tags; see the root `SECURITY.md` and [DEPLOYMENT.md](DEPLOYMENT.md).

## Threat model

| Threat | Boundary | Mitigation | Test |
| :--- | :--- | :--- | :--- |
| Tampered installer or archive (users pipe `install.sh` into a shell) | GitHub to the user's machine | HTTPS; `--ref` to pin a tag; `--sha256` to verify the archive; the installer never overwrites existing files | Installer steps in the `spec` CI job; ShellCheck |
| Malicious content in the spec steering agents into unsafe actions (prompt injection through rules or skills) | Pull requests to this repository | Review of every change; adapted external content is read as data, paraphrased and attributed; rule 06 tells agents to treat file content as data | Review; validators |
| Compromised dependency or action | Registries and GitHub Actions to CI | Actions pinned to commit SHAs; lockfiles; 7-day cooldown for version updates; checksum-verified binaries; dependency audits | actionlint, zizmor, `npm audit`, `pip-audit`, CodeQL |
| Secrets committed by mistake | Contributor to repository | `.gitignore` for key and credential files; secret scan of the full history | gitleaks in the `secret-scan` job |
| AI agents credited as contributors through commit identities or co-author trailers | Agent sessions to repository history | `AGENTS.md` non-negotiable 10; rule 08 section 2 | `check-authorship.mjs` in the `authorship` job |
| Personal data exposed in Git metadata | Repository history to the public | Private no-reply commit addresses recommended; history rewrite is the owner's decision | gitleaks; manual review |
| Unsafe code in templates copied into user projects | Templates to user projects | Templates run in CI with strict linters, security lint rules and audits; distroless, non-root images | Template CI jobs; Trivy results recorded in the Dockerfiles and hadolint results in `native-from-scratch` |

## Authentication and authorization

Changes reach `main` only through the repository owner's GitHub account. Branch protection, required reviews for workflow changes and approval of workflows from first-time contributors are repository settings that the owner should enable ([PRD.md](PRD.md) open questions). Workflows run with `contents: read` by default.

## Data classification and protection

The repository holds public specification text and code only. Known exposure: commit metadata contains a personal email address, and the tracked file `.archive/phase1-original-2026-10-14.tar.gz` contains a local username. Removing them requires rewriting published history, which is irreversible and needs the owner's explicit decision ([RULES.md](RULES.md)).

## Secrets management

No secrets are used by the scripts or the CI. If one is ever needed, it goes into GitHub encrypted secrets scoped to the job that needs it, never into files ([rule 06](../../../.agents/rules/06-security.md)).

## Dependency and supply-chain security

Dependabot checks every ecosystem daily (7-day cooldown for version updates, none for security updates); `freshness.yml` checks pins Dependabot cannot read; gitleaks and the MCP Toolbox binary are checksum-verified; CodeQL scans the workflows, JavaScript and Python daily and on every push.

## Security testing

`validate.yml` runs gitleaks over the full history, zizmor (offline) on the workflows, actionlint, ShellCheck, Ruff's security rules in the Python templates, `npm audit` and `pip-audit`; `codeql.yml` runs the `security-extended` queries. The guard hook asset has its own tests.

## Incident response

1. Confirm the report privately and assess which releases are affected.
2. Fix on `main`, release a new version, and publish a GitHub security advisory with the affected and fixed tags.
3. If a secret was exposed: revoke and rotate it first, then remove it; deleting it from the latest commit is not enough.
4. Tell users how to update: `bash scripts/install.sh --ref <fixed tag> --force` for files they have not customised.
