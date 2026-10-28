---
name: accessibility-audit
description: Audit and fix the accessibility of a website, web app, design file, component, document or PDF against WCAG 2.2 Level AA - automated scanning with axe-core and Lighthouse, manual keyboard, zoom and screen reader testing, contrast checks, ARIA review, legal context (European Accessibility Act, ADA, Section 508, EN 301 549), and a severity-ranked report. Use when asked to check accessibility or a11y, make something WCAG compliant, review a design for accessibility, test with a screen reader, or write an accessibility statement or VPAT.
license: MIT
metadata:
  version: "1.0.0"
---

# Accessibility Audit

The standard is [10-accessibility](../../rules/10-accessibility.md) (WCAG 2.2 AA). The checklist by success criterion is in [references/wcag-checklist.md](references/wcag-checklist.md); laws, tools and assistive technology are in [references/laws-and-tools.md](references/laws-and-tools.md). An automated scanner is in [assets/axe-check/](assets/axe-check/).

## 1. Scope

- Define what is audited: URLs or screens, the key user journeys (sign up, search, checkout, account), the components, and the states (errors, menus open, dialogs, loading).
- Define the standard (WCAG 2.2 AA unless a contract or law says otherwise) and the environments: browsers, operating systems, assistive technologies.
- For designs (Figma, Penpot), audit what can be checked before code: contrast, target sizes, focus order and headings annotations, colour-only meaning, text alternatives planned, motion, error states.

## 2. Automated pass (finds a part of the issues quickly)

```sh
cd assets/axe-check
npm ci
npx playwright install chromium
node check.mjs https://example.com/ https://example.com/signup
```

The script checks WCAG 2.0, 2.1 and 2.2 A/AA rules at phone and desktop widths in light and dark colour schemes, with reduced motion, warns about horizontal scrolling, and also fails on console errors such as Content Security Policy violations. Also run Lighthouse's accessibility category, html-validate, and the framework's lint plugin. In component libraries, run the Storybook accessibility addon on every story.

## 3. Manual pass (required; automated tools cannot judge most criteria)

1. **Keyboard only**: Tab through each journey. Is every control reachable and operable (Enter, Space, arrows, Escape) in a logical order? Is focus always visible and never hidden? Any traps? Does focus move sensibly when dialogs open and close and when content changes?
2. **Zoom and reflow**: 200 percent browser zoom; 320 CSS px wide viewport (or 400 percent at 1280 px); a text-spacing bookmarklet. Nothing lost or overlapping, no horizontal scrolling for text.
3. **Screen reader**: VoiceOver with Safari (macOS, iOS), NVDA with Chrome or Firefox (Windows), TalkBack with Chrome (Android). Check headings list, landmarks, link and button names, form labels, errors and status messages announced, images described, dialogs and menus announced with role and state.
4. **Visual**: contrast of text, icons, borders and focus indicators in every state and theme; meaning not by colour alone; content readable in forced-colors (Windows contrast themes).
5. **Content**: page titles, heading structure, link text out of context, plain language, captions and transcripts, alt text quality (purpose, not "image of").
6. **Motion and timing**: reduced-motion respected, nothing flashes, carousels and auto-updating content can be paused, time limits can be extended.

## 4. Verify and rank each finding

For each issue record: the WCAG success criterion, location (URL, component, selector), steps to reproduce, who is affected, severity, and a concrete fix. Confirm each finding with a second method before reporting it.

| Severity | Meaning |
| :--- | :--- |
| Critical | Blocks a key task for some users (keyboard trap, unlabeled checkout button, inaccessible CAPTCHA) |
| Serious | Major difficulty or a failed AA criterion on a key journey |
| Moderate | Workaround exists; AA failure outside key journeys |
| Minor | Best-practice improvement, no criterion failed |

## 5. Fix

Fix root causes in shared components and tokens first (one fix, many pages). Prefer native HTML over ARIA. Re-test each fix with the same method that found it, plus a regression check (axe in CI, component tests asserting roles and names with Testing Library queries like `getByRole`).

## 6. Report

```text
Scope:        <pages, journeys, components, standard, date>
Environment:  <browsers, OS, assistive technologies and versions>
Automated:    <tool, version, result counts>
Findings:     <ranked list: severity, SC, location, impact, fix>
Passed:       <criteria checked and passed>
Not tested:   <criteria or areas not covered and why>
```

Never write "fully compliant" unless every applicable success criterion was tested on every page in scope. For an accessibility statement or conformance report, use the W3C's [statement generator](https://www.w3.org/WAI/planning/statements/generator/) or the ITI [VPAT](https://www.itic.org/policy/accessibility/vpat) template, and state known limitations honestly.
