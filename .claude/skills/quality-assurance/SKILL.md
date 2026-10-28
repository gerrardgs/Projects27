---
name: quality-assurance
description: Plan and run quality assurance beyond unit tests - test strategy and test plans, risk-based test design, exploratory testing, API and contract testing, end-to-end and cross-browser testing, performance and load testing, accessibility testing, security testing (DAST), resilience testing, test data management, bug reports and release readiness. Use when acting as QA or SDET, preparing a release, writing a test plan, load-testing a service, verifying accessibility, or reporting and triaging defects.
license: MIT
metadata:
  version: "1.0.0"
---

# Quality Assurance

Automated unit and integration testing is covered in [test-engineering](../test-engineering/SKILL.md) and [07-testing](../../rules/07-testing.md). This skill covers the wider QA practice. Tool names checked on 2026-10-15.

## 1. Test strategy

- Derive testing from **risk**: what fails most often, what hurts users or the business most, what changed. Spend effort there.
- Define quality attributes and how each is verified: functionality, reliability, performance, security, accessibility, usability, compatibility (browsers, devices, OS versions), localization, and data integrity.
- Decide the level for each check (unit, integration, contract, end-to-end, manual exploratory) and automate what runs repeatedly.
- Agree on entry and exit criteria for a release: blocking defect severities, required test passes, performance and accessibility budgets.

## 2. Test design techniques

Equivalence partitioning, boundary value analysis, decision tables for rule combinations, state-transition testing for workflows, pairwise testing for many configuration options, and error guessing from past defects. Write test cases as observable steps and expected results.

## 3. Exploratory testing

Run time-boxed sessions with a charter ("explore checkout with expired cards and slow network to find payment-state errors"), take notes, and turn every defect found into an automated regression test where practical.

## 4. Specialized testing

| Area | Approach | Tools (examples) |
| :--- | :--- | :--- |
| API | Schema conformance, negative and boundary cases, authorization per role and object | Schemathesis (property-based testing from OpenAPI or GraphQL), pytest or the project's runner, REST Client files |
| Contract | Consumer-driven contracts between services | Pact (`@pact-foundation/pact` and other language libraries) |
| End-to-end and cross-browser | Critical journeys only, stable selectors by role and label, isolated test data | Playwright (`@playwright/test`, `pytest-playwright`) |
| Performance and load | Define the workload model and targets (throughput, p95/p99 latency, error rate) first; ramp up, sustain (soak), spike, and find the breaking point; test in a production-like environment | k6, Locust, Apache JMeter, Gatling |
| Accessibility | Automated scans plus keyboard and screen-reader testing against WCAG 2.2 AA | axe-core (`@axe-core/playwright`), Lighthouse, manual checks |
| Security (dynamic) | Scan running test environments, never production without approval | ZAP (by Checkmarx, free and open source) |
| Resilience | Inject failures (dependency down, latency, node loss) and verify graceful degradation and recovery; procedure and safety rules in [chaos-engineering](../chaos-engineering/SKILL.md) | Chaos Mesh, LitmusChaos, Toxiproxy, cloud fault-injection services |
| Visual | Screenshot comparison for design-critical pages | Playwright screenshot assertions, Storybook-based tools |
| Mobile | Real devices and emulators across OS versions | See [mobile-engineering](../mobile-engineering/SKILL.md) |
| AI features | Evaluation suites with adversarial cases | See [llm-applications](../llm-applications/SKILL.md) |

## 5. Test data and environments

- Synthetic or properly anonymized data only; never copy production personal data into test environments.
- Each automated test creates the data it needs and cleans up; seed data is versioned.
- Test environments mirror production configuration (versions, feature flags, integrations) closely enough for the result to mean something; document the differences.

## 6. Defect reports

```text
Title:       <component>: <observable problem> when <condition>
Environment: <build or version, OS, browser or device, environment URL, test account>
Steps:       1. ... 2. ... 3. ...
Expected:    <what should happen, with the requirement reference>
Actual:      <what happens; exact error text; screenshot, video, logs, request IDs>
Severity:    critical | major | minor | trivial   (impact on users)
Priority:    <set by triage>   Reproducibility: always | intermittent (n of m) | once
```

One defect per report; attach the smallest reproduction; link duplicates rather than reopening them.

## 7. Release readiness

- [ ] Exit criteria met: no open blocking defects; known issues documented with workarounds
- [ ] Regression suite green on the release candidate build (the same artefact that will ship)
- [ ] Performance, accessibility and security checks within agreed budgets
- [ ] Upgrade, migration and rollback paths tested
- [ ] Monitoring and alerts ready for the new functionality
