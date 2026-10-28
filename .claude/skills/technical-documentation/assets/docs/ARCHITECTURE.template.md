# Architecture

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How the system is built and why. Decisions are recorded as ADRs and linked here.

## Overview

<!-- One paragraph: what the system does and its main parts. -->

{{overview}}

## System context

<!-- C4 level 1 as Mermaid: users, this system, external systems. -->

```mermaid
flowchart LR
  user[{{User}}] --> system[{{This system}}]
  system --> ext[{{External system}}]
```

## Containers and components

<!-- C4 level 2: deployable units, their responsibility, technology and owner. -->

| Container | Responsibility | Technology | Owner |
| :--- | :--- | :--- | :--- |
| {{api}} | {{responsibility}} | {{technology}} | {{team}} |

## Data flow

<!-- How a main request or event moves through the system; a sequence diagram helps. -->

{{data flow}}

## Trust boundaries

<!-- Where untrusted data enters and which control checks it. -->

{{boundary}}: {{control}}

## Quality attributes

<!-- The ranked attributes as measurable scenarios (ISO/IEC 25010 as a checklist). -->

{{attribute}}: {{scenario with a measure}}

## Key decisions

<!-- Links to ADRs for decisions that are hard to reverse. -->

- {{ADR 0001: title, linked to its file under docs/adr/}}

## Deployment view

<!-- Where each container runs; details in DEPLOYMENT.md. -->

{{deployment view}}

## Known limitations and technical debt

<!-- Known weaknesses, their impact and the plan. -->

{{limitation}}: {{impact}}, {{plan}}
