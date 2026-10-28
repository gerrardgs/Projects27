# Contributing to {{project name}}

<!-- Copy to CONTRIBUTING.md at the repository root (GitHub also reads it from .github/ or docs/). Replace every {{...}} with commands you have run. -->

## Getting started

Prerequisites (exact versions are in `docs/TECHSTACKS.md`): {{runtime, package manager, services}}.

```bash
{{git clone ...}}
{{install command}}
{{cp .env.example .env   # then fill in values; see docs/CONFIGURATION.md}}
{{start command}}
```

## Development workflow

- Branch from `{{main}}` with a short-lived branch named `{{type/short-description}}`.
- Commit messages follow {{Conventional Commits}}; one logical change per commit.
- Domain terms come from `GLOSSARY.md`; project rules are in `docs/RULES.md` and `docs/CODE_STYLE.md`.

## Checks before opening a pull request

```bash
{{format check command}}
{{lint command}}
{{type-check command}}
{{test command}}
```

Update the documents in `docs/` that describe what you changed, in the same pull request.

## Pull requests

Describe what changed and why, how it was verified (commands and results), the risk (one-way or two-way door, blast radius) and the rollback. Reviews follow {{review rules, required approvals}}.

## Reporting bugs and requesting features

{{issue tracker link and templates}}. Report security vulnerabilities privately as described in `SECURITY.md`, never in a public issue.
