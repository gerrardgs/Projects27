---
name: technical-documentation
description: Write and maintain documentation that people can use - the complete project docs/ set (PRD, architecture, tech stack, code style, rules, configuration, API, integrations, database, schema, privacy, design, design system, assets, security, testing, debugging, deployment, operations) with templates and a completeness check, READMEs, tutorials, how-to guides, API and configuration reference, architecture explanations, decision records, changelogs, runbooks, docstrings and code comments - organised with the Diátaxis framework, kept next to the code, reviewed and tested like code. Use when creating or updating any documentation, documenting an API, CLI, library or service, writing a README or migration guide, or when users keep asking the same questions.
license: MIT
metadata:
  version: "1.0.0"
---

# Technical Documentation

Documentation is part of the product. Wrong documentation is worse than none, so it must change in the same pull request as the behaviour it describes.

## 1. Pick the right kind (Diátaxis)

The [Diátaxis](https://diataxis.fr/start-here/) framework separates four needs. Mixing them makes each worse.

| Kind | Serves | Write it as |
| :--- | :--- | :--- |
| Tutorial | Learning: "a lesson, that takes a student by the hand through a learning experience" | One guaranteed path from nothing to a working result; no choices, no digressions |
| How-to guide | A goal: "addresses a real-world goal or problem" | Numbered steps for a competent user; starts from their goal, states prerequisites |
| Reference | Information: "accurate, complete, reliable information, free of distraction and interpretation" | Consistent structure mirroring the code (every option, endpoint, flag, error); generated from source where possible |
| Explanation | Understanding: "context and background", answering "why?" | Discussion of design, trade-offs, history and alternatives |

## 2. The documents most projects need

| Document | Contents |
| :--- | :--- |
| `README.md` | What it is and who it is for, requirements, quick start that works on a fresh machine, common commands, configuration, links to the rest ([template](../project-bootstrap/assets/README.template.md)) |
| API reference | Generated from the contract (OpenAPI, GraphQL schema, `.proto`) or from doc comments; examples for each operation, including errors |
| Configuration reference | Every environment variable and setting: meaning, type, default, required or not, example; kept in sync with `.env.example` |
| Architecture overview | Components, data flows, trust boundaries and the main decisions; diagrams as code (for example Mermaid) so they can be reviewed |
| Decision records | One short record per significant decision ([ADR template](../project-bootstrap/assets/adr-template.md)) |
| `CHANGELOG.md` | User-visible changes per release, grouped as added, changed, deprecated, removed, fixed, security ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)) |
| Migration guides | For every breaking change: who is affected, what to change, before and after examples |
| Runbooks | Operational procedures for each service ([deploy-and-release](../deploy-and-release/SKILL.md) section 7) |
| `SECURITY.md`, `CONTRIBUTING.md` | How to report vulnerabilities privately; how to set up, test and submit changes |

## 3. Writing rules

- Lead with what the reader needs to do or know; one idea per paragraph; short sentences; active voice; consistent terms.
- No generated-sounding prose: no buzzwords, inflated significance, chatbot openers or closers, claims without a source, or invented specifics ([anti-slop writing reference](../anti-slop/references/writing.md)).
- Every command and code sample is copy-pasteable and was actually run; state the versions it was tested with.
- Documents, changelog entries and release notes are written in the owner's name; never add AI attribution lines or badges ([08-git-workflow](../../rules/08-git-workflow.md) section 2).
- Use real-looking but synthetic examples (reserved domains such as `example.com`, documentation IP ranges), never real credentials or personal data.
- Document behaviour and contracts, not implementation details that change often.
- Write for accessibility: descriptive link text, alt text for images, headings in order, no information conveyed only by colour.
- Code comments explain *why*; public APIs get doc comments in the language's format ([02-clean-code](../../rules/02-clean-code.md) section 6).

## 4. Docs as code

- Keep documentation in the repository next to the code, reviewed in the same pull request.
- Check it in CI where practical: broken links, Markdown lint, spelling, and running the code samples or doctests.
- Generate reference material from the source of truth (schemas, type definitions, CLI help) instead of copying it by hand.
- Mark the version a page applies to, and remove or update pages for removed features.

## 5. The project documentation set (`docs/`)

Every project keeps a complete `docs/` folder. Each document below exists and is filled in, or is listed in `docs/README.md` as "not applicable" with the reason (a CLI tool has no `DESIGN_SYSTEM.md`; a stateless service has no `DATABASE.md`). Templates with the required sections are in [assets/docs/](assets/docs/): copy `NAME.template.md` to `docs/NAME.md`. The 23 documents keep one subject each, so every fact has exactly one home.

