// Run with: node --test   (needs Chromium: npx playwright install chromium)
// Proves the experiments can fail: the resilient starter site must pass every one, and a deliberately fragile
// fixture must fail the ones that target its faults.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { runExperiment } from "./chaos.mjs";
import { EXPERIMENTS } from "./experiments.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITES = {
  resilient: path.resolve(HERE, "../../../frontend-from-scratch/assets/static-site"),
  fragile: path.join(HERE, "fixtures", "fragile"),
};
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

/** Serves one fixed folder; only plain file names, so no path traversal is possible. */
function serve(root) {
  return http.createServer(async (request, response) => {
    const name = (request.url ?? "/").split("?")[0] === "/" ? "index.html" : (request.url ?? "").slice(1).split("?")[0];
    if (!/^[\w.-]+$/.test(name ?? "")) return response.writeHead(404).end();
    try {
      const body = await readFile(path.join(root, name ?? ""));
      response
        .writeHead(200, { "content-type": TYPES[path.extname(name ?? "")] ?? "application/octet-stream" })
        .end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
}

const experiment = (name) => {
  const found = EXPERIMENTS.find((candidate) => candidate.name === name);
  assert.ok(found, name);
  return found;
};

describe("browser chaos experiments", () => {
  const servers = {};
  const urls = {};
  let browser;

  before(async () => {
    browser = await chromium.launch();
    for (const [name, root] of Object.entries(SITES)) {
      servers[name] = serve(root);
      await new Promise((resolve) => servers[name].listen(0, "127.0.0.1", resolve));
      urls[name] = `http://127.0.0.1:${servers[name].address().port}/`;
    }
  });

  after(async () => {
    await browser?.close();
    await Promise.all(Object.values(servers).map((server) => new Promise((resolve) => server.close(resolve))));
  });

  test("the resilient starter site holds every hypothesis", async () => {
    for (const candidate of EXPERIMENTS) {
      assert.deepEqual(await runExperiment(browser, urls.resilient, candidate), [], candidate.name);
    }
  });

  test("blocked storage is caught when code reads localStorage without a guard", async () => {
    const problems = await runExperiment(browser, urls.fragile, experiment("storage-blocked"));
    assert.ok(
      problems.some((problem) => problem.startsWith("uncaught error")),
      problems.join("; "),
    );
  });

  test("missing JavaScript is caught when the form and controls depend on it", async () => {
    const problems = await runExperiment(browser, urls.fragile, experiment("javascript-unavailable"));
    assert.ok(problems.includes("missing a labelled name field"), problems.join("; "));
  });
});
