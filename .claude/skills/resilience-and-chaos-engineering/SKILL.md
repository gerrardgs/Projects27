---
name: resilience-and-chaos-engineering
description: Make websites, web apps and their back ends keep working when things go wrong, and prove it with chaos engineering - front-end failure modes (offline, slow or flaky networks, API errors and timeouts, blocked scripts, styles, fonts or storage, third-party outages, deploy version skew, expired sessions), resilience patterns (progressive enhancement, timeouts, retries with backoff and jitter, circuit breakers, error boundaries, fallbacks, kill switches), service-level objectives and error budgets from real-user data, and controlled fault-injection experiments in the browser, in CI and in production game days, run as a six-step cycle (steady state, failure hypothesis, injected chaos, observation against the expectation, evaluation, improvement plan) with a written experiment record. Use when asked about chaos engineering, resilience, fault tolerance, graceful degradation, offline support, error handling in the UI, reliability, SLOs, or what happens when a dependency fails.
license: MIT
metadata:
  version: "1.0.0"
---

# Resilience and Chaos Engineering

Failures are normal: networks drop, APIs time out, scripts are blocked, deploys race with open tabs. Resilience is designing so users can still complete their task; chaos engineering is the discipline of **proving** it by experiment instead of hoping. Rules that always apply: [05-error-handling](../../rules/05-error-handling.md) (timeouts, retries, cleanup), [11-frontend-code](../../rules/11-frontend-code.md) (progressive enhancement), and [15-clean-execution](../../rules/15-clean-execution.md). Tools and sources are in [references/tools.md](references/tools.md); a tested experiment harness is in [assets/browser-chaos/](assets/browser-chaos/).

## 1. Principles

