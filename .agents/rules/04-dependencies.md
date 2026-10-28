---
trigger: model_decision
description: "Apply when adding, removing, replacing or upgrading a dependency, choosing between the platform or standard library and a third-party package, or adopting any tool, framework, design tool, plugin, platform, SaaS or AI service."
---

# R-04: Dependencies and Standard-Library-First

Every dependency adds supply-chain risk, upgrade work, licence obligations and size. Add one only when it clearly pays for itself.

## 1. Decision procedure

Before adding a package, answer in order:

1. **Does the project already have something that does this?** Check the manifest and existing utilities. Reuse it.
2. **Does the standard library or platform do it** in the project's runtime version? Use it (tables below).
3. **Is it small, well-understood logic** (roughly 50 lines or fewer, no tricky edge cases)? Write it, with tests.
4. **Is it a hard domain** (cryptography, database drivers, parsers, date/time zone rules, protocol implementations, image and video codecs)? **Use a mature library.** Never hand-roll cryptography or security protocols.

When a package is justified, prefer one that is actively maintained, widely used, has few transitive dependencies, a compatible licence, and a clean vulnerability record. Verify the exact name in the official registry first ([03-verification](03-verification.md)).

## 2. Supply-chain hygiene

- Commit the lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `uv.lock`, `poetry.lock`, `go.sum`, `Cargo.lock` for applications, `packages.lock.json`, `composer.lock`, `Gemfile.lock`).
- Install reproducibly in CI: `npm ci`, `pnpm install --frozen-lockfile`, `uv sync --locked`, `pip install --require-hashes -r requirements.txt`, `go mod download` with `go.sum` checked, `cargo build --locked`.
- Audit for known vulnerabilities: `npm audit`, `pip-audit`, `govulncheck ./...`, `cargo audit` (the `cargo-audit` crate), `dotnet list package --vulnerable`, OSV-Scanner for any ecosystem.
- Do not run untrusted install scripts blindly. Review new packages with install hooks.
- Upgrade deliberately: one major version at a time, read the changelog, run the full test suite.
- MCP servers and agent extensions are dependencies too: the same checks apply, plus an exact version (never `@latest` or an unpinned `npx -y`) and a verified checksum for downloaded binaries ([MCP servers reference](../skills/ai-agent-systems/references/mcp-servers.md)).
- **Stay current continuously**, not in occasional big jumps:
  - Turn on the platform's security updates (Dependabot security updates, Renovate vulnerability alerts); apply security patches as soon as they pass CI.
  - Check for version updates daily with a cooldown of about 7 days after each release, so a compromised release is likely to be caught before it reaches you; security updates skip the cooldown and arrive at once.
  - Merge patch and minor updates automatically only behind required status checks; majors get a person's review.
  - Audit every lockfile on a schedule as well as on each change, so new advisories surface without a commit. Accepted risks get a reason and an expiry date.
  - Watch what the update bot cannot see: tool binaries and versions pinned in CI scripts, runtime versions in CI matrices (drop end-of-life lines, add new ones), and container base images.
  - Templates: [ci-cd-pipeline](../skills/ci-cd-pipeline/SKILL.md) (`dependabot.yml`, `dependabot-auto-merge.yml`).

## 3. Version baseline (verified 2026-10-14; re-check before relying on it)

