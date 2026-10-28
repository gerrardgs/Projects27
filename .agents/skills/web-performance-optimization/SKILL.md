---
name: web-performance-optimization
description: Measure and improve web page speed and responsiveness - Core Web Vitals (LCP, INP, CLS), field versus lab data, Lighthouse, WebPageTest, Chrome DevTools performance profiling, image and font optimisation, JavaScript bundle size, rendering strategy, caching and CDNs, and performance budgets in CI. Use when a site is slow, Lighthouse or Search Console reports poor Core Web Vitals, images or fonts are heavy, bundles are large, interactions feel laggy, or before launching a page.
license: MIT
metadata:
  version: "1.0.0"
---

# Web Performance Optimisation

Targets and rules are in [12-web-performance](../../rules/12-web-performance.md). Tools and references are in [references/tools.md](references/tools.md). Never claim an improvement you did not measure ([03-verification](../../rules/03-verification.md)).

## 1. Measure first

1. **Field data** (what real users experience): Chrome UX Report through PageSpeed Insights or Search Console, or your own RUM with the `web-vitals` library (version 6.2.3 on 2026-10-15). Look at the 75th percentile, mobile and desktop separately.
2. **Lab data** (to diagnose): Lighthouse in Chrome DevTools or the CLI, WebPageTest, the DevTools Performance panel with CPU and network throttling (mid-range mobile, slow 4G), and the Performance insights for LCP, INP and CLS.
3. Record a baseline: metrics, page weight by type, number of requests, JavaScript size (compressed and uncompressed), main-thread long tasks.

## 2. Diagnose by metric

| Metric | Find the cause | Typical fixes |
| :--- | :--- | :--- |
| LCP | Which element is LCP, and its four phases: time to first byte, resource load delay, resource load duration, element render delay | Faster server or CDN and caching; make the LCP image discoverable in HTML (no lazy-loading, `fetchpriority="high"`, preload if discovered late); smaller, modern image formats; remove render-blocking CSS/JS; server-render the LCP content |
| INP | DevTools Performance panel: long tasks during the slow interaction (input delay, processing, presentation delay) | Break up long tasks (`scheduler.yield()` where supported, otherwise `setTimeout`); reduce work in event handlers; avoid large re-renders (memoisation, virtualised lists); move heavy work to Web Workers; reduce third-party scripts |
| CLS | DevTools "Layout shifts" track; which elements move | `width`/`height` or `aspect-ratio` on media and embeds; reserve space for ads and late content; font fallbacks with `size-adjust`; animate `transform` and `opacity` only; no content inserted above existing content |

## 3. Common wins (verify each with a measurement)

- **Images**: right size (`srcset`/`sizes`), AVIF/WebP, compression, lazy-load below the fold, SVG for icons. Tools: Squoosh, `sharp` (0.35.5), SVGO (`svgo` 4.1.0), an image CDN.
- **Fonts**: system stack or few self-hosted WOFF2 files; subset; `font-display: swap`; preload the critical one; metric-matched fallbacks.
- **JavaScript**: propose removing unused dependencies, with approval (`knip`, bundle analysers such as `vite-bundle-visualizer` or `@next/bundle-analyzer`); code-split by route; lazy-load below-the-fold and interaction-only components; prefer server rendering and islands; defer third-party scripts or load them after interaction.
- **CSS**: propose removing unused CSS, with approval; avoid large `@import` chains; inline critical CSS only when it measurably helps.
- **Network**: HTTP/2 or HTTP/3, Brotli, CDN, long immutable cache for hashed files, `preconnect` to critical origins, `103 Early Hints` where the host supports it.
- **Navigation**: prefetch or prerender likely next pages (Speculation Rules API in Chromium browsers, framework link prefetching); back/forward cache eligibility (avoid `unload` handlers, check in DevTools Application panel).

## 4. Prevent regressions

- Budgets per page type in Lighthouse CI (`@lhci/cli` 0.15.1) assertions or bundle-size checks; fail the build on regression.
- Track field Core Web Vitals over time (Search Console, CrUX dashboard, RUM).
- Review the performance cost of every new dependency, font, image-heavy design and third-party tag before adding it. Designers and developers share the budget.

## 5. Report

Report before and after numbers from the same tool, device profile and network profile, with the field data where available, and say which changes produced which gains. Example: `LCP (lab, Moto G Power profile, slow 4G): 4.1 s → 2.2 s after preloading the hero AVIF and inlining critical CSS`.
