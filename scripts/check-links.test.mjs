// Run with: node --test "scripts/*.test.mjs"

import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, extractUrls } from "./check-links.mjs";

test("extracts unique http(s) Markdown link targets", () => {
  const markdown = "[a](https://a.example/x) and [b](http://b.example) and [a again](https://a.example/x)";
  assert.deepEqual(extractUrls(markdown), ["https://a.example/x", "http://b.example"]);
});

test("ignores relative links, anchors and links inside code", () => {
  const markdown = [
    "[rel](../x.md) [anchor](#top)",
    "`[inline](https://code.example)`",
    "```",
    "[fenced](https://fenced.example)",
    "```",
  ].join("\n");
  assert.deepEqual(extractUrls(markdown), []);
});

test("keeps titles out of the URL", () => {
  assert.deepEqual(extractUrls('[t](https://t.example/page "Title")'), ["https://t.example/page"]);
});

test("classifies results, downgrading 404 only for documented bot-blocking hosts", () => {
  assert.equal(classify("https://example.com/a", { status: 200 }), "ok");
  assert.equal(classify("https://example.com/a", { status: 403 }), "warning");
  assert.equal(classify("https://example.com/a", { status: 404 }), "error");
  assert.equal(classify("https://example.com/a", { error: "ENOTFOUND" }), "error");
  assert.equal(classify("https://www.ftc.gov/news-events/x", { status: 404 }), "warning");
  assert.equal(classify("https://www.ftc.gov/news-events/x", { error: "ENOTFOUND" }), "error");
});
