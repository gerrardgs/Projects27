---
name: test-engineering
description: Design, write and run effective automated tests - unit, integration, end-to-end, property-based, fuzz and mutation tests - with deterministic setups and meaningful coverage. Use when adding tests for new or changed behaviour, writing a regression test for a bug, setting up a test framework, fixing flaky tests, or judging whether a change is adequately tested.
license: MIT
metadata:
  version: "1.0.0"
---

# Test Engineering

Follow the standards in [07-testing](../../rules/07-testing.md). This skill is the procedure. Tool commands per language are in [references/tooling.md](references/tooling.md).

## 1. Find the existing setup first

1. Look for the test command in `package.json` scripts, `pyproject.toml`/`tox.ini`/`noxfile.py`, `Makefile`, `go.mod` packages, `Cargo.toml`, CI workflow files, and the README.
2. Read two or three existing tests. Copy their structure, naming, fixtures and helpers.
3. Run the existing suite once **before** changing anything, so you know the baseline (and which failures were already there).

If the project has no tests, set up the language's standard runner (see the reference) and say so in your report.

## 2. Choose the right level

| Level | Use for | Speed | Typical tools |
| :--- | :--- | :--- | :--- |
| Unit | Pure logic, validation, calculations, state transitions | Milliseconds | `node:test`, Vitest, Jest, pytest, `testing`, `cargo test` |
| Integration | Database queries, HTTP handlers, filesystem, message queues, external API clients | Seconds | Same runners plus Testcontainers, local servers on port 0, mock HTTP servers |
| End-to-end | A few critical user journeys through the deployed stack | Seconds to minutes | Playwright, or API-level scripts |
| Property-based | Invariants over many generated inputs (parsers, serializers, math) | Seconds | fast-check, Hypothesis, `proptest`, jqwik |
| Fuzz | Parsers and decoders that handle untrusted bytes | Minutes, in CI or nightly | Go native fuzzing, `cargo fuzz`, Atheris, Jazzer |
| Mutation | Checking that tests actually detect bugs in critical code | Minutes | StrykerJS, mutmut, `cargo mutants`, PIT, Stryker.NET |

Most tests should be unit tests, with fewer integration tests and only a handful of end-to-end tests.

## 3. Write the test

1. **Name the behaviour**: `test_rejects_expired_token`, `"returns 404 for an unknown user"`.
2. **Arrange**: build the minimum input. Use factories or builders over large shared fixtures.
3. **Act**: call one public function or endpoint.
4. **Assert**: exact values, exact error type and message, and state changes. One behaviour per test; several asserts about that behaviour are fine.
5. **Cover the edges**: work through the list in [07-testing](../../rules/07-testing.md) section 2. Use table-driven or parametrized tests for many similar cases.
6. **Bug fix**: write the test that reproduces the bug, run it, and **watch it fail** for the right reason before you fix the code.

Test-driven development applies the same loop to new behaviour: write a test for the next bit of functionality, make it pass, then refactor ("Red - Green - Refactor", [Fowler](https://martinfowler.com/bliki/TestDrivenDevelopment.html)). It works best when the expected behaviour can be stated before the code exists.

Tests worth keeping (adapted from Matt Pocock's [tdd skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd), MIT):

- **Agree the seams first.** Decide, with the user for anything significant, which public interfaces the tests cross and what each catches; effort goes to critical paths, not to every internal function.
- **Vertical slices.** One test, the least code that passes it, then the next test. Writing all tests first tests imagined behaviour and locks in a structure before you understand it.
- **No tautologies.** The expected value comes from an independent source (a literal, a worked example, the specification), never from recomputing it the way the code does: `assert total([10, 5]) == 15`, not `== sum(prices)`.
- **Coupling check.** A test that breaks when you refactor without changing behaviour is testing the implementation: it mocks internal collaborators, calls private functions, or verifies through a side channel such as querying the database instead of reading back through the interface.
- **Mockable boundaries.** Give external services one function per operation (`get_user`, `create_order`) rather than one generic request function, so each fake returns one shape without conditional logic.

## 4. Make it deterministic

| Source of flakiness | Fix |
| :--- | :--- |
| Current time | Inject a clock; use fake timers (`node:test` `mock.timers`, Vitest `vi.useFakeTimers()`, Python `time-machine`/`freezegun`) |
| Randomness | Inject the generator or fix the seed; log the seed on failure |
| Network | Local test server on an ephemeral port, or a request-mocking library at the HTTP boundary |
| Shared state, test order | Fresh state per test; unique temp directories; transactions rolled back per test |
| Concurrency and async | Await everything; wait for conditions instead of `sleep`; run Go tests with `-race` |
| Environment | Set required variables inside the test; do not depend on the developer's machine |

Run a suspected flaky test many times in a row to confirm the fix: `go test -count=100 -run '^TestX$' ./pkg`, or a shell loop such as `for i in $(seq 1 50); do pytest -q tests/test_x.py::test_y || break; done` (the same pattern works with `node --test --test-name-pattern="..."`).

## 5. Run and report

- Run the narrow set first (one file or name pattern), then the whole suite.
- Check coverage of the **changed** lines and branches when the project measures coverage.
- Report the exact commands and a summary of the results, for example: `npm test → 128 passed, 0 failed`.

## 6. Review checklist

- [ ] Each changed behaviour has a test that would fail without the change
- [ ] Error paths and boundaries are covered, not only the happy path
- [ ] No real network, clock or randomness without control; no `sleep`-based waits
- [ ] No skipped, commented-out or weakened tests
- [ ] Test names describe behaviour; assertions are specific
- [ ] No real credentials or personal data in fixtures
