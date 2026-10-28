#!/usr/bin/env node
// Looks up live facts about any package, product or repository from official registries, so agents
// cite real versions, licences and end-of-life dates instead of guessing.
//
// Usage (Node.js 22+, no dependencies, read-only HTTPS GET requests):
//   node scripts/tech-lookup.mjs <ecosystem>:<name> [more ...] [--json]
//
// Ecosystems:
//   npm:express            pypi:django             crates:axum            go:github.com/gin-gonic/gin
//   maven:org.springframework.boot:spring-boot     nuget:Newtonsoft.Json  rubygems:rails
//   packagist:laravel/framework                    pub:http               hex:phoenix
//   eol:nodejs             (release cycles and end-of-life dates from endoflife.date)
//   scorecard:github.com/expressjs/express         (OpenSSF Scorecard security score)
//   github:grafana/k6      (latest published release, for tools distributed as binaries;
//                           unauthenticated GitHub API calls are limited to 60 per hour)
//
// Exit code 1 when any lookup fails, so a wrong name is noticed instead of silently ignored.

import { fileURLToPath } from "node:url";

const USER_AGENT = "projects27-tech-lookup (https://github.com/gerrardgs/Projects27)";
const TIMEOUT_MS = 20_000;
const PRERELEASE_PATTERN =
  /(?:^|[.\-_+])(?:alpha|beta|rc|cr|m\d+|milestone|snapshot|dev|pre|preview|nightly|canary|next|ea)(?:[.\-_]?\d+)?(?:$|[.\-_+])/i;

/** True when a version string has no pre-release marker (SemVer "-" suffix, Maven qualifiers, PEP 440 tags). */
export function isStableVersion(version) {
  if (/^v?\d+(\.\d+)*$/.test(version)) return true;
  if (/^v?\d+(\.\d+)*\.(RELEASE|Final|GA)$/i.test(version)) return true;
  if (version.includes("-")) return false;
  if (/\d(a|b|rc)\d+$/i.test(version)) return false;
  return !PRERELEASE_PATTERN.test(version);
}

/** Compares one version component: numbers numerically, numbers above text, text alphabetically. */
function compareParts(left, right) {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);
  if (leftNumeric && rightNumeric) return Math.sign(Number(left) - Number(right));
  if (leftNumeric !== rightNumeric) return leftNumeric ? 1 : -1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** Compares dotted versions part by part ("1.10.0" is newer than "1.9.9"). */
export function compareVersions(left, right) {
  const split = (value) => value.replace(/^v/, "").split(/[.\-_+]/);
  const leftParts = split(left);
  const rightParts = split(right);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const result = compareParts(leftParts[index] ?? "0", rightParts[index] ?? "0");
    if (result !== 0) return result;
  }
  return 0;
}

export function latestStable(versions) {
  const stable = versions.filter(isStableVersion);
  return stable.sort(compareVersions).at(-1);
}

/** Go module proxy escaping: each upper-case letter becomes "!" plus its lower-case form. */
export function escapeGoModule(path) {
  return path.replace(/[A-Z]/g, (letter) => `!${letter.toLowerCase()}`);
}

/** First value that is neither undefined, null nor an empty string. */
function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function repositoryUrl(repository) {
  if (!repository) return undefined;
  const url = typeof repository === "string" ? repository : repository.url;
  return url?.replace(/^git\+/, "").replace(/\.git$/, "");
}

