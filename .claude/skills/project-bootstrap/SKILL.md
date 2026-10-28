---
name: project-bootstrap
description: Set up a new repository or service from an empty folder with the right runtime version, package manager, formatter, linter, type checker, test runner, security scanning, editor extensions, CI, and documentation, for front-end and design-system projects, TypeScript/JavaScript, Python, Go, Rust, Java/Kotlin, C#/.NET or C/C++. Use when starting a new project or website, adding tooling to a project that has none, choosing a language toolchain, or onboarding a repository to these agent rules.
license: MIT
metadata:
  version: "1.0.0"
---

# Project Bootstrap

Set up the project so that the first commit already builds, lints, type-checks, tests and runs in CI. The toolchain per language, including verified VS Code extension IDs, is in [references/toolchains.md](references/toolchains.md).

## 1. Decide (ask the user only what you cannot infer)

- Language and **currently supported** runtime version (see the baseline in [04-dependencies](../../rules/04-dependencies.md)).
- Kind of project: library, CLI, web service, website or web app (see [frontend-from-scratch](../frontend-from-scratch/SKILL.md) for the stack choice), design system, worker, or monorepo.
- Deployment target, if known (container, serverless, static hosting, package registry).
- Licence (ask; never pick one for a private or commercial project on your own).

## 2. Create the skeleton

1. `git init`, and create the default branch. Commit with the owner's Git identity only; no AI co-author trailer or "Generated with" line, from the first commit on ([08-git-workflow](../../rules/08-git-workflow.md) section 2).
2. Pin the runtime version for every developer and CI: `.nvmrc` or `engines` (Node.js), `.python-version` and `requires-python` (Python), the `go` and `toolchain` lines in `go.mod` (Go), `rust-toolchain.toml` (Rust), `global.json` (.NET), the Gradle or Maven toolchain setting (Java).
3. Initialise the package manager and **commit the lockfile**.
4. Add the files from [assets/](assets/):
   - [`.editorconfig`](assets/editorconfig) (rename to `.editorconfig`) and [`.gitattributes`](assets/gitattributes) (rename to `.gitattributes`)
   - `.gitignore` from the official [github/gitignore](https://github.com/github/gitignore) template for the language, plus `.env` and `.env.*` with `!.env.example`
   - [`.env.example`](assets/env.example) (rename to `.env.example`) listing every variable, with no real values
   - [`.vscode/extensions.json`](assets/vscode-extensions.json) (rename and trim to the stack)
   - [`.pre-commit-config.yaml`](assets/pre-commit-config.yaml) with secret scanning and basic hygiene hooks
   - [`README.md`](assets/README.template.md) and an [ADR](assets/adr-template.md) folder (`docs/adr/`) for significant decisions
   - `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format) and the linter's config file (for example `eslint.config.mjs` or `biome.json`)
   - For shared or open-source repositories, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md` (how to report a vulnerability), which GitHub shows as [community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) when they are in the root, `docs/` or `.github/`
   - [`CONTRIBUTING.md`](assets/CONTRIBUTING.template.md) with setup commands you have run, the workflow and the checks to pass before a pull request
   - [`SECURITY.md`](assets/SECURITY.template.md) (rename to `SECURITY.md`) with a private vulnerability-reporting channel; for public repositories also turn on secret scanning with push protection and use a private no-reply commit email
   - [`GLOSSARY.md`](assets/GLOSSARY.template.md) for domain terms; the back-end documentation templates in [technical-documentation](../technical-documentation/assets/docs/) complement the docs-kit of [project-documentation](../project-documentation/SKILL.md).
   - The complete documentation set in `docs/` from [project-documentation](../project-documentation/SKILL.md) (PRD, glossary, architecture, tech stack, code style, rules, design, design system, assets, accessibility, performance, API, database, schema, security, privacy, testing, debugging, deployment, documentation guide, and the folder's `AGENTS.md` and `CLAUDE.md`), filled from real sources, with its checker added to CI
5. Configure the formatter, linter and type checker at their strictest practical settings, and make them pass on the empty project.
6. Add one real test and make `test` pass. Add a `verify` script that runs format check, lint, type check and tests in one command with a summary, for example `"verify": "node scripts/run-quiet.mjs --steps lint,typecheck,test"`, so people and agents check everything without reading full logs ([15-clean-execution](../../rules/15-clean-execution.md) section 2).
7. Add CI from [ci-cd-pipeline](../ci-cd-pipeline/SKILL.md) and Dependabot.
8. Add this specification: `AGENTS.md`, `.agents/`, and the adapters for the tools the team uses. Fill in section 8 of `AGENTS.md` ("Project profile") with the real commands.

## 3. Layout conventions

Follow the community layout of the ecosystem rather than inventing one:

| Language | Typical layout |
| :--- | :--- |
| TypeScript / Node.js | `src/`, tests beside code (`*.test.ts`) or in `test/`; `package.json` scripts `build`, `lint`, `typecheck`, `test` |
| JavaScript or TypeScript monorepo | `apps/<app>/` for deployable apps (web, docs site, mobile), `packages/<package>/` for shared code (UI components, tokens, config), `scripts/` for repository tooling, `docs/` for the documentation set; a workspace tool (npm, pnpm or Yarn workspaces, optionally Turborepo or Nx) |
| Python | `src/<package>/` with `pyproject.toml`; tests in `tests/` |
| Go | `go.mod` at the root; `cmd/<app>/main.go` for binaries; `internal/` for private packages; tests beside code (`*_test.go`) |
| Rust | Cargo layout: `src/main.rs` or `src/lib.rs`, integration tests in `tests/`, a workspace for multiple crates |
| Java / Kotlin | Maven or Gradle standard layout: `src/main/java`, `src/test/java` |
| C# / .NET | Solution file at the root; `src/<Project>/`, `tests/<Project>.Tests/` |
| C / C++ | CMake: `src/`, `include/`, `tests/`, `CMakeLists.txt`; dependencies with vcpkg or Conan |

## 4. Done when

- [ ] A fresh clone can install, build, lint, type-check, test and run by following the README alone
- [ ] `docs/` holds the complete documentation set and `check-docs.mjs` passes
- [ ] The runtime version is pinned and the lockfile is committed
- [ ] CI runs all checks on pull requests; Dependabot is enabled
- [ ] `.gitignore` excludes dependencies, build output, caches and `.env` files
- [ ] Secret scanning runs as a pre-commit hook or in CI
- [ ] No commit credits an AI agent (`scripts/check-authorship.mjs` passes); the owner is the only contributor
- [ ] `AGENTS.md` "Project profile" is filled in with the real commands
