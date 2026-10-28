# Debugging

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How to investigate problems in this system, from a laptop to production.

## Run locally

<!-- Exact steps to start the system with debug tooling. -->

{{steps}}

## Logs, metrics and traces

<!-- Where each lives, how to query them, the correlation ID to follow. -->

{{locations and queries}}

## Common problems

<!-- Known failure modes with their symptom, cause and fix. -->

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| {{symptom}} | {{cause}} | {{fix}} |

## Debugging tools

<!-- Debugger setup, profilers, database consoles, request replay. -->

{{tools}}

## Feature flags and configuration

<!-- Flags and settings that change behaviour, and how to inspect them. -->

{{flags}}

## Escalation

<!-- When and how to involve the owner or on-call. -->

{{process}}
