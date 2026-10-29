# Security

## Reporting a vulnerability

Use GitHub's private vulnerability reporting on the repository (Security tab → "Report a vulnerability"); do not open a public issue. The repository-wide policy is in [`../SECURITY.md`](../SECURITY.md).

## Supported versions

The latest release on `main` (1.3.x on 2026-10-29). No earlier release is deployed anywhere, so fixes go only into the next release.

## Threat model

| Asset | Threat | Control |
| :--- | :--- | :--- |
| Financial records | Tampering or silent loss | Database triggers make postings, audit events and snapshots immutable; hash-chained audit with `GET .../audit/verify`; reversals instead of edits |
| Accounts and sessions | Password guessing, stolen tokens | Argon2id (19 MiB, 2 iterations, parallelism 1, `node:crypto`), optional TOTP (RFC 6238, seeds encrypted with AES-256-GCM), rate limits, tokens stored only as SHA-256 hashes, expiry and sign-out revocation |
| Another person's data | Access across entities (IDOR) | Membership and permission checked on the server for every entity route; composite keys keep lines inside their entity; 404 for foreign objects |
| Browser session | CSRF, XSS, clickjacking | `SameSite=Lax`, `HttpOnly` cookies with an Origin check on writes; React escaping; `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` on API responses; `nosniff`; `no-referrer`; HSTS when `COOKIE_SECURE` is on |
| AI capture | Prompt injection in a sentence; data sent to a third party | The sentence is data inside a strict tool schema; every field is validated; only the sentence and the account list are sent, and only when a key is configured ([INTEGRATIONS.md](INTEGRATIONS.md)) |
| Device copy | A lost or shared device | App-private storage (iOS file protection until first unlock); cleared at sign-out; not otherwise encrypted ([ARCHITECTURE.md](ARCHITECTURE.md#known-limitations-and-technical-debt)) |
| Supply chain | Malicious or vulnerable packages and actions | Exact versions and lockfiles, Dependabot with a cooldown, pinned actions, CodeQL daily, gitleaks over the full history |

## Authentication and authorization

Email and password with optional TOTP; web sessions last 12 hours (cookie) and native sessions 30 days (bearer token in the Keychain or Android Keystore). Sign-in answers take the same time for unknown emails. Permissions per role are listed in [RULES.md](RULES.md#approvals); the approver of an entry can never be its author. Passkeys and OpenID Connect are planned once a domain exists.

## Data classification and protection

Classes and tables are in [SCHEMA.md](SCHEMA.md#data-classification). Secrets never appear in logs or error bodies. TLS is required in production (hosting not chosen yet); plain HTTP is allowed only locally with `COOKIE_SECURE=false`.

## Secrets management

Secrets come only from the environment (`TOTP_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`); `.env` files are git-ignored, and only `.env.example` with empty values is committed. CI scans every commit with gitleaks. A leaked secret is revoked and rotated, not just deleted from the latest commit. Note: the repository on GitHub is public, and commit metadata shows the author's email address; switching to a no-reply address is recommended in [`../SECURITY.md`](../SECURITY.md).

## Dependency and supply-chain security

The API has two runtime dependencies (`pg` 8.23.1, `@anthropic-ai/sdk` 1.3.0); the web app has React and React DOM. Versions are exact. New dependencies follow [04-dependencies](../.agents/rules/04-dependencies.md) (registry check, licence, age). Open risk: `sqflite_android` 2.4.5, pulled in by `sqflite` 2.4.4+2, was 8 days old when locked on 2026-10-28, under the 14-day cooldown the project uses.

## Security testing

API tests cover sign-in limits, TOTP, session revocation, permissions per role, cross-entity access, immutability and the audit chain (`apps/api/test`). CodeQL runs on every push and daily; gitleaks on every push. The content-hygiene scanner finds hidden Unicode and Trojan Source characters. No external penetration test has been done; the target is OWASP ASVS 5.0 level 2 ([PRD.md](PRD.md#non-functional-requirements)).

## Incident response

1. Contain: revoke sessions (sign-out, or delete rows in `sessions`), rotate the affected secret, take the API offline if data is at risk.
2. Assess: `GET .../audit/verify` and the audit trail show what changed and who changed it.
3. Notify: personal-data breaches follow [PRIVACY.md](PRIVACY.md#breach-response) (UU 27/2022 Article 46: written notice within 3 × 24 hours).
4. Fix and record: a test that reproduces the issue, the fix, and an entry in the CHANGELOG.
