# Documentation

The documentation set for Projects 27, the finance reporting system. Rule [16-project-documentation](../.agents/rules/16-project-documentation.md) defines the set; `node .agents/skills/technical-documentation/assets/check-docs.mjs docs` checks that every document exists and every section has content. The agent specification itself (rules, skills, reference library) lives in [`docs/spec/`](spec/) and is not part of this set.

## Documents

| Document | What it answers |
| :--- | :--- |
| [PRD.md](PRD.md) | What the product must do, for whom, and the owner's decisions |
| [RESEARCH.md](RESEARCH.md) | The facts and sources behind the requirements |
| [ROADMAP.md](ROADMAP.md) | Delivery stages and their status |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the system is built, its boundaries and its known gaps |
| [EVALUATION.md](EVALUATION.md) | How speech recognition and automatic form filling are measured, with results |
| [TECHSTACKS.md](TECHSTACKS.md) | Runtimes, libraries and tools with versions |
| [CODE_STYLE.md](CODE_STYLE.md) | Conventions and the tools that enforce them |
| [RULES.md](RULES.md) | Domain rules about money, periods and audit, and who may approve what |
| [DESIGN.md](DESIGN.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [ASSETS.md](ASSETS.md) | Interface direction, tokens and components, fonts and icons |
| [API.md](API.md) | The HTTP API: authentication, errors, limits, endpoints |
| [CONFIGURATION.md](CONFIGURATION.md) | Environment variables and configuration files |
| [DATABASE.md](DATABASE.md), [SCHEMA.md](SCHEMA.md) | PostgreSQL setup, migrations, tables and invariants |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Claude API and device speech services |
| [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md) | Threat model and controls; personal data and its handling |
| [TESTING.md](TESTING.md), [DEBUGGING.md](DEBUGGING.md) | How the system is tested, and how to find a problem |
| [DEPLOYMENT.md](DEPLOYMENT.md), [OPERATIONS.md](OPERATIONS.md) | How it is released and run (hosting is not chosen yet) |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Where documentation goes and how it stays current |
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | Instructions for AI agents editing this folder |

## Not applicable

- ACCESSIBILITY.md, PERFORMANCE.md and GLOSSARY.md are named by rule 16 but have no template in the checker. Accessibility targets are in [DESIGN.md](DESIGN.md) and [PRD.md](PRD.md); performance targets are in [PRD.md](PRD.md) under Non-functional requirements.
- ANALYTICS.md, I18N.md and SEO.md are not applicable: the apps collect no analytics, the interface is Indonesian only for now, and there are no public pages.

## Reading paths

- **New to the project**: PRD → ARCHITECTURE → ROADMAP → TECHSTACKS.
- **Changing money logic**: RULES → SCHEMA → DATABASE → TESTING.
- **Working on a client app**: DESIGN → DESIGN_SYSTEM → API → the app's own README in `apps/`.
- **Running it locally**: CONFIGURATION → DATABASE (local data) → DEBUGGING.
- **Reviewing AI or speech**: EVALUATION → INTEGRATIONS → PRIVACY.
