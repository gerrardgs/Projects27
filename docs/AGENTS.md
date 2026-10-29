# Agent instructions for docs/

## Scope

These instructions cover the files in `docs/` (this documentation set). The repository-wide rules in [`../AGENTS.md`](../AGENTS.md) still apply; `docs/spec/` holds the agent specification and follows those rules, not these.

## Rules for editing documentation

- Write facts that the code or a command can confirm. Name the file, endpoint, test or command a statement rests on. Mark planned work as planned.
- Update the matching document in the same change as the code ([16-project-documentation](../.agents/rules/16-project-documentation.md)): a new endpoint goes into API.md, a new variable into CONFIGURATION.md, a new table into SCHEMA.md and DATABASE.md.
- Keep every section of each template, with content. Never delete a section; if it does not apply, say why in one sentence.
- Dates are absolute (2026-10-29), versions exact (Node.js 24.22.1), amounts as the product writes them (Rp 35.000).
- Plain English, short sentences, no marketing words ([anti-slop](../.agents/skills/anti-slop/SKILL.md)).

## Checks

```sh
node .agents/skills/technical-documentation/assets/check-docs.mjs docs   # every document and section present and filled
node scripts/agents-sync.mjs --check --all-markdown                       # relative links resolve
node .agents/skills/content-hygiene/assets/unicode-hygiene.mjs docs       # no hidden characters
```
