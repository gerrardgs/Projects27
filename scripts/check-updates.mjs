#!/usr/bin/env node
// Reports pinned versions that Dependabot cannot update, compared with the latest stable release.
//
// Dependabot keeps lockfiles, requirements files, GitHub Actions SHAs and Docker digests current.
// It does not read versions written in workflow `env:` blocks, and its support for PEP 735
// `[dependency-groups]` in pyproject.toml is not documented. This script covers those pins.
//
// Usage (Node.js 22+, no dependencies, read-only HTTPS requests):
//   node scripts/check-updates.mjs [--cooldown-days N]   (default 7, the same cooldown as Dependabot)
//
// Exit code 1 when an update is due (a newer stable release older than the cooldown) or a lookup
// fails, so a scheduled CI run turns red and notifies the owner. Releases younger than the cooldown
// are listed but do not fail the run. Security fixes should not wait: see security-hardening section 7.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareVersions, lookup } from "./tech-lookup.mjs";

const DEFAULT_COOLDOWN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const SKIPPED_DIRECTORIES = new Set([".git", ".claude", "node_modules", ".venv", "__pycache__"]);
const PYPROJECT_PIN = /"([A-Za-z0-9][A-Za-z0-9._-]*)==([^"\s;]+)"/g;

/** Workflow `env:` variables that pin a binary, and where its releases are published. */
export const WORKFLOW_PIN_SOURCES = {
  GITLEAKS_VERSION: "github:gitleaks/gitleaks",
  TOOLBOX_VERSION: "github:googleapis/mcp-toolbox",
};

/** Finds `name==version` pins inside `[dependency-groups]` and `[project]` arrays of a pyproject.toml. Pure. */
export function parsePyprojectPins(text, file) {
  return [...text.matchAll(PYPROJECT_PIN)].map(([, name, version]) => ({
    file,
    spec: `pypi:${name.toLowerCase()}`,
    current: version,
  }));
}

/** Finds `NAME: version` lines for the known workflow pin variables. Pure. */
export function parseWorkflowPins(text, file) {
  const pins = [];
  for (const [variable, spec] of Object.entries(WORKFLOW_PIN_SOURCES)) {
    const match = text.match(new RegExp(`^\\s*${variable}:\\s*["']?([^"'\\s#]+)`, "m"));
    if (match) pins.push({ file, spec, current: match[1] });
  }
  return pins;
}

/** Decides what to do with one pin given the latest stable release. Pure. */
export function classify({ current, latest, released, now, cooldownDays }) {
  if (compareVersions(latest, current) <= 0) return { status: "current" };
  const releasedAt = Date.parse(released ?? "");
  if (Number.isNaN(releasedAt)) return { status: "due", note: "release date unknown" };
  const eligibleAt = releasedAt + cooldownDays * DAY_MS;
  if (eligibleAt > now)
    return { status: "cooldown", note: `eligible on ${new Date(eligibleAt).toISOString().slice(0, 10)}` };
  return { status: "due" };
}

async function findFiles(directory, accept, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await findFiles(fullPath, accept, found);
    else if (accept(entry.name)) found.push(fullPath);
  }
  return found;
}

async function collectPins(root) {
  const pyprojects = await findFiles(root, (name) => name === "pyproject.toml");
  const workflows = await findFiles(path.join(root, ".github", "workflows"), (name) => /\.ya?ml$/.test(name));
  const pins = [];
  for (const file of pyprojects)
    pins.push(...parsePyprojectPins(await readFile(file, "utf8"), path.relative(root, file)));
  for (const file of workflows)
    pins.push(...parseWorkflowPins(await readFile(file, "utf8"), path.relative(root, file)));
  return pins;
}

async function checkPin(pin, now, cooldownDays, lookupOnce) {
  try {
    const release = await lookupOnce(pin.spec);
    return {
      ...pin,
      latest: release.version,
      ...classify({ ...pin, latest: release.version, released: release.released, now, cooldownDays }),
    };
  } catch (error) {
    return { ...pin, status: "error", note: error.message };
  }
}

function parseCooldown(args) {
  const index = args.indexOf("--cooldown-days");
  if (index === -1) return DEFAULT_COOLDOWN_DAYS;
  const days = Number(args[index + 1]);
  if (!Number.isInteger(days) || days < 0) throw new Error("--cooldown-days needs a whole number of days, 0 or more");
  return days;
}

function formatRow(result) {
  const latest = result.latest ? ` -> ${result.latest}` : "";
  const note = result.note ? ` (${result.note})` : "";
  return `${result.status.padEnd(8)} ${result.spec} ${result.current}${latest}  ${result.file}${note}`;
}

async function main() {
  const cooldownDays = parseCooldown(process.argv.slice(2));
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const pins = await collectPins(root);
  const releases = new Map();
  const lookupOnce = (spec) => {
    if (!releases.has(spec)) releases.set(spec, lookup(spec));
    return releases.get(spec);
  };
  const results = await Promise.all(pins.map((pin) => checkPin(pin, Date.now(), cooldownDays, lookupOnce)));
  for (const result of results) console.log(formatRow(result));
  const failing = results.filter((result) => result.status === "due" || result.status === "error");
  console.log(`${pins.length} pin(s) checked, ${failing.length} need attention (cooldown ${cooldownDays} days)`);
  process.exitCode = failing.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.on("error", (error) => {
    if (error.code !== "EPIPE") throw error;
    process.exit(process.exitCode ?? 0);
  });
  try {
    await main();
  } catch (error) {
    console.error(`check-updates: ${error.message}`);
    process.exitCode = 2;
  }
}
