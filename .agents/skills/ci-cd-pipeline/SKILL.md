---
name: ci-cd-pipeline
description: Create or review continuous integration and delivery pipelines that build, lint, type-check, test, scan and release software with least-privilege permissions and pinned dependencies. Use when setting up GitHub Actions or another CI system, adding checks to pull requests, automating releases or container publishing, configuring Dependabot, or hardening an existing workflow.
license: MIT
metadata:
  version: "1.0.0"
---

# CI/CD Pipeline

A pipeline turns "it works on my machine" into "it works, every time, for everyone". It must be fast, reproducible and secure.

## 1. Pipeline stages

| Stage | Runs on | Contents | Fails the build when |
| :--- | :--- | :--- | :--- |
| Verify | Every pull request and push to the default branch | Install from lockfile, format check, lint, type-check, unit and integration tests, dependency audit, secret scan, SAST | Any check fails |
| Build | Default branch and release tags | Build the artifact once (package, binary or container image), generate an SBOM | Build or scan fails |
| Release | Version tags (`v1.2.3`) | Push the artifact, attach build provenance, create release notes | Signing or push fails |
| Deploy | After release, per environment | Deploy the **same** artifact digest to staging, verify, then promote to production | Health checks or smoke tests fail |

Use the project's own scripts (`npm test`, `make test`, `nox`, ...) in CI so local and CI runs match.

## 2. Templates (verified with actionlint 1.7.12 and zizmor 1.30.1 on 2026-10-14)

- [assets/github-actions/ci-node.yml](assets/github-actions/ci-node.yml): Node.js matrix (22, 24, 26): `npm ci`, lint, type-check, test, `npm audit`.
- [assets/github-actions/ci-python.yml](assets/github-actions/ci-python.yml): Python matrix (3.11 to 3.15): install with a PEP 735 `dev` dependency group, Ruff, mypy, pytest, pip-audit.
- [assets/github-actions/release-container.yml](assets/github-actions/release-container.yml): on a version tag, build and push an image to GitHub Container Registry with SBOM and signed build provenance.
- [assets/github-actions/dependabot.yml](assets/github-actions/dependabot.yml): daily updates for actions and npm; version updates wait 7 days after a release (a guard against compromised releases), while security updates are raised immediately.
- [assets/github-actions/dependabot-auto-merge.yml](assets/github-actions/dependabot-auto-merge.yml): turns on auto-merge for Dependabot's patch and minor updates (`dependabot/fetch-metadata` v3.1.0), only when the base branch requires status checks; majors wait for a person.
- [assets/github-actions/ci-frontend.yml](assets/github-actions/ci-frontend.yml): front-end checks (lint, type-check, unit tests, build, production `npm audit`), Playwright end-to-end and accessibility tests with the report kept on failure, and Lighthouse CI budgets.
- [assets/lighthouse/lighthouserc.json](assets/lighthouse/lighthouserc.json): Lighthouse CI assertions: accessibility score 1.0, best practices 0.9, LCP at most 2.5 s, CLS at most 0.1, script and page weight warnings. Verified on 2026-10-15 with `@lhci/cli` 0.15.1 (Lighthouse 12.6.1) against the static-site template: all four categories scored 100, CLS 0.
- [assets/github-actions/deploy-github-pages.yml](assets/github-actions/deploy-github-pages.yml): build and deploy a static site with the official GitHub Pages actions (`configure-pages` v6.0.0, `upload-pages-artifact` v5.0.0, `deploy-pages` v5.0.1, pinned to commit SHAs). See [frontend-deployment](../frontend-deployment/SKILL.md).
- [assets/github-actions/codeql.yml](assets/github-actions/codeql.yml): CodeQL security analysis (`security-extended` queries) on pull requests, pushes and a daily schedule. Verified in Projects 23 with actionlint 1.7.12 and zizmor 1.31.1 on 2026-10-16.

The action versions are pinned to full commit SHAs, with the version in a comment. These SHAs were resolved from the actions' release tags on 2026-10-14. Dependabot keeps the SHAs and comments updated.

## 3. Security rules for workflows

- **Least privilege**: set `permissions: contents: read` at the top level; grant extra scopes only on the job that needs them, with a comment saying why.
- **Pin third-party actions to a full commit SHA** (`uses: owner/action@<40-char-sha> # vX.Y.Z`). Tags can be moved; SHAs cannot.
- `actions/checkout` with `persist-credentials: false` unless a later step must push.
- **Untrusted input**: never interpolate `${{ github.event.* }}` fields (titles, branch names, bodies) directly into `run:` scripts. Pass them through `env:` and quote the variable.
- **Pull requests from forks** get no secrets. Avoid `pull_request_target` and `workflow_run` with checkout of untrusted code; if unavoidable, never run that code with secrets.
- Prefer OIDC federation (`id-token: write`) to long-lived cloud credentials.
- Set `timeout-minutes` on every job and `concurrency` to cancel superseded runs.
- Lint workflows with `actionlint` and audit them with `zizmor` (see [security-hardening tools](../security-hardening/references/tools.md)).
- Run security checks on a **schedule** as well (daily `cron`, at least weekly), so vulnerabilities published after the last commit are still found.
- Keep tool versions that CI installs in a requirements or manifest file, not inline in `run:` commands, so Dependabot can update them. Pins that must stay in a workflow (a binary version next to its checksum) need a scheduled freshness check that fails when a newer release has passed the cooldown.
- **Authorship**: run an authorship check on the full history (`actions/checkout` with `fetch-depth: 0`, then `node scripts/check-authorship.mjs`) so no commit credits an AI agent; release automation publishes notes without AI attribution ([08-git-workflow](../../rules/08-git-workflow.md) section 2).

## 4. Speed and reliability

- Cache dependencies by lockfile hash (`actions/setup-node` and `actions/setup-python` have a `cache` input).
- Run independent jobs in parallel; use a matrix for supported runtime versions.
- Keep the pull-request pipeline under about 10 minutes. Move long suites (end-to-end, fuzzing, mutation) to scheduled or pre-release runs.
- A flaky check is a bug: fix it, don't retry it blindly.
- Make required status checks mandatory with branch protection, so nothing merges red.

## 5. Measure delivery performance

Track the [DORA metrics](https://dora.dev/guides/dora-metrics-four-keys/) to see whether changes to the pipeline help: **change lead time** (commit to production), **deployment frequency**, **failed deployment recovery time**, **change fail rate** (deployments needing immediate intervention) and **deployment rework rate** (unplanned deployments caused by production incidents). Improve throughput and stability together; speed that raises the fail rate is not progress.

## 6. Other CI systems

The same principles apply to GitLab CI (`.gitlab-ci.yml`), Azure Pipelines, CircleCI, Jenkins and Buildkite: reproducible installs, least-privilege tokens, pinned images and plugins, protected secrets for protected branches only, and one build promoted through environments. Check the platform's documentation for exact syntax; do not translate GitHub Actions syntax by guesswork.

## 7. Checklist

- [ ] Every pull request runs format, lint, type-check, tests, dependency audit and secret scan
- [ ] Top-level `permissions: contents: read`; extra scopes only per job, commented
- [ ] All third-party actions pinned to commit SHAs; Dependabot or Renovate keeps them current
- [ ] No untrusted `${{ }}` expressions inside `run:` scripts
- [ ] Jobs have timeouts; superseded runs are cancelled
- [ ] Releases build once and attach an SBOM and provenance; deployments use the artifact digest
