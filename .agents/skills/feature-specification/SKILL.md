---
name: feature-specification
description: Turn a feature request, user story or vague idea into a clear specification, technical plan and ordered task list before writing code (spec-driven development) - goals and non-goals, users and scenarios, acceptance criteria in Given/When/Then form, edge cases, non-functional requirements (security, performance, accessibility, privacy), open questions, design options and risks. Use when a request is larger than a small fix, is ambiguous, touches several components, or when the user asks for a spec, PRD, plan, breakdown or estimate.
license: MIT
metadata:
  version: "1.0.0"
---

# Feature Specification and Planning

Agents and humans both build the wrong thing fastest when "what" and "why" are skipped. Spec-driven development fixes the intent first, then the approach, then the tasks; GitHub's open-source [Spec Kit](https://github.com/github/spec-kit) uses the same order (principles once per project; then specify, plan, tasks, implement for each feature). This skill is tool-independent.

Keep the size proportional: a one-day change needs a few lines, not a document. Store the result where the project keeps such files (for example `docs/specs/<feature>.md`) or in the issue.

## 1. Specify: what and why (no technology yet)

```text
Problem:        <who has which problem today; evidence>
Goal:           <the outcome that will be true when this is done>
Non-goals:      <what this deliberately does not do>
Users:          <roles and their main scenarios>
Acceptance criteria (each one testable):
  Given <context>, when <action>, then <observable result>
  ...
Edge cases:     <empty, maximum, invalid, concurrent, offline, partial failure, permissions>
Non-functional: <security and privacy, performance targets, accessibility (WCAG 2.2 AA), reliability, compliance>
Open questions: <decisions only the user or owner can make>
```

- Write acceptance criteria as observable behaviour, not implementation. Each becomes at least one test ([test-engineering](../test-engineering/SKILL.md)).
- Ask the open questions now, before planning ([AGENTS.md](../../../AGENTS.md) section 6, "Ambiguous request").

### Resolve the design tree with the user (grilling)

For a significant or unclear feature, interview the user until nothing is silently assumed (adapted from Matt Pocock's [grilling skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling), MIT):

1. Map the decisions as a tree: each decision opens the decisions that depend on it.
2. Ask in rounds. A round contains every question whose prerequisites are already settled, numbered, each with your recommended answer, worded so that "yes" accepts the recommendation. A question that depends on an answer still open waits for a later round.
3. Facts are your job, decisions are the user's: look up anything the code, documentation or tools can answer instead of asking.
4. Stop when no open question remains, confirm the shared understanding, and only then plan.

## 2. Plan: how

- Read the existing code and conventions first ([change-existing-code](../change-existing-code/SKILL.md)); reuse before adding.
- Describe the approach: components touched, data model and contract changes (API, events, schema), migrations, configuration, feature flags, and observability.
- For a significant choice, compare two or three options with their trade-offs and record the decision ([ADR template](../project-bootstrap/assets/adr-template.md)).
- When a question is cheaper to answer by building than by debating (does this state model hold, which layout works), build a **throwaway prototype**: clearly named as one, trivial to run, no persistence or polish, showing its state. Keep the validated decision, not the prototype; leave the prototype out of the main branch.
- List risks with mitigations: security (threat model, [security-hardening](../security-hardening/SKILL.md)), data migration, performance, backward compatibility, rollout and rollback.

## 3. Tasks: ordered, small and verifiable

- Break the plan into tasks that each leave the system working and can be reviewed on their own: typically under a day each.
- Prefer **tracer-bullet** tasks: each a thin vertical slice through every layer it needs (schema, logic, interface, tests) that can be demonstrated on its own, rather than one layer at a time. Give each task its blocking tasks; any task whose blockers are done can start.
- Do preparatory refactoring first (Kent Beck: "make the change easy, then make the easy change"). A wide mechanical change (renaming a shared field or type) is the exception to vertical slicing: expand (add the new form beside the old), migrate callers in batches that each keep CI green, then contract (remove the old form after agreement).
- Order by dependency and risk: contracts and tests first, risky unknowns early (a spike to learn), polish last.
- For each task, state its "done" check (a test, a command, an observable result).

```text
1. <task> — done when <check>
2. <task> — done when <check>
```

## 4. Implement and converge

- Implement task by task with [15-clean-execution](../../rules/15-clean-execution.md): verify after each, self-review, keep the task list updated.
- When reality differs from the plan, update the spec or plan first, then the code, so they never drift apart.
- Finish by checking every acceptance criterion against a passing test or demonstration, and report any criterion not met.

## Done when

- [ ] Goals, non-goals, acceptance criteria, edge cases and non-functional requirements are written and agreed
- [ ] Open questions answered by the owner, or explicitly deferred
- [ ] Plan names affected components, contract and data changes, risks and the rollback
- [ ] Tasks are small, ordered and each has a verification
- [ ] Every acceptance criterion maps to a passing test
