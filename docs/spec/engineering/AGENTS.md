# Agent instructions for docs/

## Scope

These instructions apply when reading or editing files in `docs/`. Everything else in the root `AGENTS.md` still applies; this file adds only what is specific to the documentation.

## Rules for editing documentation

- Keep each fact in the one document that owns it: versions in `TECHSTACKS.md`, variables in `CONFIGURATION.md`, invariants in `RULES.md`, release steps in `DEPLOYMENT.md`. Link to it from elsewhere instead of copying it.
- Write only facts you verified in this session: run the commands you document, read versions from the manifests or `node scripts/tech-lookup.mjs`, and check every external link.
- Update a document in the same change as the behaviour it describes, and update its row in `README.md` (owner, last-reviewed date).
- A section that does not apply says so in one line with the reason. A document that does not apply is listed under "Not applicable" in `README.md`.
- Keep the required sections of each document (they come from the templates in `.agents/skills/technical-documentation/assets/docs/`); add sections freely, never drop one.
- Plain, specific prose without filler ([anti-slop](../../../.agents/skills/anti-slop/SKILL.md)); diagrams as Mermaid code.

## Checks

```bash
node .agents/skills/technical-documentation/assets/check-docs.mjs docs   # completeness
node scripts/agents-sync.mjs --check --all-markdown                      # links and spec validation
```
