# Security

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How the system is protected. GitHub shows the first SECURITY.md it finds in .github/, the root, then docs/: if another copy exists, keep the reporting policy there and link it here.

## Reporting a vulnerability

<!-- Private reporting channel and response times, or a link to the policy file GitHub shows. -->

{{channel}}

## Supported versions

<!-- Versions that receive security fixes. -->

{{versions}}

## Threat model

<!-- Assets, entry points, trust boundaries and threats (STRIDE) with mitigations. -->

| Threat | Boundary | Mitigation | Test |
| :--- | :--- | :--- | :--- |
| {{threat}} | {{boundary}} | {{mitigation}} | {{test}} |

## Authentication and authorization

<!-- Identity provider, session and token handling, permission model, object-level checks. -->

{{design}}

## Data classification and protection

<!-- Data classes, encryption in transit and at rest, retention, access logging. -->

{{rules}}

## Secrets management

<!-- Where secrets live, who can read them, rotation (names only, never values). -->

{{process}}

## Dependency and supply-chain security

<!-- Lockfiles, update automation, audits, signing, SBOM. -->

{{process}}

## Security testing

<!-- Scanners in CI and their commands, review checklist, penetration tests. -->

{{process}}

## Incident response

<!-- Who to call, how to rotate secrets and roll back, how to notify users. -->

{{plan}}
