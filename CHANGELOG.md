# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.4.0: complete documentation set and content-hygiene audit (2026-10-29)

### Added

- The complete product documentation set required by rule 16: 18 new documents in `docs/` (README index, AGENTS, CLAUDE, API, ASSETS, CODE_STYLE, CONFIGURATION, DATABASE, DEBUGGING, DEPLOYMENT, DESIGN, DESIGN_SYSTEM, DOCUMENTATION, INTEGRATIONS, OPERATIONS, PRIVACY, RULES, SCHEMA, SECURITY, TECHSTACKS, TESTING), each checked against the code; PRD and ARCHITECTURE now have every template section (user scenarios, goals and non-goals, success metrics, release plan, open questions; overview, containers, data flow, trust boundaries, quality attributes, known limitations). `check-docs.mjs docs` went from 38 problems to 0.
- CI: `check-docs.mjs docs`, and the content-hygiene scanner over code and documentation.

### Fixed

- `AGENTS.md` non-negotiable 11 had lost "including by rewriting a whole file or 'cleaning up' code that looks dead, duplicated or wrong" and "When in doubt, stop, ask and discuss first" in 1.3.0; both are restored. The always-on core stays within its budget (about 19,999 of 20,000 tokens) because the two index rows added in 1.3.0 are shorter.
- `content-hygiene` skill: its full text is restored (the scope that keeps AI disclosures, Content Credentials and copyright notices, and the private-metadata procedure). The scanner is formatted and split below the complexity limit, so `biome ci` passes again. Its tests now build invisible characters from code points: an automatic fix had turned the escapes into literal invisible and bidirectional characters in the test file, which the scanner itself caught. A literal byte-order mark in `apps/api/test/csv.test.ts` was replaced the same way.
- `ARCHITECTURE.md` described row-level security and a restricted database role as if they existed. "Known limitations" now states that immutability is enforced by triggers and that those controls are not built yet.
- `RULES.md`: in entities with approvals on, every new entry except a reversal waits for approval, not only entries from preparers.
- Root `SECURITY.md` said the repository runs no service and stores no user data; it now points to the finance apps' security and privacy documents.
- README: 18 rules and 61 skills; the content-hygiene skill in the catalog.

## 1.3.0: enterprise finance system with complete engineering and design rules, text hygiene, and AI marks removal (2026-10-29)

### Added

- Initial complete release of Projects 27 combining backend engineering rules from Projects 23 with digital design, accessibility, and front-end rules from Projects 24.
- Rule 18 (`18-text-hygiene-and-provenance.md`): text hygiene, Unicode cleaning, and provenance marks removal.
- Skills `clean-user-facing-text` and `remove-ai-marks`: comprehensive zero-dependency Unicode cleaning scripts and multi-vendor AI watermark removal service stack.
- Skill `content-hygiene`: a zero-dependency scanner for invisible and bidirectional Unicode (`assets/unicode-hygiene.mjs`, 5 tests, run in CI) and a procedure for stripping private metadata (GPS, serial numbers, owner names) while keeping AI disclosures, Content Credentials and copyright notices.
- Full set of 61 agent skills synchronized to `.claude/skills/`.
- Complete financial reporting architecture, API endpoints, evaluation suites, and offline data storage.

## Unreleased: spec sync with Projects 23 2.19.0 and Projects 24 1.13.0 (CLI first, small output)

### Added

- `scripts/run-quiet.mjs` and its 5 tests (root script tests 49 → 54), `npm run verify` (spec check, Biome and the script tests, one line per step), the installer entry, the `verify` step in `project-bootstrap`, the "Run and verify economically" prompt, the `CLAUDE.md` note on running things through the Bash tool, and the README, configuration, rules, tech-stack and testing lines. The upstream history entries are copied into this changelog and `docs/spec/engineering/CHANGELOG.md`.

### Not done yet

- The always-on text (Projects 24 non-negotiable 14 and the rule 15 section 2 bullets) is about 540 tokens, and the always-on core is at 19,946 of its 20,000-token budget. It waits for the owner to choose what to trim or move.

## Unreleased: capture evaluation, recording indicator, offline device copy

### Added

- Evaluation of speech recognition and form filling ([docs/EVALUATION.md](docs/EVALUATION.md)). It uses a labelled corpus of 120 Indonesian sentences, split into 60 dev and 60 held-out test (`apps/api/eval/capture-cases.json`), and pass thresholds set before the first run (`eval/gates.json`). Metrics: WER and CER, raw and with number normalisation; per-field accuracy, precision, recall and silently-wrong rate; exact form match; 95% Wilson intervals; real-time factor. `eval/run-capture.ts` scores text to form. `eval/run-asr.ts` scores speech to text to form with Apple's on-device dictation model (`eval/asr-transcribe`), on synthetic Indonesian speech (clean, fast, and noise at 10 dB and 0 dB SNR) or on human recordings. `npm test` checks the gates on the test split.
- Real-use quality. Migration `002_capture_quality.sql` records each automatic fill (method, model, fields filled, latency; never the sentence). After Simpan, the web, Android and iOS apps send `POST .../capture/{draftId}/review` with the fields the person changed. `GET .../capture/quality` returns the share saved without correction and the share of each field kept, with Wilson intervals, overall and per method; the Catat screen on all three apps shows it. `parseCapture` now returns `draftId`. Contract version 0.4.0, 30 operations.
- A visible recording sign on all three apps: a red dot, "Merekam", a timer and (Android, iOS) the input level, plus "Menyalakan mikrofon…" until audio actually flows.
- Offline device copy on all three apps. Every GET answer is kept on the device: IndexedDB on the web, SQLite (`sqflite` 2.4.4+2) on Android, and SQLite through the system library on iOS. When the API or hosting is down, screens show the saved copy with a notice of when it was saved. Transactions saved while offline wait in an outbox and are sent oldest first when the server is back (on start, every 30 seconds, when the browser comes online, or with "Kirim sekarang"). Each keeps its idempotency key, so it is posted once even if a response was lost. Server refusals stay visible with the reason. Signing out clears the copy, and asks first when transactions are still waiting. On the web, a service worker in production builds keeps the app itself, so it opens without the hosting.

### Fixed

- Safari: speech was heard (the words showed on screen) but the form reported "Tidak ada kalimat yang terdengar", because Safari can end recognition without marking a result final. The latest transcript is now used whether or not it is final. Recognition stops after 2.5 seconds without new words, after 8 seconds without any word, or after 30 seconds. Android keeps partial words in the same way when recognition ends without a final result.
- Parser, from evaluation failures: compound amounts ("2 juta 500 ribu" was read as 2,000,000); "internet banking" read as an internet bill; more banks (Danamon, CIMB, Permata, BTN, OCBC, Maybank, Panin, Jenius, blu, Livin, BRImo); vehicle words; "gajian", "dikasih"; the most specific keyword wins; own accounts are no longer named as the counterparty; "kirim uang ke X" names the payee; names keep the speaker's capitals; a spelled-number boundary bug ("bayar sekolah lima ratus ribu" read no amount); recogniser artefacts "18003 hari lalu" (an amount and a day count run together) and "tanggal lima".
- Android and iOS: after saving an automatically filled income, the next entry kept the type Pemasukan and was saved as income. The form now starts fresh after Simpan, as on the web. Found by the Android emulator test.

