// Runs axe-core in headless Chromium against one or more URLs, in light and dark color schemes,
// at a phone and a desktop viewport. Exits 1 when any WCAG 2.x A/AA violation is found, or when the page logs
// console errors (for example Content Security Policy violations or failed requests).
//
// Usage: node check.mjs <url> [more urls...]
// Setup: npm ci && npx playwright install chromium
//
// Automated tools find only part of the problems (Deque estimates about 57% of issues by volume).
// A clean result is the start of an audit, not the end: follow the manual steps in the skill.
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  { name: "phone", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 },
];
const SCHEMES = ["light", "dark"];

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("usage: node check.mjs <url> [more urls...]");
  process.exit(2);
}

/** Loads one URL in one viewport and colour scheme, and collects axe violations, console errors and overflow. */
async function scanPage(browser, url, viewport, colorScheme) {
  const context = await browser.newContext({ colorScheme, viewport, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: "load" });
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    return { label: `${url} [${viewport.name}, ${colorScheme}]`, violations, consoleErrors, overflow };
  } finally {
    await context.close();
  }
}

/** Prints one scan result and returns the number of problems it found. */
function report({ label, violations, consoleErrors, overflow }) {
  // WCAG 1.4.10 Reflow: content should not need horizontal scrolling at 320 CSS px wide.
  if (overflow) console.log(`WARN ${label}: page scrolls horizontally`);
  for (const message of consoleErrors) console.log(`FAIL ${label}: console error: ${message}`);
  for (const violation of violations) {
    console.log(`FAIL ${label}: ${violation.id} (${violation.impact}) ${violation.help}`);
    for (const node of violation.nodes) console.log(`       ${node.target.join(" ")}`);
    console.log(`       ${violation.helpUrl}`);
  }
  const problems = consoleErrors.length + violations.reduce((sum, violation) => sum + violation.nodes.length, 0);
  if (problems === 0) console.log(`pass ${label}`);
  return problems;
}

const runs = urls.flatMap((url) =>
  VIEWPORTS.flatMap((viewport) => SCHEMES.map((colorScheme) => ({ url, viewport, colorScheme }))),
);
const browser = await chromium.launch();
let problemCount = 0;
try {
  for (const { url, viewport, colorScheme } of runs) {
    problemCount += report(await scanPage(browser, url, viewport, colorScheme));
  }
} finally {
  await browser.close();
}
console.log(`${problemCount} problem(s)`);
process.exitCode = problemCount > 0 ? 1 : 0;
