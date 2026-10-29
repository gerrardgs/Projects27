# Security Policy

Projects 27 holds the merged agent specification of Projects 23 and Projects 24 (rules, skills, documentation and small example templates) and an enterprise finance reporting system: an API, a web app and iOS and Android apps that process financial and personal data. No production deployment exists yet, and the repository contains no credentials. Its security goals are that nothing private is ever published through it, that its templates are safe to copy, that its supply chain (dependencies, actions, installer) cannot be quietly tampered with, and that the finance apps protect their users' data. The finance apps' threat model, controls and incident response are in [docs/SECURITY.md](docs/SECURITY.md), their personal-data handling in [docs/PRIVACY.md](docs/PRIVACY.md), and the money rules in [rule 17](.agents/rules/17-financial-integrity.md).

No software can be guaranteed impossible to attack. What this project does is close every known gap, verify it automatically on every push, and keep its dependencies updated automatically.

## Reporting a vulnerability

Use GitHub's **private vulnerability reporting**: the "Security" tab of the repository, then "Report a vulnerability". Please do not open a public issue for security problems. Supported version: the latest release on `main`.

## Controls in place

Checked on 2026-10-16.

| Area | Control | Where |
| :--- | :--- | :--- |
| Secrets | gitleaks 8.30.1 scans every commit and every file on each push and pull request; the binary's SHA-256 is verified before it runs. On 2026-10-16: 3 commits and all files, 0 findings | `.github/workflows/validate.yml`, job `secrets` |
| Secrets in projects that use the spec | Rule 06; `.env` and `.env.*` ignored; pre-commit gitleaks hook in the bootstrap template | `.agents/rules/06-security.md`, `.gitignore`, `project-bootstrap/assets/pre-commit-config.yaml` |
| Personal data | No personal data, local paths or e-mail addresses in the files (checked with a search over all tracked files) | |
| Dependencies | Lockfiles for every Node.js package; `npm audit` and `pip-audit` in CI; Dependabot checks npm, GitHub Actions, Docker and the CI's pip tools **daily**, with a 7-day cooldown on version updates against freshly compromised releases (security updates are raised at once); patch and minor updates auto-merge once required checks pass; a daily workflow audits every lockfile (accepted risks expire) and reports pinned tools and CI runtimes that are behind or end-of-life | `.github/dependabot.yml`, `.github/workflows/dependabot-auto-merge.yml`, `.github/workflows/freshness.yml` |
| CI and actions | Every action pinned to a full commit SHA (all at their latest release on 2026-10-16); `permissions: contents: read` (the release workflow alone grants `contents: write` to its one job, which publishes notes for a verified version tag); `persist-credentials: false`; workflows linted by actionlint and audited by zizmor 1.31.1 (auditor persona: no findings) | `.github/workflows/` |
| Container images | Base images pinned to digests and refreshed to the current digest on 2026-10-16; non-root users | `native-from-scratch/assets/*/Dockerfile` |
| Code | Semgrep 1.181.0 rulesets for JavaScript, TypeScript, Node.js, Python, Dockerfile, GitHub Actions, secrets and security audit: 0 findings on 2026-10-16; strict TypeScript; Biome lint | |
| Templates | Strict Content Security Policy and security headers; dev server bound to `127.0.0.1` with path-traversal protection; request-size limits and input validation in the service templates; untrusted JSON validated before use; tokens never logged | `frontend-from-scratch/assets/static-site`, `figma-integration/assets/figma-variables-sync`, `native-from-scratch/assets` |
| Installer | Documented as download, read, then run, pinned to an immutable commit SHA; never overwrites differing files; installs over HTTPS only | `scripts/install.sh` |
| AI agents | Untrusted content is data, not instructions; MCP servers pinned and least-privilege; human approval for outward-facing actions (OWASP Top 10 for LLM Applications 2026 and for Agentic Applications 2026) | `.agents/rules/06-security.md` |
| Agent changes | Agents never delete existing work without approval; in Claude Code, `.claude/settings.json` asks before deletion commands and a PreToolUse hook asks before edits that remove existing lines (9 tests) | `.agents/rules/01-core-principles.md` section 8, `scripts/hooks/` |
| Security reviews | Vulnerability audits follow an evidence-first method adapted from Cloudflare's security-audit skill: source review and sandboxed local tests only, no probing of deployed systems, independent verification, impact-based severity | `.agents/skills/security-vulnerability-audit/` |

## Accepted risk

| Issue | Analysis | Decision |
| :--- | :--- | :--- |
| `braces` ≤ 3.0.3, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (CVE-2026-93687, high): stack exhaustion through deeply nested brace patterns. No patched version exists on 2026-10-16 | Reached only through Stylelint in the static-site template, a development tool. Stylelint is only ever given the fixed path `styles.css`, so an attacker cannot supply a pattern; nothing from npm ships to browsers | Keep Stylelint; audit production dependencies for that template; Dependabot opens the update when a fix is published. Biome could replace Stylelint at the cost of fewer CSS checks |

## Maintainer checklist (repository and account settings)

These settings live in GitHub, not in the repository files, so they must be turned on by the owner. Each links to GitHub's documentation.

- [ ] Two-factor authentication on the owner account, preferably with a passkey or security key ([2FA](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication)).
- [ ] Keep your e-mail address private and block pushes that expose it ([commit e-mail](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address), [block pushes](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/blocking-command-line-pushes-that-expose-your-personal-email-address)); set `git config user.email` to your `users.noreply.github.com` address. Existing commits keep the address they were made with.
- [ ] Private vulnerability reporting ([docs](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configuring-private-vulnerability-reporting-for-a-repository)).
- [ ] Secret scanning with push protection ([docs](https://docs.github.com/en/code-security/secret-scanning/enabling-secret-scanning-features/enabling-push-protection-for-your-repository)).
- [ ] Dependabot alerts and security updates ([docs](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates)).
- [ ] "Allow auto-merge" in the repository settings ([docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository)). The Dependabot auto-merge workflow stays off until the ruleset below requires status checks, so nothing merges untested.
- [ ] Code scanning default setup with CodeQL ([docs](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning)).
- [ ] A ruleset on `main`: require pull requests and the `Validate` checks, block force pushes and deletion ([rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)); optionally require signed commits ([signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)).
- [ ] Actions settings: default workflow permissions read-only, approval required for workflows from outside contributors, and "Require actions to be pinned to a full-length commit SHA" ([Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository), [SHA pinning policy](https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/)).

## Note on visibility

The repository is public by design: the documented installer downloads it from GitHub. Making it private would break public installs. Nothing in it needs to be secret; keep it that way by never committing credentials, personal data or client material, which the secret scan and rule 06 enforce.
