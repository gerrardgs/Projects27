# Operations

Nothing runs in production yet. This document holds the targets that hosting must meet; each section says what exists today.

## Service level objectives

From [PRD.md](PRD.md#non-functional-requirements): 99.5 percent monthly availability for the web app and API; LCP at most 2.5 s and INP at most 200 ms at the 75th percentile; zero unbalanced posted entries; zero audit chain breaks. Users keep reading and recording during an outage through the device copy and outbox, which softens the impact of downtime.

## Alerts and on-call

Planned: alert on a failed health check for 5 minutes, an error rate above 2 percent for 10 minutes, any failed report check, and any audit chain break. On call: the owner, until a team exists.

## Incident management

Follow [SECURITY.md](SECURITY.md#incident-response) for security and data incidents. For outages: confirm with the health check, check the database, roll back the last release if it caused the problem ([DEPLOYMENT.md](DEPLOYMENT.md#rollback)), and write a short report afterwards with the timeline and the fix.

## Capacity and scaling

One API instance is enough for personal use. The API is stateless except for the in-memory rate limits, which must move to a shared store (for example PostgreSQL) before a second instance runs. The database grows with journal lines; a load test of the monthly recap at 100,000 lines is still to do.

## Backup and disaster recovery

Target: managed PostgreSQL with point-in-time recovery, recovery point objective 15 minutes, recovery time objective 4 hours, a daily restore test in staging, and backups kept in Indonesia for the 10-year retention duty. Today: local database only, with manual `pg_dump`.

## Routine maintenance

Daily: Dependabot and the freshness workflow (dependency and runtime end-of-life checks). Monthly: close the month and verify the snapshots' hashes. Each release: run migrations, then the evaluation (`node eval/run-capture.ts`) and the full test suite.

## Cost

Today: no hosting cost. Claude calls cost per token at Anthropic's current price and only when a key is configured; capture is limited to 30 calls per user per minute. Hosting cost will be estimated when a provider is chosen.
