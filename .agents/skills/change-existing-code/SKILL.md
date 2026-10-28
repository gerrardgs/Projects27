---
name: change-existing-code
description: Safely modify, refactor, upgrade or migrate an existing codebase without breaking behaviour - understand it first, pin current behaviour with characterization tests, then change it in small verified steps. Use when fixing or extending code you did not write, refactoring, upgrading dependencies or runtime versions, removing deprecated APIs, renaming across a codebase, or working in legacy code with few tests.
license: MIT
metadata:
  version: "1.0.0"
---

# Change Existing Code Safely

Most engineering work happens in code that already exists. The goal is to change exactly what was asked while everything else keeps working.

## 1. Understand before editing

1. Read the README, contribution guide, architecture notes, and any nested `AGENTS.md` near the code you will touch.
2. Find the entry points and trace the path your change affects: who calls this code, what it calls, what data it reads and writes.
3. Search for every use of a symbol before changing it (`rg -n "symbolName"`, or the editor's "find references"). Include tests, configuration, scripts, templates and documentation.
4. Identify the conventions: error handling, logging, naming, folder layout, test style. Your change should look as if the original authors wrote it.
5. Run the existing build and tests to get a baseline. Note failures that existed before you started.

## 2. Pin the current behaviour

- If the code you will change lacks tests, first write **characterization tests** that record what it does now, including odd behaviour. They are a safety net, not a statement that the behaviour is correct.
- For hard-to-test code, test through the nearest seam that exists: a public function, an HTTP endpoint, a CLI invocation, or a file in and a file out.
- If you must change behaviour that callers depend on, list the affected callers and ask the user before you proceed.

## 3. Change in small, verified steps

- **Surgical changes**: every changed line traces to the request. Do not "improve" nearby code, comments or formatting, do not refactor what is not broken, and match the existing style. Imports, variables or helpers that *you* added and no longer need, remove; anything that existed before and became unused, propose for removal ([01-core-principles](../../rules/01-core-principles.md) section 8).
- Separate **refactoring** (structure changes, behaviour identical) from **behaviour changes**. Do them in different commits.
- After each step: build, run the relevant tests, and keep the code working. Never pile up many unverified edits.
- Common safe refactorings: rename, extract function, inline function, move code, introduce parameter object, replace conditional with polymorphism or a lookup table. Use the editor's or language server's automated refactorings where available.
- Keep public interfaces stable. To replace one, add the new interface, migrate callers, deprecate the old one with a clear message, and remove it in a later major version.
- For large replacements, use the **strangler fig** approach: route a slice of traffic or calls to the new implementation, grow the slice, then delete the old code once the user approves the removal ([01-core-principles](../../rules/01-core-principles.md) section 8). Use a feature flag when the switch must be reversible at runtime.

## 4. Upgrades and migrations

### Dependency or runtime upgrade
1. Read the changelog and migration guide for every version you cross. Note breaking changes and deprecations.
2. Upgrade one major version at a time, and one significant dependency at a time.
3. Run the full test suite, the type checker and the linter. Search for removed or deprecated APIs and replace them.
4. Update the lockfile, CI configuration, container base images and the documented minimum versions together.

### Large mechanical changes
- Prefer a codemod or the language server over hand edits or blind search-and-replace: TypeScript language service refactors, `jscodeshift`, `gofmt -r` and `gopls`, `rust-analyzer` assists, OpenRewrite (Java).
- Review the full diff anyway. Mechanical tools miss strings, reflection, configuration files and documentation.

### Database schema changes
Use expand and contract: add new columns or tables in a backward-compatible way, deploy code that writes both and reads the new one, backfill, then remove the old column in a later release. Details are in [deploy-and-release](../deploy-and-release/SKILL.md).

## 5. Finish

- Code that your change made unused: search again for every use, then propose removing it and wait for the user's approval ([01-core-principles](../../rules/01-core-principles.md) section 8). Until then, leave it and list it in the report.
- Update documentation, configuration examples, and the changelog.
- Commit as the repository owner only, with no AI co-author trailer or "Generated with" line ([08-git-workflow](../../rules/08-git-workflow.md) section 2).
- Report what changed, what stayed deliberately unchanged, how it was verified, and any follow-up risk (see the report format in [AGENTS.md](../../../AGENTS.md)).

## Warning signs: stop and ask the user

- The change requires modifying a public API, a database schema, a file format or a network protocol that other systems use.
- Tests that encode current behaviour must change for reasons you do not understand.
- You find security problems or data corruption in nearby code.
- The task turns out much larger than requested.
- The change would delete, overwrite or replace existing code, files, tests or features, even ones that look unused ([01-core-principles](../../rules/01-core-principles.md) section 8). Show what would go and why, offer alternatives, and wait for approval.
