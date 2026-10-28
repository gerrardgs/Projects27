---
trigger: model_decision
description: "Apply when writing or reviewing error handling, input validation, logging, retries, timeouts, or resource cleanup."
---

# R-05: Error Handling, Validation and Resource Safety

## 1. Use the language's native error model

Handle errors the way the language intends. Do not force one style everywhere.

| Language | Expected failures | Bugs / impossible states |
| :--- | :--- | :--- |
| Go | return `error`; wrap with `fmt.Errorf("load config: %w", err)`; inspect with `errors.Is/As` | `panic` only for programmer errors |
| Rust | `Result<T, E>` with `?`; typed errors (for example `thiserror` in libraries) | `panic!`, `unreachable!` |
| Python | specific exception classes; `raise NewError(...) from err` | `assert` for internal invariants only (removed under `-O`) |
| TypeScript / JS | thrown `Error` subclasses, or a discriminated-union result for *expected* domain outcomes | thrown errors |
| Java / Kotlin / C# | specific exception types; Kotlin `Result` or sealed classes where idiomatic | runtime exceptions |

A small, type-safe result type for TypeScript, when the codebase does not already have one:

```typescript
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}
```

## 2. Never swallow errors

- No empty `catch {}` / `except: pass`. No `catch (e) { console.log(e) }` that continues as if nothing happened.
- Catch only what you can handle *at that point*: retry, fall back, translate to a domain error, or add context. Otherwise let it propagate.
- Catch specific types. Avoid bare `except:` and `except Exception:` except at the top-level boundary.
- When re-throwing, keep the cause: `new Error("charge failed", { cause: error })` (JS, ES2022), `raise ChargeError(...) from error` (Python), `%w` (Go), `source` (Rust).
- Each top-level boundary (HTTP handler, job runner, CLI `main`) has one handler that logs the full error once and returns a safe response or exit code.

## 3. Validate at the boundary, trust inside

- Validate every external input where it enters: HTTP bodies, query strings, headers, CLI arguments, environment variables, files, queue messages, third-party API responses.
- Parse into a typed domain object once (schema validator or explicit checks), then pass the typed value inward. Reject unknown fields when practical.
- Check types, ranges, lengths, formats and sizes. Put limits on everything that can grow: body size, array length, string length, page size, upload size.
- Fail fast on startup when configuration is missing or invalid, with a message naming the variable (but never its secret value).

## 4. Messages and logging

- Error messages for users are safe and actionable. They never contain stack traces, SQL, internal paths, secrets or other users' data.
- Error messages for operators carry context: operation, identifiers, inputs (redacted), and the cause chain.
- Log in a structured format (key-value or JSON) with a correlation or request ID. Use levels consistently: `error` needs attention, `warn` is degraded but working, `info` is a business event, `debug` is diagnostics.
- Never log passwords, tokens, API keys, session IDs, full card numbers, or personal data beyond what policy allows.

## 5. Timeouts, retries and cancellation

- Every network call has a timeout. No call should be able to wait forever.
- Retry only idempotent operations, or use idempotency keys. Use exponential backoff with jitter and a maximum number of attempts. Do not retry validation or authorisation failures.
- Propagate cancellation: `AbortSignal` (JS), `context.Context` (Go), `asyncio` task cancellation (Python), `CancellationToken` (.NET).

## 6. Resource cleanup

Release every resource on every path, including the error path:

- JS/TS: `try/finally`; `using` / `await using` declarations where the runtime supports explicit resource management.
- Python: `with` / `async with` context managers.
- Go: `defer f.Close()` right after a successful open; check the `Close` error when writing.
- Rust: RAII (`Drop`) does this automatically; do not leak with `mem::forget`.
- Java: try-with-resources. C#: `using`.

Clear timers, close sockets and stop listeners in shutdown paths and in test teardown.
