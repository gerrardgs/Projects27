# Agent instructions for docs/

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

Loaded by agents working inside docs/ (the nearest AGENTS.md wins). The project-wide rules stay in the root AGENTS.md; do not copy them here.

## Scope

<!-- What this file covers: editing and creating documents in docs/. -->

{{These instructions apply when reading or editing files in docs/. Project-wide rules are in the root AGENTS.md.}}

## Rules for editing documentation

<!-- Project-specific rules for docs: where each kind of fact lives, naming, diagrams, review. -->

- {{Each fact lives in one document; link to it instead of copying.}}
- {{Run every command you document before writing it down.}}
- {{Update the docs in the same change as the behaviour they describe.}}

## Checks

<!-- The commands that validate documentation. -->

{{node <path>/check-docs.mjs docs}} and {{the link checker}}
