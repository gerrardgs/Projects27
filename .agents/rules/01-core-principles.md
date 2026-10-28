---
trigger: always_on
description: "Core engineering principles for every coding task: scope discipline, simplicity, completeness, and respect for the existing codebase."
---

# R-01: Core Engineering Principles

## 1. Solve the stated problem, nothing more

- Do what was asked. Do not add features, options, abstractions or "improvements" that were not requested. Mention them as suggestions instead.
- Keep diffs focused. Do not rename, reformat or reorganise code you were not asked to touch. Unrelated changes hide the real change in review.
- If the request is ambiguous and the choice matters, ask. If it does not matter much, choose the conventional option and say which one you chose.
- **Think before coding.** State your assumptions. When a request has several reasonable readings, name them instead of picking one silently. When a simpler approach exists, say so and push back. When something is unclear, stop, say exactly what is confusing, and ask.
- **Surgical changes.** Match the existing style even where you would write it differently. The test for a diff: every changed line traces directly to the user's request. Unrelated problems you notice (dead code, bugs, style) go in the report, not in the diff.

## 2. Simplicity (KISS, YAGNI)

- Write the most direct code that is correct. Concrete code first; extract an abstraction only when a second real use appears, or when it removes real duplication of *knowledge*, not merely of similar-looking lines.
- Prefer flat control flow: guard clauses and early returns instead of deep `if/else` nesting. Aim for nesting depth of 3 or less.
- Keep one level of abstraction per function. Orchestration code calls well-named helpers; it does not mix in byte-level or string-buffer details.
- Prefer the platform's standard library and the project's existing dependencies before adding new ones (see [04-dependencies](04-dependencies.md)).
- No speculative flexibility: no configuration options, parameters, extension points or error handling for situations the request, the types and the boundary validation ([05-error-handling](05-error-handling.md)) already rule out. If the solution grew far beyond the problem (200 lines where 50 would do), rewrite it smaller. Ask: would a senior engineer call this overcomplicated?
- These points follow the four principles distilled from Andrej Karpathy's observations on LLM coding pitfalls ([andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills), MIT): think before coding, simplicity first, surgical changes, goal-driven execution ([15-clean-execution](15-clean-execution.md) section 1). Where they differ, this specification is stricter: existing code that your change made unused is proposed for removal, not removed (section 8).

## 3. Completeness

- Code presented as done must compile, run and handle its error paths.
- Not allowed in finished work: placeholder comments (`// TODO: implement`), elided bodies (`...` used as "rest omitted"), stubbed returns, fake data standing in for real logic, or catch-all handlers that hide failures.
- Legitimate exceptions: `pass` / `...` where the language requires an empty body by design (abstract methods, `Protocol` members, type stubs), and spread or rest syntax. Judge by intent, not by the characters.
- When you show only part of a file, say which part is omitted and why. Never let a partial snippet look like a complete file.

## 4. Work with the codebase, not against it

- Existing conventions win over personal or "best practice" preferences, unless they cause a bug or a security issue. In that case, flag it and ask before changing it widely.
- Reuse existing helpers, types, error classes, logging, configuration and test utilities. Search before writing a new one.
- Keep architecture boundaries the project already has: layers, modules, packages, public APIs.

## 5. Separate decisions from effects

- Keep business rules, validation and calculations in pure functions that take inputs and return outputs. They are easy to test without mocks.
- Keep I/O (network, disk, database, clock, randomness, environment) at the edges and pass results in. This makes behaviour deterministic and testable.
- Apply this pragmatically. A 20-line script does not need layers.

## 6. Make it work, make it right, then make it fast

- Correctness first, then clarity, then performance.
- Optimise only with evidence: a benchmark or profile that shows the hot path. Record the before and after numbers.
- Choose sensible algorithms from the start (avoid accidental O(n²) on unbounded input). That is correctness at scale, not premature optimisation.

## 7. Leave a trail

- Explain *why* in comments, commit messages and PR descriptions; the code already shows *what*.
- Record significant design decisions (new dependency, new service, data model change) in a short decision record (ADR) when the project keeps them.

## 8. Never delete existing work without approval; confirm and discuss first

Existing code, content and design represent decisions you may not see. Removing them is the change most likely to break something silently and the hardest for a reviewer to notice in a diff.

- **What counts as deleting**: removing or emptying a file, function, component, test, comment, style rule, configuration entry, dependency, asset, design layer or feature; overwriting a file with new content; replacing a block with a shorter version that drops behaviour; moving or renaming in a way that removes the old entry point; and Git commands that discard work (`git rm`, `git clean`, `git reset --hard`, `git checkout -- <path>`, `git restore`, `git stash drop`, `git branch -D`, force-push).
- **Before any of these, stop and ask.** Show exactly what would be removed (file and lines, or the command), why, what depends on it (search for every use), and the alternatives: keep it, deprecate it, put it behind a feature flag, move it, or comment on it in the report. Then wait for the user's explicit "yes" for that removal. Approval for one removal does not cover the next one.
- **This applies even when the code looks dead, duplicated, wrong or unused**, when a linter or a skill suggests removing it, when a refactor or migration "needs" it, and in auto or agent modes. Make the case and let the user decide.
- **Not deleting**: editing lines inside the change the user asked for (fixing a bug in a line, renaming a variable you introduced), and removing temporary files, debug output or processes that *you* added during the current task ([15-clean-execution](15-clean-execution.md) section 4). If you are unsure which side of the line a change falls on, treat it as deleting and ask.
- **Anything beyond the request**: if you want to do something the user did not ask for (restructure, upgrade, replace a library, change a design), propose it and discuss it first; do not do it and report afterwards.
- **Report every removal** in the `Removed:` line of the task report ([AGENTS.md](../../AGENTS.md) section 7).
- **Enforcement in Claude Code**: this repository's `.claude/settings.json` asks for confirmation before deletion commands and runs [`scripts/hooks/guard-deletions.mjs`](../../scripts/hooks/guard-deletions.mjs), which turns edits and file rewrites that remove existing lines into a confirmation prompt. Other tools rely on this rule; use their own permission settings where they exist.

## 9. Correct your own thinking

Counter silent assumptions, hidden confusion and symptom patching on purpose:

- **Correct the thinking, not only the code.** When a test, an error message or the user contradicts what you believed, update the belief and re-check every conclusion built on it. Do not explain the evidence away or stack patches on a wrong model. After two failed attempts at the same fix, stop, re-read the evidence and re-plan ([systematic-debugging](../skills/systematic-debugging/SKILL.md)).
- **Keep facts and guesses apart.** In your reasoning and in your report, distinguish what you verified (ran, read, measured) from what you inferred.
