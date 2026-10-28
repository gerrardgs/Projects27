# Interfaces Without Slop

For web and mobile interfaces, dashboards and admin screens. It complements [web-frontend-engineering](../../web-frontend-engineering/SKILL.md) and [mobile-engineering](../../mobile-engineering/SKILL.md). Adapted from the antislop-ui, antislop-human and antislop-layoutmobile skills of [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) (MIT); accessibility figures checked against WCAG 2.2 on 2026-10-23.

## Hard gates

| Gate | Requirement |
| :--- | :--- |
| Honest content | No invented statistics, deltas, testimonials, activity feeds, logos, ratings or "John Doe" data in fields; real data or labelled placeholders |
| Working controls | Every link, menu item, button, form, toggle and row action does something real; navigation never points to sections that do not exist; verified by clicking through |
| States | Every data view has an empty, a loading (with text) and an error state that says what happened and what to do |
| Contrast | [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): at least 4.5:1 for normal text and 3:1 for large text, where large means at least 18 point or 14 point bold (about 24 and 18.5 CSS pixels); and 3:1 for user-interface components, focus indicators and meaningful graphics such as chart segments ([SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Measure, do not eyeball |
| Keyboard and focus | Everything reachable and operable with Tab, Enter, Space and Escape in a logical order, with a visible focus indicator; no mouse- or hover-only features |
| Zoom and reflow | Text resizes to 200% without loss of content or function ([SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)); content reflows at a width of 320 CSS pixels without two-dimensional scrolling ([SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)) |
| Touch targets | At least 24 by 24 CSS pixels or enough spacing ([SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), level AA); aim for 44 by 44 for primary controls ([SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html), level AAA) |
| Responsive | No horizontal scroll at phone width; columns collapse; full-height sections use the dynamic viewport unit (`dvh`), not `100vh`; a focused input is never hidden by the on-screen keyboard |
| Themes | A light and a dark theme, if both ship, both work |
| Source, not patches | Features are written in the source, not injected by a script that rewrites files or CSS afterwards |

## Purpose required (allowed with a reason, not by default)

Gradients and glow, glassmorphism on more than one or two elements, heavy shadows on every component, background grids or dot patterns, uniform pill-shaped corners, arrows on every button, capsule badges ("AI Powered", "Beta", "New") with no function, eyebrow labels above every headline, decorative status dots, generic AI icons (sparkles, magic wands, robots, orbs), emoji as decoration, stock illustrations unrelated to the product, template animations on everything, a dark theme forced as the default without a reason.

## Template shapes to question

A generic hero with three identical feature cards, "How it works" in exactly three steps, a "Trusted by" logo bar, a bento grid, a fake terminal window, three pricing tiers with "Most popular", a four-column footer, FAQ questions nobody asks; in apps, the default shell of sidebar, four stat cards, one chart and a table with Name, Status, Date and Actions. For each screen, name its job and the decision the user makes on it, and build the hierarchy around that. A chart's title states the question it answers ("Failed jobs per hour, last 24 hours"). If the design would still fit after swapping in another product's name, it has no identity yet.

Without design direction from the owner (brand, tone, references), keep the interface plain, say that it is a draft without direction, and ask for it.
