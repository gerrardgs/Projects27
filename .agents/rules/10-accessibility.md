---
trigger: always_on
description: "Accessibility baseline for every design and front-end change: WCAG 2.2 Level AA, semantic HTML first, keyboard and focus, contrast, text alternatives, forms, motion, and testing with tools plus manual checks."
---

# R-10: Accessibility Baseline (WCAG 2.2 AA)

Target [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA (a W3C Recommendation since October 2023) unless the project requires more. Laws reference WCAG: the EU European Accessibility Act applies from 28 June 2025 (harmonised standard EN 301 549; its V4.1.1 of September 2026 aligns the web, document and software clauses with WCAG 2.2), and the US ADA Title II rule uses WCAG 2.1 AA. WCAG 2.2 AA covers both. WCAG 3.0 is still a Working Draft (checked 2026-10-15); do not claim conformance to it. For audits, use the [accessibility-audit](../skills/accessibility-audit/SKILL.md) skill.

## 1. Semantic HTML first, ARIA second

- Use the native element for the job: `<button>` for actions, `<a href>` for navigation, `<label>` for inputs, `<fieldset>`/`<legend>` for groups, `<table>` with `<th scope>` for tabular data, `<dialog>` for modal dialogs, `<details>`/`<summary>` for disclosure.
- One `<h1>` per page in most cases, then headings in order without skipping levels for styling. Use landmarks: `<header>`, `<nav>` (with `aria-label` when there are several), `<main>`, `<footer>`, `<aside>`.
- The first rule of ARIA: do not use ARIA when a native element or attribute does the job. Never put `role="button"` on a `<div>` instead of using `<button>`. When you do build a custom widget, follow the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) pattern completely (roles, states, and keyboard support). Use only roles and attributes that exist in [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/).
- Set `<html lang>`; mark passages in another language with `lang`. Give every page a unique, descriptive `<title>`.

## 2. Keyboard and focus

- Everything that works with a pointer works with a keyboard alone, in a logical order, with no keyboard traps (SC 2.1.1, 2.1.2, 2.4.3).
- Focus is always visible (SC 2.4.7) and not hidden behind sticky headers or overlays (SC 2.4.11). Never `outline: none` without an equally visible replacement; prefer `:focus-visible` styles.
- Manage focus on change: move it into an opened dialog and back to the trigger on close; move it to the new heading or the error summary after navigation or a failed submit. Do not use positive `tabindex`.
- Provide a "Skip to main content" link on sites with repeated navigation (SC 2.4.1).

## 3. Perceivable

- **Contrast** (SC 1.4.3, 1.4.11): text at least 4.5:1; large text (24 px regular, or 18.66 px bold, and larger) at least 3:1; UI component boundaries, focus indicators, icons and chart elements that carry meaning at least 3:1 against adjacent colours. Measure, do not guess; check every theme (light, dark, high contrast) and every state.
- **Colour is never the only signal** (SC 1.4.1): add text, an icon, a pattern or underline (links in body text are underlined).
- **Text alternatives** (SC 1.1.1): informative images get `alt` text that conveys their purpose; decorative images get `alt=""`; icon-only buttons get an accessible name; complex images (charts, diagrams) get a text equivalent nearby. SVG icons inside labelled buttons get `aria-hidden="true"`.
- **Media**: captions for prerecorded video with audio (SC 1.2.2), reviewed by a person when made by speech recognition; transcripts for audio; audio description where visuals carry information (SC 1.2.5). See [video-editing-and-post-production](../skills/video-editing-and-post-production/SKILL.md) section 6.
- **Resize and reflow**: content works at 200 percent zoom and at 320 CSS px wide without horizontal scrolling (SC 1.4.4, 1.4.10), and with user text-spacing overrides (SC 1.4.12). Use relative units for type; never disable zoom in the viewport meta tag.

## 4. Operable and understandable

- **Target size** (SC 2.5.8): pointer targets at least 24 by 24 CSS px or with enough spacing; aim for 44 by 44.
- **Dragging** (SC 2.5.7): every drag action has a single-pointer alternative.
- **Motion**: honour `prefers-reduced-motion`; nothing flashes more than three times per second (SC 2.3.1; test video and animation with PEAT or Harding, see [motion-graphics-and-animation](../skills/motion-graphics-and-animation/SKILL.md) section 5); auto-playing or moving content longer than five seconds can be paused (SC 2.2.2).
- **Forms**: every input has a visible label (placeholder text is not a label); instructions and formats are given up front; errors are identified in text, linked to the field, and say how to fix them (SC 3.3.1, 3.3.3); use `autocomplete` tokens for personal data (SC 1.3.5); do not make people re-enter information they already gave (SC 3.3.7); authentication does not depend on a cognitive test such as remembering or transcribing a code without allowing paste or a password manager (SC 3.3.8).
- **Predictable**: no change of context on focus or input alone (SC 3.2.1, 3.2.2); help mechanisms appear in the same place across pages (SC 3.2.6).
- **Status messages** are announced without moving focus (SC 4.1.3): use `role="status"` or `aria-live="polite"`, `role="alert"` only for urgent errors.

## 5. Verify

- Automated: axe-core (browser extension, `@axe-core/playwright`, Storybook addon), Lighthouse, html-validate, eslint-plugin-jsx-a11y or the framework's equivalent. Automated tools catch only part of the issues ([Deque, 2021](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/)).
- Manual, every time: keyboard-only pass, 200 percent zoom and 320 px reflow, a screen reader pass on the main flow (VoiceOver on macOS/iOS, NVDA or JAWS on Windows, TalkBack on Android), contrast of every state.
- Report what was tested and with what; never claim "WCAG compliant" without an audit that covered all applicable success criteria.
- Overlays and "one line of code" accessibility widgets do not make a site conform. The US FTC ordered one vendor, accessiBe, to stop claiming its automated product makes websites WCAG-compliant without evidence and to pay $1 million ([FTC, 22 April 2025](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million); [Overlay Fact Sheet](https://overlayfactsheet.com/)). Fix the source instead.
- Beyond the success criteria, design for cognitive and learning disabilities with the W3C guidance [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/): clear purpose, familiar patterns, plain language, help and forgiveness for mistakes.
