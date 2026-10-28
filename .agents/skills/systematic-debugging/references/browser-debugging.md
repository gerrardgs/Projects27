# Browser and front-end debugging

The method in [SKILL.md](../SKILL.md) applies unchanged: capture, reproduce, isolate, prove, fix the root cause, add a regression test. This page lists the tools and the usual causes of front-end bugs. Links checked on 2026-10-15.

## 1. Capture the facts in the browser

| Need | Tool |
| :--- | :--- |
| Errors and stack traces | DevTools Console; with source maps the stack points to your source ([source maps](https://developer.chrome.com/docs/devtools/javascript/source-maps)) |
| Step through code | Sources panel breakpoints, conditional breakpoints, logpoints, "pause on exceptions" ([JavaScript debugging](https://developer.chrome.com/docs/devtools/javascript)) |
| Requests, status codes, CORS, caching | Network panel; "Disable cache"; throttling ([Network](https://developer.chrome.com/docs/devtools/network)) |
| Styles that win or lose | Elements → Styles and Computed ([CSS](https://developer.chrome.com/docs/devtools/css)); layout overlays for grid, flexbox and container queries |
| User preferences | Rendering panel: emulate `prefers-color-scheme`, `prefers-reduced-motion`, forced colours, vision deficiencies ([emulate CSS media features](https://developer.chrome.com/docs/devtools/rendering/emulate-css)) |
| Memory leaks | Memory panel heap snapshots ([memory problems](https://developer.chrome.com/docs/devtools/memory-problems)) |
| Slowness, jank, INP | Performance panel ([web-performance-optimization](../../web-performance-optimization/SKILL.md)) |
| Try a fix on production assets without deploying | Local overrides ([overrides](https://developer.chrome.com/docs/devtools/overrides)) |
| Record a reproduction | Recorder panel ([Recorder](https://developer.chrome.com/docs/devtools/recorder)); Playwright traces ([trace viewer](https://playwright.dev/docs/trace-viewer)) |
| Real phones | Android: [remote debugging](https://developer.chrome.com/docs/devtools/remote-debugging); iOS: [Safari Web Inspector](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios); Firefox: [about:debugging](https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/) |
| Framework state | [React Developer Tools](https://react.dev/learn/react-developer-tools), [Vue DevTools](https://devtools.vuejs.org/), [Angular DevTools](https://angular.dev/tools/devtools) |
| Agent access | Chrome DevTools MCP (console with source-mapped stacks, network, traces) or Playwright MCP ([figma-integration references](../../figma-integration/references/figma-platform.md#other-design-tool-and-browser-integrations-for-agents)) |

## 2. Usual causes, by symptom

| Symptom | Check first |
| :--- | :--- |
| Works locally, broken when deployed | Environment variables missing or not public-prefixed; base path or asset URLs; case-sensitive file names on Linux hosts; SPA fallback missing (404 on refresh); stale cache (hashed file names, `Cache-Control`); CSP blocking a script (console shows the directive) |
| "Hydration failed" / text content mismatch (React, Next.js, Vue, Svelte, Astro) | Output that differs between server and client: dates, random IDs, `window` or `localStorage` read during render, locale formatting, invalid HTML nesting (a `<div>` inside `<p>`), browser extensions changing the DOM ([React `hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot), [Next.js hydration error](https://nextjs.org/docs/messages/react-hydration-error)) |
| CORS error | The server must send the `Access-Control-Allow-*` headers; the browser cannot fix it. Preflight (`OPTIONS`) failing, credentials with a wildcard origin ([MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)) |
| Element not where expected | Containing block ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block)), `position: sticky` inside an `overflow` ancestor, flex child without `min-width: 0`, collapsing margins, `box-sizing` |
| `z-index` has no effect | Stacking contexts created by `transform`, `opacity`, `filter`, `position` plus `z-index`, `isolation` ([MDN stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context)) |
| Horizontal scrolling on phones | An element wider than the viewport: long words or URLs (`overflow-wrap: anywhere`), fixed widths, `100vw` with a scrollbar, images without `max-inline-size: 100%` |
| Style does not apply | Cascade layer order, specificity, a typo in a custom property name (silently invalid), the property not supported by the browser (`@supports`), CSS Modules or scoping renaming the class |
| State not updating (React) | Mutating state instead of replacing it; stale closures in effects or callbacks; missing or unstable `key`s |
| Infinite re-render or effect loop | Effect dependencies that change every render (new objects or functions); derived state stored in state |
| Click does nothing | An invisible overlay intercepting pointer events (Elements panel, `pointer-events`), the button is `type="submit"` inside a form, the handler was attached before the element existed |
| Font flashes or shifts | `font-display`, missing preload, fallback metrics |
| Only in Safari or Firefox | Feature not supported in that engine (check Baseline); date parsing (`new Date("2026-10-15 10:00")` is not portable, use ISO 8601 with `T` and a zone); autoplay and permission policies |

## 3. Reproduce in a test

Turn the bug into a failing test at the lowest level that shows it: a unit test for logic, a component test (Testing Library) for rendering and events, a Playwright test for browser-specific or multi-page behaviour, a visual snapshot for layout regressions ([frontend-testing-and-visual-qa](../../frontend-testing-and-visual-qa/SKILL.md)).
