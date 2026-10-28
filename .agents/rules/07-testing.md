---
trigger: model_decision
description: "Apply when writing, changing, reviewing or running tests, or when deciding how to verify a change."
---

# R-07: Testing Standards

Tests prove behaviour and protect it from regression. For procedures and tool commands per language, use the [test-engineering](../skills/test-engineering/SKILL.md) skill. For user interfaces (component, end-to-end, visual regression and accessibility tests), also use [frontend-testing-and-visual-qa](../skills/frontend-testing-and-visual-qa/SKILL.md).

## 1. What every change needs

- A behaviour change or bug fix comes with a test that **fails before the change and passes after it**. For bug fixes, write the failing test first.
- Run the relevant tests, and the full suite before declaring the task done. Report the command and the result.
- Never delete, skip, or weaken a failing test to make the suite pass. Fix the code, or explain to the user why the test itself is wrong.

## 2. What to test

- Public behaviour through public interfaces, not private implementation details.
- The happy path, every error path, and boundaries: empty, zero, one, many, negative, maximum, maximum plus one, invalid types, Unicode, time zones and DST, concurrency, timeouts.
- Pure logic with fast unit tests. Integration points (database, HTTP, filesystem, queues) with integration tests against real or containerized dependencies where practical. Critical user journeys with a few end-to-end tests.

## 3. Test quality

- **Deterministic**: no dependence on wall-clock time, randomness, network, test order or shared state. Inject clocks and random seeds, and use fake timers where the framework provides them.
- **Isolated**: each test sets up and cleans up its own data. Tests can run in parallel and in any order.
- **Readable**: one behaviour per test, named for the behaviour (`rejects_expired_token`), arranged as setup, action, assertion.
- **Specific assertions**: assert exact values and error types, not merely "truthy" or "no exception".
- **Mock at boundaries only**: prefer real objects and in-memory fakes. Over-mocking tests the mocks, not the code.
- A flaky test is a bug. Fix the cause (usually a race, shared state or real time) instead of adding retries.

## 4. Coverage is a signal, not a goal

- Use coverage to find untested code, not as proof of quality. Look at branch coverage on changed code.
- For critical logic, check that tests detect injected faults: property-based testing, fuzzing, or mutation testing.
- For critical journeys and integrations, test resilience with the chaos engineering cycle: steady state, failure hypothesis, injected fault, observation against the expectation, evaluation and an improvement plan ([resilience-and-chaos-engineering](../skills/resilience-and-chaos-engineering/SKILL.md) section 5).

## 5. Test data and secrets

- Use synthetic data. Never use production personal data or real credentials in tests or fixtures.
- Keep fixtures small and next to the tests that use them.
