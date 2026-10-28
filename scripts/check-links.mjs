#!/usr/bin/env node
// Checks that every external http(s) link in the repository's Markdown files still resolves.
//
// Usage (Node.js 22+, no dependencies, needs network access):
//   node scripts/check-links.mjs                 check all Markdown files
//   node scripts/check-links.mjs docs/FILE.md    check specific files
//
// A link fails on HTTP 404 or 410, or on a DNS or connection error. Other statuses (401, 403, 429, 5xx)
// are reported as warnings, because many sites block automated requests while working fine in a browser.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDED_DIRECTORIES = new Set([".git", ".archive", "node_modules", ".claude"]);
const CONCURRENCY = 8;
const TIMEOUT_MS = 20_000;
const USER_AGENT = "Mozilla/5.0 (compatible; projects27-link-check/1.0; +https://github.com/gerrardgs/Projects27)";
const FAILING_STATUSES = new Set([404, 410]);
// Hosts that answer 404 to every automated client, even for pages that exist. Their links were verified in a browser
// (www.ftc.gov on 2026-10-16); for them a 404 is reported as a warning, not an error.
const BOT_BLOCKING_HOSTS = new Set(["www.ftc.gov", "ftc.gov"]);

/** Classifies a probe result: "ok", "warning" or "error". */
export function classify(url, result) {
  if (result.error !== undefined) return "error";
  if (FAILING_STATUSES.has(result.status)) return BOT_BLOCKING_HOSTS.has(new URL(url).hostname) ? "warning" : "error";
  return result.status >= 400 ? "warning" : "ok";
}

/** Extracts unique http(s) URLs from Markdown link syntax, ignoring fenced and inline code. */
export function extractUrls(markdown) {
  const text = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const urls = new Set();
  for (const [, url] of text.matchAll(/\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    urls.add(url.replace(/[.,;:]+$/, ""));
  }
  return [...urls];
}

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(fullPath)));
    else if (entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files.sort();
}

async function request(url, method) {
  return fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
}

/** Returns the final HTTP status, or an error message. Retries once, because timeouts are often transient. */
async function probe(url) {
  const first = await probeOnce(url);
  if (first.error === undefined) return first;
  await new Promise((resolve) => setTimeout(resolve, 2_000));
  return probeOnce(url);
}

/** Falls back to GET when the server rejects HEAD. */
async function probeOnce(url) {
  try {
    let response = await request(url, "HEAD");
    if (response.status === 405 || response.status === 403 || response.status === 404 || response.status === 400) {
      response = await request(url, "GET");
      await response.body?.cancel();
    }
    return { status: response.status };
  } catch (error) {
    return { error: error instanceof Error ? (error.cause?.code ?? error.message) : String(error) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const files = args.length > 0 ? args.map((file) => path.resolve(file)) : await markdownFiles(ROOT);
  const sources = new Map();
  for (const file of files) {
    for (const url of extractUrls(await readFile(file, "utf8"))) {
      if (!sources.has(url)) sources.set(url, []);
      sources.get(url).push(path.relative(ROOT, file));
    }
  }
  const urls = [...sources.keys()];
  console.log(`checking ${urls.length} unique external links in ${files.length} file(s)`);

  const failures = [];
  const warnings = [];
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      const result = await probe(url);
      const where = sources.get(url).join(", ");
      const outcome = classify(url, result);
      const detail = `${url} -> ${result.error ?? `HTTP ${result.status}`} (in ${where})`;
      if (outcome === "error") failures.push(detail);
      else if (outcome === "warning") warnings.push(detail);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  for (const message of warnings.sort()) console.warn(`warning: ${message}`);
  for (const message of failures.sort()) console.error(`error: ${message}`);
  console.log(`${urls.length} link(s) checked, ${failures.length} broken, ${warnings.length} warning(s)`);
  process.exitCode = failures.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
