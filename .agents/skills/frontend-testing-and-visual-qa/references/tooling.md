# Front-end testing tools

Latest versions on npm, checked on 2026-10-15. The project's lockfile decides what is installed.

| Tool | Package | Latest | Docs |
| :--- | :--- | :--- | :--- |
| Playwright Test | `@playwright/test` | 1.64.1 | [playwright.dev](https://playwright.dev/docs/intro), [visual comparisons](https://playwright.dev/docs/test-snapshots), [accessibility testing](https://playwright.dev/docs/accessibility-testing), [best practices](https://playwright.dev/docs/best-practices) |
| Vitest | `vitest` | 5.0.4 | [vitest.dev](https://vitest.dev/), [browser mode](https://vitest.dev/guide/browser/) (`@vitest/browser` 5.0.4) |
| Jest | `jest` | 30.5.2 | [jestjs.io](https://jestjs.io/) |
| Testing Library (DOM) | `@testing-library/dom` | 10.4.2 | [testing-library.com](https://testing-library.com/docs/), [query priority](https://testing-library.com/docs/queries/about#priority) |
| Testing Library (React) | `@testing-library/react` | 16.3.3 | [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) |
| user-event | `@testing-library/user-event` | 14.6.8 | [user-event](https://testing-library.com/docs/user-event/intro) |
| Vue Test Utils | `@vue/test-utils` | 2.5.1 | [test-utils.vuejs.org](https://test-utils.vuejs.org/) |
| Angular testing | built in | | [angular.dev/guide/testing](https://angular.dev/guide/testing) |
| Svelte testing | `@testing-library/svelte` | 5.4.2 | [svelte.dev/docs/svelte/testing](https://svelte.dev/docs/svelte/testing) |
| DOM environments | `jsdom` 30.1.2, `happy-dom` 21.0.1 | | [jsdom](https://github.com/jsdom/jsdom), [happy-dom](https://github.com/capricorn86/happy-dom) |
| Mock Service Worker | `msw` | 3.0.3 | [mswjs.io](https://mswjs.io/) |
| Storybook | `storybook` | 10.6.2 | [Testing in Storybook](https://storybook.js.org/docs/writing-tests) |
| Chromatic | `chromatic` | 18.12.2 | [chromatic.com/docs](https://www.chromatic.com/docs/) |
| Percy | `@percy/cli` | 1.32.11 | [BrowserStack Percy docs](https://www.browserstack.com/docs/percy) |
| BackstopJS | `backstopjs` | 6.3.25 | [GitHub](https://github.com/garris/BackstopJS) |
| axe-core for Playwright | `@axe-core/playwright` | 4.13.0 | [GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) |
| Pa11y CI | `pa11y-ci` | 5.0.0 | [GitHub](https://github.com/pa11y/pa11y-ci) |
| Lighthouse CI | `@lhci/cli` | 0.15.1 | [GitHub](https://github.com/GoogleChrome/lighthouse-ci) |

## Real-device and cross-browser services

[BrowserStack](https://www.browserstack.com/), [Sauce Labs](https://saucelabs.com/), [LambdaTest](https://www.lambdatest.com/). Free alternatives: Xcode iOS Simulator (macOS), Android Emulator (Android Studio), Firefox and Chrome Remote Debugging on physical devices, Safari Web Inspector for iOS.

## Browser DevTools documentation

[Chrome DevTools](https://developer.chrome.com/docs/devtools), [Firefox DevTools](https://firefox-source-docs.mozilla.org/devtools-user/), [Safari Web Inspector](https://developer.apple.com/documentation/safari-developer-tools/web-inspector), [Edge DevTools](https://learn.microsoft.com/en-us/microsoft-edge/devtools/landing/).

## Example: Playwright config fragment for visual tests

```typescript
// playwright.config.ts (fragment) - verify option names against the installed version's docs
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01 } },
  use: { reducedMotion: "reduce", colorScheme: "light" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
});
```
