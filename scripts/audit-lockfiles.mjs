#!/usr/bin/env node
// Runs `npm audit` for every committed package-lock.json and fails on any high or critical advisory, except
// advisories accepted in .github/accepted-advisories.json. Each acceptance has an expiry date, so an accepted
// risk is reviewed again instead of being ignored forever. Run daily so new advisories surface even when
// nothing in the repository changed.
//
// Usage (Node.js 22+, needs network access to the npm registry):
//   node scripts/audit-lockfiles.mjs            audit every lockfile tracked by Git
//   node scripts/audit-lockfiles.mjs <dir>...   audit only these directories
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACCEPTED_FILE = path.join(ROOT, ".github", "accepted-advisories.json");
const BLOCKING = new Set(["high", "critical"]);
const MAX_BUFFER = 32 * 1024 * 1024;

/** The advisory ID (GHSA) of one `via` entry, falling back to npm's numeric source ID. */
const advisoryId = (via) => /GHSA-[\w-]+/.exec(via.url ?? "")?.[0] ?? String(via.source);

/** High and critical advisories in `npm audit --json` output: { id, url, title, severity, package }[]. */
export function blockingAdvisories(report) {
  const found = new Map();
  for (const [name, vulnerability] of Object.entries(report?.vulnerabilities ?? {})) {
    // String entries name another vulnerable package (a transitive path); that package is listed itself.
    const direct = (vulnerability.via ?? []).filter((via) => typeof via === "object" && BLOCKING.has(via.severity));
    for (const via of direct) {
      const id = advisoryId(via);
      found.set(id, { id, url: via.url, title: via.title, severity: via.severity, package: name });
    }
  }
  return [...found.values()];
}

/**
 * Splits advisories into those that block and those covered by a current acceptance.
 * An acceptance covers an advisory only for the listed directory and until its `expires` date (YYYY-MM-DD).
 */
export function applyAcceptances(advisories, directory, accepted, today) {
  const covers = (advisory) =>
    accepted.some(
      (entry) => entry.id === advisory.id && entry.directories.includes(directory) && entry.expires >= today,
    );
  return {
    blocking: advisories.filter((advisory) => !covers(advisory)),
    accepted: advisories.filter(covers),
  };
}

async function lockfileDirectories() {
  const { stdout } = await run("git", ["ls-files", "*package-lock.json"], { cwd: ROOT });
  return stdout
    .split("\n")
    .filter((line) => line.length > 0 && !line.startsWith(".claude/")) // the mirror repeats .agents/skills
    .map((file) => path.dirname(file));
}

/** npm audit exits non-zero when it finds anything, so read its JSON from stdout either way. */
async function auditDirectory(directory) {
  try {
    const { stdout } = await run("npm", ["audit", "--json"], {
      cwd: path.join(ROOT, directory),
      maxBuffer: MAX_BUFFER,
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (typeof error.stdout === "string" && error.stdout.trim().startsWith("{")) return JSON.parse(error.stdout);
    throw new Error(`npm audit failed in ${directory}: ${error.message}`, { cause: error });
  }
}

async function main() {
  const accepted = JSON.parse(await readFile(ACCEPTED_FILE, "utf8"));
  const today = new Date().toISOString().slice(0, 10);
  const directories = process.argv.length > 2 ? process.argv.slice(2) : await lockfileDirectories();
  let blockingCount = 0;
  for (const directory of directories) {
    const result = applyAcceptances(blockingAdvisories(await auditDirectory(directory)), directory, accepted, today);
    for (const advisory of result.accepted) console.log(`accepted ${directory}: ${advisory.id} ${advisory.package}`);
    for (const advisory of result.blocking) {
      console.error(
        `BLOCKING ${directory}: ${advisory.severity} ${advisory.id} ${advisory.package}: ${advisory.title}`,
      );
    }
    blockingCount += result.blocking.length;
  }
  console.log(`${directories.length} lockfile(s) audited, ${blockingCount} blocking advisory(ies)`);
  process.exitCode = blockingCount > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
