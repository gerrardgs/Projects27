# Modern CSS and HTML features: support status and references

Baseline status taken from the `web-features` npm package, version 3.42.0, on 2026-10-15, and re-checked with 3.43.0 on 2026-10-16 (no status changed). **Widely available** means supported in all core browsers (Chrome, Edge, Firefox, Safari on desktop and mobile) for at least 30 months; **newly available** means supported in all of them, but recently; **limited** means not yet in all core browsers. Always confirm on the feature's page before relying on it: [Baseline](https://web.dev/baseline), [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/), [MDN](https://developer.mozilla.org/), [Can I use](https://caniuse.com/).

To re-check: `npm install web-features` and read `features["<id>"].status`.

## Widely available (safe for most support targets)

| Feature (web-features id) | Since (newly → widely) |
| :--- | :--- |
| Flexbox (`flexbox`), Grid (`grid`) | 2015 / 2017 → 2018 / 2020 |
| `aspect-ratio`, logical properties | 2021-09 → 2024-03 |
| Cascade layers `@layer` (`cascade-layers`) | 2022-03 → 2024-09 |
| `:focus-visible`, `<dialog>` | 2022-03 → 2024-09 |
| Small, large, dynamic viewport units `svh`/`lvh`/`dvh` (`viewport-unit-variants`) | 2022-12 → 2025-06 |
| Size container queries (`container-queries`) | 2023-02 → 2025-08 |
| `color-gamut` media query | 2023-02 → 2025-08 |
| Media query range syntax (`media-query-range-syntax`) | 2023-03 → 2025-09 |
| Import maps (`import-maps`) | 2023-03 → 2025-09 |
| `inert` attribute | 2023-04 → 2025-10 |
| `oklab()`/`oklch()` (`oklab`), `color-mix()` | 2023-05 → 2025-11 |
| `subgrid` | 2023-09 → 2026-03 |
| `image-set()` | 2023-09 → 2026-03 |
| CSS nesting (`nesting`) | 2023-12 → 2026-06 |
| `:has()` (`has`) | 2023-12 → 2026-06 |
| Lazy-loading images and iframes (`loading-lazy`) | 2023-12 → 2026-06 |
| AVIF images (`avif`) | 2024-01 → 2026-07 |
| `min()`, `max()`, `clamp()` (`min-max-clamp`) | 2020-07 → 2023-01 |
| `prefers-reduced-motion`, `prefers-color-scheme`, `font-display` | 2020-01 → 2022-07 |

## Newly available (in every core browser, but recently; check your support target)

| Feature | Newly available since |
| :--- | :--- |
| `light-dark()` | 2024-05 |
| `text-wrap: balance` (`text-wrap-balance`) | 2024-05 |
| `@property` registered custom properties (`registered-custom-properties`) | 2024-07 |
| `@starting-style`, `transition-behavior: allow-discrete` | 2024-08 |
| Exclusive accordions `<details name>` (`details-name`) | 2024-09 |
| Relative colour syntax (`relative-color`) | 2024-09 |
| `fetchpriority` (`fetch-priority`) | 2024-10 |
| Popover API (`popover`) | 2025-01 |
| `content-visibility` | 2025-09 |
| Same-document View Transitions (`view-transitions`) | 2025-10 |
| Invoker commands `command`/`commandfor` (`invoker-commands`) | 2025-12 |
| Navigation API (`navigation`) | 2026-01 |
| Trusted Types (`trusted-types`) | 2026-02 |
| `@scope` (`scope`) | 2026-03 |
| `contrast-color()` | 2026-04 |
| Style container queries (`container-style-queries`) | 2026-05 |
| `field-sizing` | 2026-06 |
| `sibling-count()`/`sibling-index()` (`sibling-count`) | 2026-08 |

## Limited availability (progressive enhancement only, with `@supports` or a fallback)

Anchor positioning (`anchor-positioning`), cross-document View Transitions, scroll-driven animations, `text-wrap: pretty`, `interpolate-size`, customisable `<select>` (`appearance: base-select`), `attr()` typed values, `corner-shape`, scroll-state container queries, interest invokers, `reading-flow`, grid lanes (masonry), speculation rules, CSS `if()` (`if`), custom functions with `@function` (`function`), and the `prefers-reduced-transparency` media query.

Where browsers are heading: [Interop 2026](https://web.dev/blog/interop-2026) (announced 12 February 2026) commits Apple, Google, Microsoft, Mozilla and others to improving 20 focus areas this year, including anchor positioning, View Transitions, the Navigation API, scroll snap, the `zoom` property, WebRTC and WebTransport. Progress is public on the [Interop dashboard](https://wpt.fyi/interop). Features in focus areas are the likeliest to become Baseline next; they are still not safe without a fallback until they are.

Example of safe enhancement:

```css
.tooltip { position: absolute; inset-block-start: 100%; } /* fallback */

@supports (anchor-name: --a) {
  .trigger { anchor-name: --tip; }
  .tooltip { position-anchor: --tip; position-area: block-end; inset-block-start: auto; }
}
```

## Essential references

| Topic | Link |
| :--- | :--- |
| CSS reference | [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| Learn CSS (course) | [web.dev/learn/css](https://web.dev/learn/css) |
| Specifications and status | [W3C CSS current work](https://www.w3.org/Style/CSS/current-work) |
| Grid guide | [CSS-Tricks: A complete guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) |
| Flexbox guide | [CSS-Tricks: A complete guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) |
| Container queries | [MDN: container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) |
| Cascade layers | [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) |
| Colour | [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), [oklch.com](https://oklch.com/) |
| Fluid type and space | [Utopia](https://utopia.fyi/) |
| Intrinsic layouts | [Every Layout](https://every-layout.dev/) |
| Modern reset | [Andy Bell: A (more) modern CSS reset](https://piccalil.li/blog/a-more-modern-css-reset/), [Josh Comeau: A modern CSS reset](https://www.joshwcomeau.com/css/custom-css-reset/) |
| Browser news | [Chrome for Developers blog](https://developer.chrome.com/blog), [WebKit blog](https://webkit.org/blog/), [Mozilla Hacks](https://hacks.mozilla.org/), [Interop dashboard](https://wpt.fyi/interop) |
| Interop and test results | [web-platform-tests dashboard](https://wpt.fyi/) |
| Experts | [Smashing Magazine](https://www.smashingmagazine.com/category/css), [Ahmad Shadeed](https://ishadeed.com/), [Kevin Powell](https://www.kevinpowell.co/), [Una Kravets](https://una.im/), [Jen Simmons](https://jensimmons.com/), [Rachel Andrew](https://rachelandrew.co.uk/) |
