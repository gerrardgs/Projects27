# API

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How to use and change the API. The machine-readable contract is the source of truth; this document explains it.

## Contract

<!-- Path to the OpenAPI, GraphQL schema or .proto file, and how reference docs are generated from it. -->

{{openapi.yaml}}, rendered with {{tool}}

## Base URLs and environments

<!-- One line per environment. -->

| Environment | Base URL |
| :--- | :--- |
| {{staging}} | {{https://api.staging.example.com}} |

## Authentication and authorization

<!-- How clients authenticate, token lifetime, scopes or roles, and object-level checks. -->

{{auth}}

## Versioning and compatibility

<!-- Version scheme, what counts as breaking, deprecation policy. -->

{{policy}}

## Errors

<!-- Error format (for example RFC 9457 problem details) and the list of error types. -->

{{format and examples}}

## Pagination, filtering and limits

<!-- Pagination style, maximum page size, rate limits and their headers. -->

{{rules}}

## Idempotency and retries

<!-- Which operations are idempotent, idempotency keys, safe retry guidance. -->

{{rules}}

## Endpoints

<!-- Summary table; full detail lives in the contract. One request and response example per main operation. -->

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| {{GET}} | {{/v1/orders}} | {{purpose}} | {{scope}} |

## Webhooks and events

<!-- Events sent, payload schema, signature verification, retries. Write "None." if there are none. -->

{{events}}

## Change log

<!-- Notable API changes by version, or a link to CHANGELOG.md. -->

{{changes}}
