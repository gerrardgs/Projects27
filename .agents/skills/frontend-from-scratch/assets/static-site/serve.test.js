// Run with: node --test

import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer, resolveRequestPath } from "./serve.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

describe("resolveRequestPath", () => {
  test("maps / and folders to index.html", () => {
    assert.equal(resolveRequestPath(ROOT, "/"), path.join(ROOT, "index.html"));
    assert.equal(resolveRequestPath(ROOT, "/styles.css?v=2"), path.join(ROOT, "styles.css"));
  });

  test("never escapes the root, including encoded traversal", () => {
    for (const url of ["/../package.json", "/%2e%2e/%2e%2e/etc/passwd", "/a/../../x", "/..%2f..%2fetc"]) {
      const resolved = resolveRequestPath(ROOT, url);
      assert.ok(resolved === null || resolved.startsWith(ROOT + path.sep), url);
    }
  });

  test("refuses dotfiles, node_modules, null bytes and bad encoding", () => {
    for (const url of ["/.gitignore", "/node_modules/stylelint/package.json", "/index.html%00.js", "/%E0%A4%A"]) {
      assert.equal(resolveRequestPath(ROOT, url), null, url);
    }
  });
});

describe("dev server", () => {
  const server = createServer(ROOT);
  let base = "";

  before(async () => {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
    const address = server.address();
    assert.ok(address !== null && typeof address === "object");
    base = `http://127.0.0.1:${address.port}`;
  });

  after(() => new Promise((resolve) => server.close(() => resolve(undefined))));

  test("serves the page and module script with correct types", async () => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type") ?? "", /^text\/html/);
    assert.match(await page.text(), /<main id="main"/);
    assert.match(page.headers.get("content-security-policy") ?? "", /default-src 'self'/);
    assert.equal(page.headers.get("strict-transport-security"), null);
    const script = await fetch(`${base}/main.js`);
    assert.match(script.headers.get("content-type") ?? "", /^text\/javascript/);
    await script.body?.cancel();
  });

  test("returns 404 for missing or hidden files and 405 for writes", async () => {
    assert.equal((await fetch(`${base}/missing.html`)).status, 404);
    assert.equal((await fetch(`${base}/.htmlvalidate.json`)).status, 404);
    assert.equal((await fetch(`${base}/`, { method: "POST" })).status, 405);
  });
});
