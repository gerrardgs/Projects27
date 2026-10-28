---
name: frontend-from-scratch
description: Build a new website, landing page, static site or small web app from an empty folder, platform first - semantic HTML, modern CSS with design tokens, progressive-enhancement JavaScript, accessibility, SEO and social metadata, performance, and choosing between plain HTML/CSS/JS, a static site generator, or a framework. Use when starting a new front-end, portfolio, marketing page, prototype or microsite, or when deciding which front-end stack to use.
license: MIT
metadata:
  version: "1.0.0"
---

# Front-End From Scratch

Start with the platform and add tools only when they pay for themselves ([04-dependencies](../../rules/04-dependencies.md), [11-frontend-code](../../rules/11-frontend-code.md)). A tested starter is in [assets/static-site/](assets/static-site/).

## 1. Choose the stack by need

| Need | Choose | Why |
| :--- | :--- | :--- |
| A few pages, mostly content, little interaction | Plain HTML, CSS and a little JS ([assets/static-site/](assets/static-site/)) | No build step, fastest pages, nothing to upgrade |
| Content site, blog, docs, marketing with many pages | Static site generator or content framework: Astro, Eleventy, Hugo; or a CMS | Templates and Markdown without shipping a client-side app |
| App-like UI with lots of state, auth, dashboards | A framework and its meta-framework: React with Next.js or React Router, Vue with Nuxt, Svelte with SvelteKit, Angular, Solid with SolidStart | Routing, data loading, server rendering and a component model; see [framework-frontend-engineering](../framework-frontend-engineering/SKILL.md) |
| Designer-led marketing site with no developers | Webflow, Framer, or a hosted CMS | Visual editing and hosting included; accept the platform's limits |

Record the choice and its reasons in an ADR. In an existing project, keep its stack.

## 2. Set up

1. Follow [project-bootstrap](../project-bootstrap/SKILL.md) for Git, `.editorconfig`, `.gitignore`, the Node.js version and the editor extensions in [its toolchains reference](../project-bootstrap/references/toolchains.md) (front-end and design sections).
2. Add quality tools: html-validate (or the framework's linter), Stylelint or Biome for CSS, ESLint or Biome for JS/TS, Prettier or Biome for formatting, `node --test` or Vitest for logic, Playwright for end-to-end and accessibility checks.
3. Set the support target (for example Baseline widely available) and write it in the README.

## 3. Build in layers

1. **HTML**: one `<h1>`, ordered headings, landmarks, a skip link, real links and buttons, labelled forms that work without JavaScript. Every page has `lang`, a unique `<title>`, a `meta name="description"`, and `meta name="viewport" content="width=device-width, initial-scale=1"` (never `maximum-scale=1` or `user-scalable=no`).
2. **CSS**: tokens as custom properties ([design-system-and-tokens](../design-system-and-tokens/SKILL.md)); `@layer` for order; a small modern reset; mobile-first layout with grid and flexbox; fluid type with `clamp()`; `:focus-visible` styles; `prefers-color-scheme` and `prefers-reduced-motion` handled. See [css-architecture-and-responsive](../css-architecture-and-responsive/SKILL.md).
3. **JavaScript**: ES modules, no globals; enhance what HTML already does; keep logic in pure functions that you can test in Node.js; wrap `localStorage` in `try/catch`; use `textContent`, never `innerHTML`, for data.
4. **Assets**: optimised responsive images with `width`/`height`, `loading="lazy"` below the fold, SVG icons, WOFF2 fonts or a system font stack ([12-web-performance](../../rules/12-web-performance.md)).

## 4. Metadata for search and sharing

- `<link rel="canonical">`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and `twitter:card` meta tags; a favicon set (`favicon.ico`, an SVG icon, `apple-touch-icon` 180 by 180 PNG) and a web app manifest if the site is installable.
- `robots.txt` and `sitemap.xml` for public sites; structured data (JSON-LD, [schema.org](https://schema.org/)) where it applies, validated with Google's [Rich Results Test](https://search.google.com/test/rich-results).
- References: [Google Search Central: SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Open Graph protocol](https://ogp.me/), [MDN: web app manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest).

## 5. The starter template

[assets/static-site/](assets/static-site/) is a page with no runtime dependencies (development tools only) with: skip link, landmarks, a labelled form with an error summary and inline errors, light/dark theme from tokens plus a toggle that reserves its space (no layout shift), 44 px targets, visible focus, reduced-motion support, an SVG favicon, a strict Content Security Policy (with Trusted Types enforced) and security headers from one source ([security-headers.js](assets/static-site/security-headers.js), rendered to `_headers` for Netlify and Cloudflare Pages and `vercel.json` for Vercel), a local dev server that sends the same headers and blocks path traversal, and tests.

```sh
cd assets/static-site
npm ci
npm run lint    # html-validate + Stylelint (stylelint-config-standard)
npm test        # 18 tests: validation, theme choice, dev server security, security headers in sync
npm start       # http://localhost:8080
```

Verified on 2026-10-15 with Node.js 24.9: lint clean, 18 tests passing; 0 axe-core violations (WCAG 2.0 to 2.2 A/AA tags) and 0 console errors under the strict CSP at phone and desktop sizes in light and dark mode, including the error state, using [accessibility-audit/assets/axe-check](../accessibility-audit/assets/axe-check/); Lighthouse 12.6.1 through `@lhci/cli` 0.15.1 scored 100 for performance, accessibility, best practices and SEO, with CLS 0.

## 6. Before launch

- [ ] HTML valid; no console errors; works with JavaScript disabled for core tasks
- [ ] Accessibility audit passed (automated and manual) per [10-accessibility](../../rules/10-accessibility.md)
- [ ] Lighthouse and field Core Web Vitals within budget ([web-performance-optimization](../web-performance-optimization/SKILL.md))
- [ ] Tested on current Chrome, Firefox, Safari (including iOS Safari) and Edge, on a real phone
- [ ] Metadata, social preview image, favicon, 404 page, `robots.txt` and `sitemap.xml` in place
- [ ] HTTPS, security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`) per [frontend-deployment](../frontend-deployment/SKILL.md), and no secrets in client code
- [ ] Privacy: consent before non-essential cookies or analytics ([14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md))