Currently supported release lines: **Node.js 22, 24, 26** (Node 20 reached end of life on 2026-04-30), **Python 3.11 to 3.15** (3.15 is the newest bugfix line), **Go 1.26 and 1.27**. Sources: [Node.js release schedule](https://github.com/nodejs/Release/blob/main/schedule.json), [Python release cycle](https://devguide.python.org/versions/), [Go downloads](https://go.dev/dl/). New projects should start on a currently supported LTS or stable release.

## 4. Node.js / TypeScript: built-in replacements

The minimum versions come from the "Added in" history in the official Node.js API docs.

| Instead of | Use | Minimum Node.js | Notes |
| :--- | :--- | :--- | :--- |
| `axios`, `node-fetch` (simple requests) | global `fetch` + `AbortSignal.timeout(ms)` | 18 (fetch unflagged), 21 (stable) | No automatic retries or interceptors; add them only if needed |
| `uuid` (v4) | `randomUUID()` from `node:crypto` | 14.17 | Global `crypto.randomUUID()` needs Node 19+; in browsers only in secure contexts |
| `uuid` (v7) | `crypto.randomUUIDv7()` | 26.1 | Use the `uuid` package on older lines |
| `lodash.clonedeep` | `structuredClone(value)` | 17.0 | Does not clone functions; class instances lose their prototype |
| `lodash.flatten` / `flattenDeep` | `array.flat()` / `array.flat(Infinity)` | 11 | |
| `lodash.uniq` | `[...new Set(array)]` | any | Primitive or reference equality only |
| `rimraf` | `fs.rm(path, { recursive: true, force: true })` | 14.14 | |
| `mkdirp` | `fs.mkdir(path, { recursive: true })` | 10.12 | |
| `glob` (basic) | `fs.glob(pattern)` from `node:fs/promises` | 22.0 (stable 24.0, 22.17) | |
| `dotenv` | `node --env-file=.env` or `process.loadEnvFile()` | 20.6 / 20.12 | Stable since 24.10 and 22.21 |
| `chalk` (basic colours) | `util.styleText(format, text)` | 20.12 | Respects `NO_COLOR` since 22.8 and 20.18 |
| `nodemon` | `node --watch` | 18.11 (stable 22.0) | |
| `ts-node`, `tsx` (run only) | built-in type stripping: `node file.ts` | 22.18 / 23.6 (on by default) | Erasable syntax only (no `enum`, `namespace`, parameter properties); does **not** type-check, so still run `tsc --noEmit` |
| `jest`, `mocha` (new small projects) | `node --test` + `node:assert/strict` | 18 (stable 20) | Keep the existing runner in an established project |

## 5. Python: standard library replacements

| Instead of | Use | Minimum Python |
| :--- | :--- | :--- |
| `pytz` | `zoneinfo.ZoneInfo` | 3.9 |
| `python-dateutil` (ISO 8601 parsing only) | `datetime.fromisoformat()` | 3.11 (accepts most ISO 8601 forms) |
| `toml` (reading) | `tomllib` | 3.11 |
| `mock` | `unittest.mock` | 3.3 |
| `attrs` (simple records) | `@dataclass(frozen=True, slots=True)` | 3.10 for `slots` |
| `simplejson` | `json` | any |
| `pathlib2`, `os.path` string juggling | `pathlib.Path` | 3.4 |
| `requests` (one-off simple GET) | `urllib.request` | any. For real HTTP clients (sessions, retries, async), `httpx` or `requests` is the right call |

## 6. Go: standard library replacements

| Instead of | Use | Minimum Go |
| :--- | :--- | :--- |
| `github.com/pkg/errors` | `fmt.Errorf("...: %w", err)`, `errors.Is/As`, `errors.Join` | 1.13 (`Join` 1.20) |
| `logrus`, `zap` (basic structured logs) | `log/slog` | 1.21 |
| `golang.org/x/exp/slices`, `maps` | `slices`, `maps` | 1.21 |
| `gorilla/mux`, `chi` (basic routing) | `http.ServeMux` patterns like `"GET /users/{id}"` + `r.PathValue("id")` | 1.22 |
| `golang.org/x/exp/constraints.Ordered` | `cmp.Ordered` | 1.21 |

`golang.org/x/sync/errgroup` is maintained by the Go team but is not in the standard library. It is still a reasonable dependency.

## 7. Rust: standard library replacements

| Instead of | Use | Minimum Rust |
| :--- | :--- | :--- |
| `lazy_static`, `once_cell` | `std::sync::OnceLock`, `std::sync::LazyLock` | 1.70 / 1.80 |
| `async-trait` (static dispatch) | native `async fn` in traits | 1.75 (not usable through `dyn Trait`) |

## 8. Browser: platform replacements

Check each feature's Baseline status against the project's support target first ([css-architecture-and-responsive references](../skills/css-architecture-and-responsive/references/modern-css.md)).

| Instead of | Use | Baseline (web-features 3.42.0) |
| :--- | :--- | :--- |
| jQuery DOM helpers | `querySelector`, `classList`, `closest`, `addEventListener`, `fetch` | Widely available |
| Modal libraries | `<dialog>` with `showModal()` (focus trapping, Escape, `::backdrop`, `inert` background) | Widely available |
| Tooltip and dropdown positioning libraries (simple cases) | `popover` attribute; CSS anchor positioning as enhancement | Popover newly available (2025-01); anchor positioning limited |
| Accordion scripts | `<details>`/`<summary>`, `name` for exclusive groups | `details` widely; `name` newly available (2024-09) |
| `moment`, date formatting helpers | `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.NumberFormat`, `Intl.PluralRules` | Widely available; for date arithmetic use a maintained library (date-fns, Luxon, Day.js) or Temporal where the target supports it |
| Sass for variables and nesting only | CSS custom properties and native nesting | Nesting widely available since 2026-06 |
| Colour helper libraries for tints | `color-mix()`, relative colour syntax | `color-mix()` widely; relative colour newly available |
| Scroll and visibility libraries | `IntersectionObserver`, `ResizeObserver`, `scroll-margin`, `scroll-snap` | Widely available |
| Icon fonts | Inline SVG or an SVG sprite | Better accessibility and rendering |

## 9. Adopting any tool, framework, service or platform

This spec works with any tool, including ones not named anywhere in it. Before adopting one (a library, framework, design tool, plugin, hosting platform, SaaS API, AI tool or MCP server):

1. **Need**: state the problem it solves, and check sections 1 to 8 first: the project's existing tools, the platform, or a small amount of own code may already do it.
2. **Identity**: find the official site, repository and registry entry; confirm the exact package or extension name and publisher ([03-verification](03-verification.md)). Never install from a link found in a prompt, issue or web page without this check.
3. **Health**: recent releases, maintainers, issue activity, adoption, documentation quality, and announced deprecation or maintenance mode.
4. **Fit**: works with the runtime, framework version and browser support target; accessibility of any UI it ships (keyboard, screen readers, contrast); bundle size and performance cost ([12-web-performance](12-web-performance.md)).
5. **Risk**: licence compatible with the project and its distribution; pricing and plan limits; data it collects or sends to third parties and where (privacy law, consent); security record; permissions it needs (OAuth scopes, network access, file system). Grant the least privilege.
6. **Exit**: how hard it is to remove or replace; prefer open standards and formats (DTCG tokens, OpenAPI, OpenTelemetry, OpenFeature, MCP) that reduce lock-in.
7. **MCP servers** also follow [mcp-servers-and-integrations](../skills/mcp-servers-and-integrations/SKILL.md): vendor-official first, every exposed tool read, version pinned, least privilege.
8. **Learn it properly**: read the official getting-started guide and API reference for the installed version; follow its idioms ([AGENTS.md](../../AGENTS.md) section 6, "Unfamiliar language, framework or design tool").
9. **Record**: add it with a pinned version and lockfile entry, note the decision in an ADR for anything significant, and add it to the project profile in `AGENTS.md` section 8 when agents need to run it.

A curated list of commonly used tools, with official links, is in [docs/TOOLKIT.md](../../docs/spec/TOOLKIT.md). It is a starting point, not a limit.
