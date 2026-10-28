---
name: web-frontend-engineering
description: Build and review web user interfaces and web apps that are accessible (WCAG 2.2), fast (Core Web Vitals), secure in the browser, and well tested - components, state, forms, data fetching, routing, styling, internationalization and SEO, in React, Vue, Svelte, Angular or plain HTML/CSS/JS. Use when creating or changing pages, components, client-side logic, front-end build configuration, or when a website is slow, inaccessible or broken in some browsers.
license: MIT
metadata:
  version: "1.0.0"
---

# Web Frontend Engineering

Facts checked on 2026-10-15 against [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) (Recommendation, latest version dated 12 December 2024) and [web.dev Core Web Vitals](https://web.dev/articles/vitals).

## 1. Fit the existing app

Identify the framework, rendering mode (client-side, server-side, static, or hybrid), router, state and data-fetching approach, styling system, component library, and test tools already in use. Reuse existing components and design tokens before creating new ones.

## 2. Accessibility (WCAG 2.2 level AA as the default target)

- Use semantic HTML first: `button` for actions, `a` for navigation, `label` tied to every input, headings in order, landmarks (`main`, `nav`, `header`, `footer`). Use ARIA only when no native element fits.
- Everything works with a keyboard: visible focus, logical tab order, no keyboard traps; dialogs move focus in and restore it on close.
- Text alternatives for images and icons that carry meaning; empty `alt=""` for decorative images.
- Colour contrast of at least 4.5:1 for normal text and 3:1 for large text; never use colour alone to convey meaning.
- Forms: visible labels, errors described in text and linked to the field, no time limits without a way to extend them.
- Respect `prefers-reduced-motion`; support zoom to 200% and narrow viewports without loss of content.
- Test: automated checks (axe-core, for example `@axe-core/playwright`; `eslint-plugin-jsx-a11y` for React), then keyboard-only and screen-reader checks by hand. Automated tools catch only part of the problems.

## 3. Performance (Core Web Vitals, judged at the 75th percentile of page loads)

| Metric | Good | Common fixes |
| :--- | :--- | :--- |
| Largest Contentful Paint (LCP) | 2.5 s or less | Serve the hero image or text early, preload critical resources, avoid render-blocking scripts, use a CDN and caching |
| Interaction to Next Paint (INP, replaced FID in 2024) | 200 ms or less | Break up long tasks, defer non-critical JavaScript, avoid heavy work in event handlers, reduce re-renders |
| Cumulative Layout Shift (CLS) | 0.1 or less | Set width and height (or `aspect-ratio`) on media, reserve space for ads and embeds, avoid inserting content above existing content |

Also: ship less JavaScript (code splitting, tree shaking, no unused dependencies), modern image formats with responsive `srcset`, and font loading that avoids invisible text. Measure in the field with the `web-vitals` library and in the lab with Lighthouse (`@lhci/cli` in CI).

## 4. Security in the browser

- Never insert untrusted strings as HTML (`innerHTML`, `dangerouslySetInnerHTML`, `v-html`) without a sanitizer; prefer text APIs and framework escaping.
- Send a Content Security Policy; avoid inline scripts and `eval`.
- Keep tokens out of `localStorage` when an `HttpOnly` cookie can be used; protect cookie-authenticated state changes against CSRF (`SameSite` cookies plus tokens or origin checks).
- Validate on the server as well; client-side validation is only for user experience.
- Third-party scripts run with full page privileges: load only what is necessary, from trusted sources, with Subresource Integrity where possible.

## 5. State, data and forms

- Keep server state (fetched data) separate from UI state; use the project's data-fetching layer with caching, loading, error and empty states for every request.
- Model UI state as explicit states (idle, loading, success, error) rather than boolean combinations ([02-clean-code](../../rules/02-clean-code.md)).
- Debounce or cancel stale requests (`AbortController`); handle offline and slow networks.
- Forms: client validation mirrors the server schema; disable double submission; show server errors next to fields.

## 6. Internationalization and SEO

- No hard-coded user-visible strings when the project is localized; format dates, numbers and currency with `Intl`; support right-to-left layouts if required.
- Public pages: unique `title` and meta description, semantic headings, canonical URLs, server-rendered or static HTML for content that must be indexed, and a `sitemap.xml`.

## 7. Testing

- Component tests with the project's runner (for example Vitest or Jest with Testing Library, querying by role and label as users do).
- End-to-end tests for critical journeys with Playwright across Chromium, Firefox and WebKit.
- Visual regression for design-critical components (for example Playwright screenshot comparisons or Storybook-based tools).
- Accessibility checks in the end-to-end suite; Lighthouse budgets in CI for key pages.

## 8. Editor support (VS Code extension IDs, checked on the Marketplace)

`dbaeumer.vscode-eslint`, `esbenp.prettier-vscode` or `biomejs.biome`, `deque-systems.vscode-axe-linter`, `bradlc.vscode-tailwindcss` (if Tailwind is used), `vue.volar` (Vue), `svelte.svelte-vscode` (Svelte), `angular.ng-template` (Angular), `ms-playwright.playwright`, `vitest.explorer`.

## Done when

- [ ] Keyboard and screen-reader usable; automated accessibility checks pass
- [ ] No fabricated content, dead links or controls that do nothing; empty, loading and error states present; decorative effects have a stated purpose ([anti-slop interfaces reference](../anti-slop/references/interfaces.md))
- [ ] Core Web Vitals within the "good" thresholds for the changed pages (lab and, when available, field data)
- [ ] No unsanitized HTML injection; CSP not weakened
- [ ] Loading, empty, error and offline states handled
- [ ] Component and end-to-end tests cover the change in the supported browsers
