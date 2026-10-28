# Product requirements

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

What is being built, for whom and why, and how success is measured. Engineering details belong in ARCHITECTURE.md.

## Problem

<!-- Who has which problem today, with evidence (support tickets, research, data). -->

{{problem and evidence}}

## Users and scenarios

<!-- Roles and the main scenarios for each. -->

{{role}}: {{scenario}}

## Goals and non-goals

<!-- Outcomes that will be true when this ships, and what is deliberately excluded. -->

- Goal: {{measurable outcome}}
- Non-goal: {{excluded item}}

## Requirements

<!-- Numbered requirements, each with Given/When/Then acceptance criteria that a test can check. -->

| ID | Requirement | Acceptance criteria |
| :--- | :--- | :--- |
| {{R1}} | {{requirement}} | Given {{context}}, when {{action}}, then {{result}} |

## Non-functional requirements

<!-- Security, privacy, performance targets, accessibility (WCAG 2.2 AA), reliability, compliance. -->

{{requirement with a number, for example p95 latency under 300 ms}}

## Success metrics

<!-- How you will know it worked, with baseline and target. -->

{{metric}}: baseline {{value}}, target {{value}}

## Release plan

<!-- Phases, feature flags, migration, communication. -->

{{plan}}

## Open questions

<!-- Decisions still needed, with owner and date. -->

- {{question}} (owner {{name}}, due {{date}})
