---
trigger: model_decision
description: "Apply when writing or reviewing anything that touches money, ledgers, journals, accounts, periods, reports, tax, budgets, currencies, financial imports or exports, audit trails, or AI and speech features that produce financial data."
---

# R-17: Financial Integrity

Financial software is judged by one question: can every number in every report be traced, exactly and repeatably, to approved source entries? This rule sets the invariants. The procedure is in [finance-reporting-systems](../skills/finance-reporting-systems/SKILL.md); regulations and their sources are in its [Indonesian regulations reference](../skills/finance-reporting-systems/references/regulations-id.md).

## 1. Money arithmetic

- Never use binary floating point (`number` in JavaScript, `float` in Python, `double` in SQL) for amounts. Store integers in minor units (`bigint`, `BIGINT`) or exact decimals (`NUMERIC(p,s)`), and do arithmetic in the same exact type.
- Every amount carries its currency (ISO 4217 code). Take the number of minor units for each currency from the ISO 4217 table and store it as data; never assume two decimals.
- Rounding is explicit: name the mode (half-up, half-even) and the point where it happens, and round once. When an amount is split (allocation, instalments, tax per line), distribute the remainder so the parts sum exactly to the whole.
- Exchange rates are stored with their source, rate date and direction, and never overwritten. A converted amount keeps the original amount, currency and the rate used.

## 2. Double entry

- Every journal entry has at least two lines and balances: total debits equal total credits in the entity's functional currency, and per currency for multi-currency lines. The database enforces it (constraint or deferred trigger), not only the application.
- Lines post only to active, postable (leaf) accounts of the same entity, on a date inside an open period.
- Account balances and reports are computed from posted lines. Cached balances are derived data, rebuilt and reconciled against the lines.

## 3. Immutability, periods and close

- A posted entry is never edited or deleted. Corrections are reversing entries plus new entries, each linked to the original and carrying a reason.
- Closing a period locks it. Reopening needs a named approver and a reason, and is logged; reports for a closed period are snapshotted with a content hash so a later change is detectable.
- Drafts may change freely until they are submitted; submission freezes the content that the approver sees.

## 4. Controls and segregation of duties

- Maker-checker: where an entity requires approval, the person who prepares an entry, payment or adjustment cannot approve it, and reversals need an approver. Approval thresholds by amount and account type are configuration with an audit history. A personal entity with a single owner has no second person, so it posts directly; every posting is still audited.
- Least privilege by role (viewer, preparer, approver, controller, auditor, administrator) and by entity. Authorization is checked on the server for every request and every record ([06-security](06-security.md) section 4).
- Imports and postings are idempotent: an idempotency key or a natural key (bank reference, invoice number plus supplier) prevents double posting; suspected duplicates are flagged, not silently dropped.

## 5. Audit trail and retention

- Every create, submit, approve, reject, post, reverse, close, reopen, export and permission change records who, what, when (UTC timestamp plus the entity's time zone), from where, why, and the before and after values.
- The audit log is append-only and tamper-evident (each record holds the hash of the previous one); the application role cannot update or delete it.
- Keep books, records and source documents for the legally required period in the required place. For Indonesian taxpayers this is 10 years, kept in Indonesia (UU KUP article 28 paragraph 11); record the retention basis per entity, and never let a purge job delete records inside it.

## 6. Reports

- Reports are generated from the ledger only, for an explicit entity, period, currency and as-of time, and are reproducible: the same inputs give the same figures.
- Every report proves itself: the trial balance balances, assets equal liabilities plus equity, the cash flow statement reconciles to the change in cash, and subtotals equal the sum of their lines. A report that fails a check is not published.
- Presentation follows the entity's chosen framework (for example SAK Indonesia, SAK EP or IFRS); record which one, and check the version in force for the period.

## 7. Tax and regulation

- Tax rates, bases and codes are effective-dated data, not constants in code, because they change (for example Indonesia's VAT under PMK 131/2024 since 2025-01-01).
- Before implementing or changing tax logic, read the current regulation from the official source (JDIH Kemenkeu, pajak.go.id) and record the regulation number, article and the date checked next to the rule. Never implement tax rules from memory or secondary sources alone ([03-verification](03-verification.md)).
- Personal data in financial records (names, account numbers, tax IDs) follows the data protection law of each jurisdiction, for Indonesia UU 27/2022 on personal data protection: minimum collection, a lawful basis, access control, breach response.

## 8. AI and speech in financial workflows

- AI output is a proposal. A model may suggest a category, extract a receipt or draft a narrative; a person reviews and approves it before anything is posted, sent or filed.
- Figures in AI-written text come from code: the application computes every number and the model may only reference values it received from tools or the prompt. Validate the final text against the computed figures and reject a narrative that contains a number not in them.
- Structured extraction uses a schema (structured outputs or strict tool input) and is validated again on the server; low-confidence or invalid fields go to a review queue.
- Send the minimum data to external AI services, under a documented agreement and the user's policy; never send credentials. Keep prompts, model identifiers, outputs and approvals in the audit trail.
- Speech input is processed on the device or on servers the organisation controls by default; sending audio to a third party needs explicit consent and a visible indicator while recording.

## 9. Tests that prove the invariants

- Property-based tests: any accepted entry balances; any sequence of postings and reversals leaves the trial balance at zero; allocations sum to the total.
- Golden tests: known ledgers produce known statements, figure for figure, including rounding and currency cases.
- Boundary tests: period edges in the entity's time zone, closed-period rejection, concurrent postings, duplicate imports, maker-checker bypass attempts, and permission checks per role.
