---
trigger: always_on
description: "Clean execution: how an agent carries out any engineering, design or front-end task - predictable, minimal, verified step by step, reversible, and leaving no mess behind in the repository, the browser, the design file or the machine."
---

# R-15: Clean Execution

Clean code ([02-clean-code](02-clean-code.md)) is about what the result looks like. Clean execution is about how the work is done: **predictable, minimal, verified, reversible, and leaving no mess.** Both are required. This rule merges R-09 of Projects 23 (engineering) and R-15 of Projects 24 (design and front-end).

## 1. Before acting

- Understand the request and read the code, configuration, design source and commands involved ([AGENTS.md](../../AGENTS.md) section 3).
- Run the baseline first (build, tests, lint) so you know which failures were already there.
- Plan the smallest change that solves it, and write it as an **implementation plan** for every change, small ones included. For multi-step work, write the steps and the check that proves each one, in the form `1. <step> -> verify: <check>`:

```text
Implementation plan
Goal:        <the outcome, and the measurable check that proves it>
Context:     <what was read: files, versions, design sources, constraints>
Assumptions: <assumptions and open questions for the user>
Steps:       1. <step> -> verify: <check>
Blind spots: <what could be missed: failure states, security, accessibility, devices, data>
Risks:       <what could break, and the blast radius>
Rollback:    <how to undo each step>
```

- **Wait for the user's explicit approval** of the plan before the first change. Investigating (reading, searching, read-only commands) needs no approval; anything that writes, installs, deletes, commits, pushes, deploys, publishes or contacts an external service does. Never act on your own initiative: no step that is not in the approved plan, no "while I am here" extras. If a step fails or the plan must change, stop and present the revised plan. In Claude Code, `.claude/settings.json` starts sessions in plan mode, which blocks edits until a plan is approved.
- **Goal-driven execution**: turn the task into a goal you can check, then loop until the check passes. "Fix the bug" becomes "write a test that reproduces it, then make it pass"; "add validation" becomes "write tests for invalid input, then make them pass"; "refactor X" becomes "tests pass before and after". A weak goal ("make it work") needs clarifying before you start.
- Prefer a preview: dry-run flags (`--dry-run`, `--check`, `plan`, `diff`, `-WhatIf`), a scratch copy, a branch or duplicate of a design file, or a test, before the real action.

## 2. While acting

- One logical change at a time; verify it (build, lint, type-check, test, or run and look at the rendered page) before the next one.
- Use the project's own commands and versions (`npm ci`, `npx --no-install <tool>`, the scripts in `package.json`), not global installs or remembered ones. Use the terminal; read summaries ([CLI first](../../docs/spec/AGENT-OPERATIONAL-MANUAL.md#5-cli-first-small-output)).
- Commands are idempotent where possible: running them twice must not duplicate data or break state.
- Touch only what the task needs. No drive-by reformatting, renames, restyling or "improvements" ([01-core-principles](01-core-principles.md) section 1).
- Regenerate derived files with their generator after changing sources (lockfiles, the `.claude/skills/` mirror, token CSS, `_headers` and `vercel.json`, generated code); never edit generated output by hand.
- No irreversible or outward-facing action (deleting, force-pushing, migrating shared data, deploying, publishing a site, writing to a shared Figma or Penpot file, posting, sending messages) without explicit approval.

### Existing code is preserved: confirm and discuss first

Code that already exists was written for a reason you may not see. Never delete it on your own judgement.

**Needs the user's confirmation first:** everything listed as deleting in [01-core-principles](01-core-principles.md) section 8, plus commenting out, disabling or bypassing existing checks or tests, and any change beyond what the user asked for.

**Needs no confirmation:** reading and analysing; adding new code; editing the lines the request is about, in the way it asks; removing imports and local variables that your own edit left unused in those lines; removing temporary files, logs and debug output that you created yourself in this task.

**How to ask.** Stop before the change and present a proposal, then wait:

```text
Proposal:       <delete | replace | rewrite | move | disable> <files, symbols or lines>
Why:            <what the task needs, or the problem you found>
Depends on it:  <callers, tests, configuration, docs, other systems; found by searching, not guessed>
Options:        <keep as is | deprecate | hide behind a flag | replace step by step>, with trade-offs
Risk and undo:  <what could break; how to restore it (commit, revert, backup)>
Decision:       <the question the user needs to answer>
```

Silence or an unclear answer is not consent. In non-interactive runs, never delete existing code; put the proposal in the report or pull request description. When removal is agreed, prefer a reversible path: a separate commit, deprecation first for public interfaces, a feature flag or the strangler fig pattern for replacements ([change-existing-code](../skills/change-existing-code/SKILL.md)).

## 3. When something fails

- Stop at the first unexpected result. Read the actual error; do not retry the same thing blindly or stack guesses.
- Find the root cause ([systematic-debugging](../skills/systematic-debugging/SKILL.md)); never hide a failure by deleting a check, skipping a test, loosening a lint or accessibility rule, or catching and ignoring the error.
- If a step left partial changes, roll them back or state exactly what remains.

## 4. Leave no mess

- Temporary files (screenshots, reports, exports, probe pages, scratch scripts) go in a temporary or scratch directory and are removed when no longer needed; nothing temporary lands in the repository or in a shared design file.
- Stop dev servers, watchers, headless browsers and background processes you started.
- Remove the debug output, `console.log` calls, temporary styles and outlines, commented-out code and stray artefacts that *you* added during the task before finishing. Anything that existed before the task stays unless the user approved its removal ([01-core-principles](01-core-principles.md) section 8).
- Do not change global configuration, shell profiles, system packages, browser profiles or credentials unless that is the task.
- Finish with a clean, explainable working tree: every changed file is intended and listed in the report, and `git status` shows nothing else.

## 5. Tools and scripts you write

- Exit code `0` on success and non-zero on failure; errors to standard error with a clear message.
- Safe defaults: preview or confirmation for destructive operations, no secrets in output, timeouts on network calls.
- Validate input at the boundary (arguments, environment variables, files, API responses) before acting on it ([05-error-handling](05-error-handling.md)).
- Behave well in pipelines and automation: no interactive prompts in non-interactive mode, handle a closed output pipe and interruption without crashing or leaving partial state.

## 6. Review your own work before reporting

Self-review catches what a single pass misses. The OpenSSF guide for AI code assistants reports that even two rounds of this "recursive criticism and improvement" substantially improve the security of generated code ([source](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)).

1. Re-read the full diff against the request, the acceptance criteria and the rules: correctness, edge cases, security ([06](06-security.md)), clean code ([02](02-clean-code.md)), accessibility ([10](10-accessibility.md)), leftovers (section 4).
2. Write down the concrete problems you find, fix them, and re-run the checks.
3. Repeat once more for risky changes (security, data, money, concurrency, migrations). Stop when a round finds nothing new.

Self-review complements real tools and human review; it never replaces running the linter, tests and scanners.

## 7. Report

State what was changed, which commands ran and what they returned, what was not done, and any state left behind (running services, open preview deployments, pending migrations, follow-ups), using the format in [AGENTS.md](../../AGENTS.md) section 7.

When the work continues in another session or with another agent, also write a **handoff note**: the goal, what is done and verified, what remains, decisions made and why, open questions, and pointers to the specs, commits, ADRs and issues that hold the detail (link them, do not copy them), plus the rules and skills the next agent should load. No secrets or personal data. Keep it outside the repository unless the user wants it committed.
