# UI design foundations

Numbers below are common, defensible defaults, not laws. The project's design system wins. Links checked on 2026-10-15.

## Layout and spacing

| Topic | Default | Why / source |
| :--- | :--- | :--- |
| Spacing scale | 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96 | Divides evenly at common screen densities; used by Material Design and most systems ([Material Design 3: layout](https://m3.material.io/foundations/layout/layout-overview)) |
| Column grid | 4 / 8 / 12 columns for phone / tablet / desktop, fixed gutters | Common practice; see your design system |
| Breakpoints | Content-driven. Material Design 3 uses compact (under 600 dp), medium (600 to 839), expanded (840 to 1199), large (1200 to 1599) and extra-large (1600 and up) | [Material Design 3: breakpoints](https://m3.material.io/foundations/layout/applying-layout); choose where your layout breaks, and prefer container queries for components |
| Maximum content width | About 60 to 75 rem for reading layouts | Keeps line length readable |
| Touch target | 44 by 44 pt (Apple), 48 by 48 dp (Material); 24 by 24 CSS px is the WCAG 2.2 AA minimum | [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Material: accessibility](https://m3.material.io/foundations/designing/structure), [WCAG SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |

## Typography

| Topic | Default | Source |
| :--- | :--- | :--- |
| Body size on the web | At least 16 px (1 rem) | Browser default; avoids iOS zoom on input focus |
| Line length | 45 to 75 characters (66 often cited as ideal) | Bringhurst, *The Elements of Typographic Style*; [Baymard Institute](https://baymard.com/blog/line-length-readability) |
| Line height | About 1.5 for body text (WCAG SC 1.4.12 tests 1.5), 1.1 to 1.3 for headings | [WCAG SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) |
| Type scale ratio | 1.125 to 1.333 for UI; larger ratios for editorial | Tool: [Typescale](https://typescale.com/), [Utopia fluid type](https://utopia.fyi/type/calculator/) |
| Families | One or two; a variable font can replace several weights | [Google Fonts knowledge](https://fonts.google.com/knowledge) |
| Numerals | Tabular figures (`font-variant-numeric: tabular-nums`) in tables and changing numbers | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric) |

Further reading: [Practical Typography (Butterick)](https://practicaltypography.com/), [Google Fonts Knowledge](https://fonts.google.com/knowledge), [Material Design 3: typography](https://m3.material.io/styles/typography/overview), [Apple HIG: typography](https://developer.apple.com/design/human-interface-guidelines/typography).

## Colour

- Start from neutrals and one brand or action colour; derive tints and shades in a perceptual colour space (OKLCH) so steps look even. Tools: [OKLCH colour picker](https://oklch.com/), [Huetone](https://huetone.ardov.me/), [Leonardo (Adobe)](https://leonardocolor.io/), [Radix Colors](https://www.radix-ui.com/colors), [Tailwind CSS colours](https://tailwindcss.com/docs/colors).
- Semantic roles (surface, text, border, action, focus, success, warning, danger, info) map to palette steps per theme. Components use the roles.
- Check contrast with a tool: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/), Figma plugins (for example Stark), browser DevTools, or the tested script in [design-system-and-tokens](../../design-system-and-tokens/assets/design-tokens/). APCA ([apcacontrast.com](https://www.apcacontrast.com/)) is a candidate method for WCAG 3; WCAG 2.2 ratios remain the legal and conformance baseline.
- Dark mode: dark grey surfaces rather than pure black for large areas, reduced saturation for accents, elevation shown by lighter surfaces, and contrast re-checked. See [Material Design 3: color roles](https://m3.material.io/styles/color/roles).
- Colour vision deficiency: never rely on hue alone; simulate with Chrome DevTools rendering emulation or Figma plugins.

## Elevation, shape and density

- Use a small set of elevation levels (shadow and/or surface tone) with meaning (resting, raised, overlay, modal).
- Corner radius from tokens; nested radius = outer radius minus padding keeps corners concentric.
- Offer density only when users need it (data-heavy tools); keep targets usable at the densest setting.

## Visual design principles worth knowing

Gestalt principles (proximity, similarity, continuity, closure, figure/ground, common region), visual hierarchy, contrast, alignment, repetition, balance, rhythm, and white space. Good overviews: [Interaction Design Foundation: Gestalt principles](https://www.interaction-design.org/literature/topics/gestalt-principles), [NN/g: visual design principles](https://www.nngroup.com/articles/principles-visual-design/), [Refactoring UI](https://www.refactoringui.com/) (book).

## Inspiration and pattern libraries (study, do not copy)

[Mobbin](https://mobbin.com/), [Page Flows](https://pageflows.com/), [UI Patterns](https://ui-patterns.com/), [Dribbble](https://dribbble.com/), [Behance](https://www.behance.net/), [Land-book](https://land-book.com/), [Godly](https://godly.website/), [Awwwards](https://www.awwwards.com/), [Component Gallery](https://component.gallery/), [Design Systems Gallery (Storybook showcase)](https://storybook.js.org/showcase).
