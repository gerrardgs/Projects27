#!/usr/bin/env node
// Reports pinned tools and runtimes that Dependabot cannot update (binary versions in workflows, Python tools
// in a pyproject dependency group, the Node.js and Python versions tested in CI) when a newer release exists.
// Dependabot covers npm, GitHub Actions, Docker and the pip requirements of CI tools; this covers the rest.
//
// Usage (Node.js 22+, no dependencies, needs network access):
//   node scripts/check-freshness.mjs              check every entry in .github/freshness.json
//   node scripts/check-freshness.mjs --strict     also fail on notices (a newer supported runtime is untested)
// Exit code 1 when a pin is behind its latest release or a tested runtime is end-of-life.
// Set GITHUB_TOKEN (as CI does) to avoid the GitHub API's anonymous rate limit.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, ".github", "freshness.json");
const TIMEOUT_MS = 20_000;

/** Numeric comparison of dotted versions ("1.10.0" > "1.9.3"); a leading "v" is ignored. */
export function compareVersions(a, b) {
  const parts = (version) =>
    String(version)
      .replace(/^v/, "")
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
  const left = parts(a);
  const right = parts(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

/**
 * The pinned value: the text after the first occurrence of `after`, up to `until` (default: end of line).
 * Plain string search, so the manifest cannot inject a regular expression. A comma-separated value
 * (a CI matrix) becomes a list with quotes removed.
 */
export function readPin(text, { after, until = "\n" }) {
  const start = text.indexOf(after);
  if (start === -1) throw new Error(`"${after}" not found`);
  const from = start + after.length;
  const end = text.indexOf(until, from);
  const value = text.slice(from, end === -1 ? undefined : end).trim();
  if (value.length === 0) throw new Error(`no value after "${after}"`);
  const unquote = (item) => item.trim().replace(/^["']|["']$/g, "");
  return value.includes(",") ? value.split(",").map(unquote) : unquote(value);
}

/** A single version pin against the latest release: "ok" or "outdated". */
export function evaluateVersion(name, pinned, latest) {
  return compareVersions(pinned, latest) >= 0
    ? { status: "ok", message: `${name} ${pinned} is current` }
    : { status: "outdated", message: `${name} ${pinned} is behind the latest release ${latest}` };
}

/**
 * A tested runtime matrix against endoflife.date releases ({ name, isEol }[], newest first):
 * "outdated" when a tested version is end-of-life, "notice" when a newer supported release is not tested.
 */
export function evaluateMatrix(name, tested, releases) {
  const testedSet = new Set(tested.map(String));
  const endOfLife = releases.filter((release) => release.isEol && testedSet.has(release.name)).map((r) => r.name);
  if (endOfLife.length > 0) return { status: "outdated", message: `${name}: ${endOfLife.join(", ")} end-of-life` };
  const newest = releases.find((release) => !release.isEol);
  if (newest !== undefined && !testedSet.has(newest.name)) {
    return { status: "notice", message: `${name}: newest supported release ${newest.name} is not tested` };
  }
  return { status: "ok", message: `${name}: ${tested.join(", ")} all supported` };
}

async function getJson(url) {
  const headers = { accept: "application/json", "user-agent": "projects27-freshness-check" };
  if (url.startsWith("https://api.github.com/") && process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
  return response.json();
}

const LATEST = {
  github: async ({ repo }) => (await getJson(`https://api.github.com/repos/${repo}/releases/latest`)).tag_name,
  pypi: async ({ package: name }) => (await getJson(`https://pypi.org/pypi/${name}/json`)).info.version,
  npm: async ({ package: name }) => (await getJson(`https://registry.npmjs.org/${name}/latest`)).version,
};

async function checkEntry(entry) {
  const pinned = readPin(await readFile(path.join(ROOT, entry.file), "utf8"), entry);
  if (entry.source.type === "endoflife") {
    const data = await getJson(`https://endoflife.date/api/v1/products/${entry.source.product}`);
    return evaluateMatrix(entry.name, [pinned].flat(), data.result.releases);
  }
  const lookup = LATEST[entry.source.type];
  if (lookup === undefined) throw new Error(`unknown source type ${entry.source.type}`);
  return evaluateVersion(entry.name, pinned, await lookup(entry.source));
}

async function main() {
  const strict = process.argv.includes("--strict");
  const entries = JSON.parse(await readFile(MANIFEST, "utf8"));
  let failures = 0;
  for (const entry of entries) {
    let result;
    try {
      result = await checkEntry(entry);
    } catch (error) {
      result = { status: "error", message: `${entry.name}: ${error.message}` };
    }
    const failing = result.status === "outdated" || result.status === "error" || (strict && result.status === "notice");
    if (failing) failures += 1;
    console.log(`${result.status.padEnd(8)} ${result.message} (${entry.file})`);
  }
  console.log(`${entries.length} pin(s) checked, ${failures} need attention`);
  process.exitCode = failures > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
