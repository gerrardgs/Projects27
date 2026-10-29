# Domain rules

## Domain rules and invariants

- **Exact money**: amounts are integers in minor units (`BIGINT`; IDR has 2 minor units by ISO 4217) inside the ledger and decimal strings at the API. Never binary floating point in any client.
- **Double entry**: every posted entry balances, enforced by the database ([SCHEMA.md](SCHEMA.md#invariants)).
- **Immutable history**: posted entries are never edited or deleted; a mistake is corrected by a reversal with a reason.
- **Closed periods**: nothing posts into a closed month; reopening needs a reason and is audited.
- **Audit trail**: every change appends a hash-chained audit event recording who, what, when, and before and after.
- **Reports check themselves**: each report returns its checks (for example that assets equal liabilities plus equity); a report with a failed check is shown as failed.
- **AI proposes, people decide**: capture fills a form; only Simpan posts ([17-financial-integrity](../.agents/rules/17-financial-integrity.md)).

## Compliance and legal constraints

| Source | Effect | Details |
| :--- | :--- | :--- |
| UU KUP and its rules on bookkeeping | Keep books and source records for 10 years, in Indonesia | [RESEARCH.md](RESEARCH.md) section 1 |
| UU 27/2022 on personal data protection | Data inventory, lawful basis, minimisation, breach notification | [PRIVACY.md](PRIVACY.md) |
| PMK 131/2024 (VAT 12 percent, DPP nilai lain 11/12) | Effective-dated tax codes when tax features arrive | [PRD.md](PRD.md#requirements) F11 |
| SAK (Indonesian accounting standards) | Statements follow the structure of the chosen framework | [RESEARCH.md](RESEARCH.md) |

## Protected areas

Changes here need a migration or a test that proves the rule still holds, and a reviewer: `apps/api/migrations/*` (triggers and constraints), `apps/api/src/ledger.ts`, `money.ts`, `reports.ts`, `audit.ts`, `auth.ts`, and the contract. An applied migration is never edited.

## Approvals

| Action | Who may |
| :--- | :--- |
| Record a transaction | owner, controller, accountant, preparer; in entities with approvals on (`approval_required`), every new entry except a reversal waits as `submitted` until approved |
| Approve or reject | approver, controller, owner, but never the entry's own author |
| Close or reopen a month | owner, controller |
| Manage accounts | owner, controller, accountant |
| Read the audit trail | owner, controller, auditor |

## Exceptions

No exception to the invariants is possible through the API, and none should be made by SQL. When data was posted wrongly, it is reversed and re-posted. An exception to an approval rule needs the owner's written decision, recorded in [PRD.md](PRD.md#owner-decisions-2026-10-28).
