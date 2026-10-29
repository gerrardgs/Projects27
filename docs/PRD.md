# Product requirements: enterprise finance reporting system

Status: updated with the owner's decisions of 2026-10-28 ([Owner decisions](#owner-decisions-2026-10-28)). Sources for every regulatory statement are in [RESEARCH.md](RESEARCH.md); delivery stages are in [ROADMAP.md](ROADMAP.md).

## Problem

Companies that record income and expenses in spreadsheets, chat messages and paper receipts face the same failures every month:

| Problem | Effect | Requirement that solves it |
| :--- | :--- | :--- |
| Transactions recorded late or not at all, because typing is slow | Incomplete monthly figures, last-minute rush at close | F1 quick capture by voice, photo or short text |
| Inconsistent categories between people and months | Reports that cannot be compared | F2 one chart of accounts, F5 AI category suggestions with review |
| Formula errors and floating-point rounding in spreadsheets | Totals that do not reconcile | F3 double-entry ledger with exact arithmetic and self-checking reports |
| Anyone can edit last month's numbers | No trust in reports, audit findings | F3 immutable postings, F7 period close, F8 audit trail |
| One person records and approves | Fraud and error risk | F6 maker-checker approval |
| Manual monthly recap takes days | Late decisions | F9 automated recap after close, F10 narrative draft |
| Bank statements re-typed by hand | Errors, duplicates | F4 bank import with deduplication and reconciliation |
| Tax rates and rules change (VAT since 2025-01-01) | Wrong tax amounts | F11 effective-dated tax codes with regulation references |
| Records lost or deleted | Breach of the 10-year retention duty | F8 retention policy and protected storage |
| Several entities, branches and currencies | Consolidation by copy and paste | F2 multi-entity, dimensions and multi-currency |

## Users and scenarios

### Roles

| Role | Does | Cannot |
| :--- | :--- | :--- |
| Staff (preparer) | Capture transactions and receipts for their unit | Approve own entries, see other units unless granted |
| Approver (unit head) | Approve or reject entries within a threshold | Post above the threshold, change the chart of accounts |
| Accountant | Manage entries, reconciliations, adjustments | Approve own adjustments, reopen closed periods |
| Controller / finance manager | Close and reopen periods, approve above thresholds, release recaps | Change the audit log |
| Executive (viewer) | Read dashboards and released reports | Change data |
| Auditor | Read everything including the audit trail, export evidence | Change data |
| Administrator | Manage users, roles, entities, integrations | Post or approve financial entries |

### Scenarios

| Scenario | Who | Today (2026-10-29) |
| :--- | :--- | :--- |
| Records lunch by saying "beli nasi padang 35 ribu pakai GoPay kemarin" on the phone, checks the filled form, presses Simpan | Individual owner (personal entity) | Implemented on web, Android and iOS |
| Records a transaction in the basement car park without signal; it is sent when the phone is back online | Individual owner | Implemented: device copy and outbox on all three apps |
| Imports last month's bank statement (CSV or XLSX), reviews duplicates and errors, commits | Individual owner, accountant | Implemented on the web |
| Closes October, downloads the recap in Excel, and later checks that its hash matches the snapshot | Owner, controller | Implemented on the web (close, snapshots, Excel with hash); sending by email or chat is stage 6 |
| Reverses a wrong entry with a reason instead of editing it | Accountant | Implemented (API and web) |
| Approves an entry prepared by someone else; cannot approve their own | Approver in a company entity | Implemented in the API; company entities and the approval screen come later |

## Goals and non-goals

### Goals

- Every month's income and expenses recorded completely and on time, because capture takes seconds and works by voice.
- Reports that people trust: exact amounts, balanced books, immutable postings, closed periods, a verifiable audit trail.
- One ledger, three clients (web, iOS, Android), one contract.
- AI that saves typing but never decides: every AI output is a proposal a person reviews.

### Non-goals: out of scope for the first release

Payroll calculation, filing tax returns directly with DJP, payments execution to banks, inventory costing and fixed-asset subledgers. Each can integrate later through adapters.

## Requirements

