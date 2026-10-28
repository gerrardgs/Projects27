// Runs the chaos experiments in experiments.mjs against a URL and reports which hypotheses held.
// Usage: node chaos.mjs <url>        (setup: npm ci && npx playwright install chromium)
// Exit code 0 when every hypothesis held, 1 when at least one was disproved, 2 on usage errors.
// Faults are injected only in the test browser, so running this against any environment does not affect others.
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { EXPERIMENTS, steadyStateProblems } from "./experiments.mjs";

const LOAD_TIMEOUT_MS = 30_000;

/** Runs one experiment in a fresh browser context and returns the problems that disprove its hypothesis. */
export async function runExperiment(browser, url, experiment) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const pageErrors = [];
  try {
    await experiment.before?.(context);
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(`uncaught error: ${error.message}`));
    await page.goto(url, { waitUntil: "load", timeout: LOAD_TIMEOUT_MS });
    await experiment.after?.(context, page);
    const problems = [...(await steadyStateProblems(page))];
    for (const check of experiment.checks ?? []) problems.push(...(await check(page)));
    return [...problems, ...pageErrors];
  } catch (error) {
    return [...pageErrors, `experiment aborted: ${error instanceof Error ? error.message : String(error)}`];
  } finally {
    await context.close();
  }
}

async function main() {
  const url = process.argv[2];
  if (url === undefined) {
    console.error("usage: node chaos.mjs <url>");
    process.exitCode = 2;
    return;
  }
  const browser = await chromium.launch();
  let disproved = 0;
  try {
    for (const experiment of EXPERIMENTS) {
      const problems = await runExperiment(browser, url, experiment);
      if (problems.length > 0) disproved += 1;
      console.log(`${problems.length === 0 ? "held" : "DISPROVED"}  ${experiment.name}: ${experiment.hypothesis}`);
      for (const problem of problems) console.log(`        ${problem}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`${EXPERIMENTS.length - disproved} of ${EXPERIMENTS.length} hypotheses held`);
  process.exitCode = disproved > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
