---
name: systematic-debugging
description: Find and fix the root cause of bugs, crashes, wrong output, flaky tests, performance regressions and production incidents through reproduction, isolation, evidence and regression tests instead of guessing. Use when something fails, behaves unexpectedly, is slow, or when a user reports an error message or stack trace.
license: MIT
metadata:
  version: "1.0.0"
---

# Systematic Debugging

Debugging is the scientific method applied to code: observe, hypothesise, test, conclude. Never change code hoping it helps. Debuggers, profilers and bisection commands per language are in [references/tools.md](references/tools.md). Browser and front-end debugging (DevTools, network, rendering, layout) is in [references/browser-debugging.md](references/browser-debugging.md).

## 1. Capture the facts

- The exact error message, stack trace, logs, inputs, and expected versus actual behaviour.
- The environment: versions of runtime, OS, dependencies, and configuration; what changed recently (deploys, dependency updates, data, traffic).
- Read the stack trace from the first frame **in this project's code**. The bug is usually there, not in the library that raised.

## 2. Reproduce

- Turn the report into a reproduction you can run on demand, ideally an automated failing test ([test-engineering](../test-engineering/SKILL.md)). This feedback loop is the most important step: with a signal that turns **red** on this bug, the cause will be found; without one, reading code rarely finds it. Do not start forming theories before the loop exists.
- Build the loop with whatever reaches the bug: a failing test at any level, an HTTP script against a local server, a CLI run diffed against a known-good output, a headless-browser script, a replayed captured request, a minimal harness, a property or fuzz loop, an automated `git bisect run`, or a differential run of old against new. Then tighten it until it is **red-capable** (asserts the user's exact symptom, not merely "no crash"), **deterministic**, **fast** (seconds) and runnable without a human. For intermittent bugs, raise the reproduction rate (repeat, parallelise, add stress) until it is high enough to debug. If no loop is possible, say what you tried and ask for access, a redacted capture or permission to instrument. (Adapted from Matt Pocock's [diagnosing-bugs skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/diagnosing-bugs), MIT.)
- Redact secrets in every command, output and capture you show; read credentials from environment variables.
- Shrink it: remove inputs, steps and code until removing anything else makes the failure disappear. Do this in a scratch copy or a throwaway branch, never by deleting code in the user's working tree.
- If it does not reproduce, compare environments (versions, configuration, data, timing, concurrency) and add targeted logging. Do not "fix" what you cannot observe.

## 3. Isolate

Use one technique at a time:

- **Binary search in code**: check the state at the midpoint of the data flow, then halve the search space.
- **Binary search in history**: `git bisect` between a known-good and a known-bad commit, automated with a test script.
- **Binary search in input**: halve the failing input until it is minimal.
- **Differential**: compare a working case with a failing one and list every difference (input, configuration, version, environment).
- **Inspect**: a debugger with breakpoints, or temporary structured logs at the boundaries of the suspected component. Change one variable per probe, and tag every temporary log line with a unique prefix (for example `[DEBUG-a4f2]`) so one search removes them all afterwards.

## 4. Hypothesise and prove

- Write down what you are assuming (which code actually runs, versions, configuration, inputs, environment) and check the cheapest assumptions first; many bugs live in an assumption nobody verified.
- List three to five ranked, falsifiable hypotheses before testing any ("if X is the cause, changing Y makes the bug disappear"); a single early hypothesis anchors you. Share the list with the user, who may rule some out at once. Converge on the one hypothesis that explains **all** the symptoms: "The cache returns stale data because the key omits the tenant ID."
- Design a check that would disprove it, and run it. Keep notes of what you tried and what you saw.
- Stop when the evidence shows the cause. "It works now" without knowing why is not a root cause.
- When a check disproves the hypothesis, drop it completely and form a new one from the evidence; do not bend the evidence to fit. After two failed fixes, step back and re-read everything you have ([01-core-principles](../../rules/01-core-principles.md) section 9).

## 5. Fix the root cause

- Fix the cause, not the symptom. A `try/catch` that hides the error, a `sleep` that hides a race, or a null check that hides bad data are not fixes.
- Look for the same defect elsewhere: other callers, similar code, the same pattern.
- Keep the fix minimal: every changed line traces to the root cause. Refactor separately, and report other problems you notice instead of fixing them in the same change.

## 6. Prevent the regression

- Keep the reproduction as a permanent test, and confirm it failed before the fix and passes after it. Put it at a seam where it exercises the real bug pattern; if no such seam exists, say so, because the design is preventing the bug from being locked down.
- Re-run the original, un-minimised reproduction after the fix, and state the confirmed cause in the commit or pull request so the next person learns from it.
- Remove temporary debug logging and breakpoints before committing.
- If the bug reached production, add the monitoring or alert that would have caught it earlier.

## 7. When a fix fails or you were wrong: correct the thinking, not only the code

A failed fix, a test that still fails, or the user saying "that's wrong" is evidence about your reasoning. Treat it the way you treat a failing test.

1. **Stop.** Do not try another variation of the same idea, and do not stack a second fix on the first. Undo the unproven change (it is yours, from this task) so the code is back to the last known state.
2. **Say what you believed.** Write down the assumptions behind the failed attempt: what you thought the cause was, what you thought the code, data, versions or user meant.
3. **Find the one that broke.** Check each assumption against evidence (read the code, run the reproduction, print the value, re-read the request). Name the wrong one plainly: "I assumed the API returns UTC; it returns local time."
4. **Re-plan from the corrected model.** Form a new hypothesis that explains every symptom, including why the first attempt failed, then continue from section 4.
5. **When the user corrects you, restate their correction in your own words and confirm it before changing code.** Do not defend the earlier answer, and do not over-correct into an unrequested rewrite.
6. **Report the correction** in the task report: what you assumed, what was true, and what you changed because of it. If the same kind of mistake repeats, propose a rule, a test or a check that would catch it.

## Special cases

### Flaky tests and race conditions
Run the test many times; vary parallelism and ordering; use race detectors (`go test -race`, ThreadSanitizer). Look for shared mutable state, unawaited async work, time and order dependence.

### Performance problems
Measure before changing anything: reproduce with a benchmark or load test, profile (CPU, memory, I/O, locks), fix the largest measured cost first, and re-measure with the same method. Report before and after numbers.

### Memory leaks
Compare heap snapshots taken over time under steady load; look for collections that only grow, listeners never removed, caches without limits, and closures holding large objects.

### Production incidents
1. **Mitigate first**: roll back, disable the feature flag, scale up, or fail over. Restore service before full diagnosis.
2. Preserve evidence: logs, metrics, traces, and the versions deployed.
3. Diagnose with the steps above on a copy or in staging. Never experiment on production data.
4. Write a blameless post-incident review: timeline, root cause, contributing factors, and follow-up actions with owners.

## Report

```text
Symptom:     <what failed, with the error message>
Root cause:  <the defect and the evidence that proves it>
Fix:         <what changed and why it addresses the cause>
Regression:  <test added; failed before, passes after>
Verified:    <commands run and results>
```
