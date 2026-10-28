# Front-end frameworks, libraries and tools

Latest versions on the npm registry, checked on 2026-10-15 with `npm view <package> version`. Use them to spot outdated advice, not as pins: the project's lockfile decides. Re-check before starting new work.

## Frameworks and meta-frameworks

| Framework | Package | Latest | Official docs | Notes |
| :--- | :--- | :--- | :--- | :--- |
| React | `react`, `react-dom` | 19.3.1 | [react.dev](https://react.dev/) | Actions, `use`, Server Components with a supporting framework; React Compiler ([docs](https://react.dev/learn/react-compiler)) |
| Next.js | `next` | 16.4.1 | [nextjs.org/docs](https://nextjs.org/docs) | App Router; check the version's caching defaults |
| React Router (framework mode, formerly Remix) | `react-router` | 8.4.0 | [reactrouter.com](https://reactrouter.com/) | |
| Vue | `vue` | 3.5.44 | [vuejs.org](https://vuejs.org/) | Composition API with `<script setup>` |
| Nuxt | `nuxt` | 4.6.1 | [nuxt.com/docs](https://nuxt.com/docs) | |
| Svelte | `svelte` | 5.57.2 | [svelte.dev/docs/svelte](https://svelte.dev/docs/svelte) | Runes (`$state`, `$derived`, `$effect`, `$props`) |
| SvelteKit | `@sveltejs/kit` | 3.1.0 | [svelte.dev/docs/kit](https://svelte.dev/docs/kit) | |
| Angular | `@angular/core` | 22.2.3 | [angular.dev](https://angular.dev/) | Signals, standalone components, built-in control flow |
| Astro | `astro` | 7.3.8 | [docs.astro.build](https://docs.astro.build/) | Islands; bring components from any framework |
| Solid | `solid-js` | 1.9.17 | [docs.solidjs.com](https://docs.solidjs.com/) | Fine-grained reactivity |
| Eleventy | `@11ty/eleventy` | 3.1.6 | [11ty.dev](https://www.11ty.dev/) | Static site generator |
| Hugo | Go binary | see site | [gohugo.io](https://gohugo.io/documentation/) | Static site generator |
| Qwik | `@builder.io/qwik` | 1.20.2 | [qwik.dev](https://qwik.dev/) | Resumability |
| Lit | `lit` | 3.3.3 | [lit.dev](https://lit.dev/) | Web Components |
| htmx | `htmx.org` | 2.0.11 | [htmx.org](https://htmx.org/) | HTML-over-the-wire |
| Alpine.js | `alpinejs` | 3.17.4 | [alpinejs.dev](https://alpinejs.dev/) | Small behaviour layer |

Mobile and desktop with web skills: React Native ([reactnative.dev](https://reactnative.dev/)) with Expo ([docs.expo.dev](https://docs.expo.dev/)), Flutter ([docs.flutter.dev](https://docs.flutter.dev/)), Ionic ([ionicframework.com/docs](https://ionicframework.com/docs)), Capacitor ([capacitorjs.com/docs](https://capacitorjs.com/docs)), Tauri ([tauri.app](https://tauri.app/)), Electron ([electronjs.org/docs](https://www.electronjs.org/docs/latest/)). Native: SwiftUI ([Apple docs](https://developer.apple.com/documentation/swiftui)), Jetpack Compose ([Android docs](https://developer.android.com/compose)).

## Build tools and language

| Tool | Package | Latest | Docs |
| :--- | :--- | :--- | :--- |
| Vite | `vite` | 8.3.4 | [vite.dev](https://vite.dev/) |
| TypeScript | `typescript` | 7.0.2 | [typescriptlang.org/docs](https://www.typescriptlang.org/docs/) |
| Lightning CSS | `lightningcss` | 1.33.0 | [lightningcss.dev](https://lightningcss.dev/) |
| PostCSS | `postcss` | 8.5.30 | [postcss.org](https://postcss.org/) |
| Autoprefixer | `autoprefixer` | 10.6.1 | [GitHub](https://github.com/postcss/autoprefixer) |
| Sass | `sass` (Dart Sass) | 1.105.1 | [sass-lang.com](https://sass-lang.com/documentation/) |
| Tailwind CSS | `tailwindcss` | 4.3.3 | [tailwindcss.com/docs](https://tailwindcss.com/docs) (v4: CSS-first config with `@theme`) |
| Browserslist | `browserslist` | 4.29.3 | [browsersl.ist](https://browsersl.ist/) |

## Quality tools

| Tool | Package | Latest | Docs |
| :--- | :--- | :--- | :--- |
| ESLint | `eslint` | 10.12.0 | [eslint.org/docs](https://eslint.org/docs/latest/) |
| typescript-eslint | `typescript-eslint` | 8.71.2 | [typescript-eslint.io](https://typescript-eslint.io/). Peer range on 2026-10-16: `typescript >=4.8.4 <6.1.0`, so it does not yet support TypeScript 7; pin TypeScript 5.x or 6.0 where typed linting is needed, or lint with Biome |
| eslint-plugin-jsx-a11y | `eslint-plugin-jsx-a11y` | 6.10.2 | [GitHub](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) |
| Biome (lint and format) | `@biomejs/biome` | 2.5.15 | [biomejs.dev](https://biomejs.dev/) |
| Prettier | `prettier` | 3.9.10 | [prettier.io/docs](https://prettier.io/docs/) |
| Stylelint | `stylelint` | 17.16.0 | [stylelint.io](https://stylelint.io/) |
| html-validate | `html-validate` | 11.16.2 | [html-validate.org](https://html-validate.org/) |
| knip (unused files, exports, dependencies) | `knip` | 6.41.0 | [knip.dev](https://knip.dev/) |

## Data, state, forms, motion

| Need | Options |
| :--- | :--- |
| Server state | [TanStack Query](https://tanstack.com/query/latest), [SWR](https://swr.vercel.app/), [Apollo Client](https://www.apollographql.com/docs/react/) |
| Client state | [Zustand](https://zustand.docs.pmnd.rs/), [Redux Toolkit](https://redux-toolkit.js.org/), [Pinia](https://pinia.vuejs.org/), [NgRx](https://ngrx.io/), [XState](https://stately.ai/docs) |
| Schemas and forms | [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [React Hook Form](https://react-hook-form.com/), [TanStack Form](https://tanstack.com/form/latest), [Conform](https://conform.guide/) |
| Routing | Framework router; [TanStack Router](https://tanstack.com/router/latest) |
| Animation | [Motion](https://motion.dev/) (`motion` 14.2.0), [GSAP](https://gsap.com/docs/v3/) (`gsap` 3.15.0, free including plugins since 2025), CSS and the Web Animations API |
| 3D | [three.js](https://threejs.org/docs/) (`three` 0.186.1), [React Three Fiber](https://r3f.docs.pmnd.rs/) |
| Charts | See [data-visualization-design](../../data-visualization-design/SKILL.md) |
| Sanitising HTML | [DOMPurify](https://github.com/cure53/DOMPurify) |
| Internationalisation | [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl), [FormatJS](https://formatjs.github.io/), [next-intl](https://next-intl.dev/), [vue-i18n](https://vue-i18n.intlify.dev/), [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) |

## Learning resources

[MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development), [web.dev Learn](https://web.dev/learn), [javascript.info](https://javascript.info/), [Frontend Masters](https://frontendmasters.com/), [Patterns.dev](https://www.patterns.dev/), [The Odin Project](https://www.theodinproject.com/), [freeCodeCamp](https://www.freecodecamp.org/), [State of JS](https://stateofjs.com/), [State of CSS](https://stateofcss.com/), [roadmap.sh frontend](https://roadmap.sh/frontend).
