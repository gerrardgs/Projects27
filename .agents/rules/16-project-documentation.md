---
trigger: model_decision
description: "Apply when starting a project, adding or changing features, APIs, data, design, configuration or deployment, before a release, or when writing or reviewing documentation in docs/."
---

# R-16: Project Documentation

A project is not done until its knowledge is written down where people and agents can find it. Procedure, templates and the checker: [project-documentation](../skills/project-documentation/SKILL.md).

## 1. The required set

Every project keeps these documents in `docs/`: `README.md` (index), `AGENTS.md` and `CLAUDE.md` (agent rules for the folder), `PRD.md`, `GLOSSARY.md`, `ARCHITECTURE.md`, `TECHSTACKS.md`, `CODE_STYLE.md`, `RULES.md`, `DESIGN.md`, `DESIGN_SYSTEM.md`, `ASSETS.md`, `ACCESSIBILITY.md`, `PERFORMANCE.md`, `API.md`, `DATABASE.md`, `SCHEMA.md`, `SECURITY.md`, `PRIVACY.md`, `TESTING.md`, `DEBUGGING.md`, `DEPLOYMENT.md` and `DOCUMENTATION.md`, plus decision records in `docs/adr/`. Add `ANALYTICS.md`, `I18N.md`, `SEO.md` and `RUNBOOK.md` when the project collects analytics, is localised, has public pages, or runs services someone operates. At the repository root: `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md` and the tooling files from [project-bootstrap](../skills/project-bootstrap/SKILL.md).

A document that does not apply stays in the set with `Status: not-applicable` and a `Reason:` line. It is never silently missing.

## 2. Every document is substantial

- Starts with `Owner:`, `Last reviewed: YYYY-MM-DD` and `Status: current | draft | not-applicable`.
- Fills every required section with facts specific to this project, taken from the source (code, configuration, lockfiles, schema, design files, research), not from memory or a generic template.
- Contains no template guidance, filler text, invented numbers, claims or quotes, secrets or personal data ([03-verification](03-verification.md), [06-security](06-security.md), [09-design-principles](09-design-principles.md) section 7).
- Shows commands that were run and links that resolve; links to the single source of a fact instead of copying it.

## 3. Documentation changes with the work

- A change to behaviour, configuration, the API, the schema, the design system, assets, security or deployment updates the matching document in the same change, and its `Last reviewed` date.
- Existing documentation is edited, not discarded: removing or rewriting sections someone else wrote needs their agreement ([01-core-principles](01-core-principles.md) section 8).
- `check-docs.mjs` passes before a task is reported as done when docs were touched, and with `--strict` before a release.