/** Pure parsers: take the decoded API response and return a uniform record. Exported for tests. */
export const parsers = {
  npm: (body) => ({
    version: body.version,
    license: typeof body.license === "string" ? body.license : body.license?.type,
    repository: repositoryUrl(body.repository),
    warning: body.deprecated ? `deprecated: ${body.deprecated}` : undefined,
  }),
  pypi: (body) => {
    const { info } = body;
    const projectUrls = info.project_urls ?? {};
    return {
      version: info.version,
      released: body.urls?.[0]?.upload_time_iso_8601,
      license: firstPresent(info.license_expression, info.license),
      repository: firstPresent(projectUrls.Source, projectUrls.Repository, info.home_page),
      requires: info.requires_python ? `Python ${info.requires_python}` : undefined,
      warning: info.yanked ? `yanked: ${info.yanked_reason ?? "no reason given"}` : undefined,
    };
  },
  crates: (body) => {
    const current = body.versions?.find((entry) => entry.num === body.crate.max_stable_version);
    return {
      version: body.crate.max_stable_version,
      released: current?.created_at,
      license: current?.license,
      repository: body.crate.repository,
      warning: current?.yanked ? "latest stable version is yanked" : undefined,
    };
  },
  go: (body) => ({ version: body.Version, released: body.Time, repository: body.Origin?.URL }),
  maven: (xml) => {
    const versions = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((match) => match[1]);
    return { version: latestStable(versions) };
  },
  nuget: (body) => ({ version: latestStable(body.versions ?? []) }),
  rubygems: (body) => ({
    version: body.version,
    released: body.version_created_at,
    license: body.licenses?.join(", "),
    repository: body.source_code_uri ?? body.homepage_uri,
  }),
  packagist: (body, name) => {
    const { version, time, license = [], source = {}, abandoned } = body.packages?.[name]?.[0] ?? {};
    return {
      version,
      released: time,
      license: license.join(", "),
      repository: repositoryUrl(source.url),
      warning: abandoned ? "package is marked abandoned" : undefined,
    };
  },
  pub: (body) => ({
    version: body.latest.version,
    released: body.latest.published,
    repository: body.latest.pubspec?.repository ?? body.latest.pubspec?.homepage,
    warning: body.isDiscontinued ? "package is discontinued" : undefined,
  }),
  hex: (body) => ({
    version: body.latest_stable_version,
    license: body.meta?.licenses?.join(", "),
    repository: body.meta?.links?.GitHub ?? body.meta?.links?.Github,
    warning: body.retirements && Object.keys(body.retirements).length > 0 ? "some releases are retired" : undefined,
  }),
  eol: (body) => {
    // Supported upstream = not end-of-life. `isMaintained` alone also counts paid extended support,
    // which endoflife.date reports separately (isEol true, isMaintained true).
    const supported = body.result.releases.filter((release) => release.isEol === false);
    const extendedOnly = body.result.releases.filter((release) => release.isEol && release.isMaintained);
    return {
      version: supported[0]?.latest?.name,
      cycles: supported.map((release) => ({
        cycle: release.name,
        latest: release.latest?.name,
        lts: release.isLts,
        endOfLife: release.eolFrom,
      })),
      warning:
        extendedOnly.length > 0
          ? `past end of life, extended (often paid) support only: ${extendedOnly.map((release) => release.name).join(", ")}`
          : undefined,
    };
  },
  scorecard: (body) => ({ score: body.score, released: body.date, version: body.scorecard?.version }),
  github: (body) => ({
    version: body.tag_name,
    released: body.published_at,
    repository: body.html_url?.replace(/\/releases\/tag\/.*$/, ""),
    warning: body.prerelease ? "latest release is marked as a pre-release" : undefined,
  }),
};

function requireShape(name, pattern, ecosystem, shape) {
  if (!pattern.test(name)) throw new Error(`${ecosystem} names look like "${shape}"`);
}

const OWNER_AND_NAME = /^[\w.-]+\/[\w.-]+$/;

