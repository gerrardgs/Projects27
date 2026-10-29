# Phase loop: steps and planning files

Adapted from [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core) (MIT, v1.19.0, commit `ceef689`, read on 2026-10-29): "The phase loop", "Context engineering" and "Planning artifacts". GSD Core also ships an installer, slash commands and agents for many runtimes. This reference keeps the method only, so it works with any agent and without installing anything.

## Contents

1. Files in `.planning/`
2. Discuss
3. Plan
4. Execute
5. Verify
6. Ship
7. Templates

## 1. Files in `.planning/`

Everything a later step or a later session needs is on disk, in plain Markdown, and can be committed:

```text
.planning/
  STATE.md                       where the project is now; every step reads it first and updates it last
  ROADMAP.md                     milestones and their phases, each with a one-sentence goal and requirement ids
  phases/<NN>-<slug>/
    <NN>-CONTEXT.md              decisions from Discuss
    <NN>-RESEARCH.md             findings from Plan, with sources and dates
    <NN>-<PP>-PLAN.md            one bounded unit of work each (03-02-PLAN.md is phase 3, plan 2)
    <NN>-<PP>-SUMMARY.md         what the executor did and verified
    <NN>-VERIFICATION.md         the verdict of Verify
```

The names follow GSD Core's own, so a project can adopt its tooling later without renaming files.

A project that already keeps specifications elsewhere (for example `docs/specs/`, see [feature-specification](../../feature-specification/SKILL.md)) can put these files there. Keep one location per project.

## 2. Discuss

Goal: decide how to build the phase before anyone plans it.

- Read `STATE.md`, the phase goal in `ROADMAP.md` and the code the phase touches.
- Resolve the implementation decisions with the user in rounds (the grilling procedure in [feature-specification](../../feature-specification/SKILL.md) section 1). Typical decisions: libraries, error handling, data shape, which edge cases matter, what is out of scope.
- Write `<NN>-CONTEXT.md`. Each decision gets an id (`D-01`), so that plans and verification can refer to it.

## 3. Plan

Goal: plans an executor can finish in one fresh context, ordered so that parallel work never collides.

1. **Research**: look up what the plan rests on (APIs, versions, constraints) at primary sources, with dates ([03-verification](../../../rules/03-verification.md)). Write `<NN>-RESEARCH.md`.
2. **Decompose**: write one `<NN>-<PP>-PLAN.md` per bounded unit. Each names its goal, the requirement and decision ids it serves, the files it touches, its steps, its acceptance checks and its wave.
3. **Order into waves**: plans in the same wave touch disjoint files and concerns. A plan that needs another plan's output goes in a later wave.
4. **Check the plans** before any code: run a separate review (a fresh sub-agent or a second pass) against this list:
   - every requirement id and every decision id is covered by at least one plan;
   - no two plans in a wave touch the same file;
   - every acceptance check can be run;
   - each plan fits one fresh context: if you cannot describe it in two or three sentences, split it.
5. **Get approval**: present the plans as the implementation plan ([15-clean-execution](../../../rules/15-clean-execution.md) section 1) and wait for the user.

A good phase goal fits one sentence and is neither trivial nor broad. "Add HMAC-SHA256 signature checks to the webhook endpoint" is a phase. "Build authentication" is several phases. A one-line fix needs no phase loop.

## 4. Execute

- The orchestrator (your main session) stays thin. It does not edit source files. It starts one executor per plan, collects the summaries and updates `STATE.md`.
- Each executor starts fresh and reads only what its plan needs: the project summary, `CONTEXT.md`, `RESEARCH.md` and its own plan file. Without sub-agents, run the plans one after another and start a new session for each.
- Plans in one wave may run in parallel, each in its own worktree on its own branch from the integration branch ([git-worktrees](../../git-worktrees/SKILL.md)). Merge a wave back before the next wave starts.
- Each executor commits atomically per task, runs the project's checks, and writes `<NN>-<PP>-SUMMARY.md`: what changed, which checks ran and what they printed, and any deviation from the plan.
- A deviation that changes scope stops the executor. Re-plan with the user ([15-clean-execution](../../../rules/15-clean-execution.md) section 1).

## 5. Verify

Goal: the phase is done because what was built matches what was decided, not because the executors stopped.

A verifier that did not write the code (a fresh sub-agent, a reviewer, or you after a new session) reads the phase goal, `CONTEXT.md`, the plans and the summaries, then checks:

- **Requirement coverage**: every requirement id has code and a passing test or demonstration.
- **Decision coverage**: every decision in `CONTEXT.md` is implemented as decided.
- **Goal alignment**: walk through the feature as a user would, or run the end-to-end test.
- **Checks**: the project's verify command passes on the integrated branch.
- **Review**: [rigorous-code-audit](../../rigorous-code-audit/SKILL.md) on the whole phase diff. Add [coderabbit-review](../../coderabbit-review/SKILL.md) when the project uses CodeRabbit.

Write `<NN>-VERIFICATION.md`. For every gap, write a targeted fix plan and loop back to Execute. Report anything left unverified as unverified.

## 6. Ship

- Commit, push and open a pull request only when the user asks ([08-git-workflow](../../../rules/08-git-workflow.md)). The description links the phase files.
- Mark the phase complete in `STATE.md` and pick the next phase from `ROADMAP.md`.

## 7. Templates

`STATE.md`:

```markdown
# State

- Milestone: <name and version>
- Phase: <NN-slug>, step <Discuss | Plan | Execute | Verify | Ship>
- Plans: <done ids> done; <pending ids> pending
- Blockers: <none, or what and who decides>
- Last updated: <date>, by <session or person>
```

`<NN>-CONTEXT.md`:

```markdown
# Phase <NN>: <goal>

## Decisions
- D-01: <decision>. Why: <reason>. Alternatives rejected: <options>
## Out of scope
- <item>
## Open questions
- <question>, owner: <person>
```

`<NN>-<PP>-PLAN.md`:

```markdown
# Plan <NN>-<PP>: <one-sentence goal>

- Wave: <n>
- Serves: <requirement ids>, <decision ids>
- Files: <paths>
- Steps: 1. <step> → check: <command or observation>
- Acceptance: <checks a machine or reviewer can run>
- Risks and undo: <what could go wrong; how to revert>
```

`<NN>-VERIFICATION.md`:

```markdown
# Verification: phase <NN>

| Item | Evidence | Verdict |
| :--- | :--- | :--- |
| REQ-01 | <test name or command and its output> | met / not met / unverified |
| D-01 | <file and line, or behaviour observed> | met / not met / unverified |

Gaps and fix plans: <list, or "none">
```
