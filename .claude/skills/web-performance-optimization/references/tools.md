# Web performance tools and references

Checked on 2026-10-15.

## Metrics and guidance (official)

| Topic | Link |
| :--- | :--- |
| Core Web Vitals overview and thresholds | [web.dev/articles/vitals](https://web.dev/articles/vitals) |
| LCP and how to optimise it | [web.dev/articles/lcp](https://web.dev/articles/lcp), [Optimize LCP](https://web.dev/articles/optimize-lcp) |
| INP and how to optimise it | [web.dev/articles/inp](https://web.dev/articles/inp), [Optimize INP](https://web.dev/articles/optimize-inp) |
| CLS and how to optimise it | [web.dev/articles/cls](https://web.dev/articles/cls), [Optimize CLS](https://web.dev/articles/optimize-cls) |
| Learn performance (course) | [web.dev/learn/performance](https://web.dev/learn/performance) |
| Images (course) | [web.dev/learn/images](https://web.dev/learn/images) |
| Speculation Rules API | [Chrome for Developers](https://developer.chrome.com/docs/web-platform/prerender-pages) |
| Back/forward cache | [web.dev/articles/bfcache](https://web.dev/articles/bfcache) |
| MDN performance guides | [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance) |

## Measurement tools

| Tool | Kind | Link |
| :--- | :--- | :--- |
| PageSpeed Insights | Field (CrUX) plus lab (Lighthouse) | [pagespeed.web.dev](https://pagespeed.web.dev/) |
| Chrome UX Report (CrUX) | Field dataset, API, BigQuery, Vis | [developer.chrome.com/docs/crux](https://developer.chrome.com/docs/crux) |
| Search Console Core Web Vitals report | Field, per URL group | [Search Console help](https://support.google.com/webmasters/answer/9205520) |
| `web-vitals` library 6.2.3 | RUM in your own analytics | [GitHub](https://github.com/GoogleChrome/web-vitals) |
| Lighthouse 13.5.0 | Lab audits (DevTools, CLI, Node) | [Lighthouse docs](https://developer.chrome.com/docs/lighthouse/overview) |
| Lighthouse CI 0.15.1 | Budgets and assertions in CI | [GitHub](https://github.com/GoogleChrome/lighthouse-ci) |
| Chrome DevTools Performance panel | Profiling, live metrics, insights | [Docs](https://developer.chrome.com/docs/devtools/performance) |
| WebPageTest | Real devices and locations, filmstrips, waterfalls | [webpagetest.org](https://www.webpagetest.org/) |
| DebugBear, SpeedCurve, Calibre | Commercial monitoring | Vendor sites |
| Unlighthouse 0.19.1 | Lighthouse for a whole site | [unlighthouse.dev](https://unlighthouse.dev/) |

## Optimisation tools

| Tool | Use | Link |
| :--- | :--- | :--- |
| Squoosh | Interactive image compression | [squoosh.app](https://squoosh.app/) |
| sharp 0.35.5 | Image processing in Node.js | [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/) |
| SVGO 4.1.0 | SVG optimisation | [svgo.dev](https://svgo.dev/) |
| Glyphhanger, `pyftsubset` (fontTools) | Font subsetting | [GitHub glyphhanger](https://github.com/zachleat/glyphhanger), [fontTools](https://fonttools.readthedocs.io/en/latest/subset/) |
| Fontaine, Capsize | Metric-matched font fallbacks | [GitHub fontaine](https://github.com/unjs/fontaine), [Capsize](https://seek-oss.github.io/capsize/) |
| knip 6.41.0 | Unused files, exports and dependencies | [knip.dev](https://knip.dev/) |
| Bundlephobia, pkg-size | Cost of an npm package before installing | [bundlephobia.com](https://bundlephobia.com/), [pkg-size.dev](https://pkg-size.dev/) |
| Partytown | Run third-party scripts in a web worker | [partytown.qwik.dev](https://partytown.qwik.dev/) |

## Reading

[HTTP Archive Web Almanac](https://almanac.httparchive.org/), [Smashing Magazine performance](https://www.smashingmagazine.com/category/performance), [Harry Roberts (CSS Wizardry)](https://csswizardry.com/), [Addy Osmani: Image Optimization (book)](https://www.smashingmagazine.com/printed-books/image-optimization/), [High Performance Browser Networking (Ilya Grigorik, free online)](https://hpbn.co/).
