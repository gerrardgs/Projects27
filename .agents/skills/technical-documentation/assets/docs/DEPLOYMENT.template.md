# Deployment

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How changes reach production and how to undo them.

## Environments

<!-- Each environment, its purpose, URL and who can deploy. -->

| Environment | Purpose | URL | Deployed by |
| :--- | :--- | :--- | :--- |
| {{staging}} | {{purpose}} | {{url}} | {{pipeline}} |

## Pipeline

<!-- Stages from commit to production, with links to the workflow files. -->

{{stages}}

## Configuration and secrets

<!-- How configuration and secrets reach each environment. The variable reference itself is CONFIGURATION.md. -->

{{variables}}

## Database migrations

<!-- When and how migrations run during a release. -->

{{process}}

## Release and rollout

<!-- Versioning, canary or blue-green, feature flags, release notes. -->

{{process}}

## Rollback

<!-- Exact steps and the time it takes; tested on {{date}}. -->

{{steps}}

## Monitoring and alerts

<!-- The dashboards and checks that confirm a release is healthy. Steady-state SLOs, alerts and on-call are in OPERATIONS.md. -->

{{links}}

## Runbooks

<!-- Links to operational runbooks. -->

- {{runbook}}
