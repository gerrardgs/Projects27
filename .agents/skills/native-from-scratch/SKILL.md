---
name: native-from-scratch
description: Build a new service, CLI, library or module from an empty folder using the language's standard library first, with tests, linting and type checking set up from day one. Use when starting a project or component from scratch, when asked to write something "native" or "without dependencies", or when replacing heavy third-party packages with built-in platform features.
license: MIT
metadata:
  version: "2.0.0"
---

# Native From Scratch

Build software the way an experienced engineer does on an empty folder: the standard library first, a small dependency footprint, quality tooling and tests from the first commit.

## Procedure

### 1. Pin down the target

- Write 3 to 7 acceptance criteria as observable behaviour ("`POST /users` with a valid body returns 201 and the created user").
- List the inputs, outputs, error cases and limits (sizes, rates, timeouts).
- Choose a **currently supported** runtime version and check it rather than assuming: see "Version baseline" in [04-dependencies](../../rules/04-dependencies.md).

### 2. Map the problem to built-in modules

| Need | Node.js | Python | Go | Rust |
| :--- | :--- | :--- | :--- | :--- |
| HTTP server | `node:http` | `http.server` (dev/internal only; use an ASGI/WSGI server in production) | `net/http` | none in `std`; use `hyper`/`axum` |
| HTTP client | `fetch` | `urllib.request` | `net/http` | none in `std`; use `reqwest`/`ureq` |
| JSON | `JSON` | `json` | `encoding/json` | none in `std`; use `serde_json` |
| Files and paths | `node:fs/promises`, `node:path` | `pathlib`, `shutil` | `os`, `io/fs`, `path/filepath` | `std::fs`, `std::path` |
| Secure randomness, hashing | `node:crypto` | `secrets`, `hashlib`, `hmac` | `crypto/rand`, `crypto/sha256`, `crypto/hmac` | none in `std`; use `rand`/`sha2`/`ring` |
| Concurrency | `async/await`, `AbortController`, `worker_threads` | `asyncio`, `concurrent.futures` | goroutines, `context`, `sync` | threads, `std::sync`; `tokio` for async I/O |
| CLI arguments | `util.parseArgs` | `argparse` | `flag` | `std::env::args`; `clap` for real CLIs |
| Logging | `console` with JSON lines | `logging` | `log/slog` | none in `std`; use `tracing` or `log` |
| Tests | `node:test`, `node:assert/strict` | `unittest` (or `pytest` if adopted) | `testing` | `#[test]`, `cargo test` |

Rust's standard library is intentionally small. "Native" in Rust means the standard library plus a few de-facto standard crates. Verify each crate per [03-verification](../../rules/03-verification.md).

### 3. Lay out the project

- Keep pure logic (validation, calculations, state transitions) in modules with no I/O. Keep I/O (HTTP, disk, database, clock, environment) in a thin outer layer that calls the pure code.
- Add on day one: `.gitignore`, `.editorconfig`, the formatter, linter and type-checker configuration, a test command, and a README with *install, test, run* instructions.
- Read configuration from environment variables at startup, validate it, and fail fast with a clear message.

### 4. Implement

Follow [02-clean-code](../../rules/02-clean-code.md) and [05-error-handling](../../rules/05-error-handling.md). For a network service, include:

- Input validation with size limits on bodies, strings and arrays.
- Correct status codes (400, 404, 405 with `Allow`, 413, 415, 500) and safe error bodies.
- Timeouts on outgoing calls, and graceful shutdown on `SIGTERM`/`SIGINT`.
- A `/health` endpoint, and structured logs without secrets.

### 5. Test

- Unit-test pure functions directly: valid input, each invalid field, boundaries (empty, maximum length, maximum plus one).
- Integration-test the I/O layer on an ephemeral port (`listen(0)`) against the real server, not mocks.
- Run the tests, the type checker and the linter. Report the actual output.

## Verified templates

Copy one as a starting point. Verification on 2026-10-14 (CI re-runs it on every change):

- [assets/node-http-service/](assets/node-http-service/): `node:http` JSON API with validation, body limits, graceful shutdown and 12 `node:test` tests, plus a committed lockfile, a Dockerfile and `.dockerignore`. Runs directly with `node server.ts` (Node.js 22.18+, built-in type stripping). Tested on Node.js 22.23.3, 24.9.0 and 26.11.1: `npm ci`, `npm run typecheck` (TypeScript 7.0.2), `npm test`, and `npm audit` with 0 vulnerabilities.
- [assets/python-http-service/](assets/python-http-service/): `http.server` JSON API with the same behaviour and 11 `unittest` tests, plus a Dockerfile and `.dockerignore`. Development tools are a PEP 735 group: `python -m pip install --group dev` (pip 25.1+). Tested on Python 3.11, 3.12, 3.13 and 3.14: Ruff (format and lint, mccabe complexity ≤ 10), `mypy --strict`, tests, Bandit, and `pip-audit` with no known vulnerabilities. `http.server` is fine for internal tools and learning; for internet-facing production, put it behind a reverse proxy or move to an ASGI/WSGI server.
- Both Dockerfiles use distroless runtime images (no shell, no package manager, non-root user 65532) pinned by digest. On 2026-10-22 they passed `hadolint` 2.15.1 and all 27 Trivy 0.76.0 configuration checks; Trivy found 0 critical and 0 high vulnerabilities in the Node.js base image, and 0 critical and 26 high (none with a fix released) in the Python base image. They have **not** been built in the authoring environment (no Docker available there), so run `docker build` and scan the result before relying on them. See [deploy-and-release](../deploy-and-release/SKILL.md).

## Checklist before handing over

- [ ] Every acceptance criterion has a passing test
- [ ] Formatter, linter and type checker are clean
- [ ] No dependency was added without passing the decision procedure in [04-dependencies](../../rules/04-dependencies.md)
- [ ] README states the runtime version and the install, test and run commands
- [ ] Configuration comes from the environment and is validated at startup
