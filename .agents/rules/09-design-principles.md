---
trigger: always_on
description: "Design principles for every UI, UX, graphic or front-end task: user goals first, visual hierarchy, consistency through design tokens, every state designed, content-first, responsive by default, and no invented assets, specs or research."
---

# R-09: Design Principles

Applies to interface design, graphic design and front-end work alike. A design is finished when real people can use it for its purpose, on their devices, in every state. For procedures, use the design skills indexed in [AGENTS.md](../../AGENTS.md) section 5.

## 1. Start from the user and the goal

- State who the design is for, the job they are trying to get done, the context (device, environment, time pressure, abilities), and how success will be measured. If the brief does not say, ask or write the assumption down.
- Solve the stated problem. Do not add screens, features, decorative effects or "delight" that nobody asked for; suggest them separately.
- Real research beats assumptions. Never invent user quotes, research findings, analytics numbers or test results. Mark proto-personas and hypotheses as such.

## 2. Hierarchy and clarity

- Each screen or layout has one primary action and one clear focal point. Hierarchy comes from size, weight, colour, contrast, spacing and position, in that order of strength. Do not make everything bold.
- Group related things and separate unrelated ones (Gestalt proximity, similarity, common region). Whitespace is structure, not waste.
- Align to a grid. Keep a consistent spacing scale (for example multiples of 4 or 8 px) instead of one-off values.
- Use familiar patterns (Jakob's law). Novel interaction needs a reason that serves the user.
- Write clear, specific, concise copy. Labels say what happens: "Save changes", not "OK". See [14-ux-writing-and-ethics](14-ux-writing-and-ethics.md).

## 3. Consistency through a system

- Use the project's design system, component library and **design tokens** (colour, typography, spacing, radius, elevation, motion). Never hard-code a raw value in a component when a token exists; propose a new token when one is missing.
- Same thing, same look, same name, same behaviour, everywhere. Different things look different.
- Follow the platform's conventions where they apply: Apple Human Interface Guidelines on Apple platforms, Material Design on Android, web conventions on the web.

## 4. Design every state

A component or screen is not designed until each relevant state is: default, hover, focus (visible), active/pressed, selected, disabled, read-only, loading (and slow loading), empty (first use, no results, cleared), partial, error (validation, server, offline, permission), success, and overflow (long text, many items, translation that is 30 to 40 percent longer, very large or very small numbers). Show what happens with real content, not just ideal lorem ipsum.

## 5. Responsive and adaptive by default

- Design for the smallest supported screen first, then add layout at breakpoints driven by the content, not by device names. Support zoom to 200 percent and text spacing changes without loss of content.
- Respect user preferences: colour scheme (light/dark), reduced motion, increased contrast, font size, language and reading direction.
- Touch targets are comfortable (aim for 44 by 44 CSS px; never below the 24 by 24 px minimum in WCAG 2.2).

## 6. Accessible and inclusive

Accessibility is a requirement, not a phase. Follow [10-accessibility](10-accessibility.md) from the first sketch: contrast, structure, keyboard, focus order, alternatives for non-text content, and no meaning carried by colour alone.

## 7. Do not fabricate design facts

- Do not invent brand colours, fonts, logos, guidelines, measurements or specs; take them from the source (brand guide, design file, existing code) or ask.
- Do not claim a contrast ratio, a Lighthouse score, a Core Web Vitals result or a usability finding you did not measure. Run the tool or label the value as unverified.
- No generic AI defaults: every visual technique (gradient, glow, glass, badge, card grid, animation, icon set) has a one-line written reason tied to hierarchy, identity or readability, and no statistic, testimonial, logo or claim is shown without a real source; an honest labelled placeholder beats a plausible fake ([anti-slop-filter](../skills/anti-slop-filter/SKILL.md)).
- Use only fonts, images, icons, illustrations, video and audio you are licensed to use, and record the source and licence ([13-visual-assets-and-licensing](13-visual-assets-and-licensing.md)). Never copy another product's proprietary design, logo or trade dress.

## 8. Hand-off is part of the design

A design is ready for build when it names its tokens and components, defines every state and breakpoint, specifies interactions and motion, includes real content and accessibility notes (headings, labels, focus order, alt text), and lists open questions. Developers should never have to guess.
