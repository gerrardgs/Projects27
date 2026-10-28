// Run with: node --test

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  CONTENT_SECURITY_POLICY,
  DEV_HEADERS,
  PRODUCTION_HEADERS,
  toHeadersFile,
  toVercelJson,
} from "./security-headers.js";

test("_headers (Netlify, Cloudflare Pages) matches the source of truth", async () => {
  assert.equal(await readFile(new URL("./_headers", import.meta.url), "utf8"), toHeadersFile(PRODUCTION_HEADERS));
});

test("vercel.json matches the source of truth", async () => {
  assert.equal(await readFile(new URL("./vercel.json", import.meta.url), "utf8"), toVercelJson(PRODUCTION_HEADERS));
});

test("the CSP allows no inline code, eval, plugins or framing", () => {
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /unsafe-inline|unsafe-eval|\*/);
  for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) {
    assert.ok(CONTENT_SECURITY_POLICY.includes(directive), directive);
  }
});

test("HSTS is sent only in production, never on localhost", () => {
  assert.ok("Strict-Transport-Security" in PRODUCTION_HEADERS);
  assert.ok(!("Strict-Transport-Security" in DEV_HEADERS));
});

test("every _headers line stays under Cloudflare's 2,000-character limit", () => {
  for (const line of toHeadersFile(PRODUCTION_HEADERS).split("\n")) assert.ok(line.length <= 2000, line.slice(0, 40));
});
