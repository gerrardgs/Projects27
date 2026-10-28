# Toolchains by language

Every VS Code extension ID below was checked against the Visual Studio Marketplace API on 2026-10-14 (front-end and design section on 2026-10-15). Package names were checked against their registries. Prefer the tools a project already uses. For a new project, the first option in each cell is a sensible default.

## Editor extensions for every project

| Extension ID | Purpose |
| :--- | :--- |
| `EditorConfig.EditorConfig` | Apply `.editorconfig` settings |
| `usernamehw.errorlens` | Show diagnostics inline |
| `streetsidesoftware.code-spell-checker` | Spelling in code and docs |
| `eamodio.gitlens` | Git history and blame |
| `github.vscode-pull-request-github` | GitHub pull requests and issues |
| `github.vscode-github-actions` | Workflow editing and validation |
| `redhat.vscode-yaml` | YAML validation with schemas |
| `davidanson.vscode-markdownlint` | Markdown linting |
| `timonwong.shellcheck` | Shell script linting (needs `shellcheck`) |
| `ms-azuretools.vscode-containers` | Dockerfiles, images and containers (Container Tools) |
| `ms-vscode-remote.remote-containers` | Dev Containers |
| `sonarsource.sonarlint-vscode` | SonarQube for IDE: bug and security analysis |
| `humao.rest-client` | Send HTTP requests from `.http` files |

## TypeScript / JavaScript