/** One URL builder per ecosystem; `text: true` marks XML responses. */
const REQUEST_BUILDERS = {
  npm: (name) => {
    const path = name.startsWith("@") ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);
    return { url: `https://registry.npmjs.org/${path}/latest` };
  },
  pypi: (name) => ({ url: `https://pypi.org/pypi/${encodeURIComponent(name)}/json` }),
  crates: (name) => ({ url: `https://crates.io/api/v1/crates/${encodeURIComponent(name)}` }),
  go: (name) => ({ url: `https://proxy.golang.org/${escapeGoModule(name)}/@latest` }),
  maven: (name) => {
    requireShape(name, /^[\w.-]+:[\w.-]+$/, "maven", "group:artifact");
    const [group, artifact] = name.split(":");
    return {
      url: `https://repo1.maven.org/maven2/${group.replaceAll(".", "/")}/${artifact}/maven-metadata.xml`,
      text: true,
    };
  },
  nuget: (name) => ({ url: `https://api.nuget.org/v3-flatcontainer/${name.toLowerCase()}/index.json` }),
  rubygems: (name) => ({ url: `https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json` }),
  packagist: (name) => {
    requireShape(name, OWNER_AND_NAME, "packagist", "vendor/package");
    return { url: `https://repo.packagist.org/p2/${name.toLowerCase()}.json` };
  },
  pub: (name) => ({ url: `https://pub.dev/api/packages/${encodeURIComponent(name)}` }),
  hex: (name) => ({ url: `https://hex.pm/api/packages/${encodeURIComponent(name)}` }),
  eol: (name) => ({ url: `https://endoflife.date/api/v1/products/${encodeURIComponent(name)}` }),
  scorecard: (name) => ({ url: `https://api.securityscorecards.dev/projects/${name}` }),
  github: (name) => {
    requireShape(name, OWNER_AND_NAME, "github", "owner/repository");
    return { url: `https://api.github.com/repos/${name}/releases/latest` };
  },
};

/** Builds the request for one lookup. Exported for tests. */
export function requestFor(ecosystem, name) {
  const build = REQUEST_BUILDERS[ecosystem];
  if (!build)
    throw new Error(`unknown ecosystem "${ecosystem}"; use one of: ${Object.keys(REQUEST_BUILDERS).join(", ")}`);
  return build(name);
}

/** Looks up one `ecosystem:name` spec. Exported for scripts/check-updates.mjs. */
export async function lookup(spec) {
  const separator = spec.indexOf(":");
  if (separator <= 0) throw new Error(`"${spec}" must look like ecosystem:name`);
  const ecosystem = spec.slice(0, separator);
  const name = spec.slice(separator + 1);
  const request = requestFor(ecosystem, name);
  const response = await fetch(request.url, {
    headers: { "User-Agent": USER_AGENT, Accept: request.text ? "application/xml" : "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 404) throw new Error(`not found (${request.url})`);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${request.url}`);
  const body = request.text ? await response.text() : await response.json();
  const record = parsers[ecosystem](body, name.toLowerCase());
  if (!record.version && record.score === undefined) throw new Error(`no stable version found (${request.url})`);
  return { spec, source: request.url, ...record };
}

function format(result) {
  if (result.error) return `${result.spec}\n  error: ${result.error}`;
  const lines = [result.spec];
  const fields = [
    ["latest stable", result.version],
    ["released", result.released],
    ["licence", result.license],
    ["repository", result.repository],
    ["requires", result.requires],
    ["score", result.score === undefined ? undefined : `${result.score} / 10`],
    ["WARNING", result.warning],
  ];
  for (const [label, value] of fields) if (value !== undefined && value !== "") lines.push(`  ${label}: ${value}`);
  for (const cycle of result.cycles ?? []) {
    lines.push(
      `  cycle ${cycle.cycle}: latest ${cycle.latest}${cycle.lts ? " (LTS)" : ""}, end of life ${cycle.endOfLife ?? "not announced"}`,
    );
  }
  lines.push(`  source: ${result.source}`);
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const specs = args.filter((arg) => arg !== "--json");
  if (specs.length === 0) {
    console.error(
      "usage: node scripts/tech-lookup.mjs <ecosystem>:<name> [...] [--json]  (see the header of this file)",
    );
    process.exitCode = 2;
    return;
  }
  const results = await Promise.all(
    specs.map((spec) => lookup(spec).catch((error) => ({ spec, error: error.message }))),
  );
  console.log(asJson ? JSON.stringify(results, null, 2) : results.map(format).join("\n"));
  process.exitCode = results.some((result) => result.error) ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Exit quietly when the reader closes the pipe early (for example `| head -1`).
  process.stdout.on("error", (error) => {
    if (error.code !== "EPIPE") throw error;
    process.exit(process.exitCode ?? 0);
  });
  await main();
}
