---
name: deploy-and-release
description: Package, configure, deploy, observe and roll back applications safely - container images, environment configuration, health checks, graceful shutdown, zero-downtime database migrations, progressive rollouts, monitoring and incident-ready runbooks. Use when preparing an application for production, writing a Dockerfile or deployment manifest, planning a release or migration, adding logging, metrics or tracing, or defining a rollback.
license: MIT
metadata:
  version: "1.0.0"
---

# Deploy and Release

Deploying should be boring: repeatable, observable and reversible. Never deploy to a shared or production environment without the user's explicit go-ahead.

## 1. Production readiness checklist

These items follow [The Twelve-Factor App](https://12factor.net/): one codebase with many deploys, explicit dependencies, configuration in the environment, backing services as attached resources, strictly separated build, release and run stages, stateless processes, port binding, scaling through processes, disposability (fast start, graceful shutdown), dev/prod parity, logs as event streams, and admin tasks as one-off processes.

- [ ] **One artifact**: built once in CI ([ci-cd-pipeline](../ci-cd-pipeline/SKILL.md)) and promoted unchanged through environments, identified by version and digest
- [ ] **Configuration from the environment**: no environment-specific values or secrets baked into the artifact; all variables documented in `.env.example` and validated at startup
- [ ] **Health endpoints**: liveness (process is alive) and readiness (can serve traffic: dependencies reachable, migrations applied)
- [ ] **Graceful shutdown**: on `SIGTERM`, stop accepting new requests, finish in-flight work within a deadline, close connections, then exit
- [ ] **Stateless processes**: sessions, uploads and caches live in backing services, so instances can be replaced at any time
- [ ] **Resource limits**: CPU and memory requests and limits; timeouts on every outgoing call; bounded queues and pools
- [ ] **Observability**: structured logs, metrics and traces (section 5) with alerts on user-facing symptoms
- [ ] **Security**: non-root container user, minimal base image, image scanned, secrets from a secret manager ([security-hardening](../security-hardening/SKILL.md))
- [ ] **Rollback**: a tested, documented way back to the previous version, including the database (section 4)

## 2. Container images

Verified examples live next to the service templates: [Node.js Dockerfile](../native-from-scratch/assets/node-http-service/Dockerfile) and [Python Dockerfile](../native-from-scratch/assets/python-http-service/Dockerfile). Both use distroless runtime images and pass `hadolint` 2.15.1 and Trivy's Dockerfile checks. Switching the Node.js template from `node:24-slim` to distroless removed all 4 critical and 64 high base-image vulnerabilities that Trivy reported on 2026-10-16. They were not built in the authoring environment because Docker was not installed there, so run `docker build` and scan the image before relying on them.

Rules that apply to every Dockerfile:

- Pin the base image by digest (`image:tag@sha256:...`) and let Dependabot or Renovate update it.
- Prefer a distroless or scratch runtime image (no shell or package manager); on 2026-10-16 Trivy reported 253 known vulnerabilities in `node:24-slim` and 172 in `python:3.14-slim`, most of them in packages the application never uses. Use multi-stage builds when a compile step, build tools or dependency installation is needed, and copy only the output into the final stage.
- Copy the dependency manifest and lockfile first and install, **then** copy the source, so dependency layers are cached.
- Run as a non-root numeric user (`USER 10001:10001`).
- Add a `.dockerignore` that excludes `.git`, `.env*`, dependencies, caches and tests.
- Use the exec form `CMD ["executable", "arg"]` so signals reach the process.
- Scan the image (`trivy image`, `osv-scanner scan image`) and generate an SBOM.

## 3. Release strategies

| Strategy | How | Use when |
| :--- | :--- | :--- |
| Rolling | Replace instances a few at a time, gated on readiness | Default for stateless services with backward-compatible changes |
| Blue-green | Run the new version beside the old one; switch traffic at once; keep the old one for instant rollback | Fast, complete rollback is required |
| Canary | Send a small percentage of traffic to the new version, compare error rate and latency, then increase | High-traffic or high-risk changes |
| Feature flag | Deploy code dark; enable it per user or percentage at runtime | Decouple deploy from release; risky features. [OpenFeature](https://openfeature.dev/) (a CNCF incubating project) is a vendor-neutral flag API; remove flags once fully rolled out |

After every deploy, run smoke tests against the real environment and watch the key metrics (error rate, latency, saturation) for a set period before declaring success.

Tag each release from CI-verified commits and write its release notes in the owner's name, without AI attribution lines, agent signatures or badges ([08-git-workflow](../../rules/08-git-workflow.md) sections 2 and 4).

## 4. Database migrations without downtime (expand and contract)

1. **Expand**: add new tables or nullable columns, or new indexes built concurrently. Old code keeps working.
2. **Deploy code that writes to both** old and new structures and reads from the old one.
3. **Backfill** existing data in small batches, idempotently, with progress tracking.
4. **Switch reads** to the new structure; verify.
5. **Contract**: in a later release, stop writing the old structure, then drop it.

Rules: each migration is versioned in the repository and applied by a tool (for example Flyway, Liquibase, Alembic, Prisma Migrate, golang-migrate, or Django and Rails migrations); never edit a migration that has already run in a shared environment; take a backup and test the restore before destructive steps; never run long locking operations during peak traffic.

## 5. Observability

- **Logs**: structured (JSON) to stdout, one event per line, with timestamp, level, message, request or trace ID, and no secrets or unnecessary personal data.
- **Metrics**: for services, the RED method (Rate, Errors, Duration per endpoint); for resources, USE (Utilization, Saturation, Errors). Track business events that matter.
- **Traces**: propagate trace context across services; [OpenTelemetry](https://opentelemetry.io/docs/) is the vendor-neutral standard for traces, metrics and logs.
- **Alerts**: on symptoms users feel (error rate, latency against a service-level objective), not on every internal cause. Each alert links to a runbook.

## 6. Rollback and incidents

- Rollback = redeploy the previous artifact digest. It must not require a rebuild.
- If a migration is not backward compatible, the rollback plan must say how data written by the new version is handled.
- During an incident: mitigate first (roll back, disable the flag, scale), communicate status, then diagnose with [systematic-debugging](../systematic-debugging/SKILL.md), and write a blameless review afterwards.

## 7. Runbook template (one per service)

```text
Service:        <name, owner, repository, dashboards>
Deploy:         <command or pipeline, required approvals>
Verify:         <smoke test command, key metrics and their normal ranges>
Rollback:       <exact steps and expected duration>
Configuration:  <environment variables and where secrets live>
Dependencies:   <databases, queues, external APIs, and what happens when each fails>
Alerts:         <alert name → meaning → first actions>
```
