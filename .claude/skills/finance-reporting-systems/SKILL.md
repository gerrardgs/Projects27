---
name: finance-reporting-systems
description: Design, build, test and operate enterprise finance reporting software - multi-entity double-entry ledger, chart of accounts, monthly income and expense reports, financial statements, budgets, bank reconciliation, period close, tax data, approval workflows, audit trail and retention - plus AI features (categorisation, receipt extraction, narrative reports, questions over the ledger) and speech input that stay exact, reviewable and compliant. Use for any work on the Projects 27 finance product or any system that stores or reports money.
license: MIT
metadata:
  version: "1.0.0"
---

# Finance Reporting Systems

The invariants are in [17-financial-integrity](../../rules/17-financial-integrity.md); this skill is the procedure. Regulations and their primary sources: [references/regulations-id.md](references/regulations-id.md). AI and speech design: [references/ai-and-speech.md](references/ai-and-speech.md). Facts were checked on 2026-10-28; re-check regulations before relying on them.

## 1. Model the domain first

Agree the model with the finance owner before writing code. The minimum set of entities:

| Entity | Holds | Notes |
| :--- | :--- | :--- |
| Organisation, entity | Legal entities, functional currency, time zone, fiscal calendar, reporting framework | Every record belongs to exactly one entity; consolidation reads several |
| Account | Chart of accounts: code, name, type (asset, liability, equity, income, expense), normal balance, parent, postable flag, active dates | Codes are stable; renames keep history |
| Dimension | Cost centre, department, project, branch | Optional tags on lines, validated against allowed values |
| Period | Fiscal year and month, status (open, closing, closed) | Status changes are audited |
| Journal entry and line | Date, period, source, description, status (draft, submitted, approved, posted, reversed), lines with account, dimensions, debit or credit, amount, currency, rate | Balanced, immutable once posted |
| Counterparty | Customer, supplier, employee, with tax ID where required | Personal data: minimum fields, access-controlled |
| Document | Receipt, invoice, bank statement, contract; file hash and storage location | Retained for the legal period |
| Budget | Amount per account, dimension and period, with versions | Compared with actuals, never mixed with them |
| Tax code | Rate, base rule, effective dates, regulation reference | Data, not code |
| Approval, audit event | Who did what, when, why, before and after | Append-only, hash-chained |

Monthly income and expense reporting is a view over this model (income and expense accounts by period and dimension), not a separate store. Keeping one ledger is what makes every report reconcile.

## 2. Posting engine

1. Validate the draft: at least two lines, every account postable and active on the date, dimensions allowed, period open, amounts positive with a side, currencies known.
2. Convert foreign-currency lines with the stored rate for the date; keep the original amount, currency and rate on the line.
3. Check balance in the functional currency with exact arithmetic; the database enforces it again in the same transaction.
4. Check the approval rule (maker is not the checker; amount thresholds), then post in one transaction with an idempotency key.
5. Write the audit event in the same transaction, chained to the previous event's hash.
6. Corrections: generate a linked reversing entry, then a new entry. Never update posted lines.

## 3. Reports

Build each report as a pure function of (entity set, period range, as-of time, currency, framework) over posted lines, with its own self-checks:

| Report | Self-check |
| :--- | :--- |
| Monthly income and expense recap (by category, dimension, month; actual, budget, prior period, year to date) | Totals equal the income statement for the same period |
| Trial balance | Debits equal credits |
| Statement of financial position (balance sheet) | Assets equal liabilities plus equity (including current-period result) |
| Statement of profit or loss | Net result equals the change in retained earnings before distributions |
| Statement of cash flows, indirect method | Opening cash plus net cash flow equals closing cash |
| Budget versus actual, variance analysis | Variance equals actual minus budget, per line and in total |
| Receivables and payables ageing | Ageing total equals the control account balance |
| Bank reconciliation | Book balance plus reconciling items equals the bank statement balance |

Every published report stores the parameters, the generated figures, the framework version and a content hash. Exports (PDF, XLSX, CSV) are generated from that stored result so the file and the screen never disagree.

## 4. Monthly close

Run the close as a checklist with owners and evidence, not as a single button:

1. Cut-off: all source documents for the month captured; imports from banks and subledgers completed and deduplicated.
2. Reconcile: every bank account, receivables and payables to their control accounts, intercompany balances between entities.
3. Adjust: accruals, prepayments, depreciation, revaluation of foreign-currency balances; each as an approved entry with evidence.
4. Review: trial balance, variance analysis against budget and prior period with explanations for variances above the agreed threshold.
5. Lock the period, generate and snapshot the reports, distribute the recap to the approved recipients.
6. After close: any change is a reversal in the next open period, or an audited reopen approved by the controller.

## 5. Automation

- Scheduled jobs (daily bank import, month-end reminders, recap generation after close) are idempotent, retry with backoff, record each run, and alert a person on failure.
- Automated recaps are drafts until a named approver releases them; the release is audited. Recipients come from configuration, not from the model.
- Integrations (bank statements in ISO 20022 `camt.053` or CSV, e-invoicing and tax exports, payroll, ERP) go through adapters with schema validation and a quarantine area for rejected records ([api-integration](../api-integration/SKILL.md)).

## 6. AI and speech features

Follow [references/ai-and-speech.md](references/ai-and-speech.md). In short: AI proposes, people approve; numbers come from code; extraction uses a schema; external services get the minimum data; speech stays on the device or on servers the organisation controls unless the user consents otherwise. Use [llm-applications](../llm-applications/SKILL.md) for evaluation and guardrails and [rag-systems](../rag-systems/SKILL.md) for questions over policies and documents.

## 7. Security, privacy and operations

- Threat model ([security-hardening](../security-hardening/SKILL.md)): stolen sessions, privilege escalation between roles and entities, tampering with posted data, fraudulent vendor or bank detail changes, data leaks through exports, prompt injection through uploaded documents.
- Strong authentication (single sign-on with multi-factor), short sessions, re-authentication for approvals and bank-detail changes, rate limits on exports.
- Encryption in transit and at rest, backups tested by restore, retention enforced by policy, and records stored where the law requires (for Indonesian taxpayers, in Indonesia).
- Observability: structured logs without personal data, metrics for posting latency, import failures, close progress and AI acceptance rate.

## 8. Tests

- Unit and property tests for money arithmetic, allocation, rounding, balancing and reversal ([test-engineering](../test-engineering/SKILL.md)).
- Golden ledgers with hand-checked statements for each report, including multi-currency and closed-period cases.
- Integration tests against a real database (constraints, triggers, concurrency, idempotency).
- Role-based access tests for every endpoint and entity boundary.
- AI evaluation sets with expected categories and extracted fields, and a check that narratives contain only computed numbers.
- Accessibility and end-to-end tests for the main journeys: record an expense by voice, approve, close the month, read the recap ([frontend-testing-and-visual-qa](../frontend-testing-and-visual-qa/SKILL.md)).

## 9. Checklist

- [ ] Amounts are exact (minor-unit integers or exact decimals) with a currency on every amount
- [ ] Entries balance, enforced by the database; posted entries and closed periods are immutable
- [ ] Maker-checker, role and entity permissions are tested
- [ ] The audit trail is append-only and hash-chained; retention follows the entity's legal basis
- [ ] Each report passes its self-checks and is reproducible from stored parameters
- [ ] Tax rules are effective-dated data with a regulation reference and a check date
- [ ] AI output is reviewed before it is posted or sent; narratives contain only computed numbers
- [ ] Speech and documents sent to third parties only with consent and an agreement
