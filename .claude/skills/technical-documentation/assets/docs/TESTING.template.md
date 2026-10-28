# Testing

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How this project is tested and how to add tests.

## Strategy

<!-- What each test level protects and the ratio between them. -->

{{strategy}}

## Test levels and locations

<!-- Where unit, integration, end-to-end and other tests live. -->

| Level | Location | Tool |
| :--- | :--- | :--- |
| {{unit}} | {{src/**/*.test.ts}} | {{node:test}} |

## Running tests

<!-- Exact commands, run and confirmed, for all tests and for one file. -->

- All: `{{npm test}}`
- One file: `{{command}}`

## Test data and environments

<!-- Fixtures, factories, local services; synthetic data only. -->

{{setup}}

## Quality gates

<!-- What CI requires before merge (coverage, mutation score, accessibility, performance budgets). -->

{{gates}}

## Writing tests

<!-- Project conventions: naming, seams, mocking only at boundaries, deterministic time and randomness. -->

{{conventions}}

## Flaky tests

<!-- How flaky tests are reported, quarantined and fixed. -->

{{process}}
