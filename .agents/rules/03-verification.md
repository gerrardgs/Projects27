---
trigger: always_on
description: "Anti-hallucination protocol: verify every API, package, version, flag, path and claim against the real environment or official documentation before relying on it."
---

# R-03: Verification and Anti-Hallucination Protocol

Language models produce plausible but wrong details: functions that do not exist, flags from another tool, packages that were never published, outdated APIs. Treat every such detail as **unverified until checked**.

## 1. The protocol (run it before delivering code or commands)

1. **Ground in the workspace.** Read the manifests and lockfiles, and check the runtime version actually in use (`node --version`, `python3 --version`, `go version`, `rustc --version`, `java -version`, `dotnet --version`). Read the code you are about to call or change.
2. **Verify every external symbol.** Check that each function, method, option and type exists *in the installed version*. Use the sources in section 2, not memory.
3. **Check for deprecation.** Prefer the current API. Read the changelog or release notes when crossing a major version.
4. **Run the static checks**: compiler or type checker, then linter.
5. **Run the code**: tests, or a minimal reproduction, and read the actual output.
6. **Label what remains unverified.** If you could not run or check something, say so explicitly in your response.

## 2. Where to verify (most authoritative first)

1. The installed source and type definitions: `node_modules/<pkg>/` (`package.json` → `types`), the virtualenv `site-packages/<pkg>/`, `go doc <pkg>.<Symbol>`, `cargo doc`, IDE "go to definition".
2. Built-in help: `<tool> --help`, `<tool> help <subcommand>`, `man <tool>`, `python3 -m pydoc <module>`.
3. Official documentation and changelog **for the exact version in use**.
4. The package registry: `npm view <pkg> versions`, `pip index versions <pkg>`, `go list -m -versions <module>`, `cargo info <crate>`, Maven Central, NuGet, Packagist. `node scripts/tech-lookup.mjs` queries 12 registries and data sources at once (versions, licence, deprecation, end-of-life dates, security score) and fails on names that do not exist.
5. Secondary sources (blogs, Q&A sites, AI answers): hints only, confirm in 1 to 4.

For front-end and design work, also:

- **Browser support**: [Baseline](https://web.dev/baseline) via the `web-features` package or the [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/), then [MDN browser compatibility data](https://developer.mozilla.org/) and [Can I use](https://caniuse.com/). Never claim a CSS, HTML or JavaScript feature works everywhere without checking.
- **HTML, ARIA and accessibility**: the [HTML Living Standard](https://html.spec.whatwg.org/), [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/), [ARIA in HTML](https://www.w3.org/TR/html-aria/) and the [WCAG 2.2 Understanding documents](https://www.w3.org/WAI/WCAG22/Understanding/). Measure contrast with a tool; do not estimate it.
- **Design values**: the design file (Dev Mode, the Figma MCP server, Penpot inspect), the token source, or the brand guide. A screenshot gives estimates only.
- **Licences**: the licence text on the official source of the font, image, icon set or library.

## 3. Hard rules

- **No phantom packages.** Before adding a dependency, confirm the exact name exists in the official registry and is the intended project: check the publisher, repository link, download history and age. Attackers register names that AI models tend to hallucinate ("slopsquatting") and look-alike names ("typosquatting").
- **No phantom flags or config keys.** Check `--help` or the docs for every flag you recommend for `git`, `docker`, `kubectl`, `npm`, `pip`, compilers, cloud CLIs, and so on. Flags differ between tools and between versions (for example GNU vs BSD `sed -i`).
- **No phantom paths or environment variables.** Confirm files exist before referencing them. Document every required environment variable (for example in `.env.example`) and fail fast with a clear message when one is missing.
- **No invented output.** Never claim tests passed, a build succeeded or a benchmark improved unless you ran it and saw the result. Quote the relevant output.
- **No silent version assumptions.** If code needs a minimum runtime or library version, state it, and check it is compatible with the project's declared version.
- **Cite when stating facts** about external tools, standards or versions that the user will rely on: link the official source.

## 4. Common deprecated patterns and their replacements

| Ecosystem | Avoid | Use instead |
| :--- | :--- | :--- |
| Node.js | `new Buffer(x)` (DEP0005) | `Buffer.from(x)`, `Buffer.alloc(n)` |
| Node.js | `url.parse()` for untrusted input | `new URL(input, base)` (WHATWG URL) |
| Python | `datetime.utcnow()` (deprecated in 3.12) | `datetime.now(timezone.utc)` |
| Python | `asyncio.get_event_loop()` to start a program | `asyncio.run(main())`; inside coroutines `asyncio.get_running_loop()` |
| Go | `io/ioutil` (deprecated since Go 1.16) | functions in `io` and `os` |
| React | `componentWillMount` and other legacy lifecycles | function components and hooks |
| React 19 | `ReactDOM.render`, `ReactDOM.hydrate` (removed) | `createRoot(...).render()`, `hydrateRoot()` from `react-dom/client` |
| Browser JS | `document.execCommand` for clipboard | `navigator.clipboard.writeText()` (secure contexts) |
| Browser JS | `unload` event | `pagehide` / `visibilitychange` (keeps the back/forward cache working) |
| CSS | `-webkit-`/`-moz-` prefixes added by hand | Unprefixed properties; let Lightning CSS or Autoprefixer add prefixes from `browserslist` |
| CSS | `100vh` for full-height mobile layouts | `100svh` / `100dvh` (Baseline widely available) |
| HTML | `<meta name="viewport" content="..., maximum-scale=1, user-scalable=no">` | `width=device-width, initial-scale=1` (never block zoom) |
| Design tools | Adobe XD for new work (maintenance mode) | Figma, Penpot or the team's current tool |
| Web metrics | First Input Delay (FID) | Interaction to Next Paint (INP), a Core Web Vital since March 2024 |

Check the runtime's own deprecation list when unsure: Node.js `--throw-deprecation`, Python `-W error::DeprecationWarning`, `go vet`, `cargo clippy`, compiler warnings.

## 5. When verification is impossible

If you lack network access or the tool is not installed, do not guess silently. Say what you could not verify, give the command the user can run to check it, and prefer an approach you *can* verify locally.

## 6. Blind spots, cross-checks and objective validation

- **Hunt for blind spots** before you deliver: what have you not looked at? Check failure and edge states, security and privacy, accessibility, performance, other browsers, devices, locales and themes, real and extreme data, concurrency and offline behaviour, and what the tests do not cover. List the ones you could not check.
- **Cross-check every fact the user will rely on** (a version, API, standard, browser support, figure, date, licence or legal claim) against at least two independent sources, official first. When sources disagree, say so, prefer the primary source, and record the date you checked.
- **Use current, sustainable standards and tools**: the current version of the standard; tools and libraries that are actively maintained (recent releases, not deprecated or end-of-life, a healthy maintainer base and a compatible licence) with a supported upgrade path. Check registries, release notes and [endoflife.date](https://endoflife.date/) instead of memory ([04-dependencies](04-dependencies.md) section 9).
- **Validate objectively**: define the success criteria before the work, in measurable terms (tests, thresholds, tool output such as axe-core, Lighthouse, Core Web Vitals, html-validate, coverage), then judge the result only by that evidence and quote it. An agent's own impression is not validation; a criterion that was not measured is reported as unverified.
