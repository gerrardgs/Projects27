---
name: backend-engineering
description: Design and build backend services - REST, GraphQL and gRPC APIs, data models and databases, caching, queues and background jobs, idempotency, concurrency, pagination, rate limiting and service integration - that are correct, secure and observable. Use when creating or changing an API endpoint, schema, query, migration, message consumer, job, cache, or service-to-service integration, in any backend language or framework.
license: MIT
metadata:
  version: "1.0.0"
---

# Backend Engineering

Applies with the always-on rules, [05-error-handling](../../rules/05-error-handling.md) and [06-security](../../rules/06-security.md). Calling other organizations' APIs and receiving their webhooks is covered in [api-integration](../api-integration/SKILL.md). Detailed guidance: [references/api-design.md](references/api-design.md) and [references/data-stores.md](references/data-stores.md).

## 1. Before writing code

- Identify the consumers, the contract they need, the data each request touches, and the expected load (requests per second, payload sizes, latency target).
- Find the existing patterns in the codebase: framework, routing, validation library, error format, ORM or query layer, migration tool, logging, test setup. Follow them.
- For a new endpoint or event, write the contract first (OpenAPI, GraphQL schema, `.proto`, or event schema) and agree on it before implementation.

## 2. Request handling checklist

For every endpoint, handler, consumer or job:

- [ ] **Authentication and authorization** on the server, per object (OWASP API Security Top 10 2023 lists broken object-level authorization as API1). Deny by default.
- [ ] **Input validation** at the boundary with a schema: types, required fields, ranges, lengths, formats, and size limits on bodies, arrays and pages. Reject unknown fields where practical.
- [ ] **Business rules** in pure functions, separate from transport and persistence.
- [ ] **Transactions**: everything that must change together happens in one transaction; no network calls to other services inside a database transaction.
- [ ] **Idempotency** for retried operations: idempotency keys for creates and payments, upserts or unique constraints for consumers, and at-least-once delivery assumed for queues.
- [ ] **Timeouts** on every outbound call, with bounded retries plus backoff and jitter, for idempotent calls only; a circuit breaker or bulkhead for unreliable dependencies.
- [ ] **Errors** in one consistent format, for example RFC 9457 Problem Details (`application/problem+json`), with correct status codes and no internal details.
- [ ] **Observability**: structured logs with a request ID, metrics (rate, errors, duration), and trace propagation (OpenTelemetry).
- [ ] **Tests**: unit tests for rules; integration tests against a real database (for example Testcontainers); contract tests for consumers.

## 3. Data and persistence

- Model the domain explicitly: constraints in the database (primary keys, foreign keys, `NOT NULL`, `UNIQUE`, `CHECK`), not only in application code.
- Every query that runs per request is backed by an index; check the plan (`EXPLAIN` / `EXPLAIN ANALYZE` in PostgreSQL and MySQL) for anything on a hot path.
- Avoid N+1 queries: batch-load or join; watch ORM lazy loading.
- Paginate every list endpoint, preferring cursor (keyset) pagination for large or changing data.
- Schema changes are migrations in version control, backward compatible, applied with expand and contract ([deploy-and-release](../deploy-and-release/SKILL.md) section 4).
- Choose the store by access pattern, not fashion; see [references/data-stores.md](references/data-stores.md).

## 4. Asynchronous work

- Move slow or unreliable work (emails, webhooks, report generation, third-party calls) to a queue or job system; respond with `202 Accepted` and a status resource when the client must wait.
- Publish events reliably with the **transactional outbox** pattern: write the event to an outbox table in the same transaction as the state change, and relay it to the broker separately.
- Consumers are idempotent, handle poison messages with a dead-letter queue, and expose lag metrics.
- Scheduled jobs are safe to run twice and safe to run concurrently (locks or leases where needed).

## 5. Performance and scale

- Measure first: load-test with realistic data ([quality-assurance](../quality-assurance/SKILL.md)), profile ([systematic-debugging](../systematic-debugging/SKILL.md)).
- Cache only with a clear invalidation rule and a time-to-live; never cache per-user data under a shared key.
- Use connection pools sized to the database's limits; stream large responses instead of buffering them.
- Rate-limit by client and by expensive operation (OWASP API4:2023, unrestricted resource consumption).

## 6. Done when

- [ ] Contract documented (OpenAPI, GraphQL schema, `.proto`, or event schema) and matching the implementation
- [ ] Authorization tests prove that one user cannot read or change another user's data
- [ ] Integration tests run against the real database engine and pass
- [ ] Migrations are reversible or forward-fixable and were applied in a test environment
- [ ] Logs, metrics and traces exist for the new paths; no secrets or personal data in logs
