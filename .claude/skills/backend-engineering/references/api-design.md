# API design reference

Facts checked against the official sources on 2026-10-15.

## Contracts

| Style | Contract format | Use when |
| :--- | :--- | :--- |
| REST over HTTP | [OpenAPI](https://spec.openapis.org/oas/) (latest published: 3.2.1; 3.1 and 3.0 are still widely supported by tools) | Public and partner APIs, CRUD resources, broad client compatibility |
| GraphQL | GraphQL schema (SDL) | Many client shapes over one graph; mind query cost limits and per-field authorization |
| gRPC | Protocol Buffers (`.proto`) | Internal service-to-service calls, streaming, strict typing |
| Events | AsyncAPI, JSON Schema, Avro or Protobuf with a schema registry | Asynchronous integration between services |

Generate server stubs, clients or validators from the contract where the ecosystem supports it, and test that the implementation matches the contract (for example Schemathesis for OpenAPI and GraphQL).

## HTTP semantics

- Methods: `GET` (safe, cacheable), `POST` (create or action), `PUT` (full replace, idempotent), `PATCH` (partial update), `DELETE` (idempotent).
- Status codes: `200`, `201` with `Location`, `202` for accepted async work, `204`; `400` validation, `401` unauthenticated, `403` forbidden, `404`, `409` conflict, `412` precondition failed (optimistic locking with `ETag`/`If-Match`), `413`, `415`, `422` semantically invalid, `429` with `Retry-After`; `5xx` only for server faults.
- Errors: [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) Problem Details (`application/problem+json`; it obsoletes RFC 7807).
- Idempotency for `POST`: accept an idempotency key header, store the key with the result, return the stored result on retry.

## Resource design

- Nouns for resources (`/orders/{orderId}/items`), plural collections, stable identifiers (UUIDs or other opaque IDs, never sequential IDs where enumeration is a risk).
- Filtering, sorting and pagination as query parameters with documented limits; cursor pagination returns an opaque `next` cursor.
- Timestamps in UTC, ISO 8601 / RFC 3339 format; money as integer minor units plus currency code, or a decimal string.
- Versioning: avoid breaking changes; when unavoidable, version explicitly (`/v2/` path or a media-type version) and run both versions during a deprecation period announced to clients.

## OWASP API Security Top 10 2023

API1 Broken Object Level Authorization · API2 Broken Authentication · API3 Broken Object Property Level Authorization · API4 Unrestricted Resource Consumption · API5 Broken Function Level Authorization · API6 Unrestricted Access to Sensitive Business Flows · API7 Server Side Request Forgery · API8 Security Misconfiguration · API9 Improper Inventory Management · API10 Unsafe Consumption of APIs. Source: [OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10).

## Editor support (VS Code extension IDs, checked on the Marketplace)

`42Crunch.vscode-openapi` (OpenAPI editor and audit), `graphql.vscode-graphql` (GraphQL), `zxh404.vscode-proto3` (Protocol Buffers), `humao.rest-client` (HTTP requests from `.http` files).
