# Resilience and chaos engineering: tools and sources

Checked on 2026-10-16. Versions are the latest releases on that date; verify before use.

## Principles and practice

| Source | What |
| :--- | :--- |
| [Principles of Chaos Engineering](https://principlesofchaos.org/) | Definition, steady-state hypothesis, real-world events, production, automation, blast radius |
| [Google SRE books](https://sre.google/books/) | Free online: *Site Reliability Engineering*, *The SRE Workbook*, *Building Secure and Reliable Systems* |
| [Embracing risk](https://sre.google/sre-book/embracing-risk/), [Implementing SLOs](https://sre.google/workbook/implementing-slos/), [Postmortem culture](https://sre.google/sre-book/postmortem-culture/) | Error budgets, SLOs, blameless postmortems |
| [Timeouts, retries and backoff with jitter (AWS Builders' Library)](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) | Retry design |
| [Circuit breaker (Martin Fowler)](https://martinfowler.com/bliki/CircuitBreaker.html) | Pattern |
| [Netflix Chaos Monkey](https://github.com/Netflix/chaosmonkey) | The project that popularised chaos engineering |
| [web.dev offline cookbook](https://web.dev/articles/offline-cookbook) | Service worker caching strategies |

## Fault injection in the browser and in tests

| Tool | Use | Docs |
| :--- | :--- | :--- |
| Playwright request routing and offline mode | Abort, delay or rewrite any request; `browserContext.setOffline()` | [Network](https://playwright.dev/docs/network), [setOffline](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-offline) |
| Chrome DevTools | Network throttling and request blocking by hand | [Network reference](https://developer.chrome.com/docs/devtools/network/reference#block) |
| Mock Service Worker | Return errors, delays and malformed responses from a mocked API in tests and in the browser | [mswjs.io](https://mswjs.io/) |
| `AbortSignal.timeout()` | Built-in request timeouts | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) |
| Browser chaos template | Six tested experiments | [assets/browser-chaos](../assets/browser-chaos/) |

## Fault injection for services and infrastructure

Use these with the back-end and platform teams; for back-end engineering itself see [Projects 23](https://github.com/gerrardgs/Projects23) (backend-engineering, cloud-infrastructure, quality-assurance skills).

| Tool | Kind | Latest release (2026-10-16) | Docs |
| :--- | :--- | :--- | :--- |
| Toxiproxy (Shopify) | TCP proxy that adds latency, bandwidth limits and failures between services | v2.13.0 | [GitHub](https://github.com/Shopify/toxiproxy) |
| Chaos Toolkit | Open-source experiment runner with declarative experiments and extensions | 1.21.4 | [chaostoolkit.org](https://chaostoolkit.org/) |
| LitmusChaos | Kubernetes chaos platform; CNCF Incubating since January 2022 | 3.33.0 | [litmuschaos.io](https://litmuschaos.io/), [CNCF](https://www.cncf.io/projects/litmus/) |
| Chaos Mesh | Kubernetes chaos platform; CNCF Incubating since February 2022 | v2.8.5 | [chaos-mesh.org](https://chaos-mesh.org/) |
| AWS Fault Injection Service | Managed fault injection on AWS | | [AWS docs](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html) |
| Azure Chaos Studio | Managed fault injection on Azure | | [Microsoft Learn](https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-overview) |
| Gremlin | Commercial chaos engineering platform | | [gremlin.com](https://www.gremlin.com/) |

## Observability for resilience

| Tool | Use | Docs |
| :--- | :--- | :--- |
| `web-vitals` | Real-user Core Web Vitals | [GitHub](https://github.com/GoogleChrome/web-vitals) |
| OpenTelemetry for the browser | Traces from the browser to the back end (`@opentelemetry/sdk-trace-web` 2.12.0) | [Getting started: browser](https://opentelemetry.io/docs/languages/js/getting-started/browser/) |
| Error tracking | Uncaught errors and error-boundary reports with source maps | See [frontend-deployment](../../frontend-deployment/SKILL.md) section 6 |
| Feature flags | Kill switches with safe defaults | [OpenFeature](https://openfeature.dev/) |
