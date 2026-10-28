# Documentation

Index of `docs/` for Projects 23: what each document answers, who owns it, and when it was last checked. The set follows [technical-documentation](../../../.agents/skills/technical-documentation/SKILL.md) section 5, and `check-docs.mjs` verifies it in CI.

## Documents

| Document | Answers | Owner | Last reviewed |
| :--- | :--- | :--- | :--- |
| [PRD.md](PRD.md) | What Projects 23 is, for whom, and how success is judged | Repository owner | 2026-10-23 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the spec is organised, how each AI tool loads it, and why | Repository owner | 2026-10-23 |
| [TECHSTACKS.md](TECHSTACKS.md) | Every runtime, tool and pinned version, with end-of-life dates | Repository owner | 2026-10-23 |
| [CODE_STYLE.md](CODE_STYLE.md) | Conventions for the repository's own scripts, templates and Markdown | Repository owner | 2026-10-23 |
| [RULES.md](RULES.md) | Invariants of the spec, protected areas and approvals | Repository owner | 2026-10-23 |
| [CONFIGURATION.md](CONFIGURATION.md) | Environment variables, adapter files and options | Repository owner | 2026-10-23 |
| [INTEGRATIONS.md](INTEGRATIONS.md) | External registries and services the scripts and CI call | Repository owner | 2026-10-23 |
| [TESTING.md](TESTING.md) | What is tested, where, and the exact commands | Repository owner | 2026-10-23 |
| [DEBUGGING.md](DEBUGGING.md) | Known failures of the validators, templates and CI, with fixes | Repository owner | 2026-10-23 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | How a release is made and how users install it | Repository owner | 2026-10-23 |
| [SECURITY.md](SECURITY.md) | Threat model and controls; the reporting policy is the root `SECURITY.md` | Repository owner | 2026-10-23 |
| [DOCUMENTATION.md](DOCUMENTATION.md) | How these documents are organised and kept current | Repository owner | 2026-10-23 |
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | How agents edit the files in `docs/` | Repository owner | 2026-10-23 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to author rules, skills and templates (GitHub shows it as the contributing guide) | Repository owner | 2026-10-23 |
| [AGENT-OPERATIONAL-MANUAL.md](AGENT-OPERATIONAL-MANUAL.md) | Which rule or skill to load for each kind of task | Repository owner | 2026-10-23 |
| [ANTI-HALLUCINATION-PLAYBOOK.md](ANTI-HALLUCINATION-PLAYBOOK.md) | How agents verify facts instead of inventing them | Repository owner | 2026-10-23 |

## Not applicable

- API.md: not applicable, Projects 23 offers no network API; its command-line scripts are documented in CONFIGURATION.md and TESTING.md.
- DATABASE.md: not applicable, Projects 23 stores no data in a database.
- SCHEMA.md: not applicable, there is no data store; the only structured data is skill and rule frontmatter, whose format is in CONTRIBUTING.md.
- PRIVACY.md: not applicable, the spec and its scripts collect and process no personal data. Git commit metadata is covered in SECURITY.md.
- OPERATIONS.md: not applicable, nothing runs in production; scheduled CI jobs are described in DEPLOYMENT.md and TESTING.md.
- DESIGN.md: not applicable, there is no user interface.
- DESIGN_SYSTEM.md: not applicable, there is no user interface.
- ASSETS.md: not applicable, the repository ships no images, fonts or media.

## Reading paths

- New contributor: [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [CONTRIBUTING.md](CONTRIBUTING.md), [RULES.md](RULES.md), [TESTING.md](TESTING.md).
- AI agent working in this repository: the root `AGENTS.md`, then [RULES.md](RULES.md) and [CODE_STYLE.md](CODE_STYLE.md); inside `docs/`, [AGENTS.md](AGENTS.md).
- Maintainer making a release: [DEPLOYMENT.md](DEPLOYMENT.md), [TECHSTACKS.md](TECHSTACKS.md), [SECURITY.md](SECURITY.md), [DEBUGGING.md](DEBUGGING.md).