From the [Principles of Chaos Engineering](https://principlesofchaos.org/):

1. **Steady state**: define normal behaviour as something measurable that users experience (a journey completes, an error rate, a latency), not as internal details.
2. **Hypothesis**: the steady state will continue in the experimental group as in the control group.
3. **Vary real-world events**: inject the failures that actually happen, chosen by likelihood and impact.
4. **Disprove**: look for a difference from the steady state; a difference is a finding, not a failure of the experiment.
5. **Automate continuously**, and run in production only when it is safe, approved and the **blast radius is minimised**.

Resilience is engineered before it is tested: experiments find the gaps; the patterns in section 3 close them.

## 2. Front-end failure modes to plan for

| Category | Failure | Expected behaviour |
| :--- | :--- | :--- |
| Network | Offline, slow (2G/3G, congested), flaky, captive portal | Core content readable; clear offline state; queued or retried actions; no infinite spinners |
| APIs | 5xx, 429 with `Retry-After`, timeout, malformed or partial JSON, schema change, empty lists | Validated responses ([05-error-handling](../../rules/05-error-handling.md) section 3), specific error states, retry for idempotent requests only, cached or stale data where acceptable |
| Assets | JavaScript, CSS, fonts or images fail to load (CDN outage, ad blockers, corporate proxies) | HTML works alone; system font fallback; images have dimensions and alt text |
| Third parties | Analytics, chat, maps, payments or A/B scripts down or slow | Load asynchronously with timeouts; the page never waits for them; facades for heavy embeds |
| Browser | JavaScript disabled, storage blocked, cookies off, extensions changing the DOM, old browsers, strict CSP | Progressive enhancement; `try/catch` around storage; feature detection |
| Deploys | Version skew: an open tab requests chunks that no longer exist after a deploy; stale service worker | Keep previous assets available for a while; catch failed dynamic imports and offer a reload; versioned service worker caches |
| Sessions | Token expires mid-task; user logged out in another tab | Preserve input, re-authenticate, resume |
| Data and time | Huge or empty data, slow rendering, clock skew, time zones, locales | Virtualised lists, pagination, server time for deadlines, `Intl` |
| Flags and config | Feature-flag service unreachable | Safe default value for every flag; kill switches for risky features |

## 3. Resilience patterns for user interfaces

- **Progressive enhancement**: the main task works with HTML and the server; JavaScript improves it ([frontend-from-scratch](../frontend-from-scratch/SKILL.md)).
- **Timeouts everywhere**: `fetch(url, { signal: AbortSignal.timeout(ms) })`; cancel stale requests with `AbortController`.
- **Retries with exponential backoff and jitter**, a maximum attempt count, idempotent requests only, honouring `Retry-After` ([AWS Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)).
- **Circuit breaker** for a failing dependency: stop calling it for a while and show the fallback ([Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)).
- **Fallbacks**: cached or stale data (stale-while-revalidate), static content, a reduced feature, a clear message with a retry action.
- **Error boundaries**: catch rendering errors per region so one widget cannot blank the page ([React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary), [Vue `onErrorCaptured`](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured), [SvelteKit errors](https://svelte.dev/docs/kit/errors)); report them to error tracking.
- **Optimistic UI with rollback** when an update fails; never lose user input.
- **Offline support** where users expect it ([web.dev offline cookbook](https://web.dev/articles/offline-cookbook)).
- **Kill switches and safe defaults** with feature flags ([OpenFeature](https://openfeature.dev/)).
- Every one of these is a **designed state** ([09-design-principles](../../rules/09-design-principles.md) section 4): the offline banner, the retry button and the degraded view need design and copy, not only code.

## 4. Reliability targets: SLIs, SLOs and error budgets

- Choose **service-level indicators** users feel: the share of successful key journeys (sign-up, checkout), API success rate as seen from the browser, and Core Web Vitals at the 75th percentile ([12-web-performance](../../rules/12-web-performance.md)), measured with real-user monitoring.
- Set **objectives** below 100 percent (for example 99.5 percent of checkouts succeed over 28 days); the remainder is the **error budget** that pays for releases and experiments. When it is spent, prioritise reliability ([Google SRE: embracing risk](https://sre.google/sre-book/embracing-risk/), [implementing SLOs](https://sre.google/workbook/implementing-slos/)).
- After incidents, write blameless postmortems ([Google SRE](https://sre.google/sre-book/postmortem-culture/)) and turn each finding into a test or an experiment.

## 5. Run an experiment: the six-step cycle

Every experiment follows the same cycle and is written down in an [experiment record](references/experiment-record.md), which is part of the implementation plan the user approves before any fault is injected ([15-clean-execution](../../rules/15-clean-execution.md) section 1).

1. **Define the steady state.** Pick a journey (section 4) and write what "normal" means as numbers users experience: the journey completes, within a time, with an error rate below a threshold. Measure it on the control first; without a measured baseline there is nothing to compare.
2. **State the failure hypothesis.** Choose a real failure from section 2 by likelihood and impact, and predict what the system will do: "When the analytics script times out, checkout still completes within 3 s and shows no error." Write down what would disprove it.
3. **Create the chaos, safely.** Choose the smallest safe environment (a test browser first, then CI, then staging, and production only with section 6), set the blast radius and the abort conditions, then inject the fault with the narrowest tool: browser request routing or offline mode (Playwright, Chrome DevTools request blocking and throttling), a mocked API (MSW), a proxy between services (Toxiproxy), or a platform for infrastructure (Chaos Toolkit, LitmusChaos, Chaos Mesh, AWS Fault Injection Service, Azure Chaos Studio, Gremlin); see [references/tools.md](references/tools.md).
4. **Observe against the expectation.** Compare the experiment with the control and the hypothesis: user-visible behaviour, console and uncaught errors, metrics, logs and alerts. Did the system behave as expected? Record the evidence (numbers, screenshots, tool output), not impressions.
5. **Evaluate.** The hypothesis **held** or was **disproved**. For a disproved one, find the root cause ([systematic-debugging](../systematic-debugging/SKILL.md)), the user impact and the blast radius, and whether monitoring noticed. A held hypothesis still asks: did alerts fire, were fallbacks clear to users?
6. **Plan and verify the improvement.** Write the fixes (a resilience pattern from section 3, a new state, an alert, an SLO change) with an owner, a priority and a date, get them approved, implement them, then **re-run the same experiment** to prove the fix, and keep it as an automated test so the weakness cannot return.

### The browser-chaos template

[assets/browser-chaos/](assets/browser-chaos/) runs six experiments in Chromium against any URL: control, scripts unavailable, stylesheet unavailable, every response delayed 1.5 s, storage blocked, and offline after load. Faults are injected only inside the test browser, so it is safe against any environment. Its tests prove it can fail: a deliberately fragile fixture page is caught on blocked storage and missing JavaScript.

```sh
cd assets/browser-chaos
npm ci && npx playwright install chromium
node chaos.mjs http://127.0.0.1:8080/   # each hypothesis: held or DISPROVED; exit 1 if any is disproved
npm test                                 # 3 tests: resilient site holds, fragile fixture is caught
```

Verified on 2026-10-16: the [static-site template](../frontend-from-scratch/assets/static-site/) holds all six hypotheses. Adapt `steadyStateProblems` in `experiments.mjs` to your own page's journey.

## 6. Experiments in shared or production environments

- Only with explicit approval from the system owner ([AGENTS.md](../../../AGENTS.md) section 2); never as a side effect of another task.
- Written plan: hypothesis, scope (which users, which percentage), duration, **abort conditions** (an SLO burn threshold), who watches, and how to stop it instantly.
- Start with internal users or a small percentage; expand only after the hypothesis held.
- Announce game days to the people on call and support teams; record results and follow-ups.

## 7. Done when

- [ ] Key journeys and their steady state are defined and measured
- [ ] Every failure mode in section 2 that applies has a designed and implemented state
- [ ] Timeouts on every request; retries only for idempotent requests, with backoff, jitter and a limit
- [ ] Browser chaos experiments run in CI for the key pages and hold
- [ ] SLOs and an error-budget policy exist for production services
- [ ] Production experiments only with approval, a minimal blast radius and abort conditions
- [ ] Every experiment has a record with its steady state, hypothesis, result, evaluation and an improvement plan whose fixes were re-tested