## Unreleased: voice capture on web, Android and iOS

### Added

- `POST /v1/entities/{id}/capture/parse`: an Indonesian sentence (spoken or typed) becomes an unsaved transaction draft: type, amount, date, category, funding account, description and counterparty. A rule-based Indonesian parser (`capture-rules.ts`: "35 ribu", "1,5 juta", "1.250.000,50", spelled-out numbers, kemarin, tanggal 25, 1 oktober, GoPay, BCA, tarik tunai, top up, and more) always runs; with `ANTHROPIC_API_KEY` set, Claude (`claude-opus-5-5`, strict tool use, effort low, server-side refusal fallback) proposes the fields and each one is validated and replaced by the rules when invalid. Nothing is posted; the audit trail records only the method used. Rate-limited to 30 per user per minute. Contract version 0.3.0.
- Web: **Bicara** on the Catat page (Web Speech API, `id-ID`, stops when the speaker pauses) and a typed-sentence field; the form is filled, focus moves to Simpan or to the missing amount, and saving still needs Simpan. Clear messages for denied microphones, silence and unsupported browsers.
- Android: **Bicara** with `speech_to_text` 7.5.0 (Indonesian dictation, 3-second pause), typed sentence, date picker and counterparty field; `RECORD_AUDIO` permission and the speech-service query.
- iOS: the SwiftUI app `apps/ios/Keuangan` (XcodeGen 2.46.0 project): sign-in with the token in the Keychain, dashboard with Swift Charts, capture with **Bicara** (Apple Speech in `id-ID`, on-device when supported, stops after 2 seconds of silence), journal; `KeuanganCore` gained `parseCapture`.
- Bugs found by the device tests and fixed: on iOS the screen stayed on sign-in after a successful sign-in, because `signedIn` read the unobserved token first and short-circuited, so SwiftUI never observed the session (`signedIn` now reads only observed state); unsigned simulator builds could not use the Keychain (simulator builds are now signed to run locally with the app's Keychain group); on Android the voice card pushes the form down, so the emulator test scrolls and closes the keyboard first.
- Tests: 51 API tests (rule parser golden sentences, validation of model output with a fake model, failure fallback, permissions, audit); 18 web end-to-end tests with a simulated recogniser; 6 Flutter tests and an emulator integration test of typed capture against the API; `keuangan-check` round trip including capture; an XCUITest of voice capture on the iOS 27.1 simulator against the API.

## Unreleased: stage 4, mobile apps

### Added

- `apps/android`, the Android app (Flutter 3.47.8, Dart 3.13.7): sign-in as a native client with the token in the Android Keystore (`flutter_secure_storage` 11.2.0), dashboard with a trend chart that TalkBack reads in full, capture with idempotency keys, journal. Release builds HTTPS-only with backups off; debug builds allow HTTP to the emulator host only.
- Tests: 5 Flutter tests (money, the client against a fake transport, the shared fixture, a widget test with Flutter's text-contrast and Android tap-target guidelines) and `tool/live_check.dart`, which posted the 14-entry shared ledger through the Dart client to a running API and matched the October recap exactly.

- Android: debug APK built; `integration_test/app_test.dart` passed on an Android 36 (arm64) emulator against the real API: sign-up, capture of Rp 35.000, the dashboard, the journal and sign-out. It found and fixed a real bug: `setState` closures that returned a `Future` after sign-in and reload.
- `apps/ios/KeuanganCore`: Swift package with `Money`, contract models, `APIClient` and a Keychain `TokenStore`; `keuangan-check` passed every money check and a live round trip of the shared ledger and the Keychain.

### Not done yet

- The SwiftUI app and host `flutter test` wait for the owner to accept the Xcode licence (`sudo xcodebuild -license accept`).

## Projects 27 1.2.0: web app, imports and Excel exports (2026-10-28)

### Added

- `apps/web`, the web app (React 19.3.1, Vite 8.3.5) in Indonesian: dashboard (month figures, 12-month trend chart with legend and data table, spending per category, balances), capture, journal with reversal, reports with self-checks, month close with hashed snapshots, Excel downloads, CSV and XLSX import with guessed column mapping, preview, per-row errors and duplicate detection, and two-factor setup. No UI or chart library.
- API: `monthly-trend` report; `POST .../imports/inspect`, `.../imports/preview` and `.../imports/commit` (CSV per RFC 4180 with delimiter detection, XLSX with Excel date serials, Indonesian and international number formats, DB/CR types, a stable idempotency key per row so re-imports post nothing twice); `GET .../reports/{kind}/xlsx` and `GET .../periods/{year}/{month}/snapshots/{snapshotId}/xlsx` (a Verifikasi sheet carries the SHA-256 hash). ZIP and XLSX are written and read with `node:zlib` only, bounded against zip bombs; amounts beyond Excel's 15 significant digits are written as text so they stay exact.
- Tests: 41 API tests (CSV, XLSX read of an openpyxl 3.1.5 file and own round trip, imports, exports, trend, contract conformance of 27 operations); 5 web unit tests; 12 Playwright end-to-end tests on desktop and mobile with axe-core in light and dark themes, 320-pixel reflow and the keyboard skip link. CI job for the web app with a PostgreSQL 18.6 service; Dependabot entry.

### Changed

- `Intl.NumberFormat` rounds IDR to whole rupiah by default (`id-ID`), so the web app always formats the API's decimal strings with explicit fraction digits; checked with Node.js 24.22.1 and the MDN description of string input.
- Biome now also checks `apps/web`; `noNoninteractiveTabindex` is off for `TableWrap.tsx` only, approved by the owner, because a scrollable table region must be keyboard-focusable (WCAG 2.1.1).
- Roadmap: stage 3 done; stage 4 toolchain status recorded (Android ready; Xcode needs the owner's administrator password).

## Projects 27 1.1.0: core API for the web, iOS and Android clients (2026-10-28)

### Added

- `apps/api`, the core API on Node.js 24 (standard library plus `pg` 8.23.1) and PostgreSQL 18: database-enforced balanced entries, immutable lines and posted entries, closed periods and an append-only, SHA-256 hash-chained audit trail; exact money as `bigint` minor units with decimal strings on the wire; registration that creates a personal IDR entity with a personal chart of accounts; Argon2id passwords (OWASP minimum), optional TOTP two-factor with an AES-256-GCM encrypted seed and replay protection, revocable cookie sessions for the web and bearer tokens for native apps; transactions, journal entries, maker-checker approval, reversals; monthly recap, trial balance, income statement and balance sheet with self-checks; period close with hashed report snapshots; audit-chain verification; RFC 9457 errors, security headers, CORS for configured origins, Origin checks on cookie writes, rate-limited sign-in.
- `packages/contract`: the OpenAPI 3.1 contract of all 22 operations and a shared sample ledger whose expected reports were computed independently with Python decimal arithmetic.
- 27 API tests (unit, integration against PostgreSQL, contract conformance), a CI job with a digest-pinned PostgreSQL 18.6 service on Node.js 24 and 26, the API in Biome and the clean-code ESLint, and a Dependabot entry.

### Changed

- Owner decisions recorded in `docs/PRD.md` section 8 (personal IDR entity; web, Swift iOS and Dart Android clients on one API; sign-in; imports, dashboards and Excel export; recap delivery); roadmap extended to seven stages; rule 17 states how maker-checker applies to personal entities.

## Projects 27 1.0.0: merged specification and finance product foundation (2026-10-28)

Projects 27 starts from Projects 24 version 1.12.0 and adds everything from Projects 23 version 2.18.0. The history of Projects 24 continues below; the history of Projects 23 is in [docs/spec/engineering/CHANGELOG.md](docs/spec/engineering/CHANGELOG.md).

### Added

- The 20 skills that existed only in Projects 23 (ai-agent-systems, anti-slop, api-integration, backend-engineering, chaos-engineering, cloud-infrastructure, computer-vision, data-analysis, data-engineering, feature-specification, it-operations, llm-applications, machine-learning, ml-inference-serving, quality-assurance, rag-systems, software-architecture, technical-documentation, technology-adoption, web-frontend-engineering) with their templates, `scripts/tech-lookup.mjs` and `scripts/check-updates.mjs` with tests, `tools/` (clean-code ESLint and CI tool pins), the CodeQL workflow, `.agents/domain-coverage.md` and `.agents/engineering-concepts.md`, and the Projects 23 documentation under `docs/spec/engineering/`.
- Rule 17, financial integrity, and the skill finance-reporting-systems with references for Indonesian regulations (PMK 131/2024 VAT, UU KUP retention, PSAK numbering and PSAK 118, SAK EP, UU 27/2022) and for AI and speech design; non-negotiable 14 in `AGENTS.md`.
- Product documents: `docs/PRD.md`, `docs/RESEARCH.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`.
- Validate workflow jobs from Projects 23 (ML, integration kit, chaos kit, MCP Toolbox example, clean-code lint, guardrail hook and documentation checker tests) and the matching Dependabot entries.

### Changed

- Shared rules and skills merged so no content from either source is lost: rule 15 now includes the Projects 23 proposal format for existing code, self-review rounds and the handoff note; rule 06 the public-exposure table and security testing sections; rule 01 a section on correcting one's own thinking; rule 03 the tech-lookup source; rule 04 MCP pinning; rule 08 the AI-disclosure, discard-protection, pull-request and trunk-based lines. Skills native-from-scratch, test-engineering, deploy-and-release, rigorous-code-audit, security-hardening and systematic-debugging use the more detailed Projects 23 versions with the Projects 24 additions; ci-cd-pipeline and project-bootstrap use the Projects 24 versions with the Projects 23 additions.
- Projects 24 documentation moved to `docs/spec/`; links updated. `AGENTS.md` indexes all 17 rules and 58 skills and fills in the project profile.
- Projects 23 scripts and templates formatted with Biome, the formatter of this repository.

### Fixed

- Rule 04 section 9 numbered two steps "8"; the last is now 9.
- `scripts/audit-lockfiles.mjs` keeps the original error as `cause` when `npm audit` fails, as required by the Projects 23 clean-code lint that now also runs on Projects 24 scripts.

## 1.13.0: CLI first, small output (2026-10-28)

### Added

- Non-negotiable 14 in `AGENTS.md`: processes (installs, builds, tests, linters, servers, git, deploys) run through the terminal with the project's own scripts, not step by step through chat, a browser or MCP tools, and agents read summaries and exit codes instead of whole logs, because every line read costs tokens.
- Rule 15 section 2, run processes through the CLI economically: one summarising `verify` command, quiet and summary modes checked against each tool's `--help` (`npm ci --no-audit --no-fund`, `node --test --test-reporter=dot`, `biome ci --reporter=summary`, `playwright test --reporter=line`, `pytest -q`, `ruff check --output-format concise`, `git status --short`), long output written to a file with only the failing part read, long-running processes in the background and stopped afterwards, no re-running what passed, and browser or MCP tools only for what a command cannot show.
- `scripts/run-quiet.mjs` (Node.js 22+, no dependencies): runs a command or several npm scripts, prints `PASS <step> (<seconds>s)` or `FAIL` with the last lines and the full log path, counts real warning lines, and exits with the first failing code. 5 tests (script tests 36 → 41). On this repository's `npm test` the output fell from 3,373 to 132 bytes. The installer copies it.
- `npm run verify`: the spec checks, Biome and the script tests in one command with one line per step. `project-bootstrap` adds a `verify` script to new projects; `CLAUDE.md` notes the Bash tool's background option for servers; prompt library: "Run and verify economically".

## 1.12.0: plan first, blind spots and the chaos engineering cycle (2026-10-28)

### Added

- Non-negotiable 13 in `AGENTS.md`, plan first and act only after approval: before any change (files, commands that write, installs, migrations, commits, pushes, deploys, publishing) the agent presents an implementation plan and waits for the user's explicit approval; reading and read-only checks need none, and nothing outside the approved plan is done on the agent's own initiative.
- Rule 15 section 1: the implementation plan format (goal and its measurable check, context, assumptions and questions, steps with their checks, blind spots, risks, rollback) for every change, small ones included, and the approval gate.
- `.claude/settings.json` sets `permissions.defaultMode` to `plan`, so Claude Code terminal sessions start in plan mode and edits stay blocked until the plan is approved (checked against the Claude Code settings and permission-mode documentation on 2026-10-28). `CLAUDE.md` notes that the VS Code extension needs `claudeCode.initialPermissionMode` in VS Code's user settings.
- Rule 03 section 6, blind spots, cross-checks and objective validation: a blind-spot pass before delivery, every fact the user relies on cross-checked against two independent sources, current and actively maintained standards and tools (registries, release notes, endoflife.date), and success judged only by measured evidence defined before the work.
- Skill `resilience-and-chaos-engineering` section 5 is now the six-step cycle: define the steady state, state the failure hypothesis, create the chaos safely (blast radius, abort conditions), observe against the expectation, evaluate (held or disproved, root cause, impact), and plan, implement and re-test the improvement; new `references/experiment-record.md` template. Rule 07 and `AGENTS.md` step 5 point to it.
- Prompt library: "Plan first, then wait" and "Chaos experiment".

## 1.11.0: only the human author is credited (2026-10-26)

### Added

- Non-negotiable 12 in `AGENTS.md`: commits, tags, releases and pull requests carry only the repository owner's Git identity; no `Co-Authored-By`, sign-off or similar trailer, "Generated with" line, or author, committer or bot identity that credits an AI agent, so no AI agent appears among the contributors. GitHub lists co-authors as contributors, which is how one trailer made an AI agent appear on this repository.
- `scripts/check-authorship.mjs` (Node.js 22+, no dependencies): fails when any commit has an AI author or committer, an AI co-author, sign-off or similar trailer, or a "Generated with <AI tool>" line; topics that merely name an AI tool, human co-authors and Dependabot are not flagged. 6 tests (script tests 30 → 36). New `Authorship` CI job runs it on the full history; the installer now copies it into projects.

### Changed

- Rule 08: owner-only authorship (section 2), how to remove an attribution that was already pushed with the tree kept identical and the owner's approval (section 3), and no AI attribution in pull requests or release notes (section 4).
- Skills `change-existing-code`, `ci-cd-pipeline`, `project-bootstrap` and `project-documentation` point to the rule at the step where commits, release automation, the first commit or release notes are written.

### Fixed

- The v1.10.0 commit carried a `Co-Authored-By` trailer for an AI agent; its message was amended with the tree unchanged.

## 1.10.0: the complete project documentation set (2026-10-23)

### Added

- Rule 16, project documentation (on demand): every project keeps a complete `docs/` set of 23 documents (`README`, `AGENTS`, `CLAUDE`, `PRD`, `GLOSSARY`, `ARCHITECTURE`, `TECHSTACKS`, `CODE_STYLE`, `RULES`, `DESIGN`, `DESIGN_SYSTEM`, `ASSETS`, `ACCESSIBILITY`, `PERFORMANCE`, `API`, `DATABASE`, `SCHEMA`, `SECURITY`, `PRIVACY`, `TESTING`, `DEBUGGING`, `DEPLOYMENT`, `DOCUMENTATION`) plus `docs/adr/`, and adds `ANALYTICS`, `I18N`, `SEO` and `RUNBOOK` when the project collects analytics, is localised, has public pages or runs services; documents that do not apply say so with a reason; every document has an owner, a review date and a status, is filled from real sources, and changes with the work.
- Skill `project-documentation` with the docs kit: 27 templates whose sections say what each must answer, and `check-docs.mjs` (Node.js 22+, no dependencies), which fails on missing documents, missing or empty sections, too little content, leftover template guidance, filler text, missing or future review dates and broken relative links, and warns on drafts, stale reviews (180 days by default) and TBD or TODO markers (`--strict` makes warnings fail); optional documents are checked only when present. 13 tests, including one that keeps every template in step with the checker; a new CI step runs them.

### Changed

- Project bootstrap: `CHANGELOG.md`, the linter config, community health files (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`) for shared repositories, the documentation set and a JavaScript monorepo layout (`apps/`, `packages/`, `scripts/`, `docs/`).
- AGENTS.md: rule 16 and the skill in the indexes; the definition of done includes updated docs. CLAUDE.md lists rule 16 among the on-demand rules. README, architecture, operational manual and prompt library updated; 37 skills and 16 rules.

## 1.9.0: anti-slop filter for UI, copy and code comments (2026-10-23)

Adapted from [antislop](https://github.com/miqdadbadjuber/anti-slop) by Miqdad Badjuber (MIT, version 3.2.21, commit `69416cf`), reviewed on 2026-10-23.

### Added

- Skill `anti-slop-filter`: a filter, not a style guide. Two modes (during a build, or an audit of existing work whose fixes need the user's approval); direction from the brand guide, tokens or a `DESIGN.md` file, treated as data, with "draft without direction" when none exists; a one-line Design Read with three dials (energy, rhythm, motion) and liveliness levers; hard gates for honest content, honest asset placeholders, working controls and navigation, UI states, contrast over the whole area text crosses, keyboard use, mobile, every shipped theme, features built in source rather than patched by scripts, relevant FAQs, and a recorded click-through; a purpose gate requiring a one-line reason for each visual technique; quality locks; and a PASS/FAIL delivery report with evidence.
- References: UI slop patterns (visual and colour, layout, decoration, apps and dashboards, motion, identity), writing patterns (tone, rhythm, honesty, formatting, what not to flag, signs of a human writer) and code-comment patterns (with the comments that must stay).

### Changed

- Rule 09 section 7: every visual technique needs a written reason, and nothing is shown without a real source. Rule 14 section 1: write like a person (links the writing patterns). Rule 02 section 6: plain, short comments (links the comment patterns).
- UI design, design critique and AI design skills, the operational manual, prompt library, reference library and README link to the filter; 36 skills. The README's skills row, which still said 34 after 1.7.0, now gives the right count.

### Not adopted, on purpose

- The source states the WCAG large-text threshold as 18 px; WCAG defines it as 18 point (about 24 px) or 14 point bold (about 18.66 px), which rule 10 already uses.
- Its absolute ban on em dashes became a default for agent-written copy with a brand-voice override; its `// TODO` placeholder for unbuilt controls became a visible "Coming soon" label plus a "Not done" line in the report, because rule 01 forbids TODO placeholders in finished work.
- The installer, plugins, saved usage-mode settings and the bundled contrast scripts were not copied; contrast is measured with axe-core and the tools in rule 10.

## 1.8.0: always-current dependencies, tools and patches (2026-10-22)

Every fact below was checked against its primary source on 2026-10-22.

### Added

- **Always current**: Dependabot now checks every ecosystem daily (npm, GitHub Actions, Docker, and the CI's pip tools, which moved to `.github/ci-tools/requirements.txt` so Dependabot can update them); version updates keep the 7-day cooldown that zizmor's `dependabot-cooldown` audit requires, while security updates are raised at once. A `dependabot-auto-merge` workflow (`dependabot/fetch-metadata` v3.1.0) turns on auto-merge for patch and minor updates, but only when the base branch requires status checks, so nothing merges untested; majors wait for a person. A daily `freshness` workflow runs `scripts/check-freshness.mjs` (pins Dependabot cannot see: gitleaks, the Python template's mypy, Ruff and pip-audit, and the Node.js and Python versions tested in CI against endoflife.date) and `scripts/audit-lockfiles.mjs` (npm audit of every lockfile, failing on high or critical advisories unless accepted in `.github/accepted-advisories.json` with an expiry date) plus `pip-audit`. 6 new tests (script tests 24 → 30). Rule 04 adds "stay current continuously"; the ci-cd-pipeline templates gained daily Dependabot and the auto-merge workflow.
- Python 3.15 (3.15.1 is available to `setup-python`) added to the CI matrix and the `ci-python.yml` template; the Python template passed Ruff, mypy, its tests and pip-audit on Python 3.15.0 locally.

### Changed

- `.github/dependabot.yml` and the ci-cd-pipeline template: weekly checks became daily. The 7-day cooldown on version updates stays, because a shorter one fails zizmor's `dependabot-cooldown` audit and removes the window in which compromised releases are usually caught.
- SECURITY.md: the dependency controls and a maintainer checklist item for "Allow auto-merge". CONTRIBUTING: what to do when the freshness workflow fails.

## 1.7.0: media production, Claude Design, MCP, security audits, safer changes and releases (2026-10-22)

Every fact below was checked against its primary source between 2026-10-17 and 2026-10-22; where only a secondary source was available, the reference says so.

### Added

- Skill `video-editing-and-post-production`: brief and deliverables, the workflow from checksum-verified ingest to archive (proxies, picture lock, interchange with AAF, XML, EDL and OpenTimelineIO), editing craft, frame rates, drop-frame timecode and SMPTE ST 2046-1 safe areas, loudness per deliverable (EBU R 128 v5.0, ATSC A/85:2026-07, AES TD1004, Netflix, Spotify), captions, subtitles and audio description (WebVTT, IMSC, Netflix English style guide), masters and platform files (YouTube's recommended upload settings), technical QC, video on the web (markup, hero video, HLS and DASH, accessible players, CSP and privacy) and video in code (Remotion licence terms, Motion Canvas, WebCodecs, Mediabunny, FFmpeg.wasm), with Baseline status from web-features 3.43.0. References cover codecs and containers, loudness, platform specifications, streaming, interchange and applications (Premiere Rush's discontinuation noted).
- Template `web-media-pipeline` (TypeScript, Node.js 22.18 or later, sharp 0.35.5, FFmpeg): `encodeForWeb` writes H.264 High MP4 (yuv420p, BT.709 tags set in the filter graph, faststart) with two-pass `loudnorm` normalisation, an optional SVT-AV1 and Opus WebM, and a poster; FFmpeg runs through `execFile` without a shell, and paths that FFmpeg would read as options or protocols are refused. `exportResponsiveImages` writes AVIF, WebP and JPEG widths without upscaling, honours EXIF orientation, converts to sRGB with an embedded profile and removes EXIF, GPS, serial numbers and XMP. Eight tests measure every property on generated files (ffprobe, an independent FFmpeg `ebur128` measurement within 1 LU of the target and at most -1 dBTP true peak, sharp metadata and raw bytes).
- Skill `color-grading-and-color-management`: choosing the pipeline (ACES 2.0, released April 2025; OpenColorIO 2.5 built-in ACES 2.0 configs and OCIO 2.6 of 1 October 2026 with SMPTE ST 2136-1 CLF; application colour management), reference monitors and viewing environments (BT.1886, BT.2100, BT.2408 203 cd/m² reference white), scopes, correction before grading, LUTs, CLF and ASC CDL, HDR deliverables (PQ, HLG, HDR10, HDR10+, Dolby Vision) and colour on the web. References list standards, camera log formats, exchange formats and tools.
- Skill `photo-editing-and-retouching`: rights and editorial ethics (NPPA), a non-destructive RAW-to-archive workflow, retouching craft (skin, product, compositing, background removal, batch work), disclosure rules (EU AI Act Article 50 from 2 August 2026, France's "photographie retouchée" since 1 October 2017, Norway's label since 1 July 2022, UK ASA rulings on beauty filters), export per use, metadata and privacy, and Content Credentials (C2PA 2.4, c2patool, c2pa-rs, c2pa-js), including the warning that removing metadata also removes the C2PA manifest. Tools listed with dated facts (GIMP 3.0, darktable 5.6.2, Affinity free since October 2025, Apple's acquisition of Pixelmator).
- Skill `motion-graphics-and-animation`: briefs, storyboards and animatics, the twelve principles of animation, easing and timing, kinetic typography, project hygiene and exports (ProRes 4444, image sequences, Lottie, dotLottie, Rive, video with alpha), flash and pattern safety (WCAG 2.2 SC 2.3.1 thresholds, Ofcom and ASA requirements, the UK Online Safety Act offence, PEAT and Harding FPA), reduced motion, and safe use of animation runtimes on the web (pinned versions after the October 2024 `@lottiefiles/lottie-player` compromise; the full lottie-web build uses `eval` for expressions, the light builds do not, checked in the 5.13.0 package).
- Skill `ai-design-and-artifacts`: Claude Design (launched 17 April 2026; in any conversation since 16 September 2026; the standalone claude.ai/design closes on 14 December 2026) and Claude artifacts for design work: where it runs and on which plans, setting up the design system first (GitHub repository, design files, uploads, `/design-sync` for React design systems), briefing and iterating, reviewing AI-generated designs against tokens, measured contrast, licences and the AI-design tells, handing off with the bundle or `/design` without overwriting existing code, and sharing and publishing safely (artifact page constraints, public links, untrusted content). The skill name avoids the reserved word "claude". References record each fact with its date and Anthropic source. Related skills (design-to-code handoff, design system, design tools), CLAUDE.md, the tools catalog, reference library, prompt library and operational manual link to it.
- **Never delete existing work without approval**: new non-negotiable 11 in AGENTS.md and section 8 of rule 01. Removing, overwriting or replacing existing code, files, tests, comments, styles, configuration, assets, design layers or features, and Git commands that discard work, need the user's explicit approval after the agent shows what would go, why and the alternatives; anything beyond the request is discussed first. The definition of done and the report (`Removed:` line) record removals.
- Deletion guard for Claude Code: `.claude/settings.json` with `permissions.ask` rules for deletion commands and a PreToolUse hook, `scripts/hooks/guard-deletions.mjs`, that turns deletion commands, edits that delete text or remove three or more lines net, and file rewrites that drop existing lines into a confirmation prompt (it never blocks, and asks when its input cannot be read). Validated against the official settings schema; 9 tests, including the hook run as Claude Code runs it. The installer ships both files.
- Validator: skill names must not contain the reserved words "anthropic" or "claude", which Claude's Agent Skills reject (script tests 15 → 24 with the hook tests).
- Skill `mcp-servers-and-integrations`: when a server is worth it, finding servers (vendor documentation first; the MCP Registry, punkpeye/awesome-mcp-servers, wong2/awesome-mcp-servers and Glama for discovery only), vetting (publisher, licence, activity, archived or deprecated servers, every exposed tool, tool poisoning, re-review on update, MCP Inspector), configuring (pinned versions, `${VAR}` secrets in `.mcp.json`, project-scope approval and its absence in headless and CI runs, managed allow and deny lists), least privilege and the lethal trifecta, databases with Google's MCP Toolbox for Databases v1.14.0 (prebuilt and custom tools, `${ENV}` credentials, `readOnly: true` sources, dedicated SELECT-only identities, no dynamic SQL with write access, `authServices`), and building a server with the official SDK. The catalogue lists 24 vendor-official or reference servers and tools for design and front-end work with versions and licences checked on 2026-10-22 (Figma, Penpot, Storybook `@storybook/addon-mcp`, shadcn/ui, Playwright, Chrome DevTools, Context7, GitHub, Vercel, Netlify, Cloudflare, Sentry, Contentful, Sanity, Webflow, Shopify, Stripe, MCP Toolbox, Supabase, Notion, Atlassian, the Inspector, reference servers and the SDK), and labels community servers from the lists as not reviewed. Rules 04 and 06 (lethal trifecta, headless `.mcp.json` loading, read-only database identities), the web-integrations skill, the Figma platform reference, tools catalog, reference library, engineering concepts map, prompt library and operational manual link to it.
- Karpathy-inspired guidelines ([andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills), MIT), adapted rather than copied: rule 01 now asks agents to state assumptions, name competing interpretations, push back and stop when confused; to make surgical changes where every changed line traces to the request; and to avoid speculative flexibility and oversized solutions. Rule 15 adds goal-driven execution (`step -> verify: check`, tests first for bugs). The specification stays stricter on one point: existing code a change made unused is proposed for removal, not removed.
- Systematic debugging section 7, "correct the thinking, not only the code": when a fix fails or the user says the answer is wrong, stop, undo the unproven change, list the assumptions, find the false one with evidence, re-plan, confirm the user's correction before acting, and report what was wrong. Change-existing-code adds surgical changes; the code audit checks that changed lines trace to the request and that the solution is proportionate.
- Skill `security-vulnerability-audit`, adapted from Cloudflare's [security-audit skill](https://github.com/cloudflare/security-audit-skill) (MIT, reviewed at commit `c1c8a8c`): guidance mode by default and full audit mode only on request; safe execution (source review, sandboxed local tests without network, dummy principals, no probing of deployed or production systems, no source changes without approval); a map and coverage ledger before hunting; a six-part finding contract (principal, input, control, boundary, affected resource, observed result); validation by a different agent; `confirmed`, `needs_validation` (no severity) and `rejected` verdicts; impact-based severity anchors with CVSS v4.0 as an option; the smallest fix at the last trusted decision point with a regression test; and audit anti-patterns. The reference lists front-end attack classes with what a real finding needs and how to prevent it: DOM XSS, DOM clobbering, prototype pollution, `postMessage`, cross-site WebSocket, credentialed CORS, service-worker scope and cache, browser storage, XS-Leaks, opener state, clickjacking, open redirects, CSRF, sessions and cookies, JWT/OAuth/OIDC, passkeys, cache poisoning and deception, host headers, supply chain and CI, AI output rendering, agents and MCP, data isolation, resource exhaustion, edge and hosting, and business logic.
- Security hardening: a client-side row (Trusted Types, exact `postMessage` origins, no secrets in client environment variables, SRI, no private responses in service-worker caches) and a link to the audit skill. Rule 06 section 8: security testing stays local. The code audit separates vulnerabilities from hardening notes. SECURITY.md lists the deletion guard, the audit method and the release workflow's single write permission.
- GitHub releases: a `release` workflow publishes a release from `.github/releases/<tag>.md` when a version tag is pushed, or for an existing tag on demand, and marks only the highest version as latest; release notes for v1.5.0, v1.6.0 and v1.7.0.
- CI job `web-media-template` (Node.js 22, 24 and 26) that installs FFmpeg and runs the template's type check, tests and `npm audit`; Dependabot watches the template.
- Operational manual: four media scenarios. Prompt library: video, colour, photo and motion prompts. Tools catalog: video, colour, photo, motion, audio and encoding rows. Reference library: section 27, photo, video, colour and motion production.

### Changed

- Corrected the security-hardening skill, which still pointed to the OWASP Top 10 for LLM Applications 2025: it now links the 2026 edition already used by rule 06 and SECURITY.md, plus the OWASP Top 10 for Agentic Applications 2026.

- Rule 13 now covers photography, video, audio and motion: licences for music, effects and stock footage, and a new section on honest media, provenance and metadata. Rule 10 links caption review, audio description and flash testing to the new skills.
- `graphic-design-production` and `motion-and-interaction` link to the new skills. README, architecture and AGENTS.md skill index list 35 skills; the always-on context is about 16,000 tokens (Antigravity's budget is 20,000).
- Existing guidance that told agents to remove code now asks for approval first: commented-out and dead code (rule 02), leftovers (rule 15 now limits clean-up to what the agent added), unused dependencies and CSS (rule 12, web performance skill), and code made unused or replaced by a strangler-fig migration (change-existing-code, which also lists deletion as a reason to stop and ask).

## 1.6.0: engineering concepts and chaos engineering (2026-10-16)

### Added

- Skill `resilience-and-chaos-engineering`: the Principles of Chaos Engineering (steady state, hypothesis, real-world events, disprove, automation, minimal blast radius), a catalogue of front-end failure modes with expected behaviour, resilience patterns for user interfaces (progressive enhancement, timeouts, retries with backoff and jitter, circuit breakers, error boundaries, fallbacks, kill switches), SLIs, SLOs and error budgets from real-user data, an experiment procedure, and rules for production game days (approval, abort conditions, minimal blast radius). References list fault-injection tools with current versions (Toxiproxy v2.13.0, Chaos Toolkit 1.21.4, LitmusChaos 3.33.0 and Chaos Mesh v2.8.5, both CNCF Incubating) and managed services.
- Template `browser-chaos`: six experiments (control, scripts unavailable, stylesheet unavailable, 1.5 s delay on every response, storage blocked, offline after load) with a user-visible steady state; faults are injected only in the test browser. Tests prove it can fail: a deliberately fragile fixture page is caught on blocked storage and missing JavaScript. The starter site holds all six hypotheses. Runs in CI after the accessibility scan; Dependabot covers it.
- `docs/ENGINEERING-CONCEPTS.md`: the 18 knowledge areas of the SWEBOK Guide V4.0, the nine ISO/IEC 25010:2023 quality characteristics, design principles (KISS, YAGNI, DRY, SOLID, separation of concerns, the robustness principle with RFC 9413's caution), architecture (rendering strategies, micro-frontends, BFF, hexagonal, DDD, C4, arc42, ADRs, twelve-factor), delivery (DORA's five metrics, trunk-based development, platform engineering, FinOps), testing, SRE and chaos engineering, security (CISA Secure by Design, NIST SSDF, OWASP SAMM, STRIDE, SLSA), human-centred, sustainability (SCI, ISO/IEC 21031:2024) and AI-assisted engineering, each mapped to the rule or skill that applies it. Linked from `AGENTS.md`, shipped by the installer.
- Operational manual: two scenarios (chaos and resilience; "which engineering concept applies?").

## 1.5.0: research update from public and open-source knowledge (2026-10-16)

Every addition below was checked against its primary source on 2026-10-16.

### Added

- **DTCG Resolver Module 2025.10** in the design-tokens template: `tokens/resolver.json` (sets, a `theme` modifier with `light` and `dark` contexts, `resolutionOrder`), a validated `resolver.ts` (later sources override earlier ones, references cannot leave the token directory), and 6 new tests (17 → 23). The generated CSS is byte-for-byte identical to before apart from its header comment. The spec's published `version` placeholders are accepted; the intended value `2025.10` (upstream PRs #357 and #408) is written.
- The Figma converter now also writes `tokens.resolver.json` (one-mode collections as sets, multi-mode collections as modifiers); a new test runs it through the token pipeline with contrast checks (16 → 17 tests).
- **Trusted Types** enforced in the static site's CSP (`require-trusted-types-for 'script'`, `trusted-types 'none'`; Baseline newly available since February 2026). Verified in Chromium: the page has 0 problems and an `innerHTML` probe is blocked. Rule 11 recommends it.
- UI design skill, "Make deliberate choices, not generated defaults": the common tells of AI-generated design (from Anthropic's open-source `frontend-design` skill, Apache-2.0) and how to avoid them; Vercel's Web Interface Guidelines (MIT) as an interaction checklist.
- Platform design languages of 2025: Apple's Liquid Glass and Google's Material 3 Expressive, with contrast guidance for translucent surfaces; `prefers-reduced-transparency` as an enhancement.
- Mobile: Android 16 removes the edge-to-edge opt-out for apps targeting API level 36; large-screen orientation and resizability restrictions are going away.
- Accessibility: overlays do not make sites conform (FTC final order against accessiBe, 22 April 2025; Overlay Fact Sheet); W3C cognitive accessibility guidance (COGA).
- Privacy: Global Privacy Control (`Sec-GPC`) as a legally required opt-out signal in several US states.
- Performance: a sustainability section based on the W3C Web Sustainability Guidelines (Group Note Draft).
- Modern CSS reference: Baseline data re-checked with `web-features` 3.43.0; `if()`, `@function` and `prefers-reduced-transparency` listed as limited; Interop 2026 focus areas.
- References and catalog: Resolver Module, Terrazzo, Anthropic skills, Vercel guidelines, `llms.txt` (labelled as a community proposal), COGA, Overlay Fact Sheet, GPC, Web Sustainability Guidelines, Interop 2026, Liquid Glass, Material 3 Expressive.
- Anti-hallucination playbook: errors in a published standard, and vendor claims taken as fact.
- Link checker: hosts that answer 404 to every automated client (verified manually: `www.ftc.gov`) are reported as warnings, with a test (script tests 14 → 15).

## 1.4.0: security audit and updates (2026-10-16)

### Added

- `SECURITY.md`: private vulnerability reporting, the controls in place with dated results, an accepted-risk analysis, and the GitHub account and repository settings only the owner can enable (2FA, private e-mail, secret scanning with push protection, Dependabot security updates, CodeQL, a `main` ruleset, read-only workflow permissions, required SHA pinning).
- CI job `secrets`: gitleaks 8.30.1 (SHA-256 verified before running) scans every commit and every file.
- Rule 06 section 7, AI agents and MCP servers: official and pinned servers only, tool poisoning, least privilege, approval for outward actions, agent configuration reviewed as code. References updated to the OWASP Top 10 for LLM Applications 2026 and for Agentic Applications 2026.

### Changed

- Installer instructions: download, read, then run, pinned to an immutable commit SHA, instead of piping a download into a shell (which rule 06 forbids). Same in the installer's own help.
- Unpinned `@latest` installs replaced with pinned versions (Code Connect CLI as an exact dev dependency; `govulncheck@v1.9.0`).
- Updates: `zizmor` 1.30.1 → 1.31.1 in CI, `ruff` 0.17.0 → 0.17.1, `@axe-core/playwright` 4.13.0 → 4.14.0, `node:24-slim` base image to its current digest. All 12 pinned actions confirmed at their latest releases.

### Verified (2026-10-16)

gitleaks: 0 secrets in 3 commits and all files. Semgrep 1.181.0 (JavaScript, TypeScript, Node.js, Python, Dockerfile, GitHub Actions, secrets, security audit): 0 findings in 157 files. `npm audit`: 0 vulnerabilities in every lockfile except the documented `braces` advisory (no patch exists; unreachable in this repository). `pip-audit`: no known vulnerabilities. actionlint, zizmor (auditor persona), shellcheck: clean.

## 1.3.0: clean code and clean execution audit (2026-10-16)

The concept is now explicit and the repository follows it.

### Added

- Rule `15-clean-execution` (always on): before acting, while acting, when something fails, leave no mess, tools and scripts you write, report. Same substance as R-09 of Projects 23, with design and front-end additions (shared design files, headless browsers, dev servers, generated `_headers`, token CSS and mirrors). Imported by `CLAUDE.md`.
- Rule 02 section 8: clean code in HTML, CSS, components, assets and design files, and how ESLint cyclomatic and Biome cognitive complexity map to the rule.
- `AGENTS.md`: a definition of the concept at the top, the rule in the index, and a "clean working tree" item in the definition of done. README: a concept section.
- Biome 2.5.15 at the repository root (`biome.json`, `npm run lint`, `npm run format`), run in CI; it formats and lints all 23 JavaScript and TypeScript files, orders imports, and fails on cognitive complexity above 15.
- Static site: `tsconfig.json` with `checkJs` and a `typecheck` script (TypeScript strict over the JavaScript, with JSDoc types); run in CI.
- Tests for the validator's new pure check functions (script tests 12 → 14) and for the Figma response parser (template tests 13 → 16).

### Fixed: the code did not follow its own rules

| Rule broken | Where | Fix |
| :--- | :--- | :--- |
| Rule 02: cyclomatic complexity at most 10 (measured with ESLint `complexity`) | 12 functions: `convertVariables` (18), `toCssValue` (25), `flattenTokens` (16), `fetchLocalVariables` (15), `mapType` (11), `validateSkill` (19), `validateRules` (12), `parseFrontmatter` (11), `parseNewUser` (13), `route` (11) | Split into small single-purpose functions and lookup tables; ESLint now reports no function above 10, no nesting above 3 and no function with more than 4 parameters; all tests passing |
| Rule 01: nesting depth of 3 or less | `check.mjs` (6 levels), `convert.ts` (5) | Extracted `scanPage` and `report`; per-mode conversion in its own function |
| Rule 02: few parameters, grouped into an object | Fixture helper with 7 parameters | One typed options object |
| Rule 02: formatting is the tool's job | 12 files never formatted by a tool | Biome formats every code file; enforced in CI |
| Rule 02 and 05: no unchecked `as` casts; validate at the boundary | `cli.ts` cast `JSON.parse` output to the API type; `client.ts` cast after a shallow check; casts in `build.ts`, `server.ts`, `convert.ts` | New `parseVariablesResponse` validates every field the converter reads, used by both the API client and the CLI; other casts replaced with type guards |
| Rule 02: strictest types | 10 implicit `any` in the static site JavaScript | JSDoc types; strict type-check in CI |
| Dead code | Unused `AddressInfo` import | Removed; `noUnusedLocals` and `noUnusedParameters` on in every TypeScript template |
| Duplicate warnings | The Figma converter repeated a type-level warning once per mode | Reported once; covered by a test |
| Verified facts | `typescript-eslint` 8.71.2 does not support TypeScript 7 (peer range `<6.1.0`), but the references recommended both together | Compatibility note in the framework references, toolchains and anti-hallucination playbook |
| One writing style | American spellings in README prose among British-English docs | Standardised; style rule added to the contributing guide |

The parameter limit of 4 (ESLint `max-params`) was a measurement aid for this audit; rule 02 itself says "prefer few parameters".

## 1.2.0: deployment, CI, security headers, tools catalog, prompt library (2026-10-15, stages 2 and 3 of the full audit)

### Added

- Skill `frontend-deployment`: hosting models and official docs for GitHub Pages, Netlify, Cloudflare Pages and Workers, Vercel, Firebase Hosting, AWS Amplify, Azure Static Web Apps, Render and container platforms; public versus secret configuration per framework prefix; security and caching headers; routing, domains and HTTPS; previews; monitoring; rollback.
- Skill `web-integrations-and-platforms`: headless CMS, WordPress block themes, Shopify themes and Hydrogen, Webflow and Framer, checkout UX, payments with hosted fields (small PCI scope), authentication UI and passkeys, HTML email, PWAs, technical SEO, third-party scripts, facades and consent.
- Security headers for the static site from one source (`security-headers.js`), rendered to `_headers` (Netlify, Cloudflare Pages; formats checked in their docs) and `vercel.json`; the dev server sends the same headers. Strict CSP without `unsafe-inline`; tests keep the files in sync.
- CI templates: `ci-frontend.yml` (checks, Playwright, Lighthouse CI), `lighthouserc.json` budgets, `deploy-github-pages.yml` with `configure-pages` v6.0.0, `upload-pages-artifact` v5.0.0, `deploy-pages` v5.0.1 and `upload-artifact` v7.0.2, all pinned to commit SHAs. actionlint and zizmor (auditor persona) clean.
- `axe-check` now also fails on console errors, so CSP violations are caught; a probe page with an inline script was detected.
- `systematic-debugging/references/browser-debugging.md`: DevTools, source maps, real devices, framework DevTools, agent browser access, and causes by symptom (hydration, CORS, stacking, overflow, deploy-only bugs, engine differences).
- `docs/TOOLKIT.md`: 320+ commonly used tools, libraries, platforms and services by phase, with official links (all checked), and rule 04 section 9, "Adopting any tool, framework, service or platform", so tools not listed are covered by procedure.
- `docs/PROMPT-LIBRARY.md`: ready-to-use prompts for about 25 scenarios, with notes per AI tool.
- Installer ships `docs/TOOLKIT.md` and `docs/PROMPT-LIBRARY.md`, which `AGENTS.md` links to.

### Changed

- Static site: the theme toggle reserves its space before JavaScript runs (Lighthouse had measured CLS 0.061 caused by it; now 0), and an SVG favicon removes a console 404. Lighthouse 12.6.1: 100 in all four categories. Tests: 13 → 18.
- `AGENTS.md`: indexes for the two new skills, pointers to the catalog and prompt library, and an operating condition for tools the spec does not mention. Operational manual: five more scenarios.
- README (restyled outside this session) corrected: CI status stated precisely (all 18 Validate jobs passed on GitHub for commit `7ff1512`; the changes in this release are verified locally and run in CI when pushed), the automated accessibility coverage figure now cites Deque's 57% study instead of an unsourced "30–50%", touch targets stated as 44 px with the 24 px WCAG minimum, "ISG" corrected to ISR, "eliminating hallucinations" reworded to "reduce", template verification stated precisely, counts updated to 27 skills.

## 1.1.0: Figma integration, mobile, agent capabilities (2026-10-15, stage 1 of the full audit)

### Added

- Skill `figma-integration`: file preparation for code generation, the Figma MCP server (remote and desktop, every documented tool, rate limits by seat), Code Connect (CLI, config, token scopes, seats), REST API tokens and scopes, plugins, widgets and Dev Mode codegen plugins, security, and the Penpot MCP server. Facts from Figma's developer docs on 2026-10-15.
- Template `figma-variables-sync`: converts `GET /v1/files/:file_key/variables/local` into DTCG 2025.10 token files per collection and mode. The fixture is type-checked against Figma's official `@figma/rest-api-spec` 0.44.0; 13 tests cover type mapping by scope, aliases, skipped values with reasons, name collisions, URL parsing, the API client (header, 403 and 429 handling, no token leakage) and a round trip through the design-tokens pipeline with a contrast check. CI job and Dependabot entry added.
- Skill `mobile-engineering`, adapted from the Projects 23 skill of the same name, with a mobile design layer (platform guidelines, touch targets, safe areas, dynamic type, size classes, dark mode, gestures, design tokens per platform). Extension IDs and versions re-checked.
- `AGENTS.md` operating conditions for design-file access, browser access and image input; operational manual capabilities matrix and three new scenarios; Playwright MCP, Chrome DevTools MCP and Penpot MCP documented with npm versions.
- Rule 11: session tokens out of web storage, CSRF protection for cookie-authenticated requests.

### Fixed

- Adobe XD status stated precisely from Adobe's FAQ: no new features, bug, security and privacy fixes continue, no end date announced.

## 1.0.0: design and front-end specification (2026-10-15)

Projects 24 starts as a full copy of [Projects 23](https://github.com/gerrardgs/Projects23) version 2.1.0 (engineering rules, nine skills, templates, validator, installer and CI) and extends it for UI/UX designers, digital graphic designers and front-end developers.

### Added

- Rules, always on: `09-design-principles` (user goals, hierarchy, tokens, every state, responsive, no invented design facts) and `10-accessibility` (WCAG 2.2 AA baseline with the EAA, EN 301 549 and ADA context).
- Rules, on demand: `11-frontend-code`, `12-web-performance` (Core Web Vitals thresholds), `13-visual-assets-and-licensing` (licensing, colour management, export and print specifications), `14-ux-writing-and-ethics` (interface copy, forms, localisation, deceptive patterns, consent).
- Fourteen skills: `ux-research-and-strategy`, `ui-design-and-prototyping`, `graphic-design-production`, `motion-and-interaction`, `data-visualization-design`, `design-system-and-tokens`, `design-to-code-handoff`, `frontend-from-scratch`, `framework-frontend-engineering`, `css-architecture-and-responsive`, `accessibility-audit`, `web-performance-optimization`, `frontend-testing-and-visual-qa`, `design-critique-and-review`, each with references.
- Templates, all run before release:
  - `design-tokens`: DTCG 2025.10 tokens to CSS with light and dark themes, alias and cycle checks, theme-shape check, WCAG contrast checks. 17 tests; 22 contrast pairs pass; `tsc --noEmit` clean.
  - `static-site`: accessible starter page, progressive-enhancement form, theme toggle, dev server with path-traversal protection. html-validate and Stylelint clean; 13 tests; axe-core 0 violations (phone and desktop, light and dark, initial and error states).
  - `axe-check`: Playwright plus axe-core scanner for WCAG 2.0 to 2.2 A/AA.
- `docs/DESIGN-REFERENCES.md`: about 440 curated sources in 26 sections.
- `scripts/check-links.mjs` with self-tests, and `.github/workflows/links.yml` to run it weekly. On 2026-10-15 it checked 658 unique external links across the repository: 657 resolved or were blocked only for bots; `https://inkscape.org/` could not be reached from the verification network (DNS resolves, the connection timed out).
- Versions of 70+ front-end packages checked on the npm registry; Baseline status of about 60 web features from `web-features` 3.42.0; 22 additional VS Code extension IDs checked on the Marketplace API.
- Rule 03: front-end and design verification sources and nine new deprecated patterns (React 19 removals, `unload`, `100vh`, zoom-blocking viewport, FID, Adobe XD).
- Rule 04: browser platform replacements table. Rule 07: link to UI testing.
- `AGENTS.md`: design and front-end priorities, non-negotiables (accessibility, licensed assets), workflow, 14-rule and 23-skill indexes, design operating conditions, project profile fields for framework, support target and design source.
- CI jobs for the two front-end templates, including the axe scan; Dependabot entries for their dependencies.

### Changed

- `CLAUDE.md` imports the two new always-on rules.
- `project-bootstrap`: front-end and design toolchain section and extensions.
- Docs: architecture, operational manual (about 40 scenarios), anti-hallucination playbook (nine design failure modes), contributing guide.
- Installer and package metadata point to `gerrardgs/Projects24`.

### Fixed during verification

| Found | Fix |
| :--- | :--- |
| Link checker skipped Markdown links that carry a title (`[text](url "title")`) | Regex fixed; covered by a new self-test |
| Ten reference links returned 404 or no longer resolved (Material Design layout pages, Adobe XD page, ETSI page, 18F Methods site, Datawrapper article, Polaris, Thinking with Type site, Idealliance page, FigJam category, ICO page) | Replaced with the current official pages, verified |
| `@shadcn/ui` first described as a placeholder package | It is the old CLI name (last published March 2023); wording corrected |
| Static site CSS used hand-written vendor prefixes, rejected by Stylelint | Removed; prefixes belong to build tooling |

### Known issues

- The static site's development tools (Stylelint) depend on `braces`, which had a high-severity advisory ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) with no patched release on 2026-10-15. Nothing from npm ships to browsers, so CI audits production dependencies for that template; Dependabot will propose the fix when one is published.
- `https://inkscape.org/` could not be reached from the network used for verification; it is the project's long-standing official site and is kept.

