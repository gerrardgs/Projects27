import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fixture, postFixture } from "./fixture.ts";
import { accountIds, api, type Check, type Entry, type Harness, signUp, startHarness } from "./helpers.ts";

let h: Harness;
let token: string;
let entityId: string;
let posted: Entry[];

before(async () => {
  h = await startHarness();
  ({ token, entityId } = await signUp(h, "ledger@example.test"));
  posted = await postFixture(h, token, entityId);
});
after(() => h.close());

const report = <T>(path: string) =>
  api<T & { checks: Check[] }>(h, "GET", `/v1/entities/${entityId}/reports/${path}`, { token });
const byCode = <T extends { code: string }>(rows: T[]) => rows.map(({ code, ...rest }) => ({ code, ...rest }));

test("the monthly recap matches the independently computed sample", async () => {
  type Row = {
    code: string;
    month: string;
    previousMonth: string;
    change: string;
    yearToDate: string;
    shareOfTotal: string;
  };
  const res = await report<{
    income: Row[];
    expenses: Row[];
    totalIncome: string;
    totalExpenses: string;
    net: string;
    savingsRate: string;
  }>("monthly-recap?year=2026&month=10");
  assert.equal(res.status, 200);
  const want = fixture.expected.monthlyRecap;
  const pick = (rows: Row[]) =>
    byCode(rows).map((r) => ({
      code: r.code,
      month: r.month,
      previousMonth: r.previousMonth,
      change: r.change,
      yearToDate: r.yearToDate,
      shareOfTotal: r.shareOfTotal,
    }));
  assert.deepEqual(pick(res.body.income), want.income);
  assert.deepEqual(pick(res.body.expenses), want.expenses);
  assert.equal(res.body.totalIncome, want.totalIncome);
  assert.equal(res.body.totalExpenses, want.totalExpenses);
  assert.equal(res.body.net, want.net);
  assert.equal(res.body.savingsRate, want.savingsRate);
  assert.ok(res.body.checks.every((c) => c.passed));
});

test("the balance sheet and trial balance match the sample and pass their checks", async () => {
  type Amount = { code: string; amount: string };
  const bs = await report<{
    assets: Amount[];
    liabilities: Amount[];
    equity: Amount[];
    accumulatedEarnings: string;
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
  }>("balance-sheet?asOf=2026-10-31");
  const want = fixture.expected.balanceSheet;
  const amounts = (rows: Amount[]) => rows.map((r) => ({ code: r.code, amount: r.amount }));
  assert.deepEqual(
    { assets: amounts(bs.body.assets), liabilities: amounts(bs.body.liabilities), equity: amounts(bs.body.equity) },
    { assets: want.assets, liabilities: want.liabilities, equity: want.equity },
  );
  assert.equal(bs.body.totalAssets, want.totalAssets);
  assert.equal(bs.body.totalEquity, want.totalEquity);
  assert.equal(bs.body.accumulatedEarnings, want.accumulatedEarnings);
  assert.ok(bs.body.checks.every((c) => c.passed));

  type TbLine = { code: string; debit: string; credit: string };
  const tb = await report<{ lines: TbLine[]; totalDebit: string; totalCredit: string }>(
    "trial-balance?asOf=2026-10-31",
  );
  assert.deepEqual(
    tb.body.lines.map((l) => ({ code: l.code, debit: l.debit, credit: l.credit })),
    fixture.expected.trialBalance.lines,
  );
  assert.equal(tb.body.totalDebit, fixture.expected.trialBalance.totalDebit);
  assert.equal(tb.body.totalCredit, fixture.expected.trialBalance.totalCredit);
});

test("the income statement for October equals the recap's net", async () => {
  const res = await report<{ net: string }>("income-statement?from=2026-10-01&to=2026-10-31");
  assert.equal(res.body.net, fixture.expected.monthlyRecap.net);
});

test("repeating a request with the same idempotency key returns the same entry; a different body is a conflict", async () => {
  const ids = await accountIds(h, token, entityId);
  const body = {
    kind: "expense",
    date: "2026-10-29",
    description: "Kopi",
    accountId: ids.get("5100"),
    fundingAccountId: ids.get("1100"),
    amount: "15000.00",
    idempotencyKey: "kopi-29",
  };
  const first = await api<Entry>(h, "POST", `/v1/entities/${entityId}/transactions`, { token, body });
  const again = await api<Entry>(h, "POST", `/v1/entities/${entityId}/transactions`, { token, body });
  assert.equal(first.status, 201);
  assert.equal(again.status, 200);
  assert.equal(again.body.id, first.body.id);
  const changed = await api(h, "POST", `/v1/entities/${entityId}/transactions`, {
    token,
    body: { ...body, amount: "16000.00" },
  });
  assert.equal(changed.status, 409);
  const reversed = await api<Entry>(h, "POST", `/v1/entities/${entityId}/journal-entries/${first.body.id}/reverse`, {
    token,
    body: { reason: "Tes idempoten" },
  });
  assert.equal(reversed.status, 201);
});