| Document | Answers | Required |
| :--- | :--- | :--- |
| `README.md` | What is in this folder, who owns each document, what is not applicable and why | Always |
| `AGENTS.md`, `CLAUDE.md` | How agents edit the documentation (agents read the nearest `AGENTS.md`; Claude Code loads a subfolder's `CLAUDE.md` when it works there). Project-wide rules stay in the root files | Always |
| `PRD.md` | What is built, for whom, why, with testable requirements and success metrics | Always |
| `ARCHITECTURE.md` | How the system is built: context and container diagrams, data flow, trust boundaries, quality attributes, ADR links | Always |
| `TECHSTACKS.md` | Exact runtime, framework, service and tool versions, end-of-life dates, upgrade policy; the only place versions are written | Always |
| `CODE_STYLE.md` | Conventions beyond what the formatter and linter enforce | Always |
| `RULES.md` | Business invariants, compliance constraints, protected areas, approvals | Always |
| `TESTING.md` | Strategy, levels, exact commands, quality gates | Always |
| `DEBUGGING.md` | Running locally, logs and traces, known failure modes with fixes | Always |
| `DEPLOYMENT.md` | Environments, pipeline, configuration, migrations, rollout, rollback, release health | Anything that is deployed or released |
| `CONFIGURATION.md` | Every environment variable, configuration file and feature flag: meaning, type, default, required, secret or not; the only place variables are listed | The project reads any configuration |
| `OPERATIONS.md` | SLOs and error budget, alerts and on-call, incident management, capacity, backup and disaster recovery, routine maintenance, cost | The system runs in production |
| `SECURITY.md` | Reporting, threat model, authentication, data protection, secrets, supply chain, incident response | Always. GitHub shows the first `SECURITY.md` it finds in `.github/`, the root, then `docs/`; keep one reporting policy and link it |
| `DOCUMENTATION.md` | How the docs are organised, written, owned and kept current | Always |
| `API.md` | Contract location, authentication, versioning, errors, limits, idempotency, endpoints, events | The project offers an API |
| `INTEGRATIONS.md` | Third-party services it depends on: data sent, credentials, limits, webhooks, failure behaviour, sandboxes, contacts | The project calls external services or receives their webhooks ([api-integration](../api-integration/SKILL.md)) |
| `PRIVACY.md` | Personal data inventory, legal basis, recipients and transfers, retention and deletion, data subject requests, impact assessments, breach response | The project processes personal data |
| `DATABASE.md` | Engine, configuration, migrations, roles, backup and restore, retention | The project stores data |
| `SCHEMA.md` | Entities, fields, relationships, invariants, data classification | The project stores data |
| `DESIGN.md` | Design direction, flows, screens, tone, accessibility targets | The project has a user interface |
| `DESIGN_SYSTEM.md` | Tokens with contrast ratios, components with all states, themes | The project has a user interface |
| `ASSETS.md` | Images, icons, fonts and media with source, licence and delivery | The project ships assets |

**At the repository root**, next to `docs/`: `README.md` ([template](../project-bootstrap/assets/README.template.md)), `AGENTS.md` and `CLAUDE.md` (project-wide agent rules), `CONTRIBUTING.md` ([template](../project-bootstrap/assets/CONTRIBUTING.template.md)), `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)), `LICENSE` ([choosealicense.com](https://choosealicense.com/)), `GLOSSARY.md` for the domain language ([template](../project-bootstrap/assets/GLOSSARY.template.md)), ADRs in `docs/adr/` ([template](../project-bootstrap/assets/adr-template.md)), and post-incident reviews in `docs/postmortems/`. Public repositories also add a code of conduct and a support policy. Per-model documentation lives with the model ([model cards](../machine-learning/SKILL.md)).

**What makes a document substantial, not just present:**

- Every section holds facts about **this** project, verified at the source: commands that were run, versions read from manifests or `scripts/tech-lookup.mjs`, diagrams as code (Mermaid) that match the code, links that resolve. Template text, generic advice and filler are not content ([anti-slop](../anti-slop/SKILL.md)).
- A section that does not apply says so in one line with the reason; it is never left empty or padded.
- One fact, one place: versions only in `TECHSTACKS.md`, variables only in `CONFIGURATION.md`, decisions as ADRs linked from `ARCHITECTURE.md`, data structure only in `SCHEMA.md`. Other documents link instead of copying, so nothing contradicts.
- Generated where possible: API reference from the contract, schema from migrations; the document says how to regenerate it.
- Names of environment variables, roles and secrets only, never their values; synthetic examples only.
- Each document has an owner and a last-reviewed date in `docs/README.md`, and changes in the same pull request as the behaviour it describes.

**Check it in CI.** [assets/check-docs.mjs](assets/check-docs.mjs) (Node.js 22+, no dependencies) fails when a standard document is missing and not marked not applicable, when a template section is missing or empty, or when a `{{placeholder}}` remains: `node check-docs.mjs docs`. It checks completeness only; correctness is checked by review and by running what the documents say.

## Done when

- [ ] Each changed behaviour is reflected in the reference, guides and changelog
- [ ] Commands and samples were run and work as written
- [ ] The page has one clear purpose (tutorial, how-to, reference or explanation)
- [ ] Links resolve; no secrets or real personal data in examples
- [ ] The `docs/` set is complete (`check-docs.mjs` passes) and every changed fact is updated in the one document that owns it