| Need | Tools |
| :--- | :--- |
| Runtime and version | Node.js (pin with `.nvmrc` and `engines`); version managers: nvm, fnm, Volta, mise |
| Package manager | npm (`npm ci` in CI), pnpm, Yarn, or Bun; commit the lockfile |
| Format and lint | Prettier + ESLint with `typescript-eslint`, or Biome (`@biomejs/biome`) for both. `typescript-eslint` 8 declares the peer range `typescript >=4.8.4 <6.1.0` (checked 2026-10-16), so with TypeScript 7 either use Biome or give the linter its own TypeScript below 6.1 (this repository's `tools/lint` does that) |
| Types | `typescript` with `strict: true`; `tsc --noEmit` in CI |
| Tests | `node --test`, Vitest, or Jest; Playwright for browsers |
| Unused code and dependencies | `knip` |
| Security | `npm audit`, OSV-Scanner, `eslint-plugin-security` |
| VS Code | `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode` or `biomejs.biome`, `vitest.explorer`, `ms-playwright.playwright` |

## Front-end, UI and design

| Need | Tools |
| :--- | :--- |
| Framework | See [framework-frontend-engineering references](../../framework-frontend-engineering/references/frameworks.md) |
| CSS | Plain CSS with layers, CSS Modules, Tailwind CSS, Sass; Stylelint (`stylelint`, `stylelint-config-standard`) or Biome; Lightning CSS or PostCSS for transforms |
| HTML | `html-validate` |
| Accessibility | axe-core (`@axe-core/playwright`, Storybook a11y addon), `eslint-plugin-jsx-a11y` or the framework's equivalent |
| Component workshop | Storybook |
| Tests | Vitest with Testing Library, Playwright (end-to-end, visual, accessibility) |
| Performance | Lighthouse, Lighthouse CI, `web-vitals` |
| Tokens | DTCG JSON plus Style Dictionary, or the template in [design-system-and-tokens](../../design-system-and-tokens/assets/design-tokens/) |
| Assets | `sharp`, `svgo`, Squoosh |

| VS Code extension ID | Purpose |
| :--- | :--- |
| `stylelint.vscode-stylelint` | Stylelint diagnostics |
| `bradlc.vscode-tailwindcss` | Tailwind CSS IntelliSense |
| `csstools.postcss` | PostCSS syntax |
| `clinyong.vscode-css-modules` | CSS Modules class name completion |
| `html-validate.vscode-html-validate` | HTML validation |
| `deque-systems.vscode-axe-linter` | Accessibility linting (axe) |
| `webhint.vscode-webhint` | Accessibility, compatibility and performance hints |
| `ms-playwright.playwright` | Run and debug Playwright tests |
| `vitest.explorer` | Run Vitest tests |
| `vue.volar` | Vue (Official) |
| `svelte.svelte-vscode` | Svelte |
| `astro-build.astro-vscode` | Astro |
| `angular.ng-template` | Angular Language Service |
| `unifiedjs.vscode-mdx` | MDX |
| `yoavbls.pretty-ts-errors` | Readable TypeScript errors |
| `wix.vscode-import-cost` | Inline size of imported packages |
| `figma.figma-vscode-extension` | Figma for VS Code: inspect designs and Dev Mode in the editor |
| `ms-vscode.live-server` | Live Preview of static pages (preview) |
| `ms-edgedevtools.vscode-edge-devtools` | Microsoft Edge DevTools inside VS Code |
| `naumovs.color-highlight` | Show colour values inline |
| `jock.svg` | SVG editing and preview |
| `lokalise.i18n-ally` | Internationalisation keys and translations |

## Python

| Need | Tools |
| :--- | :--- |
| Runtime and version | CPython; `uv python install`, pyenv or mise; `requires-python` in `pyproject.toml` |
| Project and packages | `uv` (lockfile `uv.lock`), or pip with `venv` and hashed requirements; PEP 735 dependency groups for dev tools |
| Format and lint | Ruff (`ruff format`, `ruff check`) |
| Types | mypy (`strict = true`) or Pyright |
| Tests | pytest (or `unittest`), `pytest-cov`, Hypothesis |
| Security | `pip-audit`, Bandit |
| VS Code | `ms-python.python`, `ms-python.vscode-pylance`, `ms-python.debugpy`, `charliermarsh.ruff`, `ms-python.mypy-type-checker`, `tamasfe.even-better-toml` |

## Go

| Need | Tools |
| :--- | :--- |
| Runtime and version | `go` and `toolchain` lines in `go.mod` |
| Format | `gofmt`, `goimports` |
| Lint | `go vet`, `staticcheck`, or `golangci-lint` |
| Tests | `go test -race ./...`, native fuzzing |
| Security | `govulncheck ./...`, `gosec` |
| Debugger | Delve (`dlv`) |
| VS Code | `golang.go` |

## Rust

| Need | Tools |
| :--- | :--- |
| Runtime and version | rustup with `rust-toolchain.toml` |
| Format and lint | `cargo fmt`, `cargo clippy -- -D warnings` |
| Tests | `cargo test` or `cargo nextest run`, `proptest`, `insta` |
| Security | `cargo audit`, `cargo deny check` |
| VS Code | `rust-lang.rust-analyzer`, `vadimcn.vscode-lldb`, `tamasfe.even-better-toml` |

## Java / Kotlin

| Need | Tools |
| :--- | :--- |
| Runtime and version | A current LTS JDK; SDKMAN or mise; Gradle or Maven toolchains |
| Build | Gradle (wrapper `./gradlew`) or Maven (wrapper `./mvnw`) |
| Format and lint | Spotless with google-java-format, ktlint (Kotlin), Checkstyle, Error Prone, SpotBugs |
| Tests | JUnit Jupiter, AssertJ, Mockito, Testcontainers, JaCoCo, PIT |
| Security | OWASP Dependency-Check, OSV-Scanner |
| VS Code | `vscjava.vscode-java-pack` |

## C# / .NET

| Need | Tools |
| :--- | :--- |
| Runtime and version | A current LTS .NET SDK pinned in `global.json` |
| Format and analysis | `dotnet format`; Roslyn analyzers with `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` and `<Nullable>enable</Nullable>` |
| Tests | `dotnet test` with xUnit, NUnit or MSTest; coverlet for coverage |
| Security | `dotnet list package --vulnerable --include-transitive` |
| VS Code | `ms-dotnettools.csdevkit` |

## C / C++

| Need | Tools |
| :--- | :--- |
| Build and dependencies | CMake with presets; vcpkg or Conan |
| Format and lint | `clang-format`, `clang-tidy` |
| Runtime checks | AddressSanitizer and UndefinedBehaviorSanitizer (`-fsanitize=address,undefined`) in test builds |
| Tests | GoogleTest or Catch2, run with `ctest` |
| VS Code | `llvm-vs-code-extensions.vscode-clangd` or `ms-vscode.cpptools`, `vadimcn.vscode-lldb` |
