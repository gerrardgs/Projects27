---
name: secret-scanning
description: Keep credentials out of repositories, builds and logs with layered secret scanning, and respond correctly when one leaks - gitleaks (offline, pre-commit and full history), TruffleHog (classification and live verification of findings), GitHub secret scanning and push protection (bypass reasons, delegated bypass, custom patterns, validity checks), release-artifact scans, false-positive handling by fingerprint, secret-shaped test fixtures, a tested report merger that never prints a secret, and a revoke-first leaked-secret runbook. Use when setting up or tuning secret scanning, when a scanner or push protection blocks a commit, when a secret may have leaked, or when the user mentions gitleaks, TruffleHog, push protection or GitHub Secret Protection.
license: MIT
metadata:
  version: "1.0.0"
---

# Secret Scanning

No single control catches every secret. Gitleaks finds candidates offline and quickly. TruffleHog tells which ones are live. GitHub push protection stops supported secrets at the server even when a local hook was skipped. A release-artifact scan catches what a build bundled in. A leak is answered by rotation, not deletion.

Sources, read on 2026-10-29:

- [gitleaks](https://github.com/gitleaks/gitleaks) v8.30.1 (MIT)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) v3.99.7 (AGPL-3.0, used as a tool)
- GitHub's [push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection) and [secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) documentation
- the [GitHub Secret Protection](https://github.com/security/advanced-security/secret-protection) page

The baseline rule is unchanged: secrets never go into code, tests, logs or commits ([06-security](../../rules/06-security.md) section 2).

## 1. Layers

| Layer | Control | Blocks or reports | Details |
| :--- | :--- | :--- | :--- |
| Editor and commit | gitleaks pre-commit hook on staged changes; optionally TruffleHog on pre-push | Blocks locally, offline (TruffleHog verification goes online) | [pre-commit-secrets.example.yaml](assets/pre-commit-secrets.example.yaml) |
| Push | GitHub push protection at the repository level | Blocks at the server; a bypass leaves an alert | [github-secret-protection](references/github-secret-protection.md) |
| Pull request and main | gitleaks over the full history, TruffleHog over the changed commits with verification | Fails CI | [secret-scan.example.yml](assets/secret-scan.example.yml) (passes actionlint 1.7.12) |
| Repository at rest | GitHub secret scanning over all history, issues, pull requests and wikis | Alerts | [github-secret-protection](references/github-secret-protection.md) |
| Builds | Scan the shipped artifact (bundles, APK, IPA, images) | Fails the release | [reverse-engineering](../reverse-engineering/SKILL.md) section 2, `gitleaks dir`, `trufflehog docker` |
| Runtime | Secrets only from the environment or a secret manager; logs redact them | Prevents | [security-hardening](../security-hardening/SKILL.md) section 5 |

Set up the first four for every repository. Add the build layer for anything that ships to users.

## 2. Set up

1. **Configuration**: copy [gitleaks.example.toml](assets/gitleaks.example.toml) to `.gitleaks.toml`. It keeps the 222 built-in rules (`useDefault = true`), adds database URLs with inline passwords, and shows how to write a narrow, documented allowlist. Add rules for the project's own token formats.
2. **Hooks**: merge [pre-commit-secrets.example.yaml](assets/pre-commit-secrets.example.yaml) into `.pre-commit-config.yaml`, then run `pre-commit install --hook-type pre-commit --hook-type pre-push` ([project-bootstrap](../project-bootstrap/SKILL.md)).
3. **CI**: copy [secret-scan.example.yml](assets/secret-scan.example.yml). Both binaries are pinned, and their downloads are checked against the release checksums. TruffleHog verification calls each provider's API with the candidate credential. That is the owner's decision; use `--no-verification` where it is not allowed.
4. **GitHub (owner action)**: turn on secret scanning with generic patterns, push protection, validity checks and, in organisations, delegated bypass ([checklist](references/github-secret-protection.md) section 4).
5. **Baseline**: scan the full history once before turning on blocking (`gitleaks git --log-opts="--all" --redact .`, `trufflehog git file://. --results=verified,unknown`). Rotate every real finding. Record each confirmed false positive by fingerprint, with a reason.

Commands, flags and exit codes: [references/tools.md](references/tools.md).

### In this repository

- **CI already runs**: the `secrets` job in `.github/workflows/validate.yml` installs gitleaks 8.30.1 with a checked checksum, then scans every commit and the checked-out files. Missing layers:
  - the pre-commit hook on developer machines;
  - repository-level push protection (owner setting; the repository is public, so secret scanning itself runs automatically);
  - TruffleHog verification, if the owner allows it.
- **Server secrets**: `DATABASE_URL`, `TOTP_KEY` and `ANTHROPIC_API_KEY` live only in `apps/api/.env`, which is git-ignored and readable only by its owner. `apps/api/.env.example` lists the names with placeholder values. Run a local `gitleaks dir .` with that file in mind: it scans untracked files too, so findings in `.env` are expected. Use `gitleaks git` for the repository itself.
- **Clients** (web, Android, iOS) hold no server secret. The release audit in [reverse-engineering](../reverse-engineering/SKILL.md) checks the built artifacts for them.
- **Financial and personal data** found by a scan (amounts, account numbers, names in fixtures or logs) is not a credential, but it is handled the same way: report its location, never its content, and follow [17-financial-integrity](../../rules/17-financial-integrity.md) and `docs/PRIVACY.md`.

## 3. Triage findings

1. Merge the reports so that no secret value is ever printed: `node assets/secret-report.mjs --gitleaks gitleaks.json --trufflehog trufflehog.jsonl`. It lists each location once, with both tools' rules and the worst status:
   - **verified**: live, rotate now;
   - **unknown**: verification failed, treat as live;
   - **unverified**: review.

   It exits 1 on findings (`--fail-on verified` for live only) and 2 on unreadable reports.
2. Decide each finding from the code, not from the value. Ask: is it a real credential, a test value, an example or a hash?
3. **Real**: follow the [leaked-secret runbook](references/leaked-secret-runbook.md). Rotation comes first, even when the commit was never pushed beyond your machine, unless you are sure it was not.
4. **Not a secret**: suppress it as narrowly as possible, and give the reason in the pull request. Use the fingerprint in `.gitleaksignore`; `gitleaks:allow` or `trufflehog:ignore` on the line for deliberate test values; a path allowlist only for whole classes of files. Never allowlist a real secret, and never weaken a rule to get green.
5. **Keys meant to be public** (a browser maps or analytics key, a publishable payment key) are not secrets, but scanners flag them. Confirm the provider lets you restrict the key (by HTTP referrer, app ID or scope) and that the restriction is on. Then suppress the finding by fingerprint, recording the restriction as the reason. Anything in a browser bundle or app binary is public ([06-security](../../rules/06-security.md) section 9).
6. **Blocked by push protection**: remove the secret from the unpublished commits and push again. Bypass only with the true reason, and never as an agent on its own initiative.

## 4. Test fixtures without secrets

- Build secret-shaped test values at run time from fragments (`"AKIA" + "Q".repeat(16)`) or from obviously fake values. Then no scanner flags the repository, and nobody mistakes a fixture for a credential.
- Prefer the official example credentials that providers publish for documentation, where they exist.
- Never use a real, expired credential as a fixture. It may not be expired everywhere.

## 5. Agents and secrets

- An agent that finds a secret stops, reports its location (file, line, commit; never the value) and waits. It never copies the value into chat, logs, issues, prompts or commit messages ([06-security](../../rules/06-security.md) section 2).
- An agent never bypasses push protection, never adds an allowlist entry for a real secret, and never rewrites history without the owner's approval ([08-git-workflow](../../rules/08-git-workflow.md) section 3).
- Live verification and rotation are outward actions. The owner approves them ([AGENTS.md](../../../AGENTS.md) non-negotiable 5).

## Done when

- [ ] Pre-commit hook, push protection, CI scans (history and changes) and GitHub secret scanning are in place, or each missing layer is reported with the owner action it needs
- [ ] Scanners are pinned and their downloads verified; reports are redacted and merged without printing values
- [ ] The full history was scanned once; every real finding was revoked and rotated first; false positives are suppressed by fingerprint with a reason
- [ ] Test fixtures are assembled or fake, never real credentials
- [ ] Any leak followed the runbook: contain, assess, clean up with approval, learn
