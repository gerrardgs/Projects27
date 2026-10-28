---
name: project-documentation
description: Create and maintain a complete, substantial documentation set for a project in docs/ - README index, PRD, glossary, architecture, tech stack, code style, project rules, design direction (DESIGN.md), design system, assets, accessibility, performance, API, database, schema, security, privacy, testing, debugging, deployment, a documentation guide, nested AGENTS.md and CLAUDE.md for agents, and optional analytics, i18n, SEO and runbook documents - with owners, review dates and statuses, every section filled from real sources, and a tested checker (check-docs.mjs) that fails on missing documents, empty sections, leftover template text, stale reviews and broken links. Use when starting a project, onboarding a repository to this specification, before a release, when documentation is missing, thin or out of date, or when the user asks for docs, a PRD, an architecture document, API or database documentation.
license: MIT
metadata:
  version: "1.0.0"
---

# Project Documentation

Every project keeps its knowledge in `docs/`, complete and worth reading: each document answers real questions with facts taken from the code, configuration, design files and research, and stays current. The rule is [16-project-documentation](../../rules/16-project-documentation.md). Templates and the checker are in [assets/docs-kit/](assets/docs-kit/).

## 1. The set

| File | Answers | Main source of facts |
| :--- | :--- | :--- |
| `README.md` | What is in this folder, who owns each document, how docs stay current | This folder |
| `AGENTS.md` | Rules for AI agents editing docs (as the nearest AGENTS.md it applies to `docs/`) | This skill, rule 16 |
| `CLAUDE.md` | Loads `AGENTS.md` for Claude Code in `docs/` (`@AGENTS.md`) | `AGENTS.md` |
| `PRD.md` | Problem, users, goals and metrics, scope, requirements, flows, acceptance criteria, risks | Research, stakeholders, [ux-research-and-strategy](../ux-research-and-strategy/SKILL.md) |
| `ARCHITECTURE.md` | Context, building blocks, data flow, quality attributes, decisions (ADRs), constraints | Code, [framework-frontend-engineering](../framework-frontend-engineering/SKILL.md) |
| `TECHSTACKS.md` | Exact versions, reasons, licences, tooling, services, upgrade policy | Manifests and lockfiles, [04-dependencies](../../rules/04-dependencies.md) |
| `CODE_STYLE.md` | Formatting and lint commands, naming, structure, components, comments, commits | Config files (`eslint.config.mjs`, `.editorconfig`), [02-clean-code](../../rules/02-clean-code.md) |
| `RULES.md` | Non-negotiables, business rules, agent and contributor rules, exceptions | Policies, contracts, `.agents/rules/` |
| `DESIGN.md` | Identity, audience and tone, visual direction, dials, do and avoid, references | Brand guide, [anti-slop-filter](../anti-slop-filter/SKILL.md) |
| `DESIGN_SYSTEM.md` | Tokens, themes, components, accessibility, contribution, tools | Token source, Storybook, [design-system-and-tokens](../design-system-and-tokens/SKILL.md) |
| `ASSETS.md` | Inventory with sources and licences; fonts, icons, media, export specs, source files | Licences, [13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md) |
| `API.md` | Base URLs, auth, endpoints, errors, limits, versioning, examples | OpenAPI or GraphQL schema |
| `DATABASE.md` | Engine, environments, migrations, backup and restore, roles, performance, retention | Migrations, infrastructure |
| `SCHEMA.md` | Entities, tables, relationships, enumerations, validation, schema changes | Migrations, ORM models, JSON Schema |
| `SECURITY.md` | Threat model, auth, secrets, data protection, supply chain, browser security, incidents | [security-hardening](../security-hardening/SKILL.md) |
| `TESTING.md` | Strategy, commands, coverage, test data, accessibility and visual tests, CI | Test config, [frontend-testing-and-visual-qa](../frontend-testing-and-visual-qa/SKILL.md) |
| `DEBUGGING.md` | Local debugging, logs and tools, common problems with fixes, escalation | Incidents, [systematic-debugging](../systematic-debugging/SKILL.md) |
| `DEPLOYMENT.md` | Environments, pipeline, configuration, release steps, rollback, after a deploy | CI workflows, [frontend-deployment](../frontend-deployment/SKILL.md) |
| `DOCUMENTATION.md` | Document types, where docs live, ownership and review, style, checks | This skill |
| `GLOSSARY.md` | The shared domain language: one word per concept, and the words to avoid | Stakeholders, the code, the PRD |
| `ACCESSIBILITY.md` | Target and legal scope, conformance status, known issues, testing, the public statement, design and content rules | Audits, [accessibility-audit](../accessibility-audit/SKILL.md) |
| `PERFORMANCE.md` | Budgets, measurement (field and lab), current measured results, optimisations, regression alerts | Real-user data, Lighthouse CI, [web-performance-optimization](../web-performance-optimization/SKILL.md) |
| `PRIVACY.md` | Personal data inventory, purposes and legal basis, consent and cookies, third parties, retention, user rights, assessments | The data protection officer, [14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md) section 5 |

