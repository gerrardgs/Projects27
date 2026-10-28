---
name: technology-adoption
description: Work correctly with any programming language, framework, library, database, platform, cloud service, SaaS product or developer tool, including ones no other skill covers - find and pin the exact version, read the official documentation, check maintenance, licence, security and end-of-life status with live data, learn the idioms, integrate it into the toolchain, and record the decision. Use when a task involves a technology you have not verified in this session, when choosing between tools, when adding or upgrading a dependency or platform, or when the user names a tool, framework or service.
license: MIT
metadata:
  version: "1.0.0"
---

# Technology Adoption

No specification can list every tool, and lists go stale. This skill makes any technology usable safely by applying one procedure, backed by live data instead of memory. A catalog of widely used tools by category, every name verified, is in [references/technology-catalog.md](references/technology-catalog.md). Dependency policy is in [04-dependencies](../../rules/04-dependencies.md).

## 1. Identify exactly what is in use

- Find the technology and its **exact version** in the repository: manifests and lockfiles, `Dockerfile` base images, CI configuration, infrastructure code, `.tool-versions`, `.nvmrc`, `.python-version`, `global.json`, `rust-toolchain.toml`, and the README.
- Run the tool's own version command where installed (`<tool> --version`).
- If the project does not use it yet, treat it as a new dependency and go through section 3 before adding it.

## 2. Get live facts, not remembered ones

Use the lookup script shipped with this spec (Node.js 22+, no dependencies, read-only requests to official registries):

```sh
node scripts/tech-lookup.mjs npm:express pypi:django crates:axum go:github.com/gin-gonic/gin \
  maven:org.springframework.boot:spring-boot nuget:Newtonsoft.Json rubygems:rails \
  packagist:laravel/framework pub:dio hex:phoenix github:grafana/k6 \
  eol:nodejs eol:postgresql scorecard:github.com/expressjs/express
```

It reports the latest stable version, release date, licence, repository, deprecation or yanked status, supported release cycles with end-of-life dates (from [endoflife.date](https://endoflife.date/)), and the OpenSSF Scorecard security score. It exits with code 1 when a name does not exist, which catches hallucinated package names. Without the script, use the same sources by hand: the package registry page, the project's release page, endoflife.date, [deps.dev](https://deps.dev/) and [securityscorecards.dev](https://securityscorecards.dev/).

Then read, in this order:

1. The **official documentation for the version in use** (version selector on the docs site). Many documentation sites publish an LLM-friendly index at `/llms.txt` ([llmstxt.org](https://llmstxt.org/)); use it when present.
2. The **changelog, release notes and migration guides** between the installed version and the one you target.
3. The **security advisories** for the project (GitHub Security Advisories, the ecosystem's audit tool, OSV).
4. The installed source or type definitions, which are the final authority for signatures ([03-verification](../../rules/03-verification.md)).

## 3. Evaluate before adopting (new dependency, platform or service)

| Question | Evidence |
| :--- | :--- |
| Does the project or platform already provide this? | Existing dependencies, standard library ([04-dependencies](../../rules/04-dependencies.md)) |
| Is it maintained? | Recent releases, issue response, supported release cycles, not archived or deprecated |
| Is it safe? | Scorecard score, open advisories, number of transitive dependencies, install scripts |
| Is the licence compatible? | Licence from the registry; copyleft (GPL, AGPL), source-available (BSL, SSPL) and proprietary terms need the owner's approval |
| Does it fit? | Supported runtime and OS versions, performance, team skills, hosting model |
| What does leaving cost? | Data export, open standards and APIs, lock-in |
| What does it cost to run? | Pricing model, quotas, support plans for commercial services |

Record a significant choice in a short decision record ([ADR template](../project-bootstrap/assets/adr-template.md)).

## 4. Learn the idioms before writing code

- Follow the official "getting started" and the framework's recommended project structure, configuration and testing approach.
- Read how the existing codebase already uses the technology and match it.
- Prefer the framework's built-in mechanisms (its validation, dependency injection, migrations, configuration, logging) over hand-rolled ones.
- Write a small spike or test that exercises the exact API you plan to use, and run it, before building on it.

## 5. Integrate into the toolchain

- Pin the version (lockfile, image digest, tool version file) and add it to dependency automation (Dependabot or Renovate).
- Add its formatter, linter, type definitions and test support to CI; add editor support to `.vscode/extensions.json` when relevant (verify extension IDs on the Marketplace).
- Configure it securely: least-privilege credentials from a secret manager, secure defaults, telemetry settings reviewed.
- Document how to install, configure and run it in the README, and fill in the `AGENTS.md` project profile.

## 6. Keep it healthy

- Re-run the lookup before upgrades and on a schedule: new major versions, deprecations, end-of-life dates, advisories.
- Upgrade one major version at a time using the migration guide ([change-existing-code](../change-existing-code/SKILL.md)).
- Plan replacement well before end-of-life; never let production run on unsupported versions without an explicit, recorded risk acceptance.

## 7. Commercial services and SaaS

- Use the vendor's official SDK or API reference for the plan and region you use; verify limits, quotas and data-processing terms.
- Integrate through [api-integration](../api-integration/SKILL.md): authentication, retries, webhooks, monitoring.
- Keep vendor-specific code behind a thin interface when switching providers is a realistic need.

## Done when

- [ ] Exact version identified or chosen, and confirmed supported (not end-of-life, not deprecated)
- [ ] Facts (versions, APIs, flags, limits) taken from live lookups and official documentation for that version
- [ ] Licence, security and maintenance checked; decision recorded for significant adoptions
- [ ] Version pinned, automated updates configured, tooling integrated into CI
- [ ] Usage follows the technology's official idioms and the project's existing patterns