test("unbalanced, one-sided and float amounts are rejected before they reach the ledger", async () => {
  const ids = await accountIds(h, token, entityId);
  const entries = `/v1/entities/${entityId}/journal-entries`;
  const unbalanced = await api(h, "POST", entries, {
    token,
    body: {
      date: "2026-10-30",
      description: "Salah",
      lines: [
        { accountId: ids.get("1100"), debit: "100.00" },
        { accountId: ids.get("4900"), credit: "90.00" },
      ],
    },
  });
  assert.equal(unbalanced.status, 422);
  assert.match(unbalanced.body.detail, /not balanced/);
  const oneLine = await api(h, "POST", entries, {
    token,
    body: { date: "2026-10-30", description: "Satu", lines: [{ accountId: ids.get("1100"), debit: "1.00" }] },
  });
  assert.equal(oneLine.status, 422);
  const float = await api(h, "POST", `/v1/entities/${entityId}/transactions`, {
    token,
    body: {
      kind: "expense",
      date: "2026-10-30",
      description: "Angka",
      accountId: ids.get("5100"),
      fundingAccountId: ids.get("1100"),
      amount: 100.5,
    },
  });
  assert.equal(float.status, 400);
  const wrongType = await api(h, "POST", `/v1/entities/${entityId}/transactions`, {
    token,
    body: {
      kind: "income",
      date: "2026-10-30",
      description: "Salah akun",
      accountId: ids.get("5100"),
      fundingAccountId: ids.get("1100"),
      amount: "1.00",
    },
  });
  assert.equal(wrongType.status, 422);
});

