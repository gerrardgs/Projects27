---
trigger: model_decision
description: "Apply when building or reviewing pages, images, fonts, JavaScript bundles, animations or anything that affects loading speed, responsiveness or layout stability (Core Web Vitals)."
---

# R-12: Web Performance

Performance is user experience and accessibility: slow pages fail people on cheap phones and poor networks first. Measure before and after every optimisation ([01-core-principles](01-core-principles.md) section 6). Procedures are in [web-performance-optimization](../skills/web-performance-optimization/SKILL.md).

## 1. Targets (Core Web Vitals, at the 75th percentile of real page loads)

| Metric | Good | Poor | Measures |
| :--- | :--- | :--- | :--- |
| Largest Contentful Paint (LCP) | at most 2.5 s | over 4.0 s | Loading |
| Interaction to Next Paint (INP) | at most 200 ms | over 500 ms | Responsiveness (replaced FID in March 2024) |
| Cumulative Layout Shift (CLS) | at most 0.1 | over 0.25 | Visual stability |

Source: [web.dev/articles/vitals](https://web.dev/articles/vitals). Field data (CrUX, `web-vitals` library, RUM) decides; lab tools (Lighthouse, WebPageTest, DevTools) explain. A Lighthouse score is not a Core Web Vitals result.

## 2. Images and media

- Serve modern formats (AVIF or WebP, with a fallback when the support target needs it), at the displayed size: `srcset` and `sizes`, or `<picture>`. Compress; strip metadata.
- Always set `width` and `height` (or `aspect-ratio`) to reserve space and avoid layout shift.
- The LCP image is never lazy-loaded; give it `fetchpriority="high"`. Lazy-load below-the-fold images and iframes with `loading="lazy"`.
- Use SVG for icons and simple illustrations (optimised with SVGO). Use video (`<video muted playsinline>`) instead of large animated GIFs.

## 3. Fonts

- Prefer system font stacks or a small number of self-hosted WOFF2 files. Subset to the needed scripts and characters; use variable fonts when they replace several files.
- Use `font-display: swap` (or `optional`), preload only the one or two fonts needed for the first view, and use size-adjusted fallbacks (`size-adjust`, `ascent-override`) to limit layout shift.

## 4. JavaScript and CSS

- Ship less JavaScript: render on the server or statically where possible; split code by route; lazy-load heavy, below-the-fold or interaction-only components; propose removing unused dependencies, with the user's approval (check with `knip`, bundle analysers).
- Keep the main thread free: break long tasks (over 50 ms), defer non-critical work, use `requestAnimationFrame` for visual updates and Web Workers for heavy computation.
- Load third-party scripts (analytics, chat, ads, tag managers) last, with `async`/`defer`, and question every one.
- Inline only the critical CSS when it measurably helps; avoid large render-blocking stylesheets and `@import` chains.

## 5. Delivery

- Compress text responses (Brotli or gzip), use HTTP/2 or HTTP/3, a CDN for static assets, and long-lived immutable caching for fingerprinted files (`Cache-Control: public, max-age=31536000, immutable`).
- Use `preconnect` for critical third-party origins and `preload` only for resources the browser discovers late.

## 6. Sustainability

Every byte transferred and every CPU cycle on the device costs energy. The W3C [Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/) (a Group Note Draft, checked 2026-10-16) collect practices for design, development, hosting and strategy. Most of them coincide with this rule: fewer and smaller assets, less JavaScript, efficient caching, no autoplaying media, and removing what users do not need. Treat page weight as a design decision, not only an engineering one.

## 7. Budgets

Set budgets per page type (for example total JavaScript, LCP image weight, number of requests) and enforce them in CI with Lighthouse CI or bundle-size checks. A regression fails the build, like a failing test.