- **F1 Capture**: record an income or expense in under 30 seconds by voice (Indonesian and English, including mixed speech), photo or PDF of a receipt, short text, or a full form. The user always reviews the extracted fields before saving a draft.
- **F2 Structure**: multiple legal entities, chart of accounts per entity from templates, dimensions (cost centre, department, project, branch), multiple currencies with stored exchange rates.
- **F3 Ledger**: double-entry journal with draft, submitted, approved, posted and reversed states; posted entries are immutable; corrections by reversal.
- **F4 Bank**: import statements (ISO 20022 `camt.053` and bank CSV formats), deduplicate, match to entries, reconcile.
- **F5 AI assistance**: category suggestions with confidence and reason; receipt extraction; anomaly flags (duplicates, outliers, unusual counterparties); questions over the ledger answered with cited report rows.
- **F6 Approvals**: maker-checker workflow with amount thresholds per role and account type, delegation during absence, full history.
- **F7 Period close**: checklist with owners and evidence, period lock, audited reopen.
- **F8 Audit and retention**: append-only, hash-chained audit trail of every change; document storage with hashes; retention of 10 years for Indonesian taxpayers, stored in Indonesia.
- **F9 Reports**: monthly income and expense recap (actual, budget, prior period, year to date, by dimension), trial balance, statement of financial position, profit or loss, cash flows (indirect), budget versus actual, receivables and payables ageing, bank reconciliation; export to PDF, XLSX and CSV; every report self-checks.
- **F10 Automation**: scheduled imports, close reminders, recap generation after close with an AI-drafted narrative that a controller approves before it is sent to configured recipients.
- **F11 Tax data**: effective-dated tax codes (for example VAT 12 percent with DPP nilai lain 11/12 for non-luxury goods under PMK 131/2024), tax reports and an export for a licensed tax application provider (PJAP) or Coretax import.
- **F12 Budgets**: annual and monthly budgets with versions, variance thresholds and explanations.
- **F13 Dashboards**: cash position, income and expense trend, budget burn, outstanding approvals, close progress; accessible charts with data tables.

## Non-functional requirements

| Area | Requirement | Measured by |
| :--- | :--- | :--- |
| Correctness | Every published report passes its self-checks; zero unbalanced posted entries | Report checks in CI and at runtime; database constraint |
| Security | OWASP ASVS 5.0 level 2 as the target; SSO with multi-factor; server-side authorization on every request | Security tests, audit ([security-hardening](../.agents/skills/security-hardening/SKILL.md)) |
| Privacy | UU 27/2022 obligations: data inventory, lawful basis, minimisation, breach runbook | Privacy review before go-live |
| Accessibility | WCAG 2.2 AA | axe-core in CI plus keyboard and screen-reader passes |
| Performance | Interactive pages: Largest Contentful Paint at most 2.5 s and Interaction to Next Paint at most 200 ms at the 75th percentile; monthly recap for 100,000 lines generated in under 10 s | Lighthouse CI, web-vitals, load tests |
| Availability | 99.5 percent monthly for the web application; no data loss on single-node failure (recovery point objective 15 minutes, recovery time objective 4 hours) | Monitoring, restore drills |
| Retention | 10 years for books and source documents of Indonesian taxpayers | Retention job tests, storage policy |
| Language | Indonesian and English interface; amounts and dates formatted with `Intl` for the user's locale | i18n tests |

## Clients

Three clients use one API and one contract ([packages/contract/openapi.json](../packages/contract/openapi.json)) and are tested against one sample ledger ([packages/contract/fixtures/personal-sample.json](../packages/contract/fixtures/personal-sample.json)):

| Client | Technology | Session |
| :--- | :--- | :--- |
| Web app (dashboards, imports, Excel export) | React 19 with Vite | HttpOnly cookie, 12 hours |
| iOS app | Swift with SwiftUI | Bearer token in the Keychain, 30 days |
| Android app | Dart with Flutter | Bearer token in the Android Keystore (through secure storage), 30 days |

Every amount crosses the API as a decimal string; clients parse it with `Decimal` (Swift) or a decimal type (Dart), never binary floating point.

## Acceptance criteria for the first release

