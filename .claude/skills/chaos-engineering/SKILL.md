---
name: chaos-engineering
description: Plan and run chaos engineering and resilience experiments safely - steady-state hypotheses, fault injection (latency, errors, dependency loss, node, zone and region failure, resource exhaustion), blast-radius control, stop conditions, rollback, game days, failure mode analysis, and turning experiments into automated regression tests. Use when verifying that timeouts, retries, fallbacks, failover, autoscaling, alerts or disaster recovery actually work, preparing a game day, choosing a chaos tool (Chaos Mesh, LitmusChaos, AWS FIS, Azure Chaos Studio, Chaos Toolkit, Toxiproxy, Gremlin), or after an incident revealed an untested failure mode.
license: MIT
metadata:
  version: "1.0.0"
---

# Chaos Engineering

"Chaos Engineering is the discipline of experimenting on a system in order to build confidence in the system's capability to withstand turbulent conditions in production" ([Principles of Chaos Engineering](https://principlesofchaos.org/)). It is a controlled experiment with a hypothesis, not breaking things at random. Sources checked on 2026-10-16: the Principles, AWS Well-Architected [REL12-BP04](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_failure_injection_resiliency.html) and [REL12-BP05](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_game_days_resiliency.html), Azure Well-Architected [RE:08](https://learn.microsoft.com/en-us/azure/well-architected/reliability/reliability-test), and the [Chaos Toolkit experiment specification](https://chaostoolkit.org/reference/api/experiment/).

## 1. Safety first (non-negotiable for agents)

Fault injection deliberately degrades a system. Treat it like a deployment ([AGENTS.md](../../../AGENTS.md) section 2, item 5):

- **Never inject faults into production or any shared environment without explicit approval** from the owner, naming the target, the fault, the time window and the stop conditions. Start locally or in a non-production environment; AWS recommends that "faults should be simulated first on a non-production environment before being run in production".
- **Only systems the user owns or is authorized to test.** Never target third-party services, other tenants or shared provider infrastructure; simulate their failure on your side (a proxy, a mock, blocked egress) instead.
- **Fix known weaknesses first.** "If you know that the workload will fail, do not run the experiment" (AWS REL12-BP04). Azure adds: with a backlog of known reliability issues, fix those before adding more tests.
- **Every experiment has** a limited blast radius, stop conditions that end it automatically, a tested rollback, and people who know it is running (operations, support, on-call) with a way to call it off.
- **No irreversible faults** (deleting data, corrupting backups, revoking credentials) unless restore has been proven in the same environment.
- **Prerequisites**: observability that shows the steady state (metrics, logs, traces, a synthetic check that acts as a user proxy) and alerting. Without them you cannot see the effect or stop in time.

## 2. Design the experiment

The four steps of the Principles: define steady state as a measurable output, hypothesize that it continues in control and experimental groups, introduce variables that reflect real-world events, and try to disprove the hypothesis.

```text
Title:            <short name>
Steady state:     <measurable output users care about, e.g. "99% of checkout requests succeed with p99 < 500 ms">
Hypothesis:       If <specific fault> occurs, <workload> will <mitigation: retry, fail over, fall back, shed load>
                  to maintain <steady-state metric>.            (template from AWS REL12-BP04)
Fault:            <type, target, intensity, duration>
Blast radius:     <environment, % of hosts/pods/requests/users, one cell or zone>
Stop conditions:  <guardrail metric and threshold that end the run automatically>
Rollback:         <how the fault is removed and the system restored; who does it if automation fails>
Observers:        <dashboards, alerts expected to fire, people informed>
Result record:    <where the journal, graphs and findings are stored>
```

- Measure the **system's output** (throughput, error rate, latency percentiles), not internal attributes; the Principles call this verifying "that the system does work, rather than trying to validate how it works".
- Prefer a **control group**: compare the experimental instances against unaffected ones under the same load.
- Expect the alerts to fire: an experiment that degrades users without any alert has found an observability gap.

## 3. Choose which faults to test

- Start from a **failure mode analysis** ([Azure guidance](https://learn.microsoft.com/en-us/azure/well-architected/reliability/failure-mode-analysis), or FMEA): list each critical flow, its dependencies, how each can fail, and the mitigation meant to handle it. Add past incidents and post-incident reviews.
- Prioritize by **likelihood and impact**; test critical flows and dependencies without redundancy first.
- Test **partial** failures, not only total outages: added latency, intermittent errors, slow responses and partial data cause more surprises than clean crashes (Azure RE:08).

| Layer | Faults to simulate | Mitigation it verifies |
| :--- | :--- | :--- |
| Application | Exceptions, memory or CPU exhaustion, thread-pool or connection-pool exhaustion, slow startup, crash loops | Health checks, restarts, bulkheads, autoscaling, graceful shutdown |
| Dependencies | Latency, timeouts, error responses (500, 503, 429), connection resets, malformed responses, expired certificates | Timeouts, retries with backoff and jitter, circuit breakers, fallbacks, caching ([backend-engineering](../backend-engineering/SKILL.md), rule [05](../../rules/05-error-handling.md)) |
| Network | Packet loss, latency, partitions, DNS failure, blocked egress to a provider | Failover, retry budgets, degraded mode |
| Infrastructure | Instance, pod or node termination, disk full, clock skew | Redundancy, pod disruption budgets, self-healing |
| Zone or region | Loss of an availability zone or region, failover of the primary database | Multi-zone design, static stability, disaster recovery within RTO and RPO ([cloud-infrastructure](../cloud-infrastructure/SKILL.md)) |
| Data | Replica lag, duplicate or out-of-order events, late data, a full queue | Idempotency, deduplication, back-pressure ([data-engineering](../data-engineering/SKILL.md)) |
| Load | Traffic spike combined with a fault | Load shedding, rate limiting, autoscaling lag ([quality-assurance](../quality-assurance/SKILL.md) load testing) |
| AI and LLM providers | Provider outage, 429 rate limits, slow tokens, invalid structured output, tool failure inside an agent loop | Fallback model or message, output validation, step limits ([llm-applications](../llm-applications/SKILL.md), [ai-agent-systems](../ai-agent-systems/SKILL.md)) |
| Clients (web and mobile) | Offline, slow network, a script or stylesheet that fails to load, blocked storage | Progressive enhancement, offline handling ([web-frontend-engineering](../web-frontend-engineering/SKILL.md), [mobile-engineering](../mobile-engineering/SKILL.md)) |
| People and process | On-call engineer unavailable, runbook out of date, missing access during failover | Runbooks, access reviews, game days |

## 4. Run it, from smallest to largest blast radius

1. **In tests**: inject dependency failures in integration tests (a stub that times out or returns 503) so every resilience mechanism has a deterministic test ([test-engineering](../test-engineering/SKILL.md)).
2. **Locally**: put a fault-injecting proxy between the service and one dependency. The [chaos experiment kit](assets/chaos-experiment-kit/) in this skill does this with the Python standard library only.
3. **Non-production environment** that resembles production: use a chaos tool (section 6) with stop conditions; combine with load tests, because a fault under load behaves differently.
4. **Game day**: a scheduled exercise in which the team runs the scenario and the response as if it were real, including communication and runbooks ([AWS REL12-BP05](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_game_days_resiliency.html)). A tabletop walk-through first is cheap and finds untested assumptions.
5. **Production, only with approval**: a small percentage of traffic or a canary with a control group, off-peak first, guardrails active, everyone informed. When real traffic is too risky, use synthetic traffic on production infrastructure (AWS REL12-BP04).

During the run: check the steady state before injecting (bail out if the system is not healthy, as Chaos Toolkit requires), watch the guardrails, stop at the first unexpected effect, and always roll back. Afterwards confirm the system returned to its known-good state.

## 5. Learn and automate

- Record every run: time, version, environment, fault, observations, outcome, and graphs or exported metrics.
- If the hypothesis was disproved, treat it like an incident finding: fix the design (timeouts, fallbacks, redundancy, alerts, runbooks), then run the experiment again.
- When the hypothesis holds, **automate the experiment as a regression test**, in the delivery pipeline and on a schedule outside deployments, so later changes cannot silently remove the resilience (AWS REL12-BP04 lists not running chaos experiments in CI/CD as an anti-pattern).
- Update the failure mode analysis with what you learned and retire experiments that no longer give insight.

## 6. Tools

Versions checked on 2026-10-16 with `node scripts/tech-lookup.mjs`; re-check before use.

| Tool | Scope | Notes |
| :--- | :--- | :--- |
| [Chaos Mesh](https://chaos-mesh.org/) v2.8.5 | Kubernetes | CNCF incubating; pod, network, DNS, HTTP, I/O, time, stress, kernel, JVM and cloud faults as Kubernetes custom resources |
| [LitmusChaos](https://litmuschaos.io/) 3.33.0 | Kubernetes | CNCF incubating; `ChaosEngine` probes validate the steady state, workflows chain experiments |
| [Chaos Toolkit](https://chaostoolkit.org/) 1.21.4 (`pip install chaostoolkit`) | Any platform through extensions | Open experiment format: steady-state hypothesis, method, rollbacks |
| [Toxiproxy](https://github.com/Shopify/toxiproxy) v2.13.0 | TCP connections | "a framework for simulating network conditions"; good for tests and local runs |
| [AWS Fault Injection Service](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html) | AWS | Managed; [stop conditions](https://docs.aws.amazon.com/fis/latest/userguide/stop-conditions.html) on CloudWatch alarms |
| [Azure Chaos Studio](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview) | Azure | Managed; service-direct and agent-based faults ([fault library](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-fault-library)) |
| [Gremlin](https://www.gremlin.com/) | Multi-cloud | Commercial platform |
| [Chaos Monkey](https://github.com/Netflix/chaosmonkey) v2.1.3 | Spinnaker deployments | The original Netflix tool: "randomly terminates virtual machine instances and containers"; last release 2025-01 |
| Playwright network routing, browser offline mode | Web front ends | Fault injection in the test browser only ([web-frontend-engineering](../web-frontend-engineering/SKILL.md)) |

Pick the tool that matches the platform you already run; managed services keep state, logs and stop conditions for you. AWS discourages custom scripts "unless the scripts have the capabilities to understand the current state of the workload, are able to emit logs, and provide mechanisms for rollbacks and stop conditions", which is exactly what the kit below implements for local use.

## 7. The chaos experiment kit

[`assets/chaos-experiment-kit/`](assets/chaos-experiment-kit/) runs real experiments on your machine with no dependencies (Python 3.11+):

- `chaos.py`: runner with steady-state probes and tolerances, bail-out when the system is not in steady state, stop conditions, guaranteed rollback (also on errors and Ctrl+C), recovery check, and a JSON journal.
- `fault_proxy.py`: a local TCP proxy that adds latency or drops connections to one dependency (listens on `127.0.0.1` only).
- `example_experiment.py`: a client with a timeout and fallback, tested against a slow and an unreachable dependency; exit code 0 when every hypothesis held.
- `test_chaos_kit.py`: 19 tests, including one showing that the same experiments catch a client without a fallback.

The example relies on a fallback on purpose. AWS avoids fallbacks "because it's difficult to prove and its effectiveness is hard to test" ([Avoiding fallback in distributed systems](https://builder.aws.com/content/3EuS9Sakq7L3VLQIF3qzfMfke1Y/avoiding-fallback-in-distributed-systems)); if you keep one, an experiment that runs on every build, like this one, is what keeps it proven ([software-architecture](../software-architecture/SKILL.md) section 5).

```bash
cd assets/chaos-experiment-kit
python example_experiment.py        # prints journals; "2 of 2 hypotheses held"
python -m unittest -v
```

## Done when

- [ ] Each experiment has a written steady state, hypothesis, blast radius, stop conditions and rollback
- [ ] Approval obtained for any shared or production environment; stakeholders informed
- [ ] The system was in steady state before injection and verified back in steady state afterwards
- [ ] Results recorded; disproved hypotheses turned into fixes and re-run
- [ ] Experiments that held are automated as regression tests in CI/CD or on a schedule
