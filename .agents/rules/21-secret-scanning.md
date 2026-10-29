---
trigger: model_decision
description: "Apply when setting up or changing secret scanning, pre-commit hooks or push protection, when gitleaks, TruffleHog or GitHub blocks or reports a secret, when a credential may have leaked, or when writing tests that need secret-shaped values."
---

# R-21: Secret Scanning and Leak Response

[06-security](06-security.md) section 2 forbids secrets in code, tests, logs and commits. This rule makes that enforceable and says what to do when it fails. Procedure: [secret-scanning](../skills/secret-scanning/SKILL.md).

## 1. Layered detection

- Every repository runs four layers:
  - a secret-scanning pre-commit hook (gitleaks on staged changes);
  - push protection on the hosting platform;
  - CI scans of the full history and of each change;
  - the platform's secret scanning at rest.
- Anything shipped to users is also scanned as built. Report a missing layer to the owner, with the action it needs.
- Scanners are pinned to a version and installed from official sources with verified checksums. Reports are redacted (`--redact`). Secret values never appear in logs, chat, issues, prompts or commit messages.
- Live verification of findings (for example TruffleHog's `verified` results) sends the credential to its provider. It runs only where the owner allows it, and only on systems the owner controls.

## 2. Findings

- A finding is real until shown otherwise. Decide from the code and context, never by printing or pasting the value.
- False positives are suppressed as narrowly as possible: by fingerprint (`.gitleaksignore`), by an inline marker for deliberate test values, or by a path allowlist for whole classes of files. Each suppression carries a reason and goes through review. Never allowlist a real secret, never disable a rule or skip the scan to get green ([AGENTS.md](../../AGENTS.md) non-negotiable 3).
- Push protection is bypassed only with the true reason, by a person. An agent stops and reports the location instead.

## 3. A leaked secret

- A secret that was committed and pushed, logged, shipped or sent anywhere is leaked, even if deleted afterwards.
- Order: revoke and rotate first, then assess its use in the provider's logs and whether personal data was in reach, then clean up, then learn.
- Rewriting history is optional after rotation, and needs the owner's explicit approval ([08-git-workflow](08-git-workflow.md) section 3).
- Close platform alerts as revoked, and remove any suppression that only hid the real secret.

## 4. This product

- Server secrets (`DATABASE_URL`, `TOTP_KEY`, `ANTHROPIC_API_KEY`) exist only in the git-ignored `apps/api/.env` and in the host's secret store, never in a client build. A leaked `TOTP_KEY` or database credential is handled as a leak of personal financial data ([17-financial-integrity](17-financial-integrity.md), `docs/PRIVACY.md`).

## 5. Tests

- Secret-shaped test values are assembled at run time or obviously fake, so scanners stay quiet and nobody mistakes them for credentials. Real credentials, expired or not, never appear in fixtures.
