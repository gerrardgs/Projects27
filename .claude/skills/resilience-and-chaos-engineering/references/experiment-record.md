# Chaos Experiment Record

One record per experiment, written before the fault is injected and completed after the evaluation. It follows the six-step cycle in [SKILL.md](../SKILL.md) section 5 and the [Principles of Chaos Engineering](https://principlesofchaos.org/). Keep records next to the project's other operational documents (for example `docs/adr/` or `docs/RUNBOOK.md`).

```text
Experiment:     <short name>                      Date: <YYYY-MM-DD>   Owner: <name>
Approved by:    <who approved the plan, and when>

1. Steady state
   Journey:     <the user task, e.g. "visitor opens the letter page and reads it">
   Normal:      <measurable: completes in < N s, error rate < N %, no console errors, axe 0 violations>
   Baseline:    <the measured values on the control, with the command or tool that measured them>

2. Failure hypothesis
   Failure:     <the real-world event, chosen by likelihood and impact>
   Prediction:  <"When <failure>, <journey> still <steady state>">
   Disproved if:<the observation that would prove the prediction wrong>

3. Chaos
   Environment: <test browser / CI / staging / production (needs section 6)>
   Method:      <tool and exact fault, e.g. Playwright route aborts every *.js request>
   Blast radius:<who and what can be affected>
   Abort when:  <condition that stops the experiment at once, and how to stop it>

4. Observation
   Result:      <what happened, with numbers and evidence: output, screenshots, logs>
   Alerts:      <which alerts fired, or "none">

5. Evaluation
   Verdict:     HELD | DISPROVED
   Cause:       <root cause for a disproved hypothesis>
   Impact:      <user impact and blast radius>

6. Improvement plan
   | Fix | Owner | Priority | Due | Re-test result |
   | :-- | :---- | :------- | :-- | :------------- |
   | <resilience pattern, state, alert or SLO change> | <name> | <P1-P3> | <date> | <HELD after fix / pending> |
   Kept as test: <path of the automated experiment, e.g. assets/browser-chaos run in CI>
```

A disproved hypothesis is a finding, not a failed experiment. The record is complete only when every fix has been re-tested with the same experiment.
