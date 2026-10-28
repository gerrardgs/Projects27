---
trigger: model_decision
description: "Apply when writing or reviewing front-end code: HTML, CSS, JavaScript or TypeScript, components in React, Vue, Svelte, Angular, Astro or similar, styling systems, browser support, state, forms, routing and rendering strategy."
---

# R-11: Front-End Code Standards

Rules 01 to 03 and 06 apply. This rule adds what is specific to code that runs in browsers. For procedures, use [frontend-from-scratch](../skills/frontend-from-scratch/SKILL.md), [framework-frontend-engineering](../skills/framework-frontend-engineering/SKILL.md) and [css-architecture-and-responsive](../skills/css-architecture-and-responsive/SKILL.md).

## 1. The platform first

- Use HTML for structure and meaning, CSS for presentation and layout, and JavaScript for behaviour that HTML and CSS cannot provide. Do not rebuild links, buttons, forms, dialogs, disclosure or scrolling in JavaScript.
- Progressive enhancement: core content and the main task should work with HTML and CSS alone where practical (a form posts to the server; a link navigates). JavaScript enhances it.
- Before adding a library, check the platform: `<dialog>`, `popover`, `<details>`, `fetch`, `URL`, `Intl` (dates, numbers, plurals, lists, relative time), `structuredClone`, `IntersectionObserver`, `ResizeObserver`, CSS container queries, `:has()`, nesting, cascade layers, `color-mix()`, View Transitions.

## 2. Browser support is a decision, not a guess

- Agree on the support target and write it down (for example "Baseline widely available" or a `browserslist` query). Check each newer feature on [Baseline / web-features](https://web-platform-dx.github.io/web-features/), [MDN](https://developer.mozilla.org/) and [Can I use](https://caniuse.com/) before using it.
- Use features that are not yet in the target behind `@supports`, feature detection or progressive enhancement, so the experience degrades gracefully. Never sniff user-agent strings to decide features.

## 3. Components

- One component, one responsibility. Props (inputs) are typed and minimal; avoid boolean prop explosions; prefer composition (children, slots) over configuration.
- Components consume design tokens and the design system's primitives. No magic numbers or hard-coded colours inside components.
- Each component handles every state from [09-design-principles](09-design-principles.md) section 4, and is accessible on its own: name, role, value, keyboard support, focus management.
- Keep server and client concerns apart. Data fetching, auth and secrets stay on the server; never ship secrets or private API keys to the browser bundle (anything in it is public, including `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` variables).

## 4. State and data

- Derive instead of duplicate: compute values from the source of truth rather than syncing copies with effects.
- Put state at the lowest level that needs it; lift it only when shared. Keep URL state (filters, tabs, pagination) in the URL so it survives reloads and can be shared.
- Model async data explicitly (idle, loading, success, error) and handle every branch in the UI. Cancel or ignore stale requests (`AbortController`).
- Use the framework's data layer or an established library (for example TanStack Query) rather than hand-rolled caches.

## 5. CSS

- Use the project's styling approach (CSS Modules, Tailwind, vanilla CSS with layers, Sass, CSS-in-JS) consistently. Do not mix a new one in.
- Layout with flexbox and grid, `gap`, logical properties (`margin-inline`, `padding-block`) and intrinsic sizing (`min()`, `max()`, `clamp()`). No layout with absolute positioning or JavaScript measurements where CSS can do it.
- Control specificity: low-specificity selectors, `@layer` for ordering, no `!important` except in utilities or user-preference overrides.
- Use relative units (`rem`) for type and spacing that should scale with user settings; never set the root font size in `px`.

## 6. Security in the browser

- Never insert untrusted strings as HTML (`innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `{@html}`) without a sanitiser such as DOMPurify; prefer text APIs (`textContent`, framework interpolation). Enforce it with [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) (Baseline newly available since February 2026): the CSP directive `require-trusted-types-for 'script'` makes string-to-DOM sinks throw unless the value comes from a reviewed policy. The [static-site template](../skills/frontend-from-scratch/assets/static-site/security-headers.js) enforces it with no policies at all.
- Validate URLs before using them in `href` or `src` (block `javascript:`). Use `rel="noopener noreferrer"` on links to untrusted sites with `target="_blank"`.
- Keep session tokens out of `localStorage` and `sessionStorage` (readable by any script after an XSS); prefer `HttpOnly`, `Secure`, `SameSite` cookies. Protect cookie-authenticated state changes against CSRF (`SameSite` plus a token or an `Origin` check).
- Ship a Content Security Policy where you control headers; use Subresource Integrity for third-party scripts and styles from CDNs; minimise third-party scripts.
- Validate on the client for usability, and always again on the server.

## 7. Quality gates

Type-check (TypeScript `strict`), lint (ESLint with the framework plugin and `jsx-a11y` or equivalent, Stylelint, or Biome), format (Prettier or Biome), test (unit, component, end-to-end), validate HTML, and run accessibility and performance checks ([12-web-performance](12-web-performance.md)) before declaring a UI change done. Include before and after screenshots for visual changes.
