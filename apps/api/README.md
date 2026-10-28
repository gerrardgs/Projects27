# Projects 27 core API

The single back end for the web app, the iOS app (Swift) and the Android app (Dart/Flutter). All three use the same contract, [packages/contract/openapi.json](../../packages/contract/openapi.json), and the same sample ledger, [packages/contract/fixtures/personal-sample.json](../../packages/contract/fixtures/personal-sample.json).

Built on the Node.js standard library (`node:http`, `node:crypto`, `node:test`) with one runtime dependency, `pg` (node-postgres), and PostgreSQL 18. TypeScript runs directly through Node.js type stripping; there is no build step.

## Requirements

- Node.js 24.7 or later (for `crypto.argon2`); checked with 24.22.1
- PostgreSQL 18 (uses `uuidv7()`); checked with 18.6

## Run locally

```sh
cd apps/api
npm ci
createdb -p 5433 projects27_dev     # Homebrew: /opt/homebrew/opt/postgresql@18/bin/createdb
cp .env.example .env                # then set TOTP_KEY: openssl rand -base64 32 (keep it; changing it voids enabled two-factor seeds)
npm run migrate:dev                 # applies migrations/*.sql with the settings in .env
npm run dev                         # http://localhost:8080/v1/health; reads .env through node --env-file
```

If the web app shows "Server API tidak dapat dihubungi" (or the dev proxy answers 502), the API is not running: start it with `npm run dev`.

## Check

```sh
npm run typecheck
TEST_DATABASE_URL=postgres://localhost:5433/postgres npm test   # creates and drops a temporary database per test file
```

The tests cover money parsing, RFC 6238 TOTP vectors, registration and sign-in, cookie and bearer sessions, cross-site request blocking, CORS, two-factor sign-in with replay protection, tenant isolation, maker-checker approval, rate limiting, the sample ledger's reports against values computed independently in Python, idempotency, reversals, database-level immutability and balance enforcement, period close with hashed snapshots, audit-chain tamper detection, and conformance of real responses to the OpenAPI contract.

## Design

- **Money**: decimal strings on the wire (`"125000.50"`), `bigint` minor units in the database (IDR has 2 minor units in ISO 4217). JSON numbers are rejected.
- **Ledger**: every entry balances, enforced again by a deferred constraint trigger; lines and posted entries cannot be updated or deleted; corrections are reversing entries; closed months accept no entries.
- **Sign-in**: email and password hashed with Argon2id (19 MiB, 2 passes, parallelism 1, the OWASP minimum), optional TOTP second factor with the seed encrypted by AES-256-GCM. Web clients get an `HttpOnly` `SameSite=Lax` cookie (12 hours) and cookie writes must come from an allowed `Origin`; native apps get a bearer token (30 days) to keep in the Keychain or Android Keystore. Sessions are random tokens stored as SHA-256 hashes and revocable.
- **Audit**: every write appends a SHA-256 hash-chained event per entity; `GET /v1/entities/{id}/audit/verify` recomputes the chain.
- **Voice and text capture**: `POST /v1/entities/{id}/capture/parse` turns an Indonesian sentence (from the device's speech recogniser or typed) into an unsaved transaction draft. With `ANTHROPIC_API_KEY` set, Claude (`claude-opus-5-5` by default, strict tool use, low effort, server-side refusal fallback) proposes the fields; every field is validated (exact amount, real date within a year, active account of the right type) and replaced by the rule-based parser (`src/capture-rules.ts`) when invalid or missing. Nothing is posted; the person presses Simpan. The audit trail records which method filled the form, never the sentence.
- **Capture quality**: each fill is stored in `capture_drafts` (method, model, fields filled, latency; no sentence). After Simpan the client reports the fields the person changed (`POST .../capture/{draftId}/review`); `GET .../capture/quality?days=90` returns the share saved without correction and per field, with 95% Wilson intervals, overall and per method.
- **Evaluation** (`eval/`): a labelled corpus of 120 sentences (dev and held-out test), `node eval/run-capture.ts` (text to form) and `node eval/run-asr.ts` (speech to text to form with Apple's on-device dictation, macOS 26 or later). Pass thresholds in `eval/gates.json` are checked by `npm test`. Method and results: [docs/EVALUATION.md](../../docs/EVALUATION.md).
- **Errors**: RFC 9457 problem details with a request id; unexpected errors are logged without request bodies.
- **Limits**: 1 MiB request bodies, 30-second request timeout, in-memory rate limit on sign-in and registration (move it to a shared store before running several instances).

Rules: [17-financial-integrity](../../.agents/rules/17-financial-integrity.md). Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
