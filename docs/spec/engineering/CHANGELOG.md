# Changelog

## 2.19.0: CLI first, small output (2026-10-28)

Every line of output an agent reads costs tokens. Processes now run through the terminal with the project's own scripts, and agents read summaries instead of whole logs. Mirrors Projects24 v1.13.0, adapted to this repository.

- **`AGENTS.md` non-negotiable 11**: installs, builds, tests, linters, servers, git and deploys go through the CLI, not step by step through chat, a browser or MCP tools; summaries and exit codes instead of whole logs.
- **Rule 09 section 2**: one summarising `verify` command; quiet and summary flags checked against each tool's help (`npm ci --no-audit --no-fund`, `node --test --test-reporter=dot`, `eslint --quiet`, `pytest -q`, `ruff check --output-format concise`, `git status --short`), other toolchains' documented quiet flags; long output written to a file with only the failure read; servers in the background and stopped afterwards; nothing re-run that already passed.
- **New `scripts/run-quiet.mjs`** (Node.js 22+, no dependencies) and five tests: one `PASS` line per passing step, the tail and the full log path for a failing one, real warning lines counted. On Projects24's `npm test` the output fell from 3,373 to 132 bytes. The installer copies it.
- **`npm run verify`** (new `lint` script for `tools/lint`): validator, ESLint and the script tests in one command. `project-bootstrap` adds a `verify` script to new projects; `CLAUDE.md`, README and `docs/` (configuration, tech stack, testing, rules, architecture) describe it.

## 2.18.0: only the human author is credited (2026-10-26)

The repository owner asked that only the owner appear as a contributor, never an AI agent. GitHub lists every `Co-Authored-By` trailer as a contributor, so one trailer is enough to show an agent on the repository page. The rule and its check follow Projects24 v1.11.0, adapted to this repository.

- **`AGENTS.md` non-negotiable 10**: commits, tags, releases and pull requests carry only the owner's Git identity; no AI co-author or sign-off trailer, "Generated with" line, or AI author, committer or bot identity.
- **Rule 08**: section 2 states the rule and replaces the earlier advice to disclose AI assistance with a commit trailer (disclosure, where a project requires it, now goes in the pull request description or the project's notes); section 3 explains how to remove an attribution that was already pushed (owner's approval, byte-identical tree, backup branch, tags moved, `--force-with-lease`); section 4 keeps AI attribution out of pull requests and release notes.
- **New `scripts/check-authorship.mjs`** (Node.js 22+, no dependencies) and seven tests: flags AI author or committer identities, AI co-author, sign-off and similar trailers, and "Generated with" lines naming an AI tool; ignores topics that merely mention AI tools, Dependabot and human co-authors. Unlike the Projects24 version it does not mistake a person named Devin for Devin AI, reads Git errors cleanly (exit code 2) and follows this repository's script conventions. It passes on the current history (20 commits, 0 attributions) and fails on the pre-amend commit kept in `backup/before-trailer-removal`.
- **CI**: a new `authorship` job checks the full history (`fetch-depth: 0`); the installer now also copies the script into projects.
- **Skills**: `change-existing-code`, `ci-cd-pipeline`, `project-bootstrap` (first commit and done-when), `technical-documentation` and `deploy-and-release` point to the rule where commits and release notes are written; the Copilot instructions gain item 11.
- **Docs**: `docs/` updated where the rule applies (code style, rules, testing, configuration, deployment, security, tech stack), and the README lists the check.

## 2.17.0: this repository follows its own documentation set (2026-10-23)

Projects 23 now keeps the complete `docs/` set it requires of other projects, written from facts checked in this repository on 2026-10-23.

- **New documents**: `docs/README.md` (index with owners, review dates, eight documents marked not applicable with reasons, reading paths), `docs/AGENTS.md` and `docs/CLAUDE.md` (how agents edit `docs/`), `PRD.md`, `TECHSTACKS.md` (every runtime and pinned tool, with end-of-life dates from endoflife.date), `CODE_STYLE.md`, `RULES.md` (invariants of the spec, protected areas, approvals, exceptions), `CONFIGURATION.md` (installer environment variables and every script option), `INTEGRATIONS.md` (registries and services the scripts and CI call, their limits and failure behaviour), `TESTING.md` (every test suite with its count and command), `DEBUGGING.md` (known validator and CI failures with fixes), `DEPLOYMENT.md` (release, rollback, a dry-run of the installer), `docs/SECURITY.md` (threat model and controls; the reporting policy stays in the root `SECURITY.md`, which GitHub shows first) and `DOCUMENTATION.md`.
- **`docs/ARCHITECTURE.md`**: the existing five sections are unchanged; the standard sections (overview, system context diagram, containers, data flow, trust boundaries, quality attributes, key decisions, deployment view, known limitations) were added below them.
- **Not applicable, with reasons**: API, database, schema, privacy, operations, design, design system and assets.
- **CI**: the `spec` job runs `check-docs.mjs docs`, so the set must stay complete. README links the index.
- **Corrections found while writing**: claims about the installer, the Ruff configuration of the machine-learning template and the scripts' exit codes were checked against the code and stated exactly.

## 2.16.0: a complete, substantial docs/ folder for every project (2026-10-23)

Every project that follows this specification now keeps a complete `docs/` folder, and each document must hold real, verified facts about that project.

- **`technical-documentation` section 5**: the standard set of 23 documents: the 19 requested (`README.md`, `AGENTS.md`, `CLAUDE.md`, `PRD.md`, `ARCHITECTURE.md`, `TECHSTACKS.md`, `CODE_STYLE.md`, `RULES.md`, `TESTING.md`, `DEBUGGING.md`, `DEPLOYMENT.md`, `SECURITY.md`, `DOCUMENTATION.md`, `API.md`, `DATABASE.md`, `SCHEMA.md`, `DESIGN.md`, `DESIGN_SYSTEM.md`, `ASSETS.md`) plus four that answer questions none of them did: `CONFIGURATION.md` (the one reference for variables and flags, previously spread over deployment and database docs), `INTEGRATIONS.md` (third-party services consumed, apart from the API offered), `PRIVACY.md` (personal data inventory, legal basis, retention, data subject requests, impact assessments, breach response, citing GDPR Articles 30, 33 and 35 as checked on gdpr-info.eu) and `OPERATIONS.md` (SLOs, on-call, incidents, capacity, disaster recovery, maintenance, cost). Each document answers one subject and says when it is required, and what makes a document substantial: verified project facts, one fact in one place, generated where possible, names but never values of secrets, an owner and a review date, updated in the same pull request. Documents that do not apply are listed with the reason instead of being padded.
- **23 templates** in `technical-documentation/assets/docs/`, plus a `CONTRIBUTING.template.md` in `project-bootstrap` and a list of the root-level files (README, AGENTS, CLAUDE, CONTRIBUTING, CHANGELOG, LICENSE, GLOSSARY, ADRs, post-incident reviews); each with its required sections, guidance and examples (tables, Mermaid context and ER diagrams). They are named `NAME.template.md` on purpose: files named `AGENTS.md` or `CLAUDE.md` inside this specification would be loaded as live instructions, because agents read the nearest `AGENTS.md` (agents.md) and Claude Code loads a subfolder's `CLAUDE.md` when it works there.
- **New `check-docs.mjs`** (Node.js 22+, no dependencies): fails when a standard document is missing and not marked not applicable, a template section is missing or empty, or a `{{placeholder}}` remains. Five tests, including one that fills every template and one that runs the CLI on a temporary folder; run in CI and covered by the clean-code lint.
- **Facts checked**: GitHub reads community health files from `.github/`, the root and `docs/`, in that order of precedence, so `docs/SECURITY.md` explains how it relates to any other copy; agents.md states that the closest `AGENTS.md` wins; Claude Code's memory documentation states that subdirectory `CLAUDE.md` files load on demand.
- **Hooks**: the `AGENTS.md` definition of done, `project-bootstrap` (create the set when a repository starts), the operational manual, the engineering concepts index and the README.

