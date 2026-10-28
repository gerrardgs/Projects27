---
name: frontend-testing-and-visual-qa
description: Test user interfaces - component and interaction tests with Testing Library and Vitest, end-to-end tests with Playwright, visual regression with screenshots, Storybook or Chromatic, automated accessibility checks, cross-browser and device testing, and manual visual QA against the design. Use when adding tests for UI components or pages, setting up Playwright, Vitest or Storybook tests, catching visual regressions, checking a build against the design, or testing on different browsers and devices.
license: MIT
metadata:
  version: "1.0.0"
---

# Front-End Testing and Visual QA

This extends [test-engineering](../test-engineering/SKILL.md) and [07-testing](../../rules/07-testing.md) for UI. Tools, versions and links are in [references/tooling.md](references/tooling.md).

## 1. What to test at which level

| Level | Tests | Tools |
| :--- | :--- | :--- |
| Logic | Validation, formatting, reducers, hooks without UI, token pipelines | `node:test`, Vitest |
| Component | Renders the right content and roles; reacts to user events; handles every state (loading, empty, error, disabled, long text) | Vitest or Jest with Testing Library, Vitest browser mode, Storybook interaction tests, Angular TestBed |
| Accessibility | No automated violations per component and page; roles and names correct | axe-core (Storybook a11y addon, `@axe-core/playwright`, jest-axe/vitest-axe) |
| Visual | Pixels did not change unexpectedly | Playwright `toHaveScreenshot`, Chromatic, Percy, BackstopJS |
| End-to-end | Critical journeys across pages with a real browser and backend or mocked network | Playwright (Chromium, Firefox, WebKit) |
| Manual QA | Design fidelity, feel, real devices, assistive technology | Checklist in section 5 |

## 2. Component tests that resist refactors

- Query like a user: `getByRole("button", { name: "Save" })`, `getByLabelText("Email")`, `getByText`. Avoid test IDs unless nothing else identifies the element; never query by CSS class.
- Interact with `@testing-library/user-event` (or Playwright), not by calling handlers.
- Assert on visible outcomes and accessibility: text, roles, `aria-invalid`, focus moving to the error summary, announcements in live regions.
- Mock the network at the boundary with MSW (Mock Service Worker) rather than mocking modules.
- Cover each state the design specifies. Stories in Storybook double as test cases and documentation.

## 3. End-to-end with Playwright

- Test the few journeys that matter most (sign up, checkout, publish). Use web-first assertions (`await expect(locator).toBeVisible()`) that wait automatically; never fixed sleeps.
- Use role-based locators (`page.getByRole`), isolated test data, and a fresh browser context per test.
- Run in Chromium, Firefox and WebKit in CI; add mobile emulation projects (viewport, touch, device scale factor). Emulation is not a real device; test real iOS Safari and Android Chrome before release (BrowserStack, Sauce Labs, LambdaTest, or physical devices).
- Add an axe scan to key pages ([accessibility-audit/assets/axe-check](../accessibility-audit/assets/axe-check/) shows the pattern).

## 4. Visual regression without flakiness

- Stabilise before capturing: fixed viewport and device scale factor, web fonts loaded (`document.fonts.ready`), animations disabled (`reducedMotion: "reduce"`, Playwright's `animations: "disabled"`), frozen dates and random data, masked dynamic regions (ads, timestamps, avatars).
- Generate baselines in the same environment that CI uses (for example the official Playwright Docker image); fonts and anti-aliasing differ between operating systems.
- Review every diff; update baselines only for intended changes, in the same pull request as the change.
- Capture light and dark themes and the key breakpoints; for components, capture every story.

## 5. Manual visual QA against the design

- [ ] Compare against the design at each designed breakpoint; then resize continuously from 320 px upward
- [ ] Typography, spacing, colours and radii match tokens; differences explained
- [ ] Every state seen in the browser: hover, focus, active, disabled, loading, empty, error, success, long content
- [ ] Light, dark and forced-colors modes; 200 percent zoom; reduced motion
- [ ] Keyboard pass and a screen reader pass on the changed flow
- [ ] Current Chrome, Edge, Firefox and Safari; iOS Safari and Android Chrome on real devices
- [ ] No console errors or warnings; no layout shift when content loads
- [ ] Screenshots before and after attached to the pull request

## 6. Report

List the tests added (by level), the commands and their results (for example `npx playwright test → 24 passed (chromium, firefox, webkit)`), visual baselines changed and why, browsers and devices checked manually, and anything not tested.
