# Deployment

## Environments

| Environment | Status |
| :--- | :--- |
| Local development | Running: API on 8080, web on 5173, PostgreSQL 18.6 on 5433 |
| CI | Running: GitHub Actions builds and tests the API and the web app on every push |
| Staging, production | Not set up; hosting is an open question ([PRD.md](PRD.md#open-questions)) |

## Pipeline

Today: push → `validate.yml` (secret scan, authorship, lint, spec checks, API tests, web tests) and CodeQL; a tag runs `release.yml`, which creates the GitHub release from `.github/releases/<version>.md`. Target: build container images once in CI, deploy the same image to staging and then production.

## Configuration and secrets

From the environment only ([CONFIGURATION.md](CONFIGURATION.md)); in production from the hosting platform's secret store. `COOKIE_SECURE` stays on (the default), `WEB_ORIGINS` lists the HTTPS web origin, and the clients are built with the production `API_BASE_URL`.

## Database migrations

Run `npm run migrate` against the target database before starting the new API version. Migrations only add or change in a backward-compatible way, so the previous API version keeps working during a rollout. An applied migration is never edited.

## Release and rollout

Versions follow semantic versioning; each release has notes in `.github/releases/` and a CHANGELOG entry. The web app is a static build behind the same origin as `/v1`; the mobile apps go through TestFlight and Google Play's internal testing track before store release. None of this has run yet.

## Rollback

Redeploy the previous image; migrations are backward compatible, so no down-migration is needed. Mobile releases cannot be pulled back from devices, so the API must keep serving the previous app version's contract (`/v1` only grows).

## Monitoring and alerts

Planned with hosting: health check on `GET /v1/health`, error rate and latency from the JSON logs, a daily `audit/verify` run, and an alert on any failed report check ([OPERATIONS.md](OPERATIONS.md)).

## Runbooks

- Start locally: [DEBUGGING.md](DEBUGGING.md#run-locally).
- Restore from backup: [DATABASE.md](DATABASE.md#backup-and-restore).
- Security incident: [SECURITY.md](SECURITY.md#incident-response).
