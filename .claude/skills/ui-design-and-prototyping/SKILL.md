---
name: ui-design-and-prototyping
description: Design user interfaces from wireframe to high-fidelity mockup and interactive prototype - layout grids, spacing, typography scales, colour systems, components, states, responsive variants, dark mode, iconography, and prototyping in Figma, Penpot, Sketch, Framer or code. Use when asked to design or redesign a screen, page, app, dashboard, landing page or component, to create wireframes, mockups or prototypes, to pick fonts or colours for a UI, or to make a UI look more polished.
license: MIT
metadata:
  version: "1.0.0"
---

# UI Design and Prototyping

Follow [09-design-principles](../../rules/09-design-principles.md) and [10-accessibility](../../rules/10-accessibility.md). Foundations (grids, type scales, colour, spacing) are in [references/ui-foundations.md](references/ui-foundations.md); tools and their official docs are in [references/design-tools.md](references/design-tools.md).

## 1. Inputs before pixels

- The brief or research ([ux-research-and-strategy](../ux-research-and-strategy/SKILL.md)): users, goals, key tasks, success metric.
- The existing design system, brand guide, tokens and components. Reuse them; list any gaps instead of improvising new styles.
- Real content: actual copy, data ranges, image ratios, longest names, translations. Design with it, not with lorem ipsum.
- Target platforms, breakpoints and the support target (web, iOS, Android, desktop) and their guidelines: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [Material Design 3](https://m3.material.io/), [Fluent 2](https://fluent2.microsoft.design/). Both mobile platforms changed their visual language in 2025: Apple's **Liquid Glass** (translucent, refractive materials across iOS 26 and Apple's other platforms; [technology overview](https://developer.apple.com/documentation/technologyoverviews/liquid-glass), [HIG materials](https://developer.apple.com/design/human-interface-guidelines/materials)) and Google's **Material 3 Expressive** (an update of Material 3, not a Material 4, with bolder shape, colour, type and spring-based motion; [building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)). Translucent surfaces lower text contrast: check contrast over the real backgrounds behind them, and design for the Reduce Transparency and Increase Contrast settings.

## 2. Low fidelity: structure and flow

1. Sketch the user flow: entry points, steps, decisions, exits, and error paths.
2. Wireframe each screen in greyscale: content priority, layout regions, primary and secondary actions. Explore two or three meaningfully different directions when the problem is open.
3. Validate the flow early (a quick usability test with clickable wireframes, or a review with stakeholders and engineers) before investing in visual detail.

## 3. High fidelity: visual design

1. **Grid and spacing**: choose a column grid per breakpoint (for example 4 columns on phones, 8 on tablets, 12 on desktop) and a spacing scale based on 4 or 8 px. Use auto layout (Figma, Penpot flex/grid layout) so frames resize like CSS.
2. **Typography**: a type scale with a clear ratio (for example 1.2 or 1.25), at most two families, body text at least 16 px on the web, line length about 45 to 75 characters, line height about 1.4 to 1.6 for body text and tighter for headings.
3. **Colour**: neutrals for most of the surface, one primary action colour, semantic colours for success, warning, danger and info, each checked for contrast in every theme. Build light and dark themes from tokens, not by inverting colours.
4. **Components**: build or reuse components with variants and properties for every state (see rule 09 section 4); name them like the code components.
5. **Iconography and imagery**: one icon family with a consistent grid, stroke and corner style; licensed imagery with consistent treatment ([13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md)).
6. **Responsive variants**: design the smallest and largest breakpoints at least, plus any where the layout changes. Show long content, empty states and errors.

## 4. Make deliberate choices, not generated defaults

AI-assisted design tends to converge on the same look whatever the subject. Anthropic's open-source [frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache-2.0) names the common tells: identical rounded cards with the same soft shadow everywhere, decorative gradient washes, an all-caps eyebrow label above every heading, one accented word in each headline, numbered markers on content that is not a sequence, and fade-and-slide entrance animations on every section. None is wrong in itself; each is wrong as a default.

- Derive palette, typography and layout from the subject, audience and brand, and write the reasoning down in the design plan before building.
- Review the plan against the brief: if a choice would come out the same for any similar product, revise it or justify it.
- Put the boldness in one place and keep the rest quiet; remove decoration that does not serve the brief.
- Keep the quality floor regardless of style: tokens, every state, accessibility, responsive layout, reduced motion. [Vercel's Web Interface Guidelines](https://vercel.com/design/guidelines) ([source, MIT](https://github.com/vercel-labs/web-interface-guidelines)) are a concise, practical checklist for interaction details (keyboard, focus, forms, loading, feedback, touch targets).
- An existing brand or design system always wins over novelty.
- Before delivering, run the [anti-slop-filter](../anti-slop-filter/SKILL.md) skill: Design Read and dials, hard gates, a written reason for each technique, and a PASS/FAIL delivery report.

## 5. Prototype

- Pick fidelity for the question: clickable wireframes for flow, high-fidelity prototypes for usability and stakeholder sign-off, coded prototypes for complex interaction, motion, real data or performance.
- In Figma or Penpot, use interactive components, variables and conditional logic where useful, but do not build the whole product in the prototype tool. Use realistic latency and loading states when they matter.
- Annotate interaction details the prototype cannot show: keyboard behaviour, focus order, screen reader names, motion timing ([motion-and-interaction](../motion-and-interaction/SKILL.md)).

## 6. Check before hand-off

- [ ] Every screen has one clear primary action and a visible hierarchy in a squint test or a greyscale view
- [ ] Spacing, type and colour use the scale and tokens only; no one-off values
- [ ] Contrast verified with a tool for text, UI components and focus indicators, in every theme
- [ ] All states and breakpoints designed, with real and extreme content
- [ ] Touch targets at least 24 by 24 px (aim for 44); nothing depends on hover alone
- [ ] Copy reviewed against [14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md); no deceptive patterns
- [ ] Ready for [design-to-code-handoff](../design-to-code-handoff/SKILL.md)
