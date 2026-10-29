# API

## Contract

The HTTP API is described in [`packages/contract/openapi.json`](../packages/contract/openapi.json) (OpenAPI 3.1, version 0.4.0, 30 operations). The contract test in `apps/api/test/contract.test.ts` fails when a route is missing from the contract, when the contract lists a route that does not exist, or when a real response does not match its schema. The web, Android and iOS clients use the same contract and the shared sample ledger `packages/contract/fixtures/personal-sample.json`.

## Base URLs and environments

| Environment | Base URL | Notes |
| :--- | :--- | :--- |
| Local development | `http://localhost:8080` | `cd apps/api && npm run dev`; the web dev server proxies `/v1` from `http://localhost:5173` |
| Android emulator | `http://10.0.2.2:8080` | Set with `--dart-define=API_BASE_URL=...` |
| iOS simulator | `http://127.0.0.1:8080` | `API_BASE_URL` build setting or `-API_BASE_URL` launch argument |
| Production | Not chosen yet | Hosting is an open question ([PRD.md](PRD.md#open-questions)) |

## Authentication and authorization

- `POST /v1/auth/register` creates a user and a personal entity; `POST /v1/auth/login` with `client: "web"` sets an `HttpOnly`, `SameSite=Lax` session cookie (12 hours); with `client: "native"` it returns a bearer token (30 days). Optional TOTP second factor (`/v1/auth/totp/setup`, `/v1/auth/totp/enable`).
- Writes from browsers must come from an origin in `WEB_ORIGINS`.
- Every `/v1/entities/{entityId}/...` route checks the caller's membership and the permission the route needs (`read`, `write`, `approve`, `close`, `manage_accounts`, `read_audit`) on the server. Roles: owner, controller, accountant, approver, preparer, viewer, auditor.

## Versioning and compatibility

The path carries the major version (`/v1`). Within `/v1`, changes only add: new operations, new optional request fields, new response fields. The contract's `info.version` follows semantic versioning (0.4.0 added `draftId`, the capture review and the quality report). A breaking change needs `/v2` and a period where both run.

## Errors

Errors are RFC 9457 problem details (`application/problem+json`) with `type`, `title`, `status`, `detail` and, for validation, `errors` per field. Status codes: 400 invalid input, 401 not signed in, 403 no permission, 404 not found (also for objects in other entities), 409 conflict (for example a capture draft reviewed twice), 413 body too large, 422 a ledger rule was violated (for example a closed period), 429 too many requests. Error bodies never contain stack traces or SQL.

## Pagination, filtering and limits

- `GET .../journal-entries?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=N`: `limit` 1 to 500, default 100.
- `GET .../capture/quality?days=N`: 1 to 366, default 90.
- Request bodies: 1 MiB, and 8 MiB for imports.
- Rate limits: sign-in and registration, 10 per minute per client address (`AUTH_ATTEMPTS_PER_MINUTE`); capture parsing, 30 per minute per user.

## Idempotency and retries

`POST .../transactions`, `POST .../journal-entries` and import commits take an `idempotencyKey`. A repeated request with the same key returns the original entry instead of posting again. The apps rely on this when they resend transactions from their offline outbox. Other writes are not idempotent; retry them only after reading the current state.

## Endpoints

| Area | Endpoints |
| :--- | :--- |
| Health and session | `GET /v1/health`, `POST /v1/auth/register`, `/login`, `/logout`, `/totp/setup`, `/totp/enable`, `GET /v1/me` |
| Accounts | `GET`, `POST /v1/entities/{id}/accounts` |
| Ledger | `POST .../transactions` (income, expense, transfer), `GET`, `POST .../journal-entries`, `GET .../journal-entries/{entryId}`, `POST .../{entryId}/reverse`, `/approve`, `/reject` |
| Reports | `GET .../reports/{kind}` and `.../reports/{kind}/xlsx` for `monthly-recap`, `monthly-trend`, `income-statement`, `balance-sheet`, `trial-balance` |
| Periods | `GET .../periods`, `POST .../periods/{year}/{month}/close`, `/reopen`, `GET .../snapshots`, `.../snapshots/{snapshotId}/xlsx` |
| Audit | `GET .../audit/verify` (checks the hash chain) |
| Imports | `POST .../imports/inspect`, `/preview`, `/commit` (CSV or XLSX) |
| Capture | `POST .../capture/parse`, `POST .../capture/{draftId}/review`, `GET .../capture/quality` |

Request and response schemas are in the contract.

## Webhooks and events

None. The API sends no webhooks and receives none. Recap delivery by email and chat is planned for stage 6 ([ROADMAP.md](ROADMAP.md)).

## Change log

- 0.4.0 (2026-10-28): `draftId` in capture drafts; `POST .../capture/{draftId}/review`; `GET .../capture/quality`.
- 0.3.0 (2026-10-28): `POST .../capture/parse`.
- 0.2.0 (2026-10-28): imports, Excel exports, `monthly-trend`.
- 0.1.0 (2026-10-28): authentication, accounts, ledger, reports, periods, audit.
