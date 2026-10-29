# Projects 27: Enterprise Finance Reporting on the Merged Projects 23 and 24 Agent Specifications

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Format: Agent Skills](https://img.shields.io/badge/Format-Agent%20Skills-blue.svg)](https://agentskills.io/specification)
[![Validate](https://github.com/gerrardgs/Projects27/actions/workflows/validate.yml/badge.svg)](https://github.com/gerrardgs/Projects27/actions/workflows/validate.yml)
[![Skills: 58](https://img.shields.io/badge/Skills-58%20Verified-success.svg)](.agents/skills/)
[![Rules: 17](https://img.shields.io/badge/Rules-17%20Core-blueviolet.svg)](.agents/rules/)
[![Design References: 470+](https://img.shields.io/badge/Design%20References-470%2B%20Curated-indigo.svg)](docs/spec/DESIGN-REFERENCES.md)
[![Accessibility: WCAG 2.2 AA](https://img.shields.io/badge/A11y-WCAG%202.2%20AA-brightgreen.svg)](.agents/rules/10-accessibility.md)
[![Design Tokens: DTCG 2025.10](https://img.shields.io/badge/Design%20Tokens-DTCG%202025.10-orange.svg)](.agents/skills/design-system-and-tokens/SKILL.md)

Projects 27 combines everything in [Projects 23](https://github.com/gerrardgs/Projects23) (engineering: back end, data, AI, cloud, security, 30 skills) and [Projects 24](https://github.com/gerrardgs/Projects24) (design, front end, mobile, media, 37 skills) into one specification of 18 rules and 61 skills, and applies it to one product: an enterprise finance reporting system for monthly income and expense reports, financial statements, budgets, bank reconciliation and period close, with AI assistance, speech input and automated recaps.

| Document | Content |
| :--- | :--- |
| [docs/PRD.md](docs/PRD.md) | Problems, users and roles, functional and non-functional requirements, acceptance criteria |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Verified facts with sources: Indonesian tax and accounting rules, data protection, AI models, speech recognition, platform versions; open questions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modular monolith on Node.js 24 and PostgreSQL 18, modules, data integrity and security design |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Six delivery stages; stage 1 (this foundation) is complete |
| [Rule 17](.agents/rules/17-financial-integrity.md), [finance-reporting-systems](.agents/skills/finance-reporting-systems/SKILL.md) | Financial integrity invariants and the procedure for building finance software |

The specification documents of both source repositories are kept under [docs/spec/](docs/spec/) (Projects 24) and [docs/spec/engineering/](docs/spec/engineering/) (Projects 23). The rest of this README describes the specification as inherited from Projects 24 and is revised as the application lands.

A universal, production-ready AI agent framework and standard designed to make AI coding models work with the rigor and craft of senior product designers, digital graphic designers, and lead front-end engineers. It bridges visual design and production code, and is built to reduce hallucinations, ungrounded hex values, broken CSS and accessibility failures across the design, prototyping, tokenization and web/mobile engineering lifecycle. Rules guide a model; checks enforce: every claim the agent makes must be verified by running something (see Limits).

Built on top of the engineering lifecycle inherited from [Projects 23](https://github.com/gerrardgs/Projects23), it provides dedicated rules, step-by-step skills, tested code templates, and a 470+ curated reference library covering Figma integration, design tokens (DTCG), modern HTML/CSS/JS, full-stack frameworks (React, Next.js, Vue, Nuxt, Svelte, Angular, Astro), mobile engineering (React Native, Flutter, iOS, Android), WCAG 2.2 AA accessibility, Core Web Vitals performance optimisation, and photo, video, colour grading and motion graphics production.

Works out of the box with Google Antigravity, Claude Code, OpenAI Codex, Gemini CLI, Cursor, Windsurf/Devin, GitHub Copilot, Cline, Aider, or any chat model you paste it into.

Every command, version, package name, extension identifier, Baseline browser feature and template in this repository was verified against official sources or by running it (dated 2026-10-15), and the templates run in GitHub Actions on every push: all 18 jobs of the Validate workflow passed for commit `7ff1512`.

---

## The Concept: Clean Code and Clean Execution

Everything in Projects 27 serves one idea, applied to design files, code and the way an agent works:

- **Clean code** is what the result looks like: readable, idiomatic, strictly typed, tested, accessible, and built from design tokens and shared components ([rule 02](.agents/rules/02-clean-code.md)).
- **Clean execution** is how the work is done: understand first, write an implementation plan and wait for your approval, preview, one verified step at a time, stop at the first failure, no irreversible action without approval, and leave no mess in the repository, the browser, the design file or the machine ([rule 15](.agents/rules/15-clean-execution.md)).

The repository follows its own rules: its code is formatted and linted by Biome, TypeScript templates type-check with dead-code detection, and every template runs in CI.

---

## Why Projects 27

Most AI coding assistants struggle with visual design and front-end engineering: they invent non-existent CSS properties, hardcode arbitrary hex codes and magic pixel margins, omit interactive UI states, neglect screen reader accessibility, and produce disconnected, fragile code that fails in production browsers. Projects 27 solves this through four core design-to-code principles:

1. **Seamless Figma-to-Code & Design System Fidelity**:
   Never generate ad-hoc styles in isolation. Projects 27 establishes a single source of truth based on the Design Tokens Community Group (DTCG 2025.10) specification. It provides a tested pipeline to synchronize Figma Variables via REST API into themeable CSS variables, connects directly to Figma and Penpot via MCP servers, and aligns components with Storybook and Code Connect.
2. **Non-Negotiable Accessibility (WCAG 2.2 AA) & Web Baseline Standards**:
   Accessibility is an absolute requirement, not an afterthought. Projects 27 mandates semantic HTML before ARIA, visible keyboard focus rings, 44×44 px touch targets (never below the WCAG 2.2 minimum of 24×24 px), compliant colour contrast ratios (4.5:1 text, 3:1 UI), and automated axe-core scanning in CI. Every proposed CSS or JS feature is verified against Web Baseline browser availability tables before adoption.
3. **Interactive Completeness & Micro-Interactions**:
   Static design mockups only show the happy path. Projects 27 forces AI agents to design and implement every user interface state (default, hover, focus-visible, active, disabled, loading, skeleton, error, and empty), responsive viewports across mobile/tablet/desktop, purposeful micro-interactions (View Transitions, scroll-driven animations as progressive enhancement, GSAP/Motion, reduced-motion preferences), and Core Web Vitals performance budgets (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1).
4. **Complete Design-to-Code Lifecycle Mastery**:
   37 modular skills and 16 normative rules that cover every phase: from UX research, wireframing, high-fidelity UI design, digital graphic assets (SVG, vector, social, print prep), and photo, video, colour grading and motion graphics production, to design-to-code handoff, modern framework engineering, mobile platforms, automated visual QA, and production release inherited from Projects 23.

---

## What Is Inside

```text
Projects 27 Architecture: Digital Design & Front-End Engineering
================================================================

  +-------------------------------------------------------------------------+
  | Core (Always Loaded): AGENTS.md (~173 lines)                            |
  | Design & front-end priorities, non-negotiables, design-to-code workflow |
  +-------------------------------------------------------------------------+
       |                                                 |
       v (links to)                                      v (links to)
  +-----------------------------------+             +-----------------------------------+
  | Rules (.agents/rules/)            |             | Skills (.agents/skills/)          |
  | 16 normative rules:               |             | 37 on-demand step-by-step guides: |
  | - 7 Always-On (core, clean code,  |             | - 10 Digital Design & UI/UX Skills|
  |   verification, security, design  |             | - 4 Photo, Video, Colour & Motion |
  |   principles, a11y, clean exec.)  |             | - 12 Front-End & Mobile Skills    |
  | - 9 On-Demand (dependencies,      |             | - 11 Software Lifecycle Skills    |
  |   errors, testing, git workflow,  |             | + 8 Verified runnable templates   |
  |   front-end code, web perf,       |             |   + CI, Lighthouse, deploy configs|
  |   assets/licensing, UX writing,   |             |                                   |
  |   project documentation)          |             |                                   |
  +-----------------------------------+             +-----------------------------------+
       |                                                 |
       +-----------------------+-------------------------+
                               |
                               v (auto-mirrored to)
  +-------------------------------------------------------------------------+
  | Tool Adapters, Mirrors & Reference Library                              |
  | CLAUDE.md, GEMINI.md, .claude/skills/ (auto-sync), Copilot, Aider, etc. |
  | docs/: DESIGN-REFERENCES (470+), TOOLKIT (350+ tools), PROMPT-LIBRARY   |
  +-------------------------------------------------------------------------+
```

| Layer | Location | Loaded | Contents |
| :--- | :--- | :--- | :--- |
| **Core** | [`AGENTS.md`](AGENTS.md) | Always | Priorities, non-negotiables, design-to-code workflow, rule and skill indexes, operating conditions, definition of done (about 173 lines) |
| **Rules** | [`.agents/rules/`](.agents/rules/) | Always (7) or when relevant (9) | Core principles, clean code, verification, security, **design principles, accessibility (WCAG 2.2 AA), clean execution**, dependencies, error handling, testing, Git workflow, **front-end code, web performance, visual assets & licensing, UX writing & ethics, project documentation** |
| **Skills** | [`.agents/skills/`](.agents/skills/) | When task matches | 37 step-by-step procedures (10 digital design & UI/UX, 4 photo, video, colour & motion, 12 front-end & mobile, 11 software lifecycle) with tested templates and references |
| **Reference Library** | [`docs/DESIGN-REFERENCES.md`](docs/spec/DESIGN-REFERENCES.md) | When needed | About 470 curated, link-checked sources in 27 sections: standards, accessibility, UX, UI, design systems, typography, colour, imagery, branding and print, motion, data viz, tools, AI workflows, HTML/CSS/JS, frameworks, browser support, testing, performance, security, SEO, i18n, ethics and law, courses, books, communities, inspiration, photo, video, colour and motion production |
| **Tested Templates** | Various under `.agents/skills/` | On demand / in CI | Runnable token pipelines, Figma variables sync, accessible static site with security headers, axe-core scanner, browser chaos experiments, web video and image pipeline, Node.js & Python backend services, front-end CI, Lighthouse CI budgets, GitHub Pages deploy |
| **Tools Catalog** | [`docs/TOOLKIT.md`](docs/spec/TOOLKIT.md) | When needed | 350+ commonly used tools, libraries, platforms and services by phase, with official links, plus the rule for adopting any tool that is not listed |
| **Prompt Library** | [`docs/PROMPT-LIBRARY.md`](docs/spec/PROMPT-LIBRARY.md) | When needed | Ready-to-use prompts for every design and front-end scenario, with notes per AI tool |
| **Adapters** | `CLAUDE.md`, `GEMINI.md`, `.gemini/settings.json`, `.github/copilot-instructions.md`, `.aider.conf.yml` | Per tool | Standard loaders connecting each AI assistant to the single core |
| **Mirror** | `.claude/skills/` | Generated | Automated copy of skills for Claude Code and Cline; kept in sync via script |
| **Tooling** | [`scripts/`](scripts/) | You or CI | Installer script, test runner, link checker, mirror validator, deletion guard, and the daily freshness check and lockfile audit that keep dependencies, tools and patches current |
| **Documentation** | [`docs/`](docs/) | Reference | Architectural design, operational manual, anti-hallucination playbook, contributing guidelines, design reference library, tools catalog, prompt library |

---

## Skills Catalog

### 1. Digital Design, UI/UX, & Graphics Skills (13 Skills)

Step-by-step procedures covering visual research, prototyping, design systems, vector art, and Figma integration:

| Phase | Skill | Highlights |
| :--- | :--- | :--- |
| **Discover** | [ux-research-and-strategy](.agents/skills/ux-research-and-strategy/SKILL.md) | User research briefs, qualitative/quantitative sample sizes, research ethics, synthesis, user personas, journey mapping, and information architecture |
| **Design** | [ui-design-and-prototyping](.agents/skills/ui-design-and-prototyping/SKILL.md) | Wireframe to hi-fi prototyping, layout grids, responsive typography scales, colour palettes, interactive states, design tooling documentation |
| **Design** | [graphic-design-production](.agents/skills/graphic-design-production/SKILL.md) | Brand identities, logos, digital social/ad banners, print preparation (bleed, CMYK, PDF/X), vector formats (SVG), official platform spec sources |
| **Motion** | [motion-and-interaction](.agents/skills/motion-and-interaction/SKILL.md) | Purposeful UI motion, duration and easing tokens, View Transitions API, scroll-driven animations, reduced-motion preferences, Motion/GSAP/Lottie/Rive |
| **Data Viz** | [data-visualization-design](.agents/skills/data-visualization-design/SKILL.md) | Chart selection by data question, honest visual encoding, colour-blind-safe palettes, responsive charts, modern viz libraries (D3, Chart.js, Observable) |
| **System** | [design-system-and-tokens](.agents/skills/design-system-and-tokens/SKILL.md) | DTCG 2025.10 tokens, light/dark themes, **tested token pipeline with automated WCAG contrast checks**, headless components, Storybook, token governance |
| **Handoff** | [design-to-code-handoff](.agents/skills/design-to-code-handoff/SKILL.md) | Mapping design files or screenshots to tokens and components, bridging the gap between design mockups and real-world interactive code |
| **Anti-Slop** | [anti-slop-filter](.agents/skills/anti-slop-filter/SKILL.md) | Filter for generic AI output adapted from antislop (MIT): direction from the brand or `DESIGN.md` as data, Design Read with energy, rhythm and motion dials, hard gates (honest content, working controls, states, contrast, mobile, themes, click-through evidence), a one-line reason for every technique, UI, writing and code-comment slop catalogues, PASS/FAIL delivery report |
| **Content Hygiene** | [content-hygiene](.agents/skills/content-hygiene/SKILL.md) | Zero-dependency scanner (5 tests) for invisible and bidirectional Unicode: removes zero-width and tag characters (hidden text, prompt smuggling), flags Trojan Source controls in code, keeps what scripts and emoji need; strips GPS, serial and owner metadata from files while keeping AI disclosures, Content Credentials and copyright notices |
| **Clean Text** | [clean-user-facing-text](.agents/skills/clean-user-facing-text/SKILL.md) | Local zero-dependency Unicode hygiene and stylometric rewrite pass for reader-facing prose while preserving author voice and factual integrity |
| **Provenance** | [remove-ai-marks](.agents/skills/remove-ai-marks/SKILL.md) | Multi-vendor AI mark removal: invisible Unicode (Layer A), statistical rewrite (Layer B), and C2PA/EXIF/container metadata stripping across files |
| **AI Design** | [ai-design-and-artifacts](.agents/skills/ai-design-and-artifacts/SKILL.md) | Claude Design and artifacts: design system first (`/design-sync`), briefs and iteration, review of AI-generated designs (tokens, measured contrast, licences), handoff with the bundle or `/design` **without overwriting existing code**, safe sharing |
| **Handoff** | [figma-integration](.agents/skills/figma-integration/SKILL.md) | Figma file preparation, MCP server tools and rate limits, Code Connect, **tested Figma variables → DTCG tokens sync**, plugins/codegen, token security, Penpot MCP |

### 2. Photo, Video, Colour & Motion Production Skills (4 Skills)

Procedures for media production, from the first storyboard to the final file on a website, broadcast or social platform:

| Domain | Skill | Highlights |
| :--- | :--- | :--- |
| **Motion** | [motion-graphics-and-animation](.agents/skills/motion-graphics-and-animation/SKILL.md) | Storyboards and animatics, the twelve principles, easing and kinetic type, Lottie, dotLottie and Rive exports, flash and pattern safety (WCAG 2.3.1, Harding, PEAT), safe animation runtimes on the web |
| **Video** | [video-editing-and-post-production](.agents/skills/video-editing-and-post-production/SKILL.md) | Ingest to archive workflow, editing craft, loudness (EBU R 128, ATSC A/85, AES TD1004, platforms), captions and audio description, codecs, HLS and DASH, **tested FFmpeg and sharp web media pipeline** |
| **Colour** | [color-grading-and-color-management](.agents/skills/color-grading-and-color-management/SKILL.md) | ACES 2.0 and OpenColorIO 2.6, log formats, LUTs and CDLs, scopes, correction then grading, SDR (BT.709, BT.1886) and HDR (BT.2100 PQ and HLG) deliverables, calibration, colour on the web |
| **Photo** | [photo-editing-and-retouching](.agents/skills/photo-editing-and-retouching/SKILL.md) | RAW and non-destructive workflow, retouching craft, honest-retouching and AI disclosure laws (EU AI Act Art. 50, France, Norway, UK ASA), metadata and GPS removal, Content Credentials (C2PA 2.4), export for web and print |

### 3. Front-End & Mobile Engineering Skills (12 Skills)

Procedures covering production web and mobile implementation, modern frameworks, accessibility, and performance:

| Domain | Skill | Highlights |
| :--- | :--- | :--- |
| **Build** | [frontend-from-scratch](.agents/skills/frontend-from-scratch/SKILL.md) | Platform-first stack choice, layered semantic architecture, metadata, **accessible starter site (no runtime dependencies) with strict CSP, 0 axe violations and Lighthouse 100 in all categories** |
| **Framework** | [framework-frontend-engineering](.agents/skills/framework-frontend-engineering/SKILL.md) | React, Next.js, Vue, Nuxt, Svelte, Angular, Astro: SSR/SSG/ISR rendering strategies, component architecture, state management, forms, version audits from npm |
| **CSS** | [css-architecture-and-responsive](.agents/skills/css-architecture-and-responsive/SKILL.md) | Modern CSS Cascade Layers (`@layer`), container queries, subgrid, fluid typography (`clamp()`), theming, **Baseline status validation from web-features** |
| **Mobile** | [mobile-engineering](.agents/skills/mobile-engineering/SKILL.md) | iOS, Android, Flutter, React Native: platform design (Apple HIG, Material 3), safe areas, dynamic type, touch targets, MASVS security, store release |
| **Integrate** | [web-integrations-and-platforms](.agents/skills/web-integrations-and-platforms/SKILL.md) | Headless CMS, WordPress, Shopify, payments with small PCI scope, auth UI and passkeys, HTML email, PWA, technical SEO, consent and third-party scripts |
| **MCP** | [mcp-servers-and-integrations](.agents/skills/mcp-servers-and-integrations/SKILL.md) | Vendor-official MCP servers first, directories (MCP Registry, awesome-mcp-servers) for discovery only, every tool reviewed, pinned versions, secrets via `${VAR}`, the lethal trifecta, **MCP Toolbox for Databases** with read-only identities, MCP Inspector |
| **Ship** | [frontend-deployment](.agents/skills/frontend-deployment/SKILL.md) | Static, server and edge hosting, public vs secret config, **tested security headers (Netlify, Cloudflare Pages, Vercel)**, caching, domains, previews, monitoring, rollback |
| **Audit** | [accessibility-audit](.agents/skills/accessibility-audit/SKILL.md) | WCAG 2.2 checklist (Level A & AA), legal frameworks (European Accessibility Act [EAA], ADA, Section 508, EN 301 549), manual testing, **automated axe-core scanner** |
| **Optimise** | [web-performance-optimization](.agents/skills/web-performance-optimization/SKILL.md) | Core Web Vitals diagnostics and fixes (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1), image optimisation (AVIF/WebP), font loading, bundle splitting, performance budgets |
| **Resilience** | [resilience-and-chaos-engineering](.agents/skills/resilience-and-chaos-engineering/SKILL.md) | Chaos engineering as a six-step cycle (steady state, failure hypothesis, injected chaos, observation, evaluation, improvement plan) with an experiment record template, front-end failure modes, resilience patterns, SLOs and error budgets, **tested browser chaos experiments** |
| **QA** | [frontend-testing-and-visual-qa](.agents/skills/frontend-testing-and-visual-qa/SKILL.md) | Component testing (Testing Library), end-to-end testing (Playwright), visual regression snapshots, cross-browser and real-device QA matrices |
| **Review** | [design-critique-and-review](.agents/skills/design-critique-and-review/SKILL.md) | Heuristic evaluations, visual hierarchy critique, design system token compliance, accessibility and UX writing passes with severity-ranked findings |

### 4. Software Lifecycle Skills (11 Skills: 9 Inherited from Projects 23)

Complete software engineering lifecycle foundation ensuring bulletproof tooling, security, and automated delivery:

| Phase | Skill | Highlights |
| :--- | :--- | :--- |
| **Start** | [project-bootstrap](.agents/skills/project-bootstrap/SKILL.md) | Toolchains for 7 language families, 22 verified front-end and design VS Code extensions, `.editorconfig`, `.gitattributes`, pre-commit secret scanning, ADR templates |
| **Build** | [native-from-scratch](.agents/skills/native-from-scratch/SKILL.md) | Standard-library-first architecture; runnable Node.js (TypeScript) and Python microservices with unit tests, lockfiles, and container configs |
| **Change** | [change-existing-code](.agents/skills/change-existing-code/SKILL.md) | Surgical changes (every changed line traces to the request), characterization tests, small verified steps, dependency upgrades, automated codemods, and strangler fig migrations |
| **Test** | [test-engineering](.agents/skills/test-engineering/SKILL.md) | Test pyramid, determinism, property-based testing, fuzz testing, mutation testing, and language-specific tooling |
| **Debug** | [systematic-debugging](.agents/skills/systematic-debugging/SKILL.md) | Root cause isolation, a procedure for correcting the agent's own reasoning when a fix fails or the user says it is wrong, `git bisect` recipes, profilers, memory leak detection, production incident response, and a browser debugging reference (hydration, CORS, layout, deploy-only bugs) |
| **Review** | [rigorous-code-audit](.agents/skills/rigorous-code-audit/SKILL.md) | Toolchain verification, OWASP Top 10 checklist, and severity-ranked audit findings |
| **Secure** | [security-hardening](.agents/skills/security-hardening/SKILL.md) | Threat modelling, OWASP ASVS 5.0, secret rotation, SAST, dependency audits, container scanning, and SBOM generation |
| **Audit** | [security-vulnerability-audit](.agents/skills/security-vulnerability-audit/SKILL.md) | Evidence-first vulnerability audits adapted from Cloudflare's security-audit skill (MIT): guidance or full mode, sandboxed local evidence only, a six-part finding contract, confirmed / needs-validation / rejected verdicts, independent verification, impact-based severity, coverage ledger, and front-end attack classes (DOM XSS, prototype pollution, postMessage, CORS, service workers, XS-Leaks, clickjacking, OAuth, CI, AI and MCP) |
| **Document** | [project-documentation](.agents/skills/project-documentation/SKILL.md) | The complete `docs/` set (23 required documents from PRD to deployment, including accessibility, performance, privacy and a glossary, plus optional analytics, i18n, SEO and runbook documents) with owners, review dates and statuses, 27 templates, and a **tested checker** that fails on missing documents, empty sections, leftover template text, stale reviews and broken links |
| **Automate** | [ci-cd-pipeline](.agents/skills/ci-cd-pipeline/SKILL.md) | GitHub Actions workflows pinned to commit SHAs, least-privilege token permissions, Dependabot with cooldown timers, plus front-end CI, Lighthouse CI budgets and a GitHub Pages deploy workflow |
| **Ship** | [deploy-and-release](.agents/skills/deploy-and-release/SKILL.md) | Production launch checklists, zero-downtime deployments, canary/blue-green rollouts, observability, and rollback plans |

---

## Tested Runnable Templates

Projects 27 includes runnable reference implementations that prove design-to-code principles in code. Each template is tested continuously in CI:

| Template | What It Proves | Verification Status |
| :--- | :--- | :--- |
| [figma-variables-sync](.agents/skills/figma-integration/assets/figma-variables-sync/) | Figma REST API variables → DTCG token files per collection and mode plus a standard resolver file; scope-based type mapping; secure API client with zero token leakage | `tsc --noEmit` clean; type-checked against Figma's official `@figma/rest-api-spec` typings; 17 tests including a round trip through the token pipeline with contrast checks |
| [design-tokens](.agents/skills/design-system-and-tokens/assets/design-tokens/) | DTCG 2025.10 tokens compiler into CSS custom properties, with themes defined by the DTCG Resolver Module; alias resolution; automated WCAG contrast checks of every text and UI pair | `tsc --noEmit` clean; 23 tests pass; 22 contrast pairs pass (Node.js 22, 24 and 26 in CI; TypeScript 7.0.2) |
| [static-site](.agents/skills/frontend-from-scratch/assets/static-site/) | Accessible starter site with no runtime dependencies: skip link, landmarks, labelled form with error summary, theme toggle, 44 px touch targets, reduced motion, strict CSP with Trusted Types and security headers for Netlify, Cloudflare Pages and Vercel | html-validate and Stylelint clean; 18 tests pass; axe-core 0 violations and 0 console errors under the CSP (phone and desktop, light and dark); Lighthouse 100 in all four categories, CLS 0 |
| [browser-chaos](.agents/skills/resilience-and-chaos-engineering/assets/browser-chaos/) | Six chaos experiments (scripts, styles, network, storage, offline) with a steady-state hypothesis each; faults injected only in the test browser | The starter site holds all 6; tests prove a deliberately fragile page is caught (3 tests) |
| [axe-check](.agents/skills/accessibility-audit/assets/axe-check/) | Automated WCAG 2.0 to 2.2 A/AA scan in headless Chromium using Playwright and axe-core across viewports and colour schemes | Fails on accessibility violations and on console errors (for example CSP violations); validated against the static site: 0 problems, and an inline-script probe was caught |
| [web-media-pipeline](.agents/skills/video-editing-and-post-production/assets/web-media-pipeline/) | Master video to web H.264 MP4 (BT.709 tags, faststart, two-pass loudness normalisation) plus AV1/Opus WebM and a poster; master photo to responsive AVIF, WebP and JPEG in sRGB with EXIF, GPS, serial numbers and XMP removed; FFmpeg run without a shell and option or protocol paths refused | `tsc --noEmit` clean; 8 tests measure every property on generated files with ffprobe, FFmpeg `ebur128` (within 1 LU of the target, true peak at most -1 dBTP) and sharp |
| [CI and deploy templates](.agents/skills/ci-cd-pipeline/assets/) | Front-end CI, Lighthouse CI budgets, GitHub Pages deploy with official actions pinned to SHAs | actionlint and zizmor (auditor persona) clean; `lighthouserc.json` run with `@lhci/cli` 0.15.1 |
| [native-from-scratch](.agents/skills/native-from-scratch/SKILL.md) | Inherited Node.js (TypeScript) and Python microservices with unit tests, Dockerfile, and lockfile | Node.js 22, 24, 26 and Python 3.11 to 3.15 in CI |

---

## Quickstart & Installation

Projects 27 installs directly into any existing repository or new project. The installer copies only specification and configuration files and **never overwrites files that already exist and differ** (it lists them for you to inspect and merge).

### Verified Install (recommended)

Pin a full commit SHA from the [commit list](https://github.com/gerrardgs/Projects27/commits/main): unlike a branch or tag, it cannot be changed after you have reviewed it. Download the installer, read it, then run it. Piping a download straight into a shell is what this project's own security rule forbids.

```sh
COMMIT=<full-40-character-commit-sha>
curl -fsSLo install.sh "https://raw.githubusercontent.com/gerrardgs/Projects27/${COMMIT}/scripts/install.sh"
less install.sh                                   # read it before running it
bash install.sh --ref "${COMMIT}" --dry-run       # preview: nothing is written
bash install.sh --ref "${COMMIT}"                 # install into the current directory
```

### Manual Installation

Alternatively, clone this repository and install locally:

```sh
git clone https://github.com/gerrardgs/Projects27.git
bash Projects27/scripts/install.sh --source Projects27 /path/to/your/project
```

### Configuration Steps After Installation

1. **Fill in Section 8 of `AGENTS.md`**: Specify your project profile (framework, browser support target, Figma/Penpot design source, and test/build commands).
2. **Configure Design Tool MCP Servers**: For Figma integration, connect the official Figma MCP server ([Figma MCP Guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)) or Penpot MCP server.
3. **Sync and Validate**: Run `node scripts/agents-sync.mjs` (Node.js 22+) to generate `.claude/skills/` mirrors and confirm all links and metadata are valid.
4. **Commit**: Add and commit the installed files into your repository.

---

## Tool Compatibility Matrix

Projects 27 conforms to the open [Agent Skills specification](https://agentskills.io/specification) and works out of the box across all major AI developer tools:

| AI Tool | Core Rules Loaded | Rules in `.agents/rules/` | Skills System | Reference Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Google Antigravity** | `AGENTS.md`, `GEMINI.md` | Native (`trigger` frontmatter) | `.agents/skills/` | [Antigravity Rules](https://antigravity.google/docs/rules) |
| **Claude Code** | `CLAUDE.md` (imports `AGENTS.md`) | Always-on rules imported; others via index | `.claude/skills/` (mirror) | [Claude Code Memory](https://code.claude.com/docs/en/memory) |
| **OpenAI Codex** | `AGENTS.md` | Referenced via index | `.agents/skills/` | [Codex Skills](https://learn.chatgpt.com/docs/build-skills) |
| **Gemini CLI** | `GEMINI.md`, `AGENTS.md` | Referenced via index | `.agents/skills/` | [Gemini CLI Context](https://geminicli.com/docs/cli/gemini-md/) |
| **Cursor** | `AGENTS.md` (nested rules supported) | Referenced via index | `.agents/skills/` | [Cursor Context Rules](https://cursor.com/docs/context/rules) |
| **Windsurf / Devin** | `AGENTS.md` | Referenced via index | `.agents/skills/` | [Cascade Memories](https://docs.devin.ai/desktop/cascade/memories) |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `AGENTS.md` | Referenced via index | `.agents/skills/` | [Copilot Custom Instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) |
| **Cline** | `AGENTS.md` | Referenced via index | `.claude/skills/` (mirror) | [Cline Rules](https://docs.cline.bot/features/cline-rules/overview) |
| **Aider** | `AGENTS.md` (via `.aider.conf.yml`) | Referenced via index | Not supported | [Aider Conventions](https://aider.chat/docs/usage/conventions.html) |
| **Any Chat LLM** | Paste `AGENTS.md` + matching skill | Manual prompt injection | Manual | [Operational Manual](docs/spec/AGENT-OPERATIONAL-MANUAL.md) |

---

## Continuous Quality & Automated Verification

Every commit and pull request to Projects 27 is automatically verified through [.github/workflows/validate.yml](.github/workflows/validate.yml):

- **Validator Self-Tests & Spec Checks**: Full frontmatter syntax parsing, size budget verification, link validity across all Markdown files, and mirror drift detection.
- **Strict Frontmatter YAML Validation**: Secondary validation via PyYAML across all `.agents/` Markdown files.
- **Workflow & Shell Security Audits**: ShellCheck on the installer script, Actionlint on GitHub Actions workflows, and offline Zizmor security audits.
- **Runnable Front-End & Design Templates**:
  - **Figma Variables Sync**: Type-checking against official Figma API specs and unit tests across Node.js 22, 24, and 26.
  - **Design Tokens Pipeline**: Type-checking, unit tests, and automated WCAG contrast validation across Node.js 22, 24, and 26.
  - **Static Site Starter**: HTML validation (`html-validate`), CSS linting (`stylelint`), unit tests including security-header consistency, and an axe-core headless Chromium scan that also fails on console errors.
- **Inherited Service Templates**: Node.js and Python microservices tested across Node.js 22/24/26 and Python 3.11/3.12/3.13/3.14.
- **CLI First, Small Output**: anything that runs goes through the terminal with the project's scripts, and agents read summaries instead of whole logs. `npm run verify` runs every spec check and prints one line per step; `scripts/run-quiet.mjs` does the same for any command and keeps the full log in a file. Browser and MCP tools are kept for what a command cannot do ([rule 15 section 2](.agents/rules/15-clean-execution.md)).
- **Owner-Only Authorship**: `scripts/check-authorship.mjs` scans the full history and fails when any commit credits an AI agent (an AI author or committer, a `Co-Authored-By` or sign-off trailer, or a "Generated with" line), so only the human author appears among the contributors.
- **External Link Integrity**: [`.github/workflows/links.yml`](.github/workflows/links.yml) checks all 650+ external references weekly via `scripts/check-links.mjs`.

---

## Limits & Human In The Loop

- **Rules Guide, Toolchains Enforce**: Instructions guide an AI model; they cannot guarantee adherence. For hard guarantees, enforce checks via CI pipelines, pre-commit hooks, lint rules, and agent hooks (e.g., Claude Code `PreToolUse`).
- **Plan First, Act Only After Approval**: before any change, agents present an implementation plan (goal, steps with their checks, blind spots, risks, rollback) and wait for your explicit approval; they never run commands that change anything on their own initiative ([AGENTS.md](AGENTS.md) non-negotiable 13, [rule 15 section 1](.agents/rules/15-clean-execution.md)). In Claude Code, `.claude/settings.json` starts every terminal session in plan mode, so edits are blocked until you approve the plan.
- **Blind Spots, Cross-Checks and Objective Validation**: every fact you will rely on is cross-checked against two independent sources, standards and tools must be current and actively maintained, and results are judged only by measured evidence ([rule 03 section 6](.agents/rules/03-verification.md)).
- **Existing Work Is Never Deleted Silently**: agents must show what they would remove, why and the alternatives, and wait for your approval ([rule 01 section 8](.agents/rules/01-core-principles.md)). In Claude Code this is enforced by `.claude/settings.json` and a `PreToolUse` deletion guard that turns deletion commands and line-removing edits into a confirmation prompt; other tools rely on the rule.
- **Human Usability & Brand Resonance**: AI agents can compute colour contrast, layout grids, and token mappings, but they cannot replace usability testing with real people (especially people with disabilities) or evaluate emotional brand resonance.
- **Automated Accessibility Scope**: Automated testing found about 57% of accessibility issues by volume in Deque's 2021 study of 2,000+ audits, but covers only part of the WCAG success criteria ([Deque](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/)). Manual keyboard navigation and screen reader audits (VoiceOver, NVDA, JAWS, TalkBack) remain essential.
- **Time-Sensitive Standards**: Package versions, browser Baseline availability, and regulatory requirements (European Accessibility Act, ADA) evolve over time. Time-sensitive references carry their verification dates; Dependabot updates pinned dependencies and the weekly link check catches dead links, but facts must still be re-checked by people. Legal summaries are orientation, not legal advice.
- **No catalog is complete**: [docs/TOOLKIT.md](docs/spec/TOOLKIT.md) lists commonly used tools; any other tool works through [rule 04 section 9](.agents/rules/04-dependencies.md).

---

## Documentation

Detailed architectural and procedural documentation is available in `docs/`:

- [Architecture Guide](docs/spec/ARCHITECTURE.md): Design-to-code architecture, cognitive context budgeting, and tool loading mechanics.
- [Agent Operational Manual](docs/spec/AGENT-OPERATIONAL-MANUAL.md): Rule and skill routing for about 50 design and front-end scenarios, plus a capabilities matrix (design-file access, browser, vision, shell, network).
- [Design and Front-End Reference Library](docs/spec/DESIGN-REFERENCES.md): Over 470 curated, link-checked sources covering standards, tools, frameworks, and typography.
- [Tools Catalog](docs/spec/TOOLKIT.md): 350+ tools, libraries, platforms and services by phase, with official links.
- [Prompt Library](docs/spec/PROMPT-LIBRARY.md): Ready-to-use prompts for each scenario, with notes per AI tool.
- [Engineering Concepts Map](docs/spec/ENGINEERING-CONCEPTS.md): SWEBOK V4.0's 18 knowledge areas, the ISO/IEC 25010:2023 quality model, design principles, architecture, delivery (DORA), testing, SRE and chaos engineering, security, human-centred, sustainability and AI-assisted engineering, each mapped to the rule or skill that applies it.
- [Anti-Hallucination Playbook](docs/spec/ANTI-HALLUCINATION-PLAYBOOK.md): Common AI design and front-end failure modes and how verification catches them.
- [Contributing Guidelines](docs/spec/CONTRIBUTING.md): Quality checklist for authoring new design rules, skills, templates, and references.
- [Security Policy](SECURITY.md): How to report a vulnerability, the controls that run on every push, accepted risks, and the GitHub settings the owner must enable.
- [Changelog](CHANGELOG.md): Complete chronological record of releases and verified additions.
- [Releases](https://github.com/gerrardgs/Projects27/releases): Release notes per version, published from [`.github/releases/`](.github/releases/) by the release workflow when a version tag is pushed.

---

## License

[MIT](LICENSE) © 2026 Gerrard Sebastian.
