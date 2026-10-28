// Posting engine: validated, balanced, idempotent, audited (finance-reporting-systems skill section 2).

import { can, type EntityContext } from "./access.ts";
import { appendAudit } from "./audit.ts";
import { canonicalJson, sha256 } from "./canonical.ts";
import type { AccountType } from "./chart-template.ts";
import { type Db, pgErrorCode, type Tx, withTransaction } from "./db.ts";
import { badRequest, conflict, forbidden, notFound, unprocessable } from "./errors.ts";
import { AmountError, formatAmount, parseAmount } from "./money.ts";
import {
  type AccountInfo,
  allChecksPass,
  balanceSheet,
  incomeStatement,
  type Movement,
  monthlyRecap,
  trialBalance,
} from "./reports.ts";

export interface Actor {
  userId: string;
  ip: string | null;
}

/** Who acts, on which entity, through which database: passed together to every ledger operation. */
export interface Scope {
  db: Db;
  actor: Actor;
  entity: EntityContext;
}

interface DraftLine {
  accountId: string;
  debit: bigint;
  credit: bigint;
  memo: string | null;
}

interface DraftEntry {
  date: string;
  description: string;
  counterparty: string | null;
  source: "manual" | "transaction" | "import" | "reversal";
  lines: DraftLine[];
  idempotencyKey: string | null;
  requestHash: Buffer | null;
  reversesEntryId: string | null;
  reason: string | null;
}

