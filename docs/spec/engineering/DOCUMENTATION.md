# Documentation guide

How the documentation of Projects 23 is organised, written and kept current.

## Structure

- Reference for agents and users of the spec: `AGENTS.md`, `.agents/rules/`, `.agents/skills/` (procedures and their references).
- Explanation: [ARCHITECTURE.md](ARCHITECTURE.md) and [PRD.md](PRD.md).
- How-to: [CONTRIBUTING.md](CONTRIBUTING.md) (authoring), [DEPLOYMENT.md](DEPLOYMENT.md) (releasing), [DEBUGGING.md](DEBUGGING.md), [AGENT-OPERATIONAL-MANUAL.md](AGENT-OPERATIONAL-MANUAL.md) (which skill for which task).
- Reference for maintainers: [TECHSTACKS.md](TECHSTACKS.md), [CONFIGURATION.md](CONFIGURATION.md), [INTEGRATIONS.md](INTEGRATIONS.md), [CODE_STYLE.md](CODE_STYLE.md), [RULES.md](RULES.md), [TESTING.md](TESTING.md), [SECURITY.md](SECURITY.md).
- Record of change: the root `CHANGELOG.md`.

## Where things go

- Versions and end-of-life dates: only [TECHSTACKS.md](TECHSTACKS.md).
- Environment variables and script options: only [CONFIGURATION.md](CONFIGURATION.md).
- Invariants, protected areas and approvals: only [RULES.md](RULES.md).
- Guidance for other projects: the rules and skills, never `docs/`.
- What changed in a release: `CHANGELOG.md`.

## Writing rules

The rules in [technical-documentation](../../../.agents/skills/technical-documentation/SKILL.md) section 3 and the [anti-slop writing reference](../../../.agents/skills/anti-slop/references/writing.md): verified facts with dates, commands that were run, diagrams as Mermaid code, and no filler.

## Keeping docs current

Documents change in the same commit as the behaviour they describe. CI runs `check-docs.mjs docs` (completeness) and `agents-sync.mjs --check --all-markdown` (links and structure) on every push and pull request.

## Ownership and review

The repository owner owns every document. The last-reviewed date of each one is in [README.md](README.md); documents are reviewed at each release that touches their subject.

## Generated documentation

- `.claude/skills/` is generated from `.agents/skills/` by `node scripts/agents-sync.mjs`.
- The always-on token estimate and skill-metadata size in [ARCHITECTURE.md](ARCHITECTURE.md) come from the output of `agents-sync.mjs` and are updated by hand when they change.
