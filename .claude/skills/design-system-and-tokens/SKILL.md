---
name: design-system-and-tokens
description: Create, extend, audit or document a design system - design tokens in the W3C Design Tokens Community Group format, theming (light, dark, brands), token pipelines with Style Dictionary, component libraries, Storybook documentation, contribution and versioning. Use when asked to set up design tokens, build or audit a component library, sync Figma variables with code, add a theme or dark mode, fix inconsistent colours or spacing across a product, or document components.
license: MIT
metadata:
  version: "1.0.0"
---

# Design System and Tokens

A design system is the shared source of truth for design and code: foundations (tokens), components, patterns, guidelines and the process that keeps them in sync. Tooling and references are in [references/tooling.md](references/tooling.md). A tested, dependency-free token pipeline is in [assets/design-tokens/](assets/design-tokens/).

## 1. Audit before you build

1. Inventory what exists: colours, font sizes, spacing values, radii, shadows, breakpoints and components, in both the design files and the code (search CSS for hex values and `px` sizes; count unique values).
2. Group duplicates and near-duplicates; decide the intended value for each. Record decisions in an ADR.
3. Agree on scope and owners: which products adopt it, who reviews contributions, and how releases are communicated.

## 2. Token architecture

Use three tiers, and let components depend only on the upper two:

| Tier | Example | Rule |
| :--- | :--- | :--- |
| Primitive (palette, scale) | `color.blue.600`, `space.4` | Raw values; never used directly in components |
| Semantic (role) | `theme.action.default`, `theme.text.muted` | Aliases to primitives; one set per theme or brand |
| Component (optional) | `button.primary.background` | Aliases to semantic tokens; only where components need their own knobs |

- Store tokens in the [DTCG format 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) (`$value`, `$type`, `$description`, aliases like `"{color.blue.600}"`), the first stable version of the community standard. Tools such as Style Dictionary, Tokens Studio, Penpot and Figma import and export it, with differences in coverage; check each tool's docs.
- Name by role, not by appearance (`danger`, not `red`). Use one naming scheme in design and code.
- Themes (light, dark, high contrast, brands) redefine the same semantic token set. Describe them with the [DTCG Resolver Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/): a `resolver.json` with **sets** (shared sources), **modifiers** with **contexts** (for example `theme`: `light`, `dark`), and a `resolutionOrder` in which later sources override earlier ones. Its `version` is `"2025.10"`; the published report shows placeholder dates there, corrected upstream ([PR #357](https://github.com/design-tokens/community-group/pull/357)). The template builds every theme from its `tokens/resolver.json` and checks that every theme defines the same paths.

## 3. Build the pipeline

1. Choose the source of truth: token JSON in the repository (recommended; reviewable and versioned), synced to Figma variables through a plugin or the Figma REST API (the Variables endpoints need a Full seat in an Enterprise organisation, per Figma's docs on 2026-10-15).
2. Generate platform outputs from it: CSS custom properties, a JS/TS module, iOS and Android resources. Use [Style Dictionary](https://styledictionary.com/) for multi-platform output, or start from [assets/design-tokens/](assets/design-tokens/) for web-only. To let Claude Design draw with the same system, upload it with `/design-sync` in Claude Code ([ai-design-and-artifacts](../ai-design-and-artifacts/SKILL.md) section 2); the repository stays the source of truth.
3. Test the tokens in CI: valid format, no broken aliases or cycles, identical theme shapes, and **contrast for every text/background pair in every theme**. The template does all of this:

   ```sh
   cd assets/design-tokens
   npm ci
   npm run typecheck && npm test   # 23 tests: parsing, aliases, resolver, CSS output, WCAG contrast
   npm run build                   # writes dist/tokens.css and prints every contrast ratio
   ```

## 4. Components

- Build each component once, with an API reviewed by design and engineering: variants, sizes, states, slots, and accessibility behaviour (keyboard, focus, roles, names).
- Prefer accessible headless primitives instead of re-implementing complex widgets: React Aria, Radix Primitives, Headless UI, Ark UI, Angular CDK, Bits UI or Melt UI for Svelte. Style them with your tokens.
- Document each component in Storybook (or the project's docs site): purpose, when not to use it, props, every state as a story, do and don't examples, accessibility notes, and the matching Figma component (Code Connect).
- Test components: unit or interaction tests, accessibility checks on every story (Storybook a11y addon / axe), and visual regression ([frontend-testing-and-visual-qa](../frontend-testing-and-visual-qa/SKILL.md)).

## 5. Govern and release

- Version the package with Semantic Versioning ([08-git-workflow](../../rules/08-git-workflow.md)): renaming or removing a token or component prop is a breaking change. Deprecate first (DTCG `$deprecated`, JSDoc `@deprecated`, console warnings in development), then remove in the next major version.
- Publish a changelog and migration notes; provide codemods for large renames.
- Measure adoption (component usage, remaining hard-coded values) and remove one-off styles over time.

## 6. Done when

- [ ] Tokens in DTCG format, three tiers, role-based names, documented
- [ ] Every theme passes the contrast checks in CI
- [ ] Components consume only semantic or component tokens; no raw values
- [ ] Each component documented with all states and accessibility notes, and tested
- [ ] Design files and code reference the same token and component names
- [ ] Release process, versioning and deprecation policy written down