Optional documents, required only when the project has the concern (the checker validates them when they exist):

| File | Add it when | Answers |
| :--- | :--- | :--- |
| `ANALYTICS.md` | The product collects analytics | Questions, the tracking plan (events), consent, data quality, tools and access |
| `I18N.md` | The product is or will be localised | Locales, translation workflow, formatting with Intl, right-to-left, testing |
| `SEO.md` | Pages are public and should be found | Indexing, metadata, structured data, performance, monitoring |
| `RUNBOOK.md` | Someone operates services in production | Services and owners, alerts, procedures, incident response, contacts |

Decisions go in `docs/adr/` ([ADR template](../project-bootstrap/assets/adr-template.md)); the root `README.md`, `CHANGELOG.md` and `SECURITY.md` (vulnerability reporting) stay at the repository root.

A document that genuinely does not apply (no database in a static site) is not deleted or left empty: it says `Status: not-applicable` and a `Reason:` line, so readers and agents know it was considered.

## 2. Create the set

1. Copy the templates: `cp -n .agents/skills/project-documentation/assets/docs-kit/templates/*.md docs/` (`-n` never overwrites a document that already exists; merge existing content into the structure by hand, with the owner's agreement for anything removed, per [01-core-principles](../../rules/01-core-principles.md) section 8).
2. Fill each document from its source in the table above, not from memory. Replace every `<!-- doc: ... -->` comment with content: the comment says what the section must answer.
3. Set the header of each document: `Owner:` (a person or team), `Last reviewed:` (the date you checked it against the source), `Status:` (`current`, `draft` or `not-applicable`).
4. Run every command a document shows and paste the real output; link instead of copying (the schema, the workflow file, the design file). One fact lives in one place.
5. Check: `node .agents/skills/project-documentation/assets/docs-kit/check-docs.mjs` (add `--strict` before a release so drafts, stale reviews and TODOs fail too).

## 3. What makes a document substantial

- **Specific to this project**: names its real modules, commands, environments, tokens, endpoints and owners. A paragraph that would fit any project is filler; replace it with the facts it stands for.
- **Verified**: versions from lockfiles, commands that were run, numbers from measurements, links that resolve ([03-verification](../../rules/03-verification.md)). Unknown facts are listed as open questions with an owner, never guessed.
- **Useful to the reader it serves**: a new developer can set up, test and deploy from the docs alone; a designer finds the direction and tokens; an agent finds the rules and the commands.
- **Plain and honest**: plain language, no buzzwords or AI filler ([writing patterns](../anti-slop-filter/references/writing-patterns.md)), no invented metrics, testimonials or claims ([09-design-principles](../../rules/09-design-principles.md) section 7), no secrets or personal data ([06-security](../../rules/06-security.md)).
- **Current**: updated in the same pull request as the change it describes; reviewed on the cadence set in `DOCUMENTATION.md`.

## 4. Keep it current

- Add the checker to CI: a job that runs `node .agents/skills/project-documentation/assets/docs-kit/check-docs.mjs` (and `--strict` on release branches).
- Every pull request that changes behaviour, configuration, the schema, the API, the design system or the deployment updates the matching document and its `Last reviewed` date.
- Review the whole set before each release and at least every 180 days (the checker's default stale threshold; change it with `--max-age`).
- Documents, changelog entries and release notes are written in the owner's name; never add AI attribution lines or badges ([08-git-workflow](../../rules/08-git-workflow.md) section 2).

## Done when

- [ ] All 23 required documents exist in `docs/`, each `current` or explicitly `not-applicable` with a reason, plus the optional ones the project's concerns call for
- [ ] Every section filled from a real source; commands run; links resolve; no template comments, filler or secrets
- [ ] `check-docs.mjs` passes (with `--strict` before a release) locally and in CI
- [ ] Owners named and review dates set