## 2.15.0: anti-slop (2026-10-23)

Researched [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) (MIT, commit `69416cf`), a filter that stops agents shipping generic AI-generated UI, text and code. Its files were read as data and adapted with attribution; nothing was installed.

- **New skill `anti-slop` (30 in total)**: three hard gates (nothing fabricated, everything shown works, people can use it), the purpose test, judging clusters rather than single tells, a scope guardrail that respects non-negotiable 9 (existing comments and copy are reported, not silently rewritten), and a draft, audit, final procedure with a checklist. References: `code-comments.md` (tells to remove, comments to keep, comments-only edits), `writing.md` (patterns to cut, what is not slop on its own, the fabrication check), `interfaces.md` (hard gates, purpose-required techniques, template shapes to question).
- **Facts checked at the source**: contrast, non-text contrast, resize, reflow and target-size figures come from the W3C WCAG 2.2 Understanding pages. The source repository describes large text as "18px+"; WCAG defines it as at least 18 point or 14 point bold (about 24 and 18.5 CSS pixels), which is what this specification uses. Its 44 by 44 target corresponds to WCAG's level AAA criterion; the AA minimum is 24 by 24 CSS pixels, and both are given.
- **Hooks**: `AGENTS.md` non-negotiable 1 now covers fabricated user-facing content; rule 02 section 6 (plain, short comments); `technical-documentation`, `web-frontend-engineering`, `mobile-engineering` (touch targets now have numbers) and `rigorous-code-audit` link the matching reference; the operational manual, domain coverage, engineering concepts and README list the skill.
- **Not adopted**: the always-on `<EXTREMELY_IMPORTANT>` block and its announced usage modes, the install wizard, the design dials and the `DESIGN.md` requirement (design direction belongs to the project), the bundled contrast-checker MCP server (this specification already uses axe-core and Lighthouse), and the outright em-dash ban (treated here as one tell among many; follow the project's style).

## 2.14.0: practices from Matt Pocock's skills (2026-10-22)

Researched [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, commit `5beb35b`). Most of its skills are workflows tied to its own issue-tracker setup and slash commands; their engineering discipline was adapted into the matching rules and skills here, with attribution, instead of adding parallel skills that would duplicate this specification. Nothing was installed.

- **New reference `software-architecture/references/deep-modules.md`** (from codebase-design): module, interface (including invariants, error modes and performance), depth as leverage, seam, adapter, locality; the deletion test; "the interface is the test surface"; one adapter is a hypothetical seam, two make a real one; testing by dependency category; design it twice. `software-architecture` also gains a `GLOSSARY.md` practice and a codebase survey for deepening opportunities (from domain-modeling and improve-codebase-architecture), plus the three-part test for writing an ADR.
- **New asset `project-bootstrap/assets/GLOSSARY.template.md`** for the project's domain language.
- **`feature-specification`**: resolve the design tree with the user in rounds, with a recommended answer per question (grilling); throwaway prototypes for questions cheaper to build than debate; tracer-bullet tasks with blocking edges, preparatory refactoring first, and expand-migrate-contract for wide mechanical changes (to-tickets).
- **`test-engineering`**: agreed seams, vertical slices, no tautological tests, the refactor test for implementation coupling, one client function per external operation (tdd).
- **`systematic-debugging`**: a red-capable, deterministic, fast feedback loop before any theory, ten ways to build one, raising the reproduction rate of intermittent bugs, three to five ranked falsifiable hypotheses, tagged debug logs, regression tests only at a seam that exercises the real bug, the confirmed cause recorded in the commit, and redacted output (diagnosing-bugs).
- **`rigorous-code-audit`**: spec conformance reported as a separate axis, never ranked against standards; code smells are labelled judgement calls that project standards override (code-review).
- **Rule 08**: pull requests summarised with the smallest visual, before-and-after evidence, and the merge danger as a one-way or two-way door with its blast radius (pr). **Rule 09**: a handoff note when work moves to another session or agent (handoff). **`AGENTS.md` section 6**: parallel implementation of a task graph on one integration branch (implement-spec). **`docs/CONTRIBUTING.md`**: writing instructions for agents (writing-for-agents) and turning repeated mechanical mistakes into automated checks (retro).
- **Guard hook** (from git-guardrails-claude-code): `guard.mjs` now also denies `git reset --hard`, `git clean -f`, `git checkout -- <path>` and `git checkout .`, `git restore` without `--staged` (or with `--worktree`), `git stash drop` and `clear`, and `git branch -D`, enforcing rule 08 section 3; 12 new denied and 9 new allowed cases in its tests. It is still an opt-in asset, not enabled in this repository.
- Not adopted: issue-tracker setup, triage, wayfinder, ask-matt, teach, to-questionnaire, wait-what and the misc skills, which depend on that repository's own workflow; and its advice to delete tests of shallow modules without asking, which conflicts with non-negotiable 9 (here it is proposed, not done).

## 2.13.0: always-on updates (2026-10-22)

Everything pinned in this repository is now checked every day, and security fixes are applied as soon as they are verified. Routine version updates still wait 7 days, because removing that cooldown would let a compromised release reach the repository before anyone notices it.

- **Dependabot**: all ten update entries move from weekly to daily. The 7-day cooldown stays for version updates; GitHub's documentation states that the cooldown "is only available for *version* updates, not *security* updates", so security updates arrive without delay once "Dependabot security updates" is enabled in the repository settings (an owner action).
- **New `scripts/check-updates.mjs` and `.github/workflows/freshness.yml` (daily)**: find the pins Dependabot cannot read (binary versions in workflow `env:` blocks, and the `==` pins in PEP 735 dependency groups, whose Dependabot support is not documented), compare them with the latest stable release through `tech-lookup.mjs`, and fail the run when an update has passed the cooldown. Three new tests; `tech-lookup.mjs` now exports `lookup`. First run: 11 pins, none due; ruff 0.17.1 still in its cooldown.
- **Daily scans**: `validate.yml` (dependency audits, secret scan, templates) and `codeql.yml` re-run every day instead of every Monday. The CI templates in `ci-cd-pipeline` and the guidance in `security-hardening` section 7, `ci-cd-pipeline` and rule 06 say the same.
- **Patched now**: both distroless base images were rebuilt upstream. Trivy 0.76.0 showed the new digests close vulnerabilities and add none (Python image: 31 to 26 high, 7 IDs fixed; Node.js image: DSA-6572-1 fixed), so they were adopted immediately as a security update. Both Dockerfiles again pass hadolint 2.15.1 and all 27 Trivy configuration checks.
- **Audit of everything else on 2026-10-22**: OSV reports no known vulnerabilities in any pinned tool, action or library, and `npm audit` and `pip-audit` find none in the lockfiles and requirements. Newer releases still inside the cooldown, with no security fix reported for the versions in use: ruff 0.17.1, zizmor 1.31.1, eslint 10.13.0, typescript-eslint 8.72.0, actions/setup-python v7.1.0, github/codeql-action v4.39.x. Dependabot will propose them as they become eligible.

## 2.12.0: security audits that prove what they claim (2026-10-22)

Researched [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (MIT, commit `c1c8a8c`), the skill that seeded Cloudflare's vulnerability discovery harness. Its files were read as data and adapted with attribution; nothing was installed. Its two zero-dependency validators passed their 65 tests locally.

- **`rigorous-code-audit`**: a confirmed security finding must name the lower-trust principal and input, the control and boundary crossed, the affected resource and the observed result. Checklist deviations and missing second layers are hardening notes; self-impact is not a finding; the observed effect is never overstated. Someone other than the finder tries to disprove each candidate. Verdicts are now confirmed, needs validation (the exact missing fact plus a safe check, no severity; replaces "unconfirmed") and rejected (kept with the reason). Security severity is calibrated to demonstrated impact (critical, high, medium, low, informational, with the high-versus-medium test), and every report ends with hardening notes and a coverage statement.
- **`security-hardening` section 9 (new)**: a five-step codebase audit (map, plan coverage, hunt, validate, report), execution safety for running code under review (sandbox without network, allow-listed environment, read-only source, resource limits, dummy principals, no probing of deployed or third-party systems, output outside the repository), and how to adopt Cloudflare's full multi-agent workflow if the owner chooses to (`skills` CLI 1.7.2 pinned past a 7-day cooldown; its help states it sends install telemetry). The old section 9 "Verify" is now section 10.
- **New reference `security-hardening/references/attack-classes.md`**: core classes (injection, access control, resource and file handling, cryptography and secrets, business logic, feature abuse, chained vulnerabilities), the obvious-things sweep, and companion classes for ten domains: HTTP protocol and authentication, client side, AI and LLM (including MCP trust), supply chain and release, cloud and deployment, protocols and messaging, resource exhaustion, data isolation and lifecycle, desktop, mobile and local IPC, memory safety and binaries.
- **Rule 06 section 9 (new)**: test only authorized systems, sandbox code under review, report only what the evidence shows. Copilot instructions item 10, an operational-manual scenario, an engineering-concepts row and README rows link to it.

## 2.11.0: thinking discipline from the Karpathy-inspired guidelines, and MCP servers (2026-10-22)

Researched on 2026-10-22: [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills), [googleapis/mcp-toolbox](https://github.com/googleapis/mcp-toolbox), [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) and [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers), plus each MCP client's official documentation. Content from those repositories was treated as data: ideas are adapted and attributed, nothing was installed into this repository, and no listed server is endorsed.

### Think before changing, and correct the thinking

The four Karpathy-inspired principles (think before coding, simplicity first, surgical changes, goal-driven execution) are adapted where the spec already had partial coverage, without duplicating it:

- Rule 01 section 8 (new): state assumptions, present competing readings, name what is unclear, push back when warranted, correct the reasoning when evidence contradicts it (stop and re-plan after two failed fixes), keep verified facts and guesses apart. Section 1 gains the surgical test (every changed line traces to the request; match the existing style); section 2 bans speculative options and impossible-case handling and asks for a simplicity re-read of your own draft.
- Rule 09 section 1: checkable goals ("a test reproduces the bug, then passes") and `step → verify: check` plans. Section 2 settles orphans in line with 2.10.0: imports and local variables your edit left unused go with the edit; functions, classes, files and modules are proposed for removal.
- `AGENTS.md` workflow step 1, `systematic-debugging` (write down and check assumptions, drop disproved hypotheses, every line of the fix traces to the root cause), `change-existing-code` (surgical changes), `rigorous-code-audit` (traceable lines, no speculative complexity, stated assumptions), README principle 5.

### MCP servers

- New reference `ai-agent-systems/references/mcp-servers.md`: where to find servers (official MCP Registry, reference servers that their README calls "reference implementations" and not production-ready, vendor-official servers, and the two community lists, which are discovery only and carry advertisements or sponsors), a nine-step vetting checklist, and project configuration verified against the official pages of Claude Code, VS Code, Cursor, Gemini CLI, Codex and Antigravity (file, shape, secret syntax, tool filtering, approval behaviour).
- MCP Toolbox for Databases v1.14.0: when and how to use it safely (fixed statements with bound parameters, no `templateParameters`, prebuilt `execute_sql` only for development, credentials as `${ENV_NAME}` for a least-privilege user, annotations and authentication, stdio locally, `--allowed-hosts` and `--allowed-origins` narrowed because both default to `*`, pinned version with verified SHA-256).
- New asset `ai-agent-systems/assets/mcp-toolbox-sqlite/`: a read-only `tools.yaml`, seed data, a client configuration example and a standard-library test that drives the real server over the MCP stdio transport. Five tests pass on Python 3.11 and 3.14 with the macOS binary, whose SHA-256 matched the release page; the pinned `npx @toolbox-sdk/server@1.14.0` path was also run. SQL injection attempts return no rows and unknown tools such as `execute_sql` are rejected. A new CI job runs it with the checksum-verified Linux binary.
- Rules 04 and 06: MCP servers and agent extensions are dependencies that run with your permissions (vet, pin, verify checksums, least privilege, confirmations on). Also linked from `backend-engineering` (agent database access), the technology catalog, the operational manual and the engineering concepts index.

### Audit findings

- geminicli.com now states that Gemini CLI was replaced by Antigravity CLI for unpaid-tier and Google One users on 2026-06-18; the README's tool table says so. The `GEMINI.md` and `context.fileName` documentation it relies on is still published.
- The MCP Toolbox README mixes versions in its examples (binary 1.14.0, container 0.24.0); the reference tells readers to take the version from the release they verified.

## 2.10.0: existing code is preserved; confirm and discuss first (2026-10-18)

A new always-on concept: agents never delete existing code on their own. Before they delete, overwrite, rewrite, comment out, disable, move or discard anything they did not create in the task, or change existing code beyond the request, they stop, propose the change and wait for the user's decision.

- `AGENTS.md` non-negotiable 9, and item 9 in `.github/copilot-instructions.md` for surfaces that read only that file.
- Rule 09 section 2, "Existing code is preserved": what needs confirmation and what does not, a proposal template (proposal, why, what depends on it, options, risk and undo, decision), approval limited to what was discussed, silence is not consent, non-interactive runs report instead of deleting, and reversible removal once agreed.
- Instructions that told agents to delete existing code themselves now ask first: rule 02 (existing commented-out code and code smells are reported, not removed), rule 09 section 4 (clean up only what you added), `change-existing-code` (unused code and strangler-fig leftovers are proposed for removal; a new warning sign), and `systematic-debugging` (shrink reproductions in a scratch copy, not in the user's working tree).
- Rule 08: never discard uncommitted or unpushed work (`git reset --hard`, `git checkout --`, `git restore`, `git clean`, `git stash drop`) without approval.
- README principle 4, a scenario in the operational manual, and a row in the engineering concepts index.

## 2.9.0: engineering concepts, software architecture and chaos engineering (2026-10-16)

Every engineering concept that applies to this specification now has a place, anchored to the field's own reference rather than to an open-ended list. Sources were checked on 2026-10-16; tool versions come from `scripts/tech-lookup.mjs`.

### New skills (29 in total)

- `chaos-engineering`: the Principles of Chaos Engineering (steady state, hypothesis, real-world events, production with care, automation, minimal blast radius), AWS Well-Architected REL12-BP04 and REL12-BP05 (hypothesis template, stop conditions, rollback, game days, experiments as regression tests in CI/CD), Azure Well-Architected RE:08 (failure mode analysis, partial failures, baselines), and the Chaos Toolkit rule that an experiment bails out when the system is not in its steady state. Safety rules for agents come first: no fault injection in production or shared environments without explicit approval, only systems the user owns, known weaknesses fixed first. It has a fault catalogue by layer (application, dependencies, network, infrastructure, zone or region, data, load, AI providers, clients, people and process) and a tool table with verified versions: Chaos Mesh v2.8.5 and LitmusChaos 3.33.0 (both CNCF incubating), Chaos Toolkit 1.21.4, Toxiproxy v2.13.0, Chaos Monkey v2.1.3, AWS FIS, Azure Chaos Studio, Gremlin.
- `software-architecture`: quality attributes from ISO/IEC 25010:2023 as measurable scenarios, architecture styles and when each fits (Azure Architecture Center), modular monolith first (Fowler), hexagonal architecture (Cockburn), domain-driven design, Conway's law and Team Topologies, CAP and PACELC (Abadi, IEEE Computer 2012), consistency models (Jepsen), Raft, idempotency, transactional outbox, sagas, CQRS, event sourcing, RFC 9413 and Hyrum's law for contracts, resilience patterns (retry at a single point in the stack, circuit breaker, bulkhead, load shedding, static stability, cells, shuffle sharding), the AWS position on fallbacks, Little's and Amdahl's laws, FinOps and Software Carbon Intensity (ISO/IEC 21031:2024), ADRs, C4, arc42 and fitness functions (ArchUnit 1.5.1, dependency-cruiser 18.6.0, import-linter 2.15).

### Runnable chaos experiment kit

`chaos-engineering/assets/chaos-experiment-kit/`, Python 3.11+ standard library only: an experiment runner (steady-state probes with tolerances, bail-out, stop conditions, rollback guaranteed on errors and interrupts, recovery check, JSON journal), a TCP proxy that injects latency or drops connections on `127.0.0.1`, and an example that tests a client with a timeout and fallback against a slow and an unreachable dependency. 19 tests pass on Python 3.11 and 3.14, including one that shows the same experiments catch a client without a fallback; ruff and mypy `--strict` are clean. A new CI job runs it on Python 3.11 and 3.14, and Dependabot watches its development pins.

### Engineering concepts index

`.agents/engineering-concepts.md` maps the 18 knowledge areas of the IEEE Computer Society's SWEBOK Guide V4.0a to the rules and skills that apply them, then lists named concepts by family (code design, architecture and distributed systems, reliability and chaos engineering, SRE and observability, delivery, quality and testing, security and privacy, data and AI, people, process and sustainability) with where each is applied and a primary source. It also covers neighbouring disciplines and a procedure for any concept that is not listed. `AGENTS.md`, `domain-coverage.md` and the operational manual link to it.

### Additions to existing skills and rules

- `cloud-infrastructure`: the four golden signals (latency, traffic, errors, saturation) with RED and USE, toil and Google's 50% budget, and fault injection plus game days to prove redundancy and alerts; the tooling reference names AWS FIS, Azure Chaos Studio and Chaos Toolkit.
- `test-engineering`: test-driven development ("Red - Green - Refactor").
- `quality-assurance`: the resilience row links the chaos-engineering procedure and adds Toxiproxy.
- Rule 08: short-lived branches merged often (trunk-based development), unfinished work behind feature flags.

## 2.8.0: research-driven additions from public standards and open source (2026-10-16)

A gap analysis of the whole specification against authoritative public sources. Each addition below is cited to its official source, checked on 2026-10-16.

### From the OpenSSF Security-Focused Guide for AI Code Assistant Instructions (2025)

- **Self-review before reporting** (rule 09 section 6, workflow step 6 in `AGENTS.md`): the guide reports that two rounds of "recursive criticism and improvement" substantially improve the security of generated code.
- **No persona framing** in instructions (`docs/CONTRIBUTING.md`): the guide does not recommend "act as an expert" prompts because some experiments found they make results worse. This specification already avoided them; the authoring rule now says why.
- **Rule 06**: never disable XML external-entity protection or type checks during deserialization, `.NET BinaryFormatter` named (Microsoft: it always throws starting with .NET 9 and "can't be made secure"), secure temporary files and file permissions, run as non-root.
- **New reference** `security-hardening/references/language-security.md`: C and C++ (OpenSSF compiler-hardening baseline flags, sanitizers), Rust, Go, Python, JavaScript/TypeScript, Java/Kotlin, C#/.NET, and the 2025 CWE Top 25 leaders.
- **Rule 08**: follow the project's policy on disclosing AI assistance.

### From agents.md

- The `AGENTS.md` project profile now has the fields agents.md recommends: project overview, dev environment setup, code style, commit and pull request conventions, and security notes.

### Other standards and practices

- `rigorous-code-audit`: Google's code review standard (approve when the change improves overall code health; read every line; watch for over-engineering).
- `deploy-and-release`: The Twelve-Factor App as the readiness frame; OpenFeature (CNCF incubating) for vendor-neutral feature flags.
- `ci-cd-pipeline`: the five DORA metrics as defined on dora.dev (change lead time, deployment frequency, failed deployment recovery time, change fail rate, deployment rework rate).
- Security domain standards: NIST SP 800-218 SSDF v1.1, the 2025 CWE Top 25, the OpenSSF AI-assistant guide, signed artefacts with Sigstore cosign or Notation and in-toto attestations; `cloud-infrastructure` admits only signed images (Kyverno `verifyImages` or the Sigstore policy-controller).

### New skills (27 in total)

- `feature-specification`: spec-driven development (specify, plan, tasks, implement, converge), in the same order as GitHub's open-source Spec Kit, with Given/When/Then acceptance criteria and non-functional requirements.
- `technical-documentation`: the Diátaxis framework (tutorial, how-to, reference, explanation), the documents most projects need, writing rules, and docs as code.

### Deterministic guardrails

- `security-hardening/assets/claude-code-guardrails/`: a Claude Code `PreToolUse` hook (schema from the official hooks documentation) that denies access to secret files and blocks force-pushes, root or home deletes, `curl | sh`, `--no-verify` commits and `chmod 777`. It fails closed on unreadable input. Five tests run in CI, and the clean-code lint covers it (the lint caught one function at complexity 11, which was split). It is not enabled automatically: hooks change every session in a repository, so enabling it is the owner's decision.

## 2.7.0: security kept current, measured (2026-10-16)

No system can be made impossible to hack. This release makes sure everything in the repository is current, that known vulnerabilities are found automatically even when nothing changes, and that the runtime images expose as little as possible.

### Checked and found current

- All 8 pinned GitHub Actions and gitleaks 8.30.1 are the latest releases (checked with `scripts/tech-lookup.mjs`).
- `npm audit`: 0 vulnerabilities in all 3 lockfiles. `pip-audit --strict`: no known vulnerabilities in the CI tools, the ML template and both Python dev groups.
- zizmor 1.31.1 (released 2026-10-15, newer than the pinned 1.30.1) found nothing in the workflows and the CI/CD templates. Its pin, and Ruff 0.17.1, were deliberately not adopted inside the 7-day cooldown, because both releases are under a day old and contain bug fixes only.

### Fixed

| # | Finding | Fix |
| :- | :--- | :--- |
| 1 | `node:24-slim` (pinned digest): Trivy 0.75.0 reported 4 critical and 68 high vulnerabilities (3 critical and 11 high with fixes available: `perl-base`, and `brace-expansion` and `undici` bundled with npm). A newer digest still had 4 critical and 64 high | Node.js runtime moved to `gcr.io/distroless/nodejs24-debian13:nonroot` (pinned digest): **0 critical, 0 high** (23 medium, 8 low, none fixable yet) |
| 2 | `python:3.14-slim`: 48 high, 4 fixable (`setuptools`, `urllib3`, `msgpack` from pip's environment) | Python runtime moved to `gcr.io/distroless/python3-debian13:nonroot` (Python 3.13, within the template's 3.11+ support): 0 critical, 31 high, none with a fix released yet; no pip in the image |
| 3 | CI tool versions were pinned inside workflow `run:` commands, which Dependabot cannot update, so security tools could silently go stale | Moved to `tools/ci/requirements.txt` with a Dependabot `pip` entry |
| 4 | Vulnerabilities published after the last commit would go unnoticed until the next change | `validate.yml` now also runs weekly (`schedule`) and on demand (`workflow_dispatch`); the ML job also runs `pip-audit` |
| 5 | No static security analysis of the code | New `codeql.yml`: `actions`, `javascript-typescript` and `python` with `security-extended` queries, on push, pull request and weekly (CodeQL Action v4.38.3; v4.39.0 is inside the cooldown) |

Both Dockerfiles pass hadolint and all 27 Trivy configuration checks. Their entrypoints and users were read from the images' registry configuration, not assumed.

### Added guidance

- `security-hardening` section 7, "Keep security current": automate every pin, keep CI tool pins where Dependabot can see them, use a cooldown for routine updates, patch known-exploited vulnerabilities first (CISA KEV catalog, EPSS), scan on a schedule, minimise runtime images, rebuild regularly, track end of life, practise the response.
- Rule 06: keep everything current, with a pointer to that section. `deploy-and-release` now prefers distroless runtime images, with the measured numbers. CodeQL template added to `ci-cd-pipeline`.

### Not added

- OpenSSF Scorecard: its README asks for `scorecard-action` v2.6.0 or later, but the latest published release is v2.5.0, and its publishing mode has restrictions that could not be tested locally. Add it once a matching release exists.

## 2.6.0: data and security private by default (2026-10-16)

### Audit of this repository (it is public on GitHub)

| # | Finding | Action |
| :- | :--- | :--- |
| 1 | Secrets: gitleaks 8.30.1 (checksum-verified binary) scanned all 10 commits on all branches and the working tree | No leaks found. No `.env`, key, certificate, credential, state or dump file was ever committed |
| 2 | The commit author email address is public in every commit of the public history | Not changed: rewriting published history is irreversible and needs the owner's decision. Recommended: GitHub's private no-reply email for future commits and "Block command line pushes that expose my email" |
| 3 | The local macOS username appeared in one CHANGELOG line and in five lines inside `.archive/phase1-original-2026-10-14.tar.gz` | CHANGELOG line redacted. The archive is left for the owner to keep, replace or remove (it also remains in history) |
| 4 | Test data used `a@b.co`, an address on a real, registered domain | Replaced with `a@example.com` (domains reserved for documentation by RFC 2606) in both service templates; tests pass |
| 5 | `.gitignore` covered `.env` files but not other secret-bearing files | Added keys and certificates, SSH keys, credential and registry token files, kubeconfigs, Terraform state and variables, database dumps and local databases; no tracked file is affected |
| 6 | No security policy | `SECURITY.md` with private vulnerability reporting; a reusable template in `project-bootstrap/assets/` |
| 7 | The installer could not prove that a downloaded archive was the reviewed one | `--sha256 <hash>` (or `UCNA_SHA256`) verifies the archive before anything is written; the hash is printed on every download. Tested: correct hash accepted, wrong hash aborts with nothing installed |
| 8 | CI did not scan for secrets | New `secret-scan` job: full history plus working tree on every push and pull request |

### Added guidance

- Rule 06 section 8, "No unintended public exposure" (always on): Git history, commit metadata, CI logs and artifacts, published packages and images, client bundles and app binaries, web servers and APIs, cloud storage and databases (Amazon S3 Block Public Access, Azure `AllowBlobPublicAccess` false, Google Cloud Storage public access prevention, each checked against official documentation), backups and logs, third-party and AI services.
- `security-hardening` skill section 6, "Public exposure audit": a six-step procedure with commands, from history scanning to cloud account controls.

## 2.5.0: clean code and clean execution, applied to this repository itself (2026-10-16)

The concept is now stated explicitly, and the repository is held to its own standard by CI.

### Audit findings and fixes

| # | Finding | Fix |
| :- | :--- | :--- |
| 1 | "Clean execution" was not defined anywhere; its practices were scattered across files | New always-on rule `09-clean-execution` (plan, preview, verify each step, fail cleanly, leave no mess, well-behaved scripts, honest report). `AGENTS.md` opens with the concept: clean code plus clean execution. Imported by `CLAUDE.md`; summarized in the Copilot instructions |
| 2 | Nine functions in the repository's own code exceeded the spec's limit of cyclomatic complexity 10 (rule 02): `validateSkill` (19), `requestFor` (19), `parseNewUser` (13), `pypi` parser (13), `validateRules` (12), `route` (11), `parseFrontmatter` (11), `compareVersions` (11), `packagist` parser (11) | Refactored: table-driven request builders, small single-purpose helpers, and validation split into pure functions (`skillProblems`, `ruleProblems`) separated from file I/O (rule 01 section 5). Behaviour unchanged: 21 script tests and 12 template tests pass on Node.js 22 and 24 |
| 3 | Nothing enforced the complexity and nesting limits on the repository's own JavaScript and TypeScript | `tools/lint`: pinned ESLint configuration (complexity 10, depth 3, 4 parameters, 60-line functions, no shadowing) and CI job `clean-code`. Proven to fail on a planted violation. Ruff already enforced the same complexity limit on the Python templates |
| 4 | Both CLIs crashed with an unhandled `EPIPE` error when their output was piped into a command that closes early (for example `head -1`) | Both exit quietly with their normal exit code |
| 5 | After editing a template, the `.claude/skills` mirror had not been regenerated (caught by the validator's drift check) | Re-synced; rule 09 now requires regenerating derived files after changing sources |
| 6 | The product was named "Projects 23" in the README but "UCNA-Spec" in the installer and docs | Unified on "Projects 23"; the README notes the former name. The installer's `UCNA_REF` and `UCNA_SOURCE_DIR` variables are kept for compatibility |
| 7 | `typescript-eslint` 8 declares the peer range `typescript >=4.8.4 <6.1.0`, which conflicts with the TypeScript 7 the toolchain guide recommends | Documented in the toolchains reference; `tools/lint` uses its own TypeScript 6.0 for parsing, and Dependabot ignores TypeScript 6.1 and later there |

### Added

- Unit tests for the pure validators `skillProblems` and `ruleProblems`.
- README: clean code and clean execution as the first principle; rule, check and size figures updated.

## 2.4.0: adopt any technology, with live verification (2026-10-15)

No document can list every tool ever published, and any list goes stale. This release makes every technology usable through one verified procedure and live data.

### Added

- `technology-adoption` skill: identify the exact version, get live facts, read the version-specific official documentation, evaluate maintenance, licence, security, fit and exit cost, learn the idioms, integrate into the toolchain, keep it healthy, and handle commercial SaaS.
- `technology-adoption/references/technology-catalog.md`: widely used tools across 19 categories (languages, backend and frontend frameworks, mobile and desktop, ORMs, databases, messaging and workflows, APIs and gateways, identity, build tools, testing, observability, containers and CI/CD, infrastructure as code, cloud platforms, data and BI, AI/ML/LLM frameworks, content and commerce, collaboration). 177 package names confirmed in their registries, 101 projects confirmed on GitHub with archived status checked, commercial platforms confirmed by their official sites.
- `scripts/tech-lookup.mjs`: zero-dependency, read-only lookup of the latest stable version, release date, licence, repository, deprecation or yanked status (npm, PyPI, Go module proxy, crates.io, Maven Central, NuGet, RubyGems, Packagist, pub.dev, Hex, GitHub releases), supported release cycles with end-of-life dates (endoflife.date) and OpenSSF Scorecard scores. It exits with code 1 for names that do not exist. 19 unit tests; live-tested against all 13 sources. Shipped by the installer.
- `AGENTS.md`, rules 03 and 04, the domain coverage map, the operational manual and the Copilot instructions now point to the skill and the lookup tool.

### Found and handled during verification

- `minio/minio` is archived on GitHub; the catalog flags it instead of recommending it.
- Licences that need attention are listed in the catalog: `ansible-core` (GPL-3.0-or-later), Terraform (BSL 1.1), `ultralytics` (AGPL-3.0), Strapi (own licence file), Soda Core (proprietary metadata).
- endoflife.date marks releases as "maintained" while paid extended support continues after upstream end of life (Node.js 20, 18, 16...). The lookup counts a cycle as supported only when it is not end-of-life, and lists extended-support-only cycles as a warning.
- Maven's `<release>` metadata can point to a milestone (Spring Boot showed 4.2.0-M2); the lookup selects the highest stable version instead (4.1.1).
- Java has no `java` product on endoflife.date; the JDK is tracked per distribution (`eclipse-temurin`, `amazon-corretto`, `oracle-jdk` and others).

### Corrected

- README: "5-step" protocol (rule 03 has 6 steps), "zero-vulnerability packages" and "eliminates hallucinations" (overclaims), "7 language families" (now 14), "AWQ/FP8 quantization" (not in the skill, which covers FP16, INT8 and 4-bit), "manual prompt injection" for chat models (prompt injection names an attack; the intended meaning is pasting), and "compatible with every major AI agent tool" (replaced by the dated, sourced compatibility table).

## 2.3.0: API integration for every sector, and back-office IT operations (2026-10-15)

### Added

- `api-integration` skill: authentication per RFC 9700 (OAuth 2.0 security BCP), webhooks (signature, replay window, deduplication, asynchronous processing), safe retries with idempotency keys, rate limits, pagination, data mapping, sandbox and contract testing, monitoring and replay.
- `api-integration/references/sector-standards.md`: cross-sector building blocks and standards for 13 sectors: payments (PCI DSS v4.0.1), banking and open finance (FAPI 2.0 Final, ISO 20022), healthcare (FHIR R5, SMART App Launch 2.2.0, HL7 v2, DICOM), government identity, accounting and ERP (Peppol BIS Billing 3.0 on EN 16931), retail and logistics (X12, EDIFACT, GS1), telecommunications (CAMARA, TM Forum), education (LTI 1.3), geospatial (OGC API - Features, GeoJSON), IoT and industrial (MQTT 5.0, OPC UA), email and messaging (SPF, DKIM, DMARC), travel and insurance, AI providers.
- `api-integration/assets/python-integration-kit/`: standard-library-only resilient HTTP client and Standard Webhooks verifier with 18 tests. It passes Ruff, `mypy --strict` and Bandit on Python 3.11, 3.13 and 3.14, and is signature-compatible with the official `standardwebhooks` library 1.1.0 in both directions. CI job `integration-kit` added.
- `it-operations` skill: identity and SSO, MFA, SCIM joiner-mover-leaver, endpoints and patching, network segmentation and zero trust, certificates (ACME), email authentication, 3-2-1 backups with restore tests, monitoring and SIEM, IT service management, and frameworks (CIS Controls v8.1, NIST CSF 2.0, ISO/IEC 27001, SOC 2).
- Two more roles in `.agents/domain-coverage.md` (integration engineer; system administrator and IT operations) and an industry-sectors section. Systems administration moved from "domains without a dedicated skill" to the new skill.
- Security domain standards: OAuth and API integration, payments, and organization-wide IT security rows.

### Facts that changed recently (checked on 2026-10-15)

- DMARC is now RFC 9989, with reporting in RFC 9990 and RFC 9991 (May 2026); RFC 7489 is obsolete.
- TLS 1.3 is now RFC 9846 (July 2026), which obsoletes RFC 8446.
- OAuth 2.1 is still an Internet-Draft (version 16). The IETF `Idempotency-Key` header draft expired, and the `RateLimit` header fields are still a draft.
- Not confirmed from official pages (403 or no version shown), so cited without a version: ITIL, the ISO/IEC 27001 edition, ISO 20022 message versions, TM Forum Open API versions.

## 2.2.0: domain coverage across backend, data, AI, cloud, security and QA (2026-10-15)

### Added

- Thirteen domain skills, each with a checklist, verified tool names and a "done when" list:
  `backend-engineering` (with API-design and data-store references), `web-frontend-engineering`, `mobile-engineering`, `data-engineering` (with tooling reference), `data-analysis`, `machine-learning` (with tooling reference and a tested scikit-learn baseline template), `llm-applications`, `rag-systems`, `ai-agent-systems`, `computer-vision`, `ml-inference-serving`, `cloud-infrastructure` (with tooling reference) and `quality-assurance`.
- `security-hardening/references/domain-standards.md`: which standard to apply per system type (OWASP Top 10:2025, ASVS 5.0, API Security Top 10 2023, MASVS, LLM Top 10 2025, Agentic Top 10 for 2026, MCP security best practices, NIST AI RMF and AI 600-1, SLSA 1.2) plus regulation pointers.
- Toolchains for PHP, Ruby, Swift, Dart/Flutter, SQL and notebooks, shell and PowerShell, and infrastructure code in `project-bootstrap/references/toolchains.md`.
- `.agents/domain-coverage.md` (installed with the spec, so `AGENTS.md` can link it): 19 roles mapped to skills, and verified starting points for domains without a dedicated skill (embedded and IoT, games, smart contracts, desktop, systems administration, robotics, HPC).
- `AGENTS.md`: a domain-skills table next to the lifecycle table; the operational manual routes 30 scenarios.
- CI job `ml-template` and a Dependabot entry for the ML template's pinned requirement.

### Verification for this release

- 110 PyPI packages, 20 npm packages and 90 GitHub repositories checked for existence (3 moved repositories are cited by package name only); 31 additional VS Code extension IDs verified on the Marketplace (`dorzey.vscode-sqlfluff` does not exist and is not used).
- Standards confirmed on their official pages: OpenAPI 3.2.1, RFC 9457, WCAG 2.2 (12 December 2024), Core Web Vitals thresholds, OWASP API Security Top 10 2023, MASVS control groups, MCP specification 2026-07-28 and its security best practices, OWASP LLM Top 10 2025, OWASP Top 10 for Agentic Applications for 2026, Kubernetes 1.35 to 1.37, NIST AI 100-1 and AI 600-1, SLSA 1.2, Terraform BSL 1.1 and OpenTofu MPL 2.0.
- Recommendations avoided after checking: TorchServe (archived 7 August 2025). Licence warnings added for `ultralytics` (AGPL-3.0) and Soda Core (proprietary licence metadata).
- ML baseline template: tests pass on Python 3.11, 3.13 and 3.14 with scikit-learn 1.9.1; Ruff clean.
- `node scripts/agents-sync.mjs --check --all-markdown`: 22 skills, 0 errors, 0 warnings. Official `agentskills validate`: all 22 valid. PyYAML: all frontmatter valid. All 48 external links in the spec and docs return HTTP 200.

## 2.1.0: full lifecycle coverage and second audit (2026-10-14)

### Fixed: defects found in the second audit

| # | Defect | Impact | Fix |
| :- | :--- | :--- | :--- |
| 1 | `scripts/install.sh` overwrote existing files and installed `README.md`, `LICENSE`, `CHANGELOG.md` and `.gitignore` into the user's project | Running the published one-liner replaced a project's own README, licence (relicensing it as MIT), `.gitignore`, `AGENTS.md` and Copilot instructions. Reproduced in a test directory | Rewritten: installs only spec files, never overwrites differing files without `--force`, supports `--dry-run`, `--ref` and `--source`, downloads one archive instead of a hard-coded file list, works on macOS bash 3.2, passes `shellcheck`; CI tests that existing files survive |
| 2 | Descriptions of rules 01 to 03 contained an unquoted `: ` | Invalid YAML ("mapping values are not allowed here" in PyYAML). Tools that parse frontmatter strictly, such as Antigravity, drop the file, so the three always-on rules could silently disappear | Values quoted; the validator now rejects YAML-ambiguous plain values; CI cross-checks every frontmatter block with PyYAML |
| 3 | The validator's parser accepted that invalid YAML | Defect 2 passed validation unnoticed | Strict scalar parsing, duplicate-key detection, and five new self-tests |
| 4 | `.gitignore` did not ignore `.env` | A spec that forbids committed secrets did not protect against the most common way to commit them | Ignores `.env` and `.env.*`, keeps `.env.example` |
| 5 | The Node.js template had no lockfile | Contradicted rule 04 ("commit the lockfile") and made `npm ci` impossible | `package-lock.json` added; `npm ci` tested on Node.js 22, 24 and 26 |
| 6 | `docs/ANTI-HALLUCINATION-PLAYBOOK.md` called `fast-uuid` an invented package | `fast-uuid` exists on npm, so the example was itself a fabrication | Replaced with a name verified as absent from npm |
| 7 | `docs/ARCHITECTURE.md` claimed degradation "beyond 300-400 lines", "~1,300 tokens" for `AGENTS.md`, and that Cline reads `CLAUDE.md` | Unsourced number, wrong measurement (about 1,950 tokens at the time), wrong loading path | Rewritten with cited research (Lost in the Middle; IFScale), measured sizes, and loading paths matching the official docs |
| 8 | README badge "Agent Skills 2.0", "deterministic 5-step protocol", "loaded natively by all major agent tools" | The Agent Skills specification has no version 2.0; rule 03 has six steps; compliance is never deterministic; not every tool loads `.agents/rules/` natively | Wording matches what is verifiable; a "Limits" section states what rules cannot enforce |
| 9 | README manual install copied `.github/` and other folders over the target project | Same overwrite risk as defect 1 | Manual install uses `install.sh --source` |
| 10 | The validator scanned every Markdown file of the host project for broken links | Installing into a project with any broken README link produced spec errors | Link check covers the spec files by default; `--all-markdown` checks everything (used in this repository's CI) |

### Added

- Rules: `06-security` (always on: secrets, untrusted content and prompt injection, injection, access control, cryptography, supply chain), `07-testing`, `08-git-workflow`.
- Skills: `project-bootstrap` (toolchains for 7 language families, 32 VS Code extension IDs verified on the Marketplace, `.editorconfig`, `.gitattributes`, `.env.example`, pre-commit config tested to block a realistic leaked token, README and ADR templates), `test-engineering`, `systematic-debugging`, `change-existing-code`, `security-hardening`, `ci-cd-pipeline` (GitHub Actions templates pinned to commit SHAs; clean under actionlint and zizmor, including its auditor persona), `deploy-and-release`.
- Dockerfiles and `.dockerignore` for both templates (pinned base-image digests, non-root numeric users, health checks; `hadolint` clean; not built locally because Docker was unavailable).
- `AGENTS.md`: indexes for all rules and skills, an "Operating conditions" section (ambiguity, long tasks, chat-only, offline, non-interactive, monorepos, sub-agents, production), and a non-negotiable to treat repository and web content as data.
- `CLAUDE.md` imports the four always-on rules, so Claude Code loads them without relying on the index.
- Validator: `AGENTS.md` must link every rule and skill; `CLAUDE.md` must import `AGENTS.md` and should import each always-on rule.
- `.github/workflows/validate.yml` and `.github/dependabot.yml` for this repository; `.editorconfig` and `.gitattributes`.
- Docs: the operational manual became a scenario router covering 17 kinds of task.

## 2.0.0: Stage 1, foundation audit and repair (2026-10-14)

The Phase 1 files were backed up to `.archive/phase1-original-2026-10-14.tar.gz` before any change.

### Defects found in Phase 1 and how they were fixed

| # | Defect | Impact | Fix |
| :- | :--- | :--- | :--- |
| 1 | `.agents/rules/*.md` had no `trigger` frontmatter | Antigravity silently discards rule files without it, so none of the rules loaded there | Every rule now declares `trigger` (`always_on` or `model_decision`) and a `description`; the validator enforces it |
| 2 | `CLAUDE.md` existed but did not import `AGENTS.md` | When a `CLAUDE.md` exists, Claude Code reads it instead of `AGENTS.md`, so Claude saw a four-line summary rather than the rules | `CLAUDE.md` now starts with `@AGENTS.md` |
| 3 | Links used `file:///Users/<user>/...` and `file:///.agents/...` | Broken on every other machine and on GitHub | Relative links throughout; the validator rejects `file:` links |
| 4 | Skills duplicated in a root `skills/` folder | No coding agent loads skills from there; two copies drift apart | `.agents/skills/` is the single source; `.claude/skills/` is generated by the sync script |
| 5 | `.cursorrules` and `.windsurfrules` repeated the rules | Both tools also read `AGENTS.md`, so instructions loaded twice; `.cursorrules` is the legacy Cursor format | Marked for removal; the validator warns while they exist |
| 6 | "Node 20+" baseline | Node.js 20 reached end of life on 2026-04-30 | Dated, sourced version baseline in rule 04 |
| 7 | Naming rule banned `ctx`, `req`, `res` | Contradicts idiomatic Go (`ctx context.Context`, `r *http.Request`), so the result would not read as native code | Naming now follows each language's idioms |
| 8 | Go generics example cited `constraints.Ordered` | That lives in `golang.org/x/exp`, not the standard library | `cmp.Ordered` (Go 1.21+) |
| 9 | Advised replacing `asyncio.get_event_loop()` with `asyncio.new_event_loop()` | Not the modern idiom | `asyncio.run()` at entry points, `asyncio.get_running_loop()` inside coroutines |
| 10 | `crypto.randomUUID()` described as "global in Node 16.7+" | The global `crypto` object is unflagged only from Node 19; `randomUUID` from `node:crypto` exists since 14.17 | Corrected with versions from the Node.js API docs |
| 11 | `lodash.flatten` mapped to `flat(Infinity)` | `flatten` is one level deep; `flattenDeep` is the infinite one | Both mappings listed correctly |
| 12 | `requestJson<T>` cast `response.json()` to `T` | Unchecked cast that contradicts the no-`any` rule | Removed; rule 05 requires validation at the boundary |
| 13 | `Result.fromThrowable` default used `e as E` and `as unknown as E` | Unsound casts in the type meant to make errors safe | Replaced with a sound `Result` type and a `toError` helper |
| 14 | Example HTTP server read unbounded request bodies and trusted `JSON.parse` output | Memory exhaustion (DoS) risk and unvalidated input | New template enforces a 16 KiB limit, content-type checks and typed validation |
| 15 | Example test imported `./server.js` from TypeScript run without a build step | Fails under Node's built-in type stripping | Template imports `./server.ts`; `tsconfig.json` enables `allowImportingTsExtensions` and `erasableSyntaxOnly` |
| 16 | Audit skill suggested bare `npx tsc` | Without local TypeScript, npx offers the npm package `tsc`, "a deprecated release of the TypeScript compiler" | Uses `npx --no-install tsc` |
| 17 | "Never use TODO / `pass` / `...`" applied literally | `pass` and `...` are legitimate syntax (Protocols, abstract methods, spread) | Rule judges intent; partial work must be stated, not hidden |
| 18 | Result type prescribed for every language | Unidiomatic in Python and most TypeScript; Go and Rust have native models | Rule 05 maps each language to its native error model |

### Added

- `scripts/agents-sync.mjs` with self-tests: syncs `.claude/skills/` and validates skills against the Agent Skills specification, rule triggers, size budgets, relative links and mirror drift.
- `.gemini/settings.json` so Gemini CLI loads `AGENTS.md` together with `GEMINI.md`.
- `.aider.conf.yml` so Aider loads `AGENTS.md`.
- Verified templates in `native-from-scratch/assets/`:
  - Node.js: 12 tests passing on Node 24.9; `tsc --noEmit` clean with TypeScript 7.0.2.
  - Python: 11 tests passing on Python 3.14; `mypy --strict` and Ruff clean, mccabe complexity ≤ 10.
- Rewritten `rigorous-code-audit` skill: commands per ecosystem, a checklist mapped to OWASP Top 10:2025, verification before reporting, and a severity-ranked report format.

### Completed cleanups

- Superseded Phase 1 draft files (`.agents/rules/00-index.md`, `01-core-philosophy.md`, `02-clean-code-invariants.md`, `03-anti-hallucination-verification.md`, `04-native-standard-first.md`, `05-defensive-error-handling.md`, `.cursorrules`, `.windsurfrules`, and root `skills/` mirror) were cleanly removed.
- Validated with `node scripts/agents-sync.mjs --check`: 2 skills checked, 0 errors, 0 warnings.

