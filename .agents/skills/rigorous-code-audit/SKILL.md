---
name: rigorous-code-audit
description: Systematically review a diff, pull request or codebase for correctness bugs, security vulnerabilities, reliability problems, missing tests and maintainability issues, verifying each finding before reporting it. Use when asked to review, audit or check code, before merging or releasing, or before refactoring unfamiliar code.
license: MIT
metadata:
  version: "2.0.0"
---

# Rigorous Code Audit

A review is only useful if its findings are **real, ranked and actionable**. Run the toolchain first, then read the code with a checklist, then verify every finding before you report it.

The standard for approving, from [Google's engineering practices](https://google.github.io/eng-practices/review/reviewer/standard.html): approve a change once it "definitely improves the overall code health of the system", even if it is not perfect, and never approve one that makes code health worse. Read every line, judge each change in the context of the whole file and system, watch especially for over-engineering, and say what is good as well as what is wrong.

## 1. Set the scope

- **Diff review** (PR or local change): `git diff <base>...HEAD`, plus enough surrounding code to understand each change. Also check callers of changed functions.
- **Codebase audit**: start from entry points (HTTP routes, CLI `main`, queue consumers, scheduled jobs) and trust boundaries (where external data enters).
- Note the stack, runtime version and existing tooling from the manifests before judging anything.

## 2. Run the automated checks (use the project's own commands first)

| Ecosystem | Format | Lint / static analysis | Types | Tests |
| :--- | :--- | :--- | :--- | :--- |
| JS / TS | `npx --no-install prettier --check .` or `npx --no-install biome check .` | `npx --no-install eslint .` | `npx --no-install tsc --noEmit` | `npm test` |
| Python | `ruff format --check .` | `ruff check .` | `mypy --strict <pkg>` or `pyright` | `pytest` or `python -m unittest` |
| Go | `gofmt -l .` (no output means clean) | `go vet ./...`, `staticcheck ./...` or `golangci-lint run` | (compiler) | `go test -race ./...` |
| Rust | `cargo fmt --check` | `cargo clippy --all-targets --all-features -- -D warnings` | (compiler) | `cargo test` |
| Java / Kotlin | Spotless or ktlint, if configured | `mvn verify` / `./gradlew check` | (compiler) | same |
| C# / .NET | `dotnet format --verify-no-changes` | `dotnet build -warnaserror` | (compiler) | `dotnet test` |

Then run the dependency vulnerability audit listed in [04-dependencies](../../rules/04-dependencies.md). For secret scanning, SAST and container scanning commands, see the [security-hardening tools reference](../security-hardening/references/tools.md).

Use `npx --no-install` (or the script in `package.json`) for local tools. A bare `npx tsc` in a project without TypeScript installed offers to download the npm package named `tsc`, which is "a deprecated release of the TypeScript compiler", not the current one.

Record each command and its result. A tool that cannot run (not installed, broken config) is itself a finding.

## 3. Read the code against this checklist

### Spec conformance (a separate axis)
- Compare the change with its originating requirement (issue, spec, acceptance criteria): requirements missing or only partly done; behaviour nobody asked for (scope creep); requirements that look implemented but behave wrongly. Quote the requirement for each finding.
- Report this axis apart from the standards and quality findings below and do not rank one against the other: code can follow every standard and still build the wrong thing, or do exactly what was asked while breaking conventions (two-axis review adapted from Matt Pocock's [code-review skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/code-review), MIT). With no requirement available, say so.

### Correctness
- Does the code do what the requirement or PR description says? Check every branch, including the `else` and default cases.
- Boundaries: empty collections, zero, negative numbers, maximum values, off-by-one, Unicode and multi-byte text, time zones and DST, floating-point money (use integer minor units or decimal types).
- Null, undefined and `None` handling; unchecked casts; ignored return values and errors.
- State: invariants maintained after every mutation; no stale caches; idempotency where retries can happen.

### Security (OWASP Top 10:2025)
- **A01 Broken Access Control**: every endpoint and object access checks authorisation server-side (IDOR, missing ownership checks, path traversal).
- **A02 Security Misconfiguration**: debug mode, default credentials, permissive CORS, verbose errors, missing security headers.
- **A03 Software Supply Chain Failures**: new or unpinned dependencies, unverified package names, missing lockfile, untrusted build steps.
- **A04 Cryptographic Failures**: hand-rolled crypto, weak algorithms (MD5 or SHA-1 for security, ECB mode), secrets in code, plaintext sensitive data, non-constant-time secret comparison.
- **A05 Injection**: SQL or NoSQL built by string concatenation, shell commands with user input, template injection, XSS from unescaped output, unsafe deserialisation.
- **A06 Insecure Design**: missing rate limits, abuse cases not considered, trust in client-side checks.
- **A07 Authentication Failures**: weak password storage (use Argon2id, scrypt or bcrypt), session fixation, missing MFA hooks where required, tokens without expiry.
- **A08 Software or Data Integrity Failures**: unsigned updates or artifacts, deserialising untrusted data, CI that runs untrusted code with secrets.
- **A09 Security Logging and Alerting Failures**: security events not logged, or secrets and personal data logged.
- **A10 Mishandling of Exceptional Conditions**: fail-open error paths, swallowed exceptions, crashes on malformed input, inconsistent state after partial failure.

### Reliability
- Every network or disk call has a timeout and a handled failure path; retries are bounded and only for idempotent operations.
- Resources (files, sockets, connections, locks, timers) are released on all paths.
- Concurrency: shared mutable state is protected; no unawaited promises or leaked goroutines and tasks; no check-then-act races.
- Unbounded growth: queues, caches, in-memory collections, request sizes.

### Tests
- New or changed behaviour has tests that would fail without the change.
- Failure paths and boundaries are tested, not only the happy path.
- Tests are deterministic (no real network, time or randomness without control) and assert behaviour, not implementation details.

### Maintainability
- Follows [02-clean-code](../../rules/02-clean-code.md) and the project's conventions; no dead code, debug output or unexplained suppressions. The code smells in rule 02 section 7 are judgement calls labelled as such ("possible feature envy"); a documented project standard overrides them, and anything a tool already enforces is skipped.
- Every changed line traces to the stated purpose of the change: no drive-by refactors, reformatting or unrelated deletions ([15-clean-execution](../../rules/15-clean-execution.md) section 2). Nothing pre-existing is removed without recorded approval ([01-core-principles](../../rules/01-core-principles.md) section 8).
- No speculative options, abstractions or configurability; nothing an experienced engineer would call overcomplicated for the problem ([01-core-principles](../../rules/01-core-principles.md) section 2).
- Assumptions the change relies on are stated in the description or a comment, and the riskiest ones are tested.
- No comment or user-facing text slop (decorative or restating comments, invented data, buzzwords) in the changed lines ([anti-slop](../anti-slop/SKILL.md)).
- Placeholder scan: `rg -n "TODO|FIXME|XXX|HACK|NotImplementedError|not implemented"` (or `grep -rnE` with the same pattern). Judge each hit in context: `...` and `pass` are often legitimate syntax.

## 4. Verify before reporting

For each candidate finding:

1. Trace the actual code path from input to the problem. Read the called functions; do not assume what they do.
2. Construct a concrete failing scenario: specific input, state, result. Write a failing test or a reproduction when feasible.
3. Drop it if you cannot build a plausible scenario. If it is grounded in the source but a decisive fact is outside it (a deployment setting, proxy or provider behaviour, identity policy, network topology), mark it **needs validation** with that exact fact and a safe way for the owner to check it. Do not assume the missing control is present or absent.
4. Do not report style preferences as bugs. Do not report issues the linter already enforces unless the linter is not running.

### Security findings: prove the boundary and the result

Adapted from Cloudflare's [security-audit skill](https://github.com/cloudflare/security-audit-skill) (MIT). A confirmed security finding names all of:

- the lower-trust principal and the input or action it controls;
- the control that should have stopped it, and the trust boundary that was crossed;
- the affected principal or resource; and
- the concrete result observed, with source evidence or a bounded local reproduction (a wrong return value, another tenant's dummy record read, a sanitizer report).

Then apply these rules:

- A deviation from a checklist or best practice is a **hardening note**, not a vulnerability. If one layer already prevents the attack, the missing second layer is a defence-in-depth note.
- Intended same-principal authority and self-impact do not cross a boundary.
- Report the effect you observed, never a stronger one you expect.
- The finder does not confirm its own finding: another reviewer, or a fresh agent given only the claim and the source, tries to disprove it. Keep disproved candidates as **rejected** with the reason, so later reviews do not raise them again without new evidence.
- Recommend the smallest change that enforces the violated invariant at the last trusted decision point, plus a regression test. A review describes fixes; it changes the code only when that is part of the request ([AGENTS.md](../../../AGENTS.md) non-negotiable 9).

## 5. Report

Order findings by severity, most severe first. One entry per finding:

```text
[Severity] path/to/file.ext:LINE: one-sentence statement of the defect
  Scenario: concrete input/state → wrong result or impact
  Fix:      the specific change recommended
  Status:   confirmed (test/repro) | needs validation (the missing fact and how to check it) | rejected (disproved, with the reason)
```

Severity guide:

- **Critical**: exploitable security flaw at the critical level below, data loss or corruption, or an outage in a core path.
- **High**: wrong results in normal use, or a security weakness that needs specific conditions.
- **Medium**: an edge-case bug, a missing timeout or limit, or an important missing test.
- **Low**: maintainability or clarity problems that make future bugs likely.

Security severity follows the demonstrated impact and never exceeds it (calibration from Cloudflare's skill). Findings marked needs validation get no severity.

- **Critical**: an unauthenticated actor gains code execution, full data-store access, or takeover of arbitrary accounts.
- **High**: an explicit control is fully defeated with real consequences: authentication bypass, cross-tenant read or write, stored script execution affecting other users, authenticated code execution, or an unauthenticated remote stop of a shared service.
- **Medium**: a real boundary violation with limited blast radius, uncommon preconditions, or effects confined to a narrow set of resources.
- **Low**: disclosure of non-secret internals, or an effect that needs sustained effort for minimal gain.
- **Informational**: confirmed but minimal impact, mainly useful as a step in a larger chain.

If the result fully defeats an explicit control for an action with real consequences, it is high; if it only weakens the control, medium. If you cannot state the concrete damage, the severity is lower than it feels.

List hardening notes separately from vulnerabilities, and end with a coverage statement: what was reviewed, what was not, and why. One pass is never complete; in Cloudflare's runs a single pass found roughly half of the vulnerabilities that repeated runs found.

Finish with the commands you ran and their results, and anything you could not check.
