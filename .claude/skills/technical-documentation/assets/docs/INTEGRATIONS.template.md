# Integrations

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

Every third-party service and API this system depends on. The API this system offers is described in API.md.

## Inventory

<!-- One row per provider. -->

| Provider | Purpose | Data sent | Owner | Criticality |
| :--- | :--- | :--- | :--- | :--- |
| {{payment provider}} | {{charge cards}} | {{amount, customer ID}} | {{team}} | {{critical}} |

## Authentication and credentials

<!-- How each integration authenticates (OAuth, API key, mTLS), where the credential lives, scopes, rotation. Names only, never values. -->

{{provider}}: {{method}}, credential in {{secret manager}}, rotated {{cadence}}

## Limits and costs

<!-- Rate limits, quotas and pricing that affect the design. -->

{{provider}}: {{limit}}

## Webhooks received

<!-- Endpoints, signature verification, replay protection, idempotency. Write "None." if there are none. -->

{{webhook}}

## Failure behaviour

<!-- Timeouts, retries, fallback or degraded mode, and what users see when the provider is down. -->

{{provider}}: timeout {{ms}}, {{behaviour}}

## Environments and sandboxes

<!-- Test or sandbox accounts and how to use them; production keys never in development. -->

{{sandbox}}

## Contacts and status pages

<!-- Support channel, status page and contract or account owner. -->

{{provider}}: {{status page}}, {{support}}
