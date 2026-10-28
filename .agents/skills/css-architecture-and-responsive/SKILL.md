---
name: css-architecture-and-responsive
description: Write, organise and refactor CSS for responsive, themeable, maintainable interfaces - layout with grid and flexbox, container queries, fluid typography and spacing, cascade layers, custom properties and tokens, dark mode, logical properties, modern colour (OKLCH, color-mix), Tailwind, CSS Modules, Sass, and checking browser support with Baseline. Use when styling components or pages, fixing layout bugs, making a design responsive, adding dark mode or themes, cleaning up specificity problems, or choosing a CSS approach.
license: MIT
metadata:
  version: "1.0.0"
---

# CSS Architecture and Responsive Design

Follow [11-frontend-code](../../rules/11-frontend-code.md) section 5. Feature support data (Baseline status from the `web-features` package) and references are in [references/modern-css.md](references/modern-css.md).

## 1. Organise the cascade

- Order styles with cascade layers so specificity fights disappear: `@layer reset, tokens, base, layout, components, utilities;`. Third-party CSS goes into its own layer.
- Keep selectors flat and low-specificity: classes, attribute selectors and `:where()` for resets. Avoid IDs and long descendant chains in component styles.
- Components own their styles (CSS Modules, scoped styles, or BEM-like class names in plain CSS); pages compose components; utilities stay small.
- Tokens as custom properties at `:root` (or on a theme scope); components read semantic tokens only ([design-system-and-tokens](../design-system-and-tokens/SKILL.md)).

## 2. Layout

| Problem | Use |
| :--- | :--- |
| One-dimensional row or column, wrapping items | Flexbox with `gap` and `flex-wrap` |
| Two-dimensional page or card layout | Grid with named areas or `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` |
| Children aligning to a parent grid | `subgrid` |
| A component that adapts to its own width | Container queries: `container-type: inline-size` and `@container (width > 30rem)` |
| Centred readable column | `inline-size: min(100% - 2rem, 65ch); margin-inline: auto;` |
| Full-height mobile sections | `min-block-size: 100svb` or `100dvh` (small/dynamic viewport units) rather than `100vh` |
| Sticky header that should not hide focused elements | `position: sticky` plus `scroll-padding-block-start` on the scroller |

Use logical properties (`inline`, `block`, `start`, `end`) so layouts work in right-to-left languages.

## 3. Responsive strategy

1. Mobile-first: base styles for the narrowest layout; add complexity with `@media (width >= 48rem)` (range syntax) at content-driven breakpoints, in `rem` or `em` so they follow text zoom.
2. Prefer intrinsic and fluid techniques over many breakpoints: `clamp()` for type and spacing, `min()`/`max()`, `auto-fit` grids, container queries for components.
3. Fluid type example that still respects user zoom (mixing `rem` with `vw`): `font-size: clamp(1.5rem, 1rem + 2.5vw, 2.5rem);`. Generate scales with [Utopia](https://utopia.fyi/).
4. Responsive images with `srcset`/`sizes` or `<picture>`, and `object-fit` for crops ([12-web-performance](../../rules/12-web-performance.md)).
5. Respect preferences: `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` (Windows high contrast: use system colours and do not remove borders and outlines), and, as an enhancement where supported, `prefers-reduced-transparency` for translucent, glass-style surfaces.

## 4. Theming and colour

- Light and dark themes redefine the same semantic tokens; set `color-scheme` so form controls and scrollbars match. Allow a user override (`[data-theme]`) on top of the OS preference.
- Define palettes in OKLCH for even perceptual steps; derive hover and tint states with `color-mix(in oklch, var(--action) 85%, black)` where supported, or precompute them in the token pipeline.
- Verify contrast for every theme and state ([10-accessibility](../../rules/10-accessibility.md)).

## 5. Choosing an approach (new projects; existing projects keep theirs)

| Approach | Good for | Watch out for |
| :--- | :--- | :--- |
| Plain CSS with layers, nesting and custom properties | Most sites; no build needed | Discipline in naming |
| CSS Modules | Component scoping in React, Vue, Svelte builds | Global tokens still needed |
| Tailwind CSS (v4: CSS-first `@theme` config) | Fast UI work with a constrained scale | Map the theme to your tokens; extract components, not long class strings; keep accessibility semantics |
| Sass | Mixins, loops, legacy codebases | Native CSS now covers nesting, variables and many functions |
| CSS-in-JS (runtime) | Existing codebases using it | Runtime cost and server-component compatibility; prefer zero-runtime options for new work |

## 6. Debugging CSS

Use browser DevTools: the Styles and Computed panes (who wins and why), the layout overlays for grid, flexbox and container queries, the "Rendering" panel for `prefers-*` emulation and vision-deficiency simulation, and the CSS Overview panel (Chrome) for colour and contrast inventory. Fix the cause (cascade order, specificity, a missing `min-width: 0` on flex children, overflow from long words: `overflow-wrap: anywhere`), not the symptom with `!important`.

## 7. Done when

- [ ] Stylelint or Biome passes; no new `!important` outside utilities and preference overrides
- [ ] Works from 320 px to wide screens, at 200 percent zoom, with text spacing overrides, and in right-to-left if supported
- [ ] Light, dark and forced-colors modes checked; reduced motion respected
- [ ] Every newer feature checked against the support target, with a fallback where needed
- [ ] Only tokens used for colour, type, spacing, radius and motion
