# Database

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How the data store is run and changed. Structure is in SCHEMA.md.

## Engine and version

<!-- Engine, exact version, hosting; versions are tracked in TECHSTACKS.md. -->

{{PostgreSQL 18, managed by ...}}

## Connection and configuration

<!-- Pooling, timeouts and TLS settings; the variables themselves are listed in CONFIGURATION.md. -->

{{DATABASE_URL}}: {{purpose}}

## Migrations

<!-- Tool, how to create and run a migration, expand-and-contract rule for zero downtime, who may run them in production. -->

{{process}}

## Access roles and permissions

<!-- Database users and what each may do; least privilege for applications and agents. -->

| Role | Used by | Permissions |
| :--- | :--- | :--- |
| {{app_rw}} | {{api}} | {{SELECT, INSERT, UPDATE on ...}} |

## Indexing and performance

<!-- Important indexes and the queries they serve; how to read query plans. -->

{{indexes}}

## Backup and restore

<!-- Schedule, retention, encryption, where copies live, and the last restore test date. -->

{{policy}}; last restore test {{date}}

## Data retention and deletion

<!-- How long each kind of data is kept and how deletion works. -->

{{policy}}

## Local development data

<!-- How to get a local database with synthetic data; never copies of production personal data. -->

{{steps}}
