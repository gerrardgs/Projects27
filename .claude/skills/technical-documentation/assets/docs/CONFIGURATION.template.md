# Configuration

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

The single reference for every environment variable, configuration file and feature flag. Other documents link here instead of listing variables.

## Environment variables

<!-- Every variable the code reads: name, meaning, type and allowed values, default, required or not, secret or not, example. Never real values for secrets. Keep it in sync with .env.example. -->

| Name | Meaning | Type | Default | Required | Secret | Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| {{DATABASE_URL}} | {{connection string for the primary database}} | URL | none | yes | yes | `postgres://user@localhost:5432/app` |

## Configuration files

<!-- Each file the application or its tools read, what it controls and who may change it. -->

{{config/app.yaml}}: {{what it controls}}

## Per-environment values

<!-- What differs between environments and where those values are stored (secret manager, CI variables). -->

| Setting | Development | Staging | Production | Stored in |
| :--- | :--- | :--- | :--- | :--- |
| {{LOG_LEVEL}} | debug | info | info | {{deployment manifest}} |

## Feature flags

<!-- Each flag: purpose, default, owner, and when it will be removed. -->

| Flag | Purpose | Default | Owner | Remove by |
| :--- | :--- | :--- | :--- | :--- |
| {{new-checkout}} | {{purpose}} | off | {{team}} | {{date}} |

## Validation

<!-- How the application checks configuration at start-up and fails fast with a clear message. -->

{{validation}}
