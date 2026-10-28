# Test tooling by language

Package names in this file were checked against npm, PyPI and crates.io on 2026-10-14, and Node.js features against the Node.js API docs. Always prefer the commands already defined in the project.

## JavaScript / TypeScript

| Task | Built-in (Node.js) | Common third-party |
| :--- | :--- | :--- |
| Runner | `node --test` (stable since Node 20) | Vitest (`npx vitest run`), Jest (`npx jest`) |
| Assertions | `node:assert/strict` | Runner's own `expect` |
| Fake timers | `mock.timers.enable()` from `node:test` (stable since Node 23.1) | `vi.useFakeTimers()`, `jest.useFakeTimers()` |
| Snapshots | `t.assert.snapshot()` (Node 22.3+), update with `--test-update-snapshots` | Vitest and Jest snapshots |
| Coverage | `node --test --experimental-test-coverage`; thresholds with `--test-coverage-lines=80` and similar (Node 22.8+) | `@vitest/coverage-v8`, `jest --coverage`, `c8` |
| HTTP mocking | Local `node:http` server on port 0 | `msw` |
| Property-based | n/a | `fast-check` |
| Integration with real services | n/a | `testcontainers` |
| End-to-end, browser | n/a | `@playwright/test` (`npx playwright test`) |
| Mutation | n/a | StrykerJS (`@stryker-mutator/core`, run with `npx stryker run`) |

## Python

| Task | Standard library | Common third-party |
| :--- | :--- | :--- |
| Runner | `python -m unittest` | `pytest` |
| Mocks | `unittest.mock` | `pytest` `monkeypatch` fixture |
| Time control | inject a clock | `time-machine`, `freezegun` |
| Coverage | `trace` (basic) | `coverage` / `pytest-cov`: `pytest --cov=<package> --cov-branch --cov-report=term-missing --cov-fail-under=80` |
| Parallel runs | n/a | `pytest-xdist` (`pytest -n auto`) |
| HTTP mocking | local `http.server` on port 0 | `respx` (HTTPX), `responses` (requests) |
| Property-based | n/a | `hypothesis` |
| Integration | n/a | `testcontainers` |
| Mutation | n/a | `mutmut` (`mutmut run`; configure `source_paths` in `setup.cfg` or `pyproject.toml`) |

## Go

| Task | Command |
| :--- | :--- |
| Run all tests | `go test ./...` |
| Race detector | `go test -race ./...` |
| Coverage | `go test -coverprofile=cover.out ./...` then `go tool cover -html=cover.out` |
| One test, repeatedly | `go test -run '^TestName$' -count=100 ./pkg` |
| Fuzzing (Go 1.18+) | write `func FuzzX(f *testing.F)`, run `go test -fuzz=FuzzX -fuzztime=60s ./pkg` |
| Benchmarks | `go test -bench=. -benchmem ./pkg` |

Table-driven tests with `t.Run(name, ...)` subtests are the idiomatic style. Use `t.TempDir()`, `t.Setenv()` and `t.Cleanup()` for isolation.

## Rust

| Task | Command or crate |
| :--- | :--- |
| Run tests | `cargo test`, or `cargo nextest run` (`cargo-nextest`) |
| Property-based | `proptest` |
| Snapshots | `insta` |
| Coverage | `cargo llvm-cov` (`cargo-llvm-cov`) |
| Fuzzing | `cargo fuzz run <target>` (`cargo-fuzz`; requires a nightly toolchain) |
| Mutation | `cargo mutants` (`cargo-mutants`) |
| Benchmarks | `criterion` |

## Java / Kotlin

JUnit Jupiter as runner (`mvn test`, `./gradlew test`), AssertJ for assertions, Mockito for boundary mocks, Testcontainers for integration, jqwik for property-based tests, JaCoCo for coverage, PIT (`pitest`) for mutation testing.

## C# / .NET

`dotnet test` with xUnit, NUnit or MSTest; coverage with `dotnet test --collect:"XPlat Code Coverage"` (coverlet collector); Testcontainers for .NET for integration; Stryker.NET for mutation testing.

## Editor support (VS Code extension IDs, checked on the Marketplace)

`vitest.explorer` (Vitest), `ms-playwright.playwright` (Playwright), `ms-python.python` (Python test explorer for pytest and unittest), `golang.go` (Go tests and coverage), `rust-lang.rust-analyzer` (Rust test lenses), `vscjava.vscode-java-pack` (Java tests), `ms-dotnettools.csdevkit` (.NET tests).
