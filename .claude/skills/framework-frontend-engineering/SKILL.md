---
name: framework-frontend-engineering
description: Build and maintain front-end applications with React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Angular, Astro, Solid or similar - component architecture, rendering strategy (SSR, SSG, ISR, CSR, islands, server components), routing, data fetching, state management, forms, styling, internationalisation, and upgrades. Use when creating or changing components, pages or app architecture in a JavaScript framework, choosing a framework or rendering mode, managing state, or upgrading framework versions.
license: MIT
metadata:
  version: "1.0.0"
---

# Framework Front-End Engineering

Apply [11-frontend-code](../../rules/11-frontend-code.md), [10-accessibility](../../rules/10-accessibility.md) and [12-web-performance](../../rules/12-web-performance.md). Current versions and official docs per framework are in [references/frameworks.md](references/frameworks.md).

## 1. Ground in the project

1. Read `package.json`, the lockfile, the framework config (`next.config.*`, `nuxt.config.*`, `svelte.config.*`, `angular.json`, `astro.config.*`, `vite.config.*`) and the folder conventions. Note exact framework and library versions: APIs differ between majors (for example React 19 actions and `use`, Next.js App Router versus Pages Router, Svelte 5 runes versus Svelte 4 stores, Angular signals and standalone components, Vue Composition API versus Options API, Nuxt 4 `app/` directory).
2. Read two or three existing components and copy their patterns: file naming, styling approach, state library, data fetching, tests.
3. Check the framework's official docs **for the installed major version** before using an API ([03-verification](../../rules/03-verification.md)).

## 2. Choose the rendering strategy per route

| Content | Strategy |
| :--- | :--- |
| Same for everyone, changes rarely (marketing, docs, blog) | Static generation at build time (SSG), optionally revalidated |
| Personalised or frequently changing, needs SEO or fast first paint | Server-side rendering or server components, streaming where supported |
| Behind login, highly interactive (dashboards, editors) | Client rendering of the interactive parts is acceptable; keep data access on the server |
| Mostly static with a few interactive widgets | Islands or partial hydration (Astro islands, server components with small client components) |

Ship the least JavaScript the experience needs. Hydration cost is paid by every user's device.

## 3. Components

- Small, typed, single-purpose components; composition (children, slots, snippets) over boolean props.
- Separate presentational components (props in, markup out) from containers that fetch or mutate data.
- Accessible by construction: semantic elements, labelled controls, managed focus for dialogs and route changes. Use the design system's or a headless library's primitives for menus, comboboxes, tabs, dialogs and date pickers.
- Style with the project's approach and tokens. Keep component styles scoped (CSS Modules, Vue/Svelte scoped styles, Angular view encapsulation, Tailwind utilities with tokens in the theme).
- Framework idioms: React keys are stable IDs, effects only for synchronising with external systems, no derived state in effects; Vue uses `computed` for derived values; Svelte 5 uses `$state`, `$derived` and `$effect` sparingly; Angular uses signals, `OnPush`/zoneless change detection where the project does, and the built-in control flow (`@if`, `@for`).

## 4. Data, state and forms

- Fetch on the server or in the framework's loaders when possible; use the framework's caching and revalidation. On the client, use an established data library (TanStack Query, SWR, Apollo, or the framework's composables) for caching, deduplication and retries.
- State placement: local component state, then lifted state or context, then URL state, then a store (Zustand, Redux Toolkit, Pinia, NgRx Signal Store, Svelte stores) only for truly global client state.
- Forms: native form semantics, the framework's form actions where they exist (React 19 actions, SvelteKit form actions, Next.js server actions, Remix/React Router actions), schema validation shared between client and server (for example Zod, Valibot), and accessible errors ([assets/static-site](../frontend-from-scratch/assets/static-site/) shows the pattern).
- Validate everything again on the server; authorise every server action and API route ([06-security](../../rules/06-security.md)).

## 5. Internationalisation

Use the framework's i18n solution (for example next-intl, vue-i18n, Nuxt i18n, Paraglide, Angular i18n) with ICU messages, `Intl` formatting, locale-aware routing and `dir="rtl"` support. Never concatenate translated strings ([14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md)).

## 6. Upgrades

Follow [change-existing-code](../change-existing-code/SKILL.md) section 4: one major version at a time, read the official migration guide, run the official codemods (for example `npx @next/codemod`, `npx nuxi upgrade`, `npx sv migrate`, `ng update`), then type-check, test, and visually check key pages.

## 7. Done when

- [ ] Type-check, lint, unit/component tests and end-to-end tests pass
- [ ] Every new component handles all states and passes automated accessibility checks
- [ ] Rendering strategy chosen deliberately per route; bundle size checked for new dependencies
- [ ] No secrets or private data in client bundles; server inputs validated and authorised
- [ ] Screenshots or Storybook stories for visual changes
