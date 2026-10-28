# Integration standards by sector

Facts with a version were checked against the official source on 2026-10-15. Entries marked "check the current version" are well-established standards whose current version could not be confirmed from an official page during that check: read the standard body's site before relying on a version. Regulations are pointers, not legal advice.

## Cross-sector building blocks

| Need | Standard |
| :--- | :--- |
| HTTP semantics and errors | RFC 9110 (HTTP Semantics), RFC 9457 (Problem Details) |
| API descriptions | OpenAPI 3.2.1 (latest published), AsyncAPI 3.1.0 for event-driven APIs |
| Event envelopes | CloudEvents 1.0.2 (a CNCF graduated project) |
| Webhook signing | Standard Webhooks; RFC 9421 (HTTP Message Signatures, 2024) for signing HTTP messages generally |
| Authorization | OAuth 2.0 (RFC 6749) with the security BCP RFC 9700 (2025); PKCE (RFC 7636); mutual TLS (RFC 8705); DPoP (RFC 9449); JWT access tokens (RFC 9068); token introspection (RFC 7662); server metadata (RFC 8414). OAuth 2.1 is still an Internet-Draft |
| Identity and provisioning | OpenID Connect; SAML 2.0 (enterprise single sign-on); SCIM 2.0 (RFC 7643 and RFC 7644) for user provisioning |
| Idempotency and rate limits | The IETF `Idempotency-Key` header draft expired without becoming an RFC, and the `RateLimit` header fields are still a draft: follow each provider's documented headers |
| Transport security | TLS 1.3 (RFC 9846, July 2026, which obsoletes RFC 8446) |

## By sector

| Sector | Standards and practices | Notes |
| :--- | :--- | :--- |
| Payments and card processing | PCI DSS v4.0.1; provider tokenization or hosted payment fields to keep card data out of your systems; idempotency keys on charges; webhook-driven payment status | Never store full card numbers or security codes; reconcile against settlement reports |
| Banking and open finance | FAPI 2.0 Security Profile (Final, 22 February 2025: pushed authorization requests, PKCE with S256, sender-constrained tokens via mTLS or DPoP); ISO 20022 for payment and financial messaging (check the current message versions); regional open-banking specifications | Strong customer authentication and consent records are usually mandatory |
| Healthcare | HL7 FHIR (R5 is the current published version; R4 is still widely deployed: use the version the counterpart supports); SMART App Launch 2.2.0 for app authorization; HL7 version 2 messaging in many existing hospital systems; DICOM for medical imaging | Health data is highly regulated (for example HIPAA in the United States, GDPR special-category data in the EU); minimum necessary access, audit logs, consent |
| Government and public identity | OpenID Connect and SAML 2.0 federation; national digital identity and e-government APIs per country | Expect mutual TLS, signed requests and strict data-residency rules |
| Accounting, invoicing and ERP | Peppol BIS Billing 3.0 (based on the European standard EN 16931, UBL syntax) for e-invoicing; ERP and CRM vendor APIs (often OData or REST, plus bulk APIs) | Respect fiscal numbering and immutability of issued invoices; country e-invoicing mandates vary |
| Retail, e-commerce, logistics and supply chain | EDI: ANSI ASC X12 and UN/EDIFACT messages (often over AS2 or SFTP); GS1 identifiers (GTIN, GLN, SSCC) and GS1 Digital Link; marketplace and carrier REST APIs | Check the current versions of X12 transaction sets and GS1 standards with the trading partner; validate EDI with the partner's implementation guide |
| Telecommunications | CAMARA network APIs (an open-source project of the Linux Foundation, with GSMA's Operator Platform Group as collaborator); TM Forum Open APIs for operator business systems (check the current API versions) | Network APIs often require operator onboarding and user consent |
| Education | 1EdTech LTI 1.3 and LTI Advantage for tool integration; OneRoster for rosters and grades (check the current version) | Student data is protected by education privacy laws in many countries |
| Maps and geospatial | OGC API - Features (Part 1 Core is also ISO 19168-1:2020; Parts 2 and 3 approved); GeoJSON (RFC 7946) | State coordinate reference systems explicitly |
| IoT and industrial | MQTT 5.0 (OASIS standard); OPC UA (IEC 62541) for industrial automation; CloudEvents for event envelopes | Device identity with certificates; plan for intermittent connectivity and message ordering |
| Email and messaging | SMTP (RFC 5321); sender authentication with SPF (RFC 7208), DKIM (RFC 6376) and DMARC (RFC 9989, with reporting in RFC 9990 and 9991, May 2026, which obsolete RFC 7489); SMS and voice through provider APIs | Honour opt-in, opt-out and quiet hours required by local regulation |
| Travel and insurance | IATA NDC for airline distribution; ACORD standards for insurance data (check current versions) | Strict partner certification processes are common |
| AI model providers | Provider REST APIs and SDKs; the Model Context Protocol for tool and data connections | See [llm-applications](../../llm-applications/SKILL.md) and [ai-agent-systems](../../ai-agent-systems/SKILL.md) |

## Choosing an integration style

| Style | Use when |
| :--- | :--- |
| Direct API calls from the service | Low volume, one or two providers, simple flows |
| Queue-backed worker | Retries, rate limits or slow providers must not affect users |
| Event-driven (webhooks into a queue) | The provider pushes changes; you need near-real-time updates |
| Batch or file transfer (SFTP, EDI, bulk APIs) | Large volumes, partners without real-time APIs |
| Integration platform or workflow engine | Many integrations with retries, schedules and human steps; long-running processes |
