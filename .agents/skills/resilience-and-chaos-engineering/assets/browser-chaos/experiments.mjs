// Chaos experiments for a web page, following https://principlesofchaos.org/:
// define a measurable steady state, inject a real-world fault, and try to disprove that the steady state holds.
// Faults are injected only inside the test browser (request routing, storage, network state), never on a server,
// so the blast radius is the single browser context of the experiment.

/** @typedef {import("playwright").Page} Page */
/** @typedef {import("playwright").BrowserContext} BrowserContext */

/**
 * The steady state: the page's purpose is still achievable. Measured from what a user can perceive and do,
 * not from implementation details.
 * @param {Page} page
 * @returns {Promise<string[]>} problems found; empty when the steady state holds
 */
export async function steadyStateProblems(page) {
  const problems = [];
  const checks = [
    ["a visible level-1 heading", page.getByRole("heading", { level: 1 })],
    ["a labelled name field", page.getByLabel("Name")],
    ["a labelled email field", page.getByLabel("Email address")],
    ["a submit button", page.getByRole("button", { name: "Subscribe" })],
    ["a skip link", page.getByRole("link", { name: "Skip to main content" })],
  ];
  for (const [description, locator] of checks) {
    if ((await locator.count()) === 0) problems.push(`missing ${description}`);
  }
  if (
    (await page.getByRole("heading", { level: 1 }).count()) > 0 &&
    !(await page.getByRole("heading", { level: 1 }).isVisible())
  ) {
    problems.push("the heading is not visible");
  }
  return problems;
}

/** Controls that need JavaScript must not be visible when JavaScript is unavailable. */
async function jsOnlyControlsHidden(page) {
  return (await page
    .locator(".js-only")
    .evaluateAll((elements) => elements.every((element) => getComputedStyle(element).visibility === "hidden")))
    ? []
    : ["a JavaScript-only control is visible although JavaScript did not load"];
}

/** Clicking the theme toggle switches the theme, which proves the page's script runs. */
async function themeToggleWorks(page) {
  const toggle = page.getByRole("button", { name: /theme/i });
  await toggle.click();
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  return theme === "dark" || theme === "light" ? [] : ["the theme toggle did nothing"];
}

/** Submitting the empty form shows the error summary without any network request. */
async function clientValidationWorks(page) {
  await page.getByRole("button", { name: "Subscribe" }).click();
  return (await page.getByRole("heading", { name: "There is a problem" }).isVisible())
    ? []
    : ["the error summary did not appear after an invalid submit"];
}

/**
 * Each experiment: a name, the real-world event it simulates, the hypothesis, how to inject the fault before
 * and after loading, and extra checks beyond the shared steady state.
 * @type {ReadonlyArray<{
 *   name: string, event: string, hypothesis: string,
 *   before?: (context: BrowserContext) => Promise<void>,
 *   after?: (context: BrowserContext, page: Page) => Promise<void>,
 *   checks?: ReadonlyArray<(page: Page) => Promise<string[]>>
 * }>}
 */
export const EXPERIMENTS = [
  {
    name: "control",
    event: "none (baseline)",
    hypothesis: "The page reaches its steady state and its script works.",
    checks: [themeToggleWorks, clientValidationWorks],
  },
  {
    name: "javascript-unavailable",
    event: "Scripts fail to load (blocked by a network, an extension or a failed deploy)",
    hypothesis: "Content and the form still work, and no control that needs JavaScript is shown.",
    before: (context) => context.route(/\.m?js(\?.*)?$/, (route) => route.abort()),
    checks: [jsOnlyControlsHidden],
  },
  {
    name: "stylesheet-unavailable",
    event: "The stylesheet fails to load (CDN outage, wrong cache headers)",
    hypothesis: "Content, labels and the form remain usable in source order.",
    before: (context) => context.route(/\.css(\?.*)?$/, (route) => route.abort()),
  },
  {
    name: "slow-network",
    event: "Every response is delayed by 1.5 s (congested mobile network)",
    hypothesis: "The page still reaches its steady state, only later.",
    before: (context) =>
      context.route("**/*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      }),
    checks: [themeToggleWorks],
  },
  {
    name: "storage-blocked",
    event: "localStorage throws (private mode, blocked cookies, quota exceeded)",
    hypothesis: "The theme toggle still works for the current page view; nothing crashes.",
    before: (context) =>
      context.addInitScript(() => {
        const fail = () => {
          throw new DOMException("Storage disabled for this experiment", "SecurityError");
        };
        Storage.prototype.getItem = fail;
        Storage.prototype.setItem = fail;
      }),
    checks: [themeToggleWorks],
  },
  {
    name: "offline-after-load",
    event: "The connection drops after the page has loaded",
    hypothesis: "Theme switching and client-side validation keep working offline.",
    after: (context) => context.setOffline(true),
    checks: [themeToggleWorks, clientValidationWorks],
  },
];
