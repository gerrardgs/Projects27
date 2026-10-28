# Testing

What protects Projects 23 from regressions, where it lives and how to run it. Test counts are from 2026-10-23.

## Strategy

The repository has two kinds of product: the specification (Markdown) and runnable code (scripts and templates). The specification is tested by validation (structure, frontmatter, links, mirror, index) and by documentation completeness; the code by unit tests without network, end-to-end checks of the command-line behaviour, and the tools each template recommends to its users (format, lint, type check, audit). Every runnable asset has a CI job, so a template that stops working fails the build.

## Test levels and locations

| Level | Location | Tool |
| :--- | :--- | :--- |
| Script unit and CLI tests | `scripts/*.test.mjs` (agents-sync 11, tech-lookup 10, check-updates 3, check-authorship 7, run-quiet 5) | `node:test` |
| Authorship of every commit | The full Git history | `node scripts/check-authorship.mjs` (CI job `authorship`, with `fetch-depth: 0`) |
| Guard hook | `.agents/skills/security-hardening/assets/claude-code-guardrails/guard.test.mjs` (5) | `node:test` |
| Docs completeness checker | `.agents/skills/technical-documentation/assets/check-docs.test.mjs` (5) | `node:test` |
| Node.js service template | `.agents/skills/native-from-scratch/assets/node-http-service/server.test.ts` | `node:test` on Node.js 22, 24, 26 |
| Python service template | `.../native-from-scratch/assets/python-http-service/test_app.py` (11) | `unittest` on Python 3.11 to 3.14 |
| Machine-learning baseline | `.../machine-learning/assets/baseline-classifier/test_baseline.py` (5) | `unittest` |
| API integration kit | `.../api-integration/assets/python-integration-kit/test_integration_kit.py` (18) | `unittest` |
| Chaos experiment kit | `.../chaos-engineering/assets/chaos-experiment-kit/test_chaos_kit.py` (19) | `unittest` |
| MCP Toolbox example (real server over MCP stdio) | `.../ai-agent-systems/assets/mcp-toolbox-sqlite/test_toolbox_smoke.py` (5) | `unittest` with the pinned Toolbox binary |
| Specification | every `.md` file | `scripts/agents-sync.mjs --check --all-markdown`, PyYAML cross-check |
| Documentation of this repository | `docs/` | `check-docs.mjs docs` |
| Installer | `scripts/install.sh` | two end-to-end steps in the `spec` CI job (no overwrite of existing files; a fresh install validates) |

## Running tests

- All Node.js tests: `node --test "scripts/*.test.mjs" ".agents/skills/security-hardening/assets/claude-code-guardrails/*.test.mjs" ".agents/skills/technical-documentation/assets/*.test.mjs"`
- Specification: `node scripts/agents-sync.mjs --check --all-markdown`
- Documentation: `node .agents/skills/technical-documentation/assets/check-docs.mjs docs`
- Clean-code lint: `npm ci --prefix tools/lint && npm run --prefix tools/lint lint`
- A Python template: from its folder, `python -m pip install --group dev`, then `ruff format --check .`, `ruff check .`, `mypy <files>` and `python -m unittest -v` (the exact commands per template are in `.github/workflows/validate.yml`). Run them in a scratch copy so no `__pycache__` lands in the repository.
- The MCP example additionally needs `TOOLBOX_BIN` pointing at the checksum-verified binary ([CONFIGURATION.md](CONFIGURATION.md)).

## Test data and environments

Synthetic data only: fixed inputs in the tests, `example.com` addresses, a seeded SQLite catalogue for the MCP example, scikit-learn's bundled breast-cancer dataset for the baseline. Network-dependent code is tested on recorded response shapes. Servers in tests bind to `127.0.0.1` on port 0.

## Quality gates

A pull request or push to `main` must pass every job in `validate.yml` (spec, node-template, python-template, ml-template, integration-kit, chaos-kit, mcp-toolbox-example, clean-code, authorship, secret-scan) and `codeql.yml`. Gates include 0 validator errors, 0 ESLint problems, Ruff and strict mypy clean, `npm audit --audit-level=high` and `pip-audit --strict` clean, no gitleaks findings, no commit that credits an AI agent, and actionlint, zizmor and ShellCheck clean.

## Writing tests

Test behaviour through public functions or the command line; keep pure logic in exported functions so it is tested without network or files; assert exact values from an independent source; make time and randomness injectable ([test-engineering](../../../.agents/skills/test-engineering/SKILL.md)). A new runnable asset comes with its own tests and a CI job.

## Flaky tests

A flaky test is a bug: reproduce it with repeated runs (for example 20 consecutive runs, as done for the chaos kit's proxy test), find the race, and fix the test or the code; never retry or skip it to get green. Record the cause in the commit message.
