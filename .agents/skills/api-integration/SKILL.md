---
name: api-integration
description: Integrate with third-party and partner APIs in any sector - payments, banking, healthcare, government, e-commerce, logistics, telecom, education, accounting and ERP, IoT, communications and AI providers - covering authentication (OAuth 2.0, OIDC, mTLS, API keys), webhooks with signature verification and replay protection, retries, rate limits, pagination, idempotency, data mapping, sandbox testing, contract tests, secrets, versioning and monitoring. Use when connecting a system to an external API or SaaS, receiving webhooks, building a connector or middleware, or when an integration fails, duplicates data or breaks after a provider change.
license: MIT
metadata:
  version: "1.0.0"
---

# API Integration

Providing your own API is covered in [backend-engineering](../backend-engineering/SKILL.md). This skill covers **consuming** other systems' APIs and receiving their events. Sector-specific standards are in [references/sector-standards.md](references/sector-standards.md). A tested template with a resilient HTTP client and a webhook verifier is in [assets/python-integration-kit/](assets/python-integration-kit/). Standards checked on 2026-10-15.

## 1. Before writing code

- Read the provider's official API reference, authentication guide, rate-limit policy, webhook guide, changelog and deprecation policy **for the API version you will use**. Never infer endpoints, fields or error codes from memory or from another provider ([03-verification](../../rules/03-verification.md)).
- Prefer the provider's official SDK when it is maintained and fits the project's language and version; otherwise use a thin, typed HTTP client of your own. Verify the SDK package name and publisher in the registry.
- Get sandbox or test credentials, and confirm how the sandbox differs from production (data, rate limits, webhook delivery).
- Write the data mapping: each field you send or receive, its type and format, required or optional, and how your system's concepts map to theirs (identifiers, statuses, currencies, time zones, units).
- Classify the data exchanged (personal, financial, health) and check the legal and contractual basis for sharing it.

## 2. Authentication and secrets

- Use the method the provider specifies, in its most secure supported form:
  - **OAuth 2.0** following the security best current practice ([RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), 2025): authorization code flow with PKCE, exact redirect URI matching, no implicit grant, no resource-owner password grant, sender-constrained tokens (mutual TLS, RFC 8705, or DPoP, RFC 9449) where supported, and rotation for public clients' refresh tokens. OAuth 2.1 consolidates these practices but was still an Internet-Draft on 2026-10-15.
  - **Client credentials** for service-to-service access, with the narrowest scopes.
  - **OpenID Connect** when you need the user's identity, not only API access.
  - **API keys** only over TLS, in a header rather than the URL, scoped and rotatable.
  - **Mutual TLS** when the provider requires certificate-based client authentication (common in banking and government).
- Store credentials and refresh tokens in a secret manager, encrypted, scoped per environment and tenant; never in code, logs or URLs ([06-security](../../rules/06-security.md)).
- Refresh tokens before they expire, handle revocation, and support credential rotation without downtime.

## 3. Calling the API reliably

The template's [`http_client.py`](assets/python-integration-kit/http_client.py) implements these rules:

- A timeout on every request.
- Retries only for transient failures (connection errors, `408`, `429`, `5xx` gateway errors), only for idempotent operations, or for operations carrying an idempotency key that the provider honours.
- Exponential backoff with jitter, a cap, and `Retry-After` honoured.
- A bounded number of attempts, then a clear error. Put a circuit breaker in front of providers that fail for long periods.
- Respect rate limits proactively: read the provider's documented limits and any rate-limit response headers, queue and throttle bulk work, and spread scheduled jobs.
- Paginate fully and safely: follow the provider's cursor or `next` link, never assume one page, and checkpoint long syncs so they resume after a failure.
- Send an idempotency key for creates and payments when the provider supports one, and store it with your record, so a retry cannot create a duplicate.

## 4. Receiving webhooks

The template's [`webhooks.py`](assets/python-integration-kit/webhooks.py) implements the [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md) scheme and is byte-compatible with the official `standardwebhooks` Python library (verified in both directions). For any provider:

1. **Verify the signature** over the raw request body, exactly as received, with the provider's documented algorithm, using a constant-time comparison. Reject unsigned or invalid requests.
2. **Reject stale timestamps** (replay protection) using a tolerance window.
3. **Deduplicate** by the event ID: deliveries are at-least-once, so the same event can arrive several times.
4. **Acknowledge fast** (`2xx` within the provider's timeout), and process asynchronously through a queue.
5. **Do not trust the payload blindly**: for important events (payments, status changes), fetch the current state from the API before acting, because events can arrive out of order.
6. Expose the endpoint over HTTPS only. Do not rely on IP allow-lists alone, and never follow URLs from a webhook payload without SSRF protection.

## 5. Data handling

- Validate every response against the expected schema; unknown enum values and missing fields must not crash the integration. Log and alert instead.
- Convert at the boundary: currencies as integer minor units or decimals, times in UTC, explicit units, normalized identifiers.
- Store the external ID next to your internal ID; never use the provider's ID as your primary key.
- For synchronization, track a high-water mark (updated-since timestamp or cursor) and run periodic reconciliation to catch missed events.
- Keep only the data you need; apply the provider's and the law's retention rules.

## 6. Testing

- Unit-test mapping and validation with recorded, anonymized payloads from the provider's documentation or sandbox.
- Integration-test against the sandbox in a separate CI job (secrets from the CI secret store), or against a local fake server when no sandbox exists.
- Contract-test the parts of the provider's API you depend on (for example with Pact, or schema checks against the provider's OpenAPI document) so provider changes are caught early.
- Test failure paths: timeouts, `429`, `5xx`, malformed responses, duplicate and out-of-order webhooks, expired credentials.

## 7. Operating the integration

- Log each call with provider, operation, status, latency, attempt number and correlation ID; never log credentials, full card numbers or health data.
- Metrics and alerts: error rate, latency, rate-limit hits, webhook verification failures, queue backlog, and reconciliation differences.
- Subscribe to the provider's status page and changelog; record the API version you use and plan migrations before deprecation dates.
- Provide a way to replay failed events and resynchronize a single record.

## Done when

- [ ] Endpoints, fields and limits taken from the provider's official documentation for the pinned API version
- [ ] Credentials in a secret manager; least-privilege scopes; rotation possible
- [ ] Timeouts, safe retries, idempotency keys and pagination implemented and tested
- [ ] Webhooks verified, replay-protected, deduplicated and processed asynchronously
- [ ] Responses schema-validated; failure paths tested against the sandbox or a fake server
- [ ] Monitoring, alerts and a replay or resync path in place