test("a reversal leaves the original untouched, links both, and nets to zero", async () => {
  const target = posted.find((e) => e.total === "186000.00");
  assert.ok(target);
  const res = await api<Entry>(h, "POST", `/v1/entities/${entityId}/journal-entries/${target.id}/reverse`, {
    token,
    body: { reason: "Langganan dibatalkan" },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.reversesEntryId, target.id);
  const original = await api<Entry>(h, "GET", `/v1/entities/${entityId}/journal-entries/${target.id}`, { token });
  assert.equal(original.body.status, "reversed");
  assert.equal(original.body.reversedByEntryId, res.body.id);
  assert.deepEqual(
    original.body.lines.map((l) => [l.debit, l.credit]),
    target.lines.map((l) => [l.debit, l.credit]),
  );
  const twice = await api(h, "POST", `/v1/entities/${entityId}/journal-entries/${target.id}/reverse`, {
    token,
    body: { reason: "lagi" },
  });
  assert.equal(twice.status, 409);
  const tb = await report<{ totalDebit: string; totalCredit: string }>("trial-balance?asOf=2026-10-31");
  assert.equal(tb.body.totalDebit, tb.body.totalCredit);
});

test("the database itself refuses edits, deletes and unbalanced entries", async () => {
  await assert.rejects(h.db.query("update journal_lines set debit_minor = debit_minor + 1"), /append-only/);
  await assert.rejects(h.db.query("delete from journal_entries"), /cannot be deleted/);
  await assert.rejects(h.db.query("update journal_entries set description = 'diubah'"), /immutable/);
  await assert.rejects(h.db.query("delete from audit_events"), /append-only/);
  await assert.rejects(h.db.query("truncate audit_events"), /append-only/);
  const client = await h.db.connect();
  try {
    await client.query("begin");
    const user = await client.query<{ id: string }>("select user_id as id from memberships where entity_id = $1", [
      entityId,
    ]);
    const account = await client.query<{ id: string }>(
      "select id from accounts where entity_id = $1 and code = '1100'",
      [entityId],
    );
    const entry = await client.query<{ id: string }>(
      "insert into journal_entries (entity_id, entry_date, description, source, status, created_by) values ($1, '2026-10-30', 'langsung', 'manual', 'posted', $2) returning id",
      [entityId, user.rows[0]?.id],
    );
    await client.query(
      "insert into journal_lines (entry_id, entity_id, line_no, account_id, debit_minor, currency) values ($1, $2, 1, $3, 100, 'IDR')",
      [entry.rows[0]?.id, entityId, account.rows[0]?.id],
    );
    await assert.rejects(client.query("commit"), /at least 2 are required/);

    await client.query("begin");
    const unbalanced = await client.query<{ id: string }>(
      "insert into journal_entries (entity_id, entry_date, description, source, status, created_by) values ($1, '2026-10-30', 'tidak seimbang', 'manual', 'posted', $2) returning id",
      [entityId, user.rows[0]?.id],
    );
    for (const [lineNo, debit, credit] of [
      [1, 100, 0],
      [2, 0, 99],
    ]) {
      await client.query(
        "insert into journal_lines (entry_id, entity_id, line_no, account_id, debit_minor, credit_minor, currency) values ($1, $2, $3, $4, $5, $6, 'IDR')",
        [unbalanced.rows[0]?.id, entityId, lineNo, account.rows[0]?.id, debit, credit],
      );
    }
    await assert.rejects(client.query("commit"), /not balanced/);
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
});

test("closing a month snapshots verified reports and locks the month until it is reopened with a reason", async () => {
  const close = await api<{ snapshots: { kind: string; contentHash: string }[] }>(
    h,
    "POST",
    `/v1/entities/${entityId}/periods/2026/9/close`,
    { token },
  );
  assert.equal(close.status, 200);
  assert.deepEqual(close.body.snapshots.map((s) => s.kind).sort(), [
    "balance-sheet",
    "income-statement",
    "monthly-recap",
    "trial-balance",
  ]);
  const snaps = await api<{ snapshots: { hashVerified: boolean; contentHash: string }[] }>(
    h,
    "GET",
    `/v1/entities/${entityId}/periods/2026/9/snapshots`,
    { token },
  );
  assert.ok(snaps.body.snapshots.every((s) => s.hashVerified));
  assert.deepEqual(
    snaps.body.snapshots.map((s) => s.contentHash).sort(),
    close.body.snapshots.map((s) => s.contentHash).sort(),
  );

  const ids = await accountIds(h, token, entityId);
  const late = {
    kind: "expense",
    date: "2026-09-30",
    description: "Terlambat",
    accountId: ids.get("5100"),
    fundingAccountId: ids.get("1100"),
    amount: "1000.00",
  };
  const blocked = await api(h, "POST", `/v1/entities/${entityId}/transactions`, { token, body: late });
  assert.equal(blocked.status, 422);
  assert.match(blocked.body.detail, /closed/);
  const reverseInClosed = await api(h, "POST", `/v1/entities/${entityId}/journal-entries/${posted[1]?.id}/reverse`, {
    token,
    body: { reason: "x" },
  });
  assert.equal(reverseInClosed.status, 422);

  const noReason = await api(h, "POST", `/v1/entities/${entityId}/periods/2026/9/reopen`, { token, body: {} });
  assert.equal(noReason.status, 400);
  const reopened = await api(h, "POST", `/v1/entities/${entityId}/periods/2026/9/reopen`, {
    token,
    body: { reason: "Koreksi struk" },
  });
  assert.equal(reopened.status, 200);
  assert.equal((await api(h, "POST", `/v1/entities/${entityId}/transactions`, { token, body: late })).status, 201);
});

test("the audit chain verifies, and a tampered record is detected", async () => {
  const ok = await api<{ valid: boolean; events: number }>(h, "GET", `/v1/entities/${entityId}/audit/verify`, {
    token,
  });
  assert.equal(ok.body.valid, true);
  assert.ok(ok.body.events > fixture.entries.length);
  // Simulate an attacker with database owner rights who disables the guard trigger.
  await h.db.query("alter table audit_events disable trigger audit_events_immutable");
  await h.db.query(
    "update audit_events set canonical = replace(canonical, 'entry.posted', 'entry.posted ') where seq = (select min(seq) from audit_events where action = 'entry.posted')",
  );
  await h.db.query("alter table audit_events enable trigger audit_events_immutable");
  const broken = await api<{ valid: boolean; firstInvalidSeq: string | null }>(
    h,
    "GET",
    `/v1/entities/${entityId}/audit/verify`,
    { token },
  );
  assert.equal(broken.body.valid, false);
  assert.notEqual(broken.body.firstInvalidSeq, null);
});