interface AccountRow extends AccountInfo {
  postable: boolean;
  active: boolean;
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(value: unknown, field: string): string {
  const text = typeof value === "string" ? value : "";
  const match = DATE.exec(text);
  const valid =
    match !== null &&
    (() => {
      const date = new Date(`${text}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
    })();
  if (!valid) throw badRequest(`${field} must be a date in the form YYYY-MM-DD.`, { [field]: "Use YYYY-MM-DD." });
  return text;
}

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max)
    throw badRequest(`${field} must be text of at most ${max} characters.`);
  return value.trim();
}

function requiredText(value: unknown, field: string, max: number): string {
  const text = optionalText(value, field, max);
  if (text === null || text === "") throw badRequest(`${field} is required.`, { [field]: "Required." });
  return text;
}

function amountField(value: unknown, field: string, units: number): bigint {
  if (typeof value !== "string")
    throw badRequest(`${field} must be a decimal string such as "125000.00".`, { [field]: "Use a string." });
  try {
    return parseAmount(value, units);
  } catch (error) {
    if (error instanceof AmountError) throw badRequest(error.message, { [field]: error.message });
    throw error;
  }
}

async function loadAccounts(db: Db | Tx, entityId: string): Promise<Map<string, AccountRow>> {
  const { rows } = await db.query<AccountRow>(
    "select id, code, name, type, postable, active from accounts where entity_id = $1",
    [entityId],
  );
  return new Map(rows.map((row) => [row.id, row]));
}

export async function listAccounts(db: Db, entity: EntityContext) {
  const accounts = await loadAccounts(db, entity.id);
  return [...accounts.values()]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((a) => ({ id: a.id, code: a.code, name: a.name, type: a.type, postable: a.postable, active: a.active }));
}

const ACCOUNT_TYPES = new Set<AccountType>(["asset", "liability", "equity", "income", "expense"]);

export async function createAccount({ db, actor, entity }: Scope, body: Record<string, unknown>) {
  const code = typeof body.code === "string" ? body.code : "";
  const name = requiredText(body.name, "name", 120);
  const type = body.type as AccountType;
  if (!/^\d{3,6}$/.test(code)) throw badRequest("code must be 3 to 6 digits.", { code: "Use 3 to 6 digits." });
  if (!ACCOUNT_TYPES.has(type)) throw badRequest("type must be asset, liability, equity, income or expense.");
  try {
    return await withTransaction(db, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        "insert into accounts (entity_id, code, name, type) values ($1, $2, $3, $4) returning id",
        [entity.id, code, name, type],
      );
      const id = rows[0]?.id as string;
      await appendAudit(tx, {
        entityId: entity.id,
        actorUserId: actor.userId,
        action: "account.created",
        objectType: "account",
        objectId: id,
        after: { code, name, type },
        ip: actor.ip,
      });
      return { id, code, name, type, postable: true, active: true };
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") throw conflict(`Account code ${code} already exists.`);
    throw error;
  }
}

function validateLines(lines: DraftLine[], accounts: Map<string, AccountRow>, units: number): void {
  if (lines.length < 2) throw unprocessable("A journal entry needs at least two lines.");
  if (lines.length > 500) throw badRequest("A journal entry can have at most 500 lines.");
  let debit = 0n;
  let credit = 0n;
  for (const [index, line] of lines.entries()) {
    const account = accounts.get(line.accountId);
    if (account === undefined) throw badRequest(`Line ${index + 1}: account not found in this entity.`);
    if (!account.postable || !account.active)
      throw unprocessable(`Line ${index + 1}: account ${account.code} does not accept postings.`);
    if (line.debit > 0n === line.credit > 0n)
      throw badRequest(`Line ${index + 1}: give either a debit or a credit greater than zero.`);
    debit += line.debit;
    credit += line.credit;
  }
  if (debit !== credit) {
    throw unprocessable(
      `The entry is not balanced: debits ${formatAmount(debit, units)}, credits ${formatAmount(credit, units)}.`,
    );
  }
}

async function findByIdempotencyKey(db: Db | Tx, entityId: string, key: string) {
  const { rows } = await db.query<{ id: string; request_hash: Buffer | null }>(
    "select id, request_hash from journal_entries where entity_id = $1 and idempotency_key = $2",
    [entityId, key],
  );
  return rows[0];
}

async function insertLines(tx: Tx, entity: EntityContext, entryId: string, lines: DraftLine[]): Promise<void> {
  for (const [index, line] of lines.entries()) {
    await tx.query(
      `insert into journal_lines (entry_id, entity_id, line_no, account_id, debit_minor, credit_minor, currency, memo)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entryId,
        entity.id,
        index + 1,
        line.accountId,
        line.debit.toString(),
        line.credit.toString(),
        entity.currency,
        line.memo,
      ],
    );
  }
}

function auditEntry(tx: Tx, scope: Scope, draft: DraftEntry, entry: { id: string; posted: boolean }) {
  const { id: entryId, posted } = entry;
  const action = draft.source === "reversal" ? "entry.reversed" : posted ? "entry.posted" : "entry.submitted";
  return appendAudit(tx, {
    entityId: scope.entity.id,
    actorUserId: scope.actor.userId,
    action,
    objectType: "journal_entry",
    objectId: entryId,
    reason: draft.reason,
    after: {
      date: draft.date,
      description: draft.description,
      lines: draft.lines.map((l) => ({ account: l.accountId, debit: l.debit, credit: l.credit })),
      reverses: draft.reversesEntryId,
    },
    ip: scope.actor.ip,
  });
}

async function writeEntry(tx: Tx, scope: Scope, draft: DraftEntry, status: "posted" | "submitted") {
  const { actor, entity } = scope;
  const posted = status === "posted";
  const entry = await tx.query<{ id: string }>(
    `insert into journal_entries
       (entity_id, entry_date, description, counterparty, source, status, idempotency_key, request_hash,
        reverses_entry_id, reason, created_by, posted_by, posted_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id`,
    [
      entity.id,
      draft.date,
      draft.description,
      draft.counterparty,
      draft.source,
      status,
      draft.idempotencyKey,
      draft.requestHash,
      draft.reversesEntryId,
      draft.reason,
      actor.userId,
      posted ? actor.userId : null,
      posted ? new Date() : null,
    ],
  );
  const entryId = entry.rows[0]?.id as string;
  await insertLines(tx, entity, entryId, draft.lines);
  if (draft.reversesEntryId !== null) {
    await tx.query("update journal_entries set status = 'reversed', reversed_by_entry_id = $2 where id = $1", [
      draft.reversesEntryId,
      entryId,
    ]);
  }
  await auditEntry(tx, scope, draft, { id: entryId, posted });
  return entryId;
}

/** Inserts a validated entry. Returns the existing entry when the same idempotency key and body are repeated. */
async function insertEntry(scope: Scope, draft: DraftEntry) {
  const { db, entity } = scope;
  if (draft.idempotencyKey !== null) {
    const existing = await findByIdempotencyKey(db, entity.id, draft.idempotencyKey);
    if (existing !== undefined) return replay(db, entity, existing, draft);
  }
  validateLines(draft.lines, await loadAccounts(db, entity.id), entity.minorUnits);
  const status = entity.approvalRequired && draft.source !== "reversal" ? "submitted" : "posted";
  try {
    const id = await withTransaction(db, (tx) => writeEntry(tx, scope, draft, status));
    return { entry: await getEntry(db, entity, id), created: true };
  } catch (error) {
    return recoverFromWriteError(db, entity, draft, error);
  }
}

/** A concurrent request with the same idempotency key wins the insert; database rule errors become 422. */
async function recoverFromWriteError(db: Db, entity: EntityContext, draft: DraftEntry, error: unknown) {
  const code = pgErrorCode(error);
  if (code === "23505" && draft.idempotencyKey !== null) {
    const existing = await findByIdempotencyKey(db, entity.id, draft.idempotencyKey);
    if (existing !== undefined) return replay(db, entity, existing, draft);
  }
  if (code === "23514") throw unprocessable(error instanceof Error ? error.message : "Ledger rule violated.");
  throw error;
}

async function replay(
  db: Db,
  entity: EntityContext,
  existing: { id: string; request_hash: Buffer | null },
  draft: DraftEntry,
) {
  if (
    existing.request_hash === null ||
    draft.requestHash === null ||
    !existing.request_hash.equals(draft.requestHash)
  ) {
    throw conflict("This idempotency key was already used for a different request.");
  }
  return { entry: await getEntry(db, entity, existing.id), created: false };
}

const requestHash = (kind: string, body: Record<string, unknown>) => sha256(canonicalJson({ kind, body }));

function idempotencyKey(body: Record<string, unknown>): string | null {
  return optionalText(body.idempotencyKey, "idempotencyKey", 200);
}

type TransactionKind = "income" | "expense" | "transfer";
const CATEGORY_TYPES: Record<TransactionKind, AccountType[]> = {
  income: ["income"],
  expense: ["expense"],
  transfer: ["asset", "liability"],
};

function transactionKind(value: unknown): TransactionKind {
  if (value === "income" || value === "expense" || value === "transfer") return value;
  throw badRequest('kind must be "income", "expense" or "transfer".', { kind: "Choose income, expense or transfer." });
}

function checkTransactionAccounts(
  kind: TransactionKind,
  category: AccountRow | undefined,
  funding: AccountRow | undefined,
) {
  if (category === undefined || funding === undefined) {
    throw badRequest("accountId and fundingAccountId must be accounts of this entity.");
  }
  if (!CATEGORY_TYPES[kind].includes(category.type)) {
    throw unprocessable(`accountId must be an ${CATEGORY_TYPES[kind].join(" or ")} account for ${kind}.`);
  }
  if (funding.type !== "asset" && funding.type !== "liability") {
    throw unprocessable("fundingAccountId must be an asset or liability account.");
  }
  if (category.id === funding.id) throw unprocessable("accountId and fundingAccountId must differ.");
  return { category, funding };
}

// income: money in (debit funding), income (credit). expense: expense (debit), money out (credit funding).
// transfer: money moves from the funding account to accountId (debit accountId, credit funding).
function transactionLines(
  kind: TransactionKind,
  { categoryId, fundingId }: { categoryId: string; fundingId: string },
  amount: bigint,
  memo: string | null,
): DraftLine[] {
  const [debitAccount, creditAccount] = kind === "income" ? [fundingId, categoryId] : [categoryId, fundingId];
  return [
    { accountId: debitAccount, debit: amount, credit: 0n, memo },
    { accountId: creditAccount, debit: 0n, credit: amount, memo },
  ];
}

/** Simple capture used by the apps: income, expense or transfer between two accounts. */
export async function recordTransaction(
  scope: Scope,
  body: Record<string, unknown>,
  source: "transaction" | "import" = "transaction",
) {
  const kind = transactionKind(body.kind);
  const amount = amountField(body.amount, "amount", scope.entity.minorUnits);
  if (amount === 0n) throw badRequest("amount must be greater than zero.", { amount: "Greater than zero." });
  const accounts = await loadAccounts(scope.db, scope.entity.id);
  const { category, funding } = checkTransactionAccounts(
    kind,
    accounts.get(requiredText(body.accountId, "accountId", 36)),
    accounts.get(requiredText(body.fundingAccountId, "fundingAccountId", 36)),
  );
  return insertEntry(scope, {
    date: parseDate(body.date, "date"),
    description: requiredText(body.description, "description", 500),
    counterparty: optionalText(body.counterparty, "counterparty", 200),
    source,
    lines: transactionLines(
      kind,
      { categoryId: category.id, fundingId: funding.id },
      amount,
      optionalText(body.memo, "memo", 500),
    ),
    idempotencyKey: idempotencyKey(body),
    requestHash: requestHash("transaction", body),
    reversesEntryId: null,
    reason: null,
  });
}

export async function createJournalEntry(scope: Scope, body: Record<string, unknown>) {
  const { entity } = scope;
  if (!Array.isArray(body.lines)) throw badRequest("lines must be an array.");
  const lines = body.lines.map((raw: unknown, index: number): DraftLine => {
    const line = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const debit = line.debit === undefined ? 0n : amountField(line.debit, `lines[${index}].debit`, entity.minorUnits);
    const credit =
      line.credit === undefined ? 0n : amountField(line.credit, `lines[${index}].credit`, entity.minorUnits);
    return {
      accountId: requiredText(line.accountId, `lines[${index}].accountId`, 36),
      debit,
      credit,
      memo: optionalText(line.memo, "memo", 500),
    };
  });
  return insertEntry(scope, {
    date: parseDate(body.date, "date"),
    description: requiredText(body.description, "description", 500),
    counterparty: optionalText(body.counterparty, "counterparty", 200),
    source: "manual",
    lines,
    idempotencyKey: idempotencyKey(body),
    requestHash: requestHash("journal", body),
    reversesEntryId: null,
    reason: null,
  });
}

interface EntryRow {
  id: string;
  entry_date: Date | string;
  description: string;
  counterparty: string | null;
  source: string;
  status: string;
  reverses_entry_id: string | null;
  reversed_by_entry_id: string | null;
  reason: string | null;
  created_by: string;
  created_at: Date;
  posted_by: string | null;
  posted_at: Date | null;
}

const dateText = (value: Date | string) => (typeof value === "string" ? value : value.toISOString().slice(0, 10));

export async function getEntry(db: Db | Tx, entity: EntityContext, entryId: string) {
  const { rows } = await db.query<EntryRow>(
    `select id, to_char(entry_date, 'YYYY-MM-DD') as entry_date, description, counterparty, source, status, reverses_entry_id,
            reversed_by_entry_id, reason, created_by, created_at, posted_by, posted_at
       from journal_entries where entity_id = $1 and id = $2`,
    [entity.id, entryId],
  );
  const row = rows[0];
  if (row === undefined) throw notFound("Journal entry not found.");
  const lines = await db.query<{
    line_no: number;
    account_id: string;
    code: string;
    name: string;
    debit_minor: string;
    credit_minor: string;
    memo: string | null;
  }>(
    `select l.line_no, l.account_id, a.code, a.name, l.debit_minor, l.credit_minor, l.memo
       from journal_lines l join accounts a on a.id = l.account_id
      where l.entry_id = $1 order by l.line_no`,
    [entryId],
  );
  const units = entity.minorUnits;
  const total = lines.rows.reduce((t, l) => t + BigInt(l.debit_minor), 0n);
  return {
    id: row.id,
    entityId: entity.id,
    date: dateText(row.entry_date),
    description: row.description,
    counterparty: row.counterparty,
    source: row.source,
    status: row.status,
    currency: entity.currency,
    total: formatAmount(total, units),
    lines: lines.rows.map((l) => ({
      lineNo: l.line_no,
      accountId: l.account_id,
      accountCode: l.code,
      accountName: l.name,
      debit: formatAmount(BigInt(l.debit_minor), units),
      credit: formatAmount(BigInt(l.credit_minor), units),
      memo: l.memo,
    })),
    reversesEntryId: row.reverses_entry_id,
    reversedByEntryId: row.reversed_by_entry_id,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    postedBy: row.posted_by,
    postedAt: row.posted_at?.toISOString() ?? null,
  };
}

export async function listEntries(db: Db, entity: EntityContext, query: URLSearchParams) {
  const from = query.has("from") ? parseDate(query.get("from"), "from") : "0001-01-01";
  const to = query.has("to") ? parseDate(query.get("to"), "to") : "9999-12-31";
  const limit = Math.min(Math.max(Number(query.get("limit") ?? "100") || 100, 1), 500);
  const { rows } = await db.query<{ id: string }>(
    `select id from journal_entries where entity_id = $1 and entry_date between $2 and $3
      order by entry_date desc, created_at desc limit $4`,
    [entity.id, from, to, limit],
  );
  const entries = [];
  for (const row of rows) entries.push(await getEntry(db, entity, row.id));
  return entries;
}

/** Posts a submitted entry. The approver must be a different person from the preparer (maker-checker). */
export async function decideEntry(
  { db, actor, entity }: Scope,
  entryId: string,
  decision: "approve" | "reject",
  body: Record<string, unknown>,
) {
  const reason = optionalText(body.reason, "reason", 500);
  if (decision === "reject" && reason === null)
    throw badRequest("reason is required to reject an entry.", { reason: "Required." });
  try {
    await withTransaction(db, async (tx) => {
      const { rows } = await tx.query<{ status: string; created_by: string }>(
        "select status, created_by from journal_entries where entity_id = $1 and id = $2 for update",
        [entity.id, entryId],
      );
      const row = rows[0];
      if (row === undefined) throw notFound("Journal entry not found.");
      if (row.status !== "submitted")
        throw conflict(`Only submitted entries can be decided; this one is ${row.status}.`);
      if (row.created_by === actor.userId)
        throw forbidden("The person who prepared an entry cannot approve or reject it.");
      if (decision === "approve") {
        await tx.query(
          "update journal_entries set status = 'posted', posted_by = $2, posted_at = now(), reason = $3 where id = $1",
          [entryId, actor.userId, reason],
        );
      } else {
        await tx.query("update journal_entries set status = 'rejected', reason = $2 where id = $1", [entryId, reason]);
      }
      await appendAudit(tx, {
        entityId: entity.id,
        actorUserId: actor.userId,
        action: decision === "approve" ? "entry.approved" : "entry.rejected",
        objectType: "journal_entry",
        objectId: entryId,
        reason,
        ip: actor.ip,
      });
    });
  } catch (error) {
    if (pgErrorCode(error) === "23514")
      throw unprocessable(error instanceof Error ? error.message : "Ledger rule violated.");
    throw error;
  }
  return getEntry(db, entity, entryId);
}

/** Corrects a posted entry with a linked reversing entry; the original is never edited. */
export async function reverseEntry(scope: Scope, entryId: string, body: Record<string, unknown>) {
  const { db, entity } = scope;
  const original = await getEntry(db, entity, entryId);
  if (original.status !== "posted")
    throw conflict(`Only posted entries can be reversed; this one is ${original.status}.`);
  const reason = requiredText(body.reason, "reason", 500);
  // Reversals post at once, so where approvals are required only an approver may reverse.
  if (entity.approvalRequired && !can(entity, "approve"))
    throw forbidden("Only an approver can reverse entries in this entity.");
  const units = entity.minorUnits;
  return insertEntry(scope, {
    date: body.date === undefined ? original.date : parseDate(body.date, "date"),
    description: `Pembalikan: ${original.description}`.slice(0, 500),
    counterparty: original.counterparty,
    source: "reversal",
    lines: original.lines.map((l) => ({
      accountId: l.accountId,
      debit: parseAmount(l.credit, units),
      credit: parseAmount(l.debit, units),
      memo: l.memo,
    })),
    idempotencyKey: `reversal:${entryId}`,
    requestHash: requestHash("reversal", { entryId }),
    reversesEntryId: entryId,
    reason,
  });
}

// ---- Reports and periods ----

async function movements(db: Db | Tx, entityId: string, from: string, to: string): Promise<Movement[]> {
  const { rows } = await db.query<{ account_id: string; debit: string; credit: string }>(
    `select l.account_id, sum(l.debit_minor)::text as debit, sum(l.credit_minor)::text as credit
       from journal_lines l join journal_entries e on e.id = l.entry_id
      where e.entity_id = $1 and e.status in ('posted', 'reversed') and e.entry_date between $2 and $3
      group by l.account_id`,
    [entityId, from, to],
  );
  return rows.map((r) => ({ accountId: r.account_id, debit: BigInt(r.debit), credit: BigInt(r.credit) }));
}

export function monthBounds(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(last)}` };
}

export function parseYearMonth(query: URLSearchParams) {
  const year = Number(query.get("year"));
  const month = Number(query.get("month"));
  if (!Number.isInteger(year) || year < 1900 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw badRequest("year (1900 to 9999) and month (1 to 12) are required.");
  }
  return { year, month };
}

export type ReportKind = "monthly-recap" | "monthly-trend" | "trial-balance" | "income-statement" | "balance-sheet";

/** Income, expenses and net per month for the months up to and including year-month (dashboard trend). */
async function monthlyTrend(db: Db | Tx, entity: EntityContext, query: URLSearchParams) {
  const { year, month } = parseYearMonth(query);
  const count = query.has("months") ? Number(query.get("months")) : 12;
  if (!Number.isInteger(count) || count < 1 || count > 24) throw badRequest("months must be 1 to 24.");
  const months = Array.from({ length: count }, (_, i) => {
    const offset = year * 12 + (month - 1) - (count - 1 - i);
    return { year: Math.floor(offset / 12), month: (offset % 12) + 1 };
  });
  const first = months[0] ?? { year, month };
  const { rows } = await db.query<{ y: number; m: number; type: string; amount: string }>(
    `select extract(year from e.entry_date)::int as y, extract(month from e.entry_date)::int as m, a.type,
            sum(case when a.type = 'income' then l.credit_minor - l.debit_minor else l.debit_minor - l.credit_minor end)::text as amount
       from journal_lines l join journal_entries e on e.id = l.entry_id join accounts a on a.id = l.account_id
      where e.entity_id = $1 and e.status in ('posted', 'reversed') and a.type in ('income', 'expense')
        and e.entry_date between $2 and $3
      group by 1, 2, 3`,
    [entity.id, monthBounds(first.year, first.month).from, monthBounds(year, month).to],
  );
  const amount = (y: number, m: number, type: string) =>
    BigInt(rows.find((r) => r.y === y && r.m === m && r.type === type)?.amount ?? "0");
  const units = entity.minorUnits;
  const series = months.map(({ year: y, month: m }) => {
    const income = amount(y, m, "income");
    const expenses = amount(y, m, "expense");
    return {
      year: y,
      month: m,
      income: formatAmount(income, units),
      expenses: formatAmount(expenses, units),
      net: formatAmount(income - expenses, units),
    };
  });
  const checks = [
    { name: "months_complete", passed: series.length === count, detail: `${series.length} of ${count} months` },
  ];
  return { period: { year, month, months: count }, series, checks };
}

export async function buildReport(db: Db | Tx, entity: EntityContext, kind: ReportKind, query: URLSearchParams) {
  const accounts = [...(await loadAccounts(db, entity.id)).values()];
  const units = entity.minorUnits;
  const base = {
    entityId: entity.id,
    entityName: entity.name,
    currency: entity.currency,
    generatedAt: new Date().toISOString(),
  };
  if (kind === "monthly-recap") {
    const { year, month } = parseYearMonth(query);
    const current = monthBounds(year, month);
    const previous = month === 1 ? monthBounds(year - 1, 12) : monthBounds(year, month - 1);
    const report = monthlyRecap(
      accounts,
      {
        month: await movements(db, entity.id, current.from, current.to),
        previousMonth: await movements(db, entity.id, previous.from, previous.to),
        yearToDate: await movements(db, entity.id, `${year}-01-01`, current.to),
      },
      units,
    );
    return { ...base, kind, period: { year, month, from: current.from, to: current.to }, ...report };
  }
  if (kind === "monthly-trend") return { ...base, kind, ...(await monthlyTrend(db, entity, query)) };
  if (kind === "income-statement") {
    const from = parseDate(query.get("from"), "from");
    const to = parseDate(query.get("to"), "to");
    if (from > to) throw badRequest("from must not be after to.");
    return {
      ...base,
      kind,
      period: { from, to },
      ...incomeStatement(accounts, await movements(db, entity.id, from, to), units),
    };
  }
  const asOf = parseDate(query.get("asOf"), "asOf");
  const upToAsOf = await movements(db, entity.id, "0001-01-01", asOf);
  if (kind === "trial-balance") return { ...base, kind, asOf, ...trialBalance(accounts, upToAsOf, units) };
  return { ...base, kind, asOf, ...balanceSheet(accounts, upToAsOf, units) };
}

export async function listPeriods(db: Db, entity: EntityContext) {
  const { rows } = await db.query<{
    year: number;
    month: number;
    status: string;
    changed_at: Date;
    reason: string | null;
  }>(
    "select year, month, status, changed_at, reason from periods where entity_id = $1 order by year desc, month desc",
    [entity.id],
  );
  return rows.map((r) => ({
    year: r.year,
    month: r.month,
    status: r.status,
    changedAt: r.changed_at.toISOString(),
    reason: r.reason,
  }));
}

/** Closes a month: no pending entries, every report passes its checks, snapshots stored with content hashes. */
export async function closePeriod({ db, actor, entity }: Scope, year: number, month: number) {
  const { from, to } = monthBounds(year, month);
  return withTransaction(db, async (tx) => {
    await tx.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`period:${entity.id}`]);
    const current = await tx.query<{ status: string }>(
      "select status from periods where entity_id = $1 and year = $2 and month = $3",
      [entity.id, year, month],
    );
    if (current.rows[0]?.status === "closed")
      throw conflict(`${year}-${String(month).padStart(2, "0")} is already closed.`);
    const pending = await tx.query<{ n: string }>(
      "select count(*)::text as n from journal_entries where entity_id = $1 and status = 'submitted' and entry_date between $2 and $3",
      [entity.id, from, to],
    );
    if (pending.rows[0]?.n !== "0")
      throw unprocessable(`${pending.rows[0]?.n} entries in this month still wait for approval.`);
    const params = (pairs: Record<string, string>) => new URLSearchParams(pairs);
    const reports = [
      await buildReport(tx, entity, "monthly-recap", params({ year: String(year), month: String(month) })),
      await buildReport(tx, entity, "income-statement", params({ from, to })),
      await buildReport(tx, entity, "trial-balance", params({ asOf: to })),
      await buildReport(tx, entity, "balance-sheet", params({ asOf: to })),
    ];
    const failed = reports.filter((r) => !allChecksPass(r));
    if (failed.length > 0)
      throw unprocessable(`Report checks failed: ${failed.map((r) => r.kind).join(", ")}. The month stays open.`);
    const snapshots = [];
    for (const report of reports) {
      const hash = sha256(canonicalJson(report));
      const { rows } = await tx.query<{ id: string }>(
        "insert into report_snapshots (entity_id, kind, year, month, result, content_hash, created_by) values ($1, $2, $3, $4, $5, $6, $7) returning id",
        [entity.id, report.kind, year, month, canonicalJson(report), hash, actor.userId],
      );
      snapshots.push({ id: rows[0]?.id as string, kind: report.kind, contentHash: hash.toString("hex") });
    }
    await tx.query(
      `insert into periods (entity_id, year, month, status, changed_by) values ($1, $2, $3, 'closed', $4)
       on conflict (entity_id, year, month) do update set status = 'closed', changed_at = now(), changed_by = $4, reason = null`,
      [entity.id, year, month, actor.userId],
    );
    await appendAudit(tx, {
      entityId: entity.id,
      actorUserId: actor.userId,
      action: "period.closed",
      objectType: "period",
      objectId: `${year}-${month}`,
      after: { snapshots },
      ip: actor.ip,
    });
    return { year, month, status: "closed", snapshots };
  });
}

export async function reopenPeriod(
  { db, actor, entity }: Scope,
  year: number,
  month: number,
  body: Record<string, unknown>,
) {
  const reason = requiredText(body.reason, "reason", 500);
  return withTransaction(db, async (tx) => {
    const { rowCount } = await tx.query(
      "update periods set status = 'open', changed_at = now(), changed_by = $4, reason = $5 where entity_id = $1 and year = $2 and month = $3 and status = 'closed'",
      [entity.id, year, month, actor.userId, reason],
    );
    if (rowCount === 0) throw conflict("Only a closed month can be reopened.");
    await appendAudit(tx, {
      entityId: entity.id,
      actorUserId: actor.userId,
      action: "period.reopened",
      objectType: "period",
      objectId: `${year}-${month}`,
      reason,
      ip: actor.ip,
    });
    return { year, month, status: "open" };
  });
}

/** Snapshots of a closed month with their stored hashes, recomputed so a reader can cross-check them. */
export async function listSnapshots(db: Db, entity: EntityContext, year: number, month: number) {
  const { rows } = await db.query<{
    id: string;
    kind: string;
    result: unknown;
    content_hash: Buffer;
    created_at: Date;
  }>(
    "select id, kind, result, content_hash, created_at from report_snapshots where entity_id = $1 and year = $2 and month = $3 order by created_at, kind",
    [entity.id, year, month],
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    createdAt: r.created_at.toISOString(),
    contentHash: r.content_hash.toString("hex"),
    hashVerified: sha256(canonicalJson(r.result)).equals(r.content_hash),
    report: r.result,
  }));
}

export async function getSnapshot(db: Db, entity: EntityContext, snapshotId: string) {
  const { rows } = await db.query<{
    id: string;
    result: Record<string, unknown>;
    content_hash: Buffer;
    created_at: Date;
  }>("select id, result, content_hash, created_at from report_snapshots where entity_id = $1 and id = $2", [
    entity.id,
    snapshotId,
  ]);
  const row = rows[0];
  if (row === undefined) throw notFound("Snapshot not found.");
  if (!sha256(canonicalJson(row.result)).equals(row.content_hash))
    throw unprocessable("The snapshot does not match its stored hash.");
  return {
    id: row.id,
    report: row.result,
    contentHash: row.content_hash.toString("hex"),
    createdAt: row.created_at.toISOString(),
  };
}
