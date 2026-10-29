# Database

## Engine and version

PostgreSQL 18 (18.6 locally, installed with Homebrew on 2026-10-28; end of life 2030-11-14). The schema uses `uuidv7()` (new in PostgreSQL 18) for primary keys.

## Connection and configuration

The API connects with `DATABASE_URL` through a `pg` 8.23.1 pool (`apps/api/src/db.ts`). Every multi-statement change runs in `withTransaction`. Locally the server listens on port 5433, because another PostgreSQL 18 installation on the same machine uses 5432.

## Migrations

`apps/api/migrations/*.sql` are applied in name order by `npm run migrate` (or `npm run migrate:dev`, which reads `.env`). Each runs in its own transaction, and its SHA-256 checksum is recorded in `schema_migrations`. A migration edited after it was applied stops the run with an error, so changes always go into a new file.

| Migration | Adds |
| :--- | :--- |
| `001_core.sql` | Currencies, users, sessions, entities, memberships, accounts, periods, journal entries and lines with balance, immutability and closed-period triggers, audit events, report snapshots |
| `002_capture_quality.sql` | `capture_drafts`, for the real-use quality of voice and text capture |

## Access roles and permissions

Today the API connects as one database role that owns the schema. The rules about money do not depend on that role: triggers reject unbalanced posted entries, changes to posted lines, audit events and snapshots, `TRUNCATE`, and postings into closed periods. A separate application role without `UPDATE`, `DELETE` or DDL rights is part of the target design and is not built yet ([ARCHITECTURE.md](ARCHITECTURE.md#known-limitations-and-technical-debt)).

## Indexing and performance

Indexes: `users (lower(email))` unique, `sessions (user_id)`, `journal_entries (entity_id, entry_date)`, `journal_lines (entity_id, account_id)`, `audit_events (chain_key, seq)`, `report_snapshots (entity_id, year, month)`, `capture_drafts (entity_id, created_at desc)`. Reports aggregate posted lines per account and month. No load test has been run yet; the target in the PRD is a monthly recap of 100,000 lines in under 10 seconds.

## Backup and restore

Not set up yet: the database runs only on a development machine. The target is managed PostgreSQL with point-in-time recovery, a recovery point objective of 15 minutes, and a restore test every day in staging ([OPERATIONS.md](OPERATIONS.md#backup-and-disaster-recovery)). Until then, `pg_dump -h localhost -p 5433 projects27_dev > backup.sql` is the manual backup.

## Data retention and deletion

Books and source records of Indonesian taxpayers must be kept for 10 years ([RESEARCH.md](RESEARCH.md)). Posted entries, audit events and snapshots cannot be deleted through the API or by SQL (the triggers forbid it); corrections are reversals. Sessions expire, and signing out revokes them. Capture drafts hold no sentence and no personal content. Deletion of a whole account and its data, with retention exceptions, is not built yet ([PRIVACY.md](PRIVACY.md#data-subject-requests)).

## Local development data

`cd apps/api && npm run migrate:dev` creates the schema in `projects27_dev`; registering in any app creates a user with a personal entity and its chart of accounts. The tests create and drop their own databases from `TEST_DATABASE_URL` (`postgres://localhost:5433/postgres`). `packages/contract/fixtures/personal-sample.json` is a 14-entry sample ledger with hand-checked totals; `apps/android/tool/live_check.dart` and `keuangan-check` post it through the clients.