1. A preparer records an expense by voice in Indonesian; the extracted amount, date and account are correct for at least 95 percent of a consented evaluation set, and the user can correct any field before saving.
2. An approver cannot approve an entry they prepared; the attempt is rejected and logged.
3. After posting, the entry cannot be edited through any API; a reversal creates linked entries.
4. Closing a month locks it; reports for that month are snapshotted and their hashes verify.
5. The monthly recap, trial balance, balance sheet, profit or loss and cash flow statement for a golden test ledger match hand-checked figures exactly.
6. The AI-drafted narrative contains no number that the report did not compute; a controller approves it before distribution.
7. axe-core reports no violations on the main journeys; all journeys work with a keyboard only.

## Success metrics

| Metric | Target | Source |
| :--- | :--- | :--- |
| Capture: amount right on a labelled Indonesian test set | At least 95 percent, with no more than 2 percent silently wrong | `apps/api/eval` gates, checked by `npm test`; 100 percent and 0 percent on 2026-10-28 ([EVALUATION.md](EVALUATION.md)) |
| Capture in real use: saved forms that needed no correction | Tracked per method (AI or rules) with a 95 percent interval; target set after 100 saved forms | `GET .../capture/quality` |
| Unbalanced posted entries | Zero | Database constraint triggers; report self-checks |
| Report self-checks failing on a published report | Zero | `checks` in every report response |
| Audit chain breaks | Zero | `GET .../audit/verify` |
| Accessibility violations on main journeys | Zero axe-core violations (WCAG 2.2 AA tags) | Playwright end-to-end tests |
| Close takes | Under one working day for a personal entity | Measured from first close task to snapshot, from stage 6 |

## Release plan

Delivery is in seven stages ([ROADMAP.md](ROADMAP.md)). Stages 1 to 4 (foundation, core API, web, mobile apps) are done. Stage 5 (AI and speech) is in progress: voice capture, evaluation and real-use quality are done; Whisper, receipts, the ledger assistant, narratives and anomaly flags remain. Stage 6 brings automated recaps by email and chat and PDF export; stage 7 brings hosting and hardening. Each stage is released when its exit criterion in the roadmap is met.

## Open questions

| Question | Needed for | Owner |
| :--- | :--- | :--- |
| Hosting provider and region (must keep data in Indonesia) | Stage 7, passkeys (need a domain), email sending | Owner |
| Claude API key for AI capture, and its monthly budget | Measuring AI mode; ledger assistant and narratives | Owner |
| Email and chat channels for recaps (which provider, which chat app) | Stage 6 | Owner |
| Company entities: when, and with which roles and approval thresholds | Approvals screen, multi-entity | Owner |
| Encryption of the device copy beyond the platform's protection | Offline mode on shared or managed devices | Owner, security review |

## Owner decisions (2026-10-28)

| Question | Decision | Effect |
| :--- | :--- | :--- |
| Entities and currency | One personal (individual) entity per user, in IDR | Registration creates the entity with a personal chart of accounts; approvals are off for personal entities and remain available for company entities |
| Clients | Web, iOS in Swift, Android in Dart, all connected to one API | Section 5; one OpenAPI contract and one shared sample ledger |
| Sign-in | Left to the team; the best available option | Stage 2: email and password (Argon2id) with optional TOTP two-factor, revocable sessions. Stage 3: passkeys (WebAuthn) for web, iOS and Android once the domain is known, because passkeys are bound to a domain. Single sign-on (OpenID Connect) when company entities with staff are added |
| Hosting | Still open | The API runs anywhere Node.js 24 and PostgreSQL 18 run; the choice must keep data in Indonesia (retention rule) |
| AI data | Allowed, provided data is never disseminated | Only minimised data goes to the AI provider; nothing is shared, published or used beyond answering the request; AI output stays a proposal |
| Imports, dashboards, exports | Everything importable; visual dashboards; reports exported to Excel | Stage 3 (web): CSV and XLSX import with column mapping and duplicate detection, bank statements, dashboards with accessible charts and data tables, XLSX export generated from stored report results |
| Recap delivery | Email and chat, cross-checkable and downloadable for personal use | Stage 6: recap released by the owner, sent by email and chat with the snapshot hash; the recipient checks the hash against `GET .../periods/{year}/{month}/snapshots`; Excel and PDF downloads |
| Installs | PostgreSQL 18 and Node.js 24 update approved | Installed on 2026-10-28: Node.js 24.22.1, PostgreSQL 18.6 (Homebrew, port 5433, because an existing PostgreSQL 18 already uses 5432) |
