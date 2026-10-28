# Technology stack

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

The single place for runtime, framework and tool versions. Other documents link here instead of repeating versions.

## Runtimes and languages

<!-- Exact versions from the manifests, with end-of-life dates (node scripts/tech-lookup.mjs eol:<product>). -->

| Name | Version | End of life | Source of the version |
| :--- | :--- | :--- | :--- |
| {{Node.js}} | {{24.x}} | {{date}} | {{package.json engines}} |

## Frameworks and libraries

<!-- Main dependencies, why each was chosen, and its licence. -->

| Dependency | Version | Purpose | Licence |
| :--- | :--- | :--- | :--- |
| {{name}} | {{version}} | {{purpose}} | {{licence}} |

## Infrastructure and services

<!-- Databases, queues, caches, cloud and SaaS services with versions or plans. -->

{{service}}: {{version or plan}}, {{purpose}}

## Tooling

<!-- Formatter, linter, type checker, test runner, build tool, package manager, each with its command. -->

| Purpose | Tool | Command |
| :--- | :--- | :--- |
| Format | {{tool}} | `{{command}}` |

## Why these choices

<!-- Short rationale or links to ADRs. -->

{{rationale}}

## Upgrade policy

<!-- How updates arrive (Dependabot or Renovate, cooldown), who reviews them, and how end of life is tracked. -->

{{policy}}
