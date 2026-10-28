// Financial reports as pure functions over account movements (rule 17 section 6). Each report
// carries its own self-checks; a report whose checks fail is not published or snapshotted.

import type { AccountType } from "./chart-template.ts";
import { formatAmount } from "./money.ts";

export interface AccountInfo {
  id: string;
  code: string;
  name: string;
  type: AccountType;
}

export interface Movement {
  accountId: string;
  debit: bigint;
  credit: bigint;
}

export interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const DEBIT_NORMAL = new Set<AccountType>(["asset", "expense"]);

function byAccount(movements: readonly Movement[]): Map<string, Movement> {
  const map = new Map<string, Movement>();
  for (const m of movements) {
    const current = map.get(m.accountId) ?? { accountId: m.accountId, debit: 0n, credit: 0n };
    current.debit += m.debit;
    current.credit += m.credit;
    map.set(m.accountId, current);
  }
  return map;
}

/** Balance in the account's normal direction: positive means a normal balance. */
function normalBalance(account: AccountInfo, movement: Movement | undefined): bigint {
  if (movement === undefined) return 0n;
  return DEBIT_NORMAL.has(account.type) ? movement.debit - movement.credit : movement.credit - movement.debit;
}

const sorted = (accounts: readonly AccountInfo[]) => [...accounts].sort((a, b) => a.code.localeCompare(b.code));
const sum = (values: readonly bigint[]) => values.reduce((total, value) => total + value, 0n);

export function trialBalance(accounts: readonly AccountInfo[], movements: readonly Movement[], units: number) {
  const moves = byAccount(movements);
  const lines = sorted(accounts)
    .map((account) => {
      const m = moves.get(account.id);
      const net = (m?.debit ?? 0n) - (m?.credit ?? 0n);
      return { account, debit: net > 0n ? net : 0n, credit: net < 0n ? -net : 0n };
    })
    .filter((line) => line.debit !== 0n || line.credit !== 0n);
  const totalDebit = sum(lines.map((l) => l.debit));
  const totalCredit = sum(lines.map((l) => l.credit));
  const checks: Check[] = [
    {
      name: "debits_equal_credits",
      passed: totalDebit === totalCredit,
      detail: `debits ${formatAmount(totalDebit, units)}, credits ${formatAmount(totalCredit, units)}`,
    },
  ];
  return {
    lines: lines.map((l) => ({
      accountId: l.account.id,
      code: l.account.code,
      name: l.account.name,
      type: l.account.type,
      debit: formatAmount(l.debit, units),
      credit: formatAmount(l.credit, units),
    })),
    totalDebit: formatAmount(totalDebit, units),
    totalCredit: formatAmount(totalCredit, units),
    checks,
  };
}

function section(accounts: readonly AccountInfo[], moves: Map<string, Movement>, type: AccountType) {
  return sorted(accounts)
    .filter((account) => account.type === type)
    .map((account) => ({ account, amount: normalBalance(account, moves.get(account.id)) }))
    .filter((line) => line.amount !== 0n);
}

function present(lines: { account: AccountInfo; amount: bigint }[], units: number) {
  return lines.map((l) => ({
    accountId: l.account.id,
    code: l.account.code,
    name: l.account.name,
    amount: formatAmount(l.amount, units),
  }));
}

export function incomeStatementTotals(accounts: readonly AccountInfo[], movements: readonly Movement[]) {
  const moves = byAccount(movements);
  const income = section(accounts, moves, "income");
  const expenses = section(accounts, moves, "expense");
  const totalIncome = sum(income.map((l) => l.amount));
  const totalExpenses = sum(expenses.map((l) => l.amount));
  return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

export function incomeStatement(accounts: readonly AccountInfo[], movements: readonly Movement[], units: number) {
  const t = incomeStatementTotals(accounts, movements);
  const checks: Check[] = [
    {
      name: "net_equals_income_minus_expenses",
      passed: t.net === sum(t.income.map((l) => l.amount)) - sum(t.expenses.map((l) => l.amount)),
      detail: `net ${formatAmount(t.net, units)}`,
    },
  ];
  return {
    income: present(t.income, units),
    expenses: present(t.expenses, units),
    totalIncome: formatAmount(t.totalIncome, units),
    totalExpenses: formatAmount(t.totalExpenses, units),
    net: formatAmount(t.net, units),
    checks,
  };
}

export function balanceSheet(accounts: readonly AccountInfo[], movements: readonly Movement[], units: number) {
  const moves = byAccount(movements);
  const assets = section(accounts, moves, "asset");
  const liabilities = section(accounts, moves, "liability");
  const equity = section(accounts, moves, "equity");
  const earnings = incomeStatementTotals(accounts, movements).net;
  const totalAssets = sum(assets.map((l) => l.amount));
  const totalLiabilities = sum(liabilities.map((l) => l.amount));
  const totalEquity = sum(equity.map((l) => l.amount)) + earnings;
  const checks: Check[] = [
    {
      name: "assets_equal_liabilities_plus_equity",
      passed: totalAssets === totalLiabilities + totalEquity,
      detail: `assets ${formatAmount(totalAssets, units)}, liabilities plus equity ${formatAmount(totalLiabilities + totalEquity, units)}`,
    },
  ];
  return {
    assets: present(assets, units),
    liabilities: present(liabilities, units),
    equity: present(equity, units),
    accumulatedEarnings: formatAmount(earnings, units),
    totalAssets: formatAmount(totalAssets, units),
    totalLiabilities: formatAmount(totalLiabilities, units),
    totalEquity: formatAmount(totalEquity, units),
    checks,
  };
}

export interface RecapInput {
  month: readonly Movement[];
  previousMonth: readonly Movement[];
  yearToDate: readonly Movement[];
}

/** Monthly income and expense recap: this month, last month, the change and the year to date, per category. */
export function monthlyRecap(accounts: readonly AccountInfo[], input: RecapInput, units: number) {
  const now = byAccount(input.month);
  const before = byAccount(input.previousMonth);
  const ytd = byAccount(input.yearToDate);
  const rows = (type: AccountType) =>
    sorted(accounts)
      .filter((account) => account.type === type)
      .map((account) => {
        const month = normalBalance(account, now.get(account.id));
        const previous = normalBalance(account, before.get(account.id));
        const yearToDate = normalBalance(account, ytd.get(account.id));
        return { account, month, previous, yearToDate };
      })
      .filter((r) => r.month !== 0n || r.previous !== 0n || r.yearToDate !== 0n);
  const income = rows("income");
  const expenses = rows("expense");
  const totalIncome = sum(income.map((r) => r.month));
  const totalExpenses = sum(expenses.map((r) => r.month));
  const statement = incomeStatementTotals(accounts, input.month);
  const show = (list: typeof income) =>
    list.map((r) => ({
      accountId: r.account.id,
      code: r.account.code,
      name: r.account.name,
      month: formatAmount(r.month, units),
      previousMonth: formatAmount(r.previous, units),
      change: formatAmount(r.month - r.previous, units),
      yearToDate: formatAmount(r.yearToDate, units),
      shareOfTotal:
        (r.account.type === "income" ? totalIncome : totalExpenses) === 0n
          ? "0.00"
          : formatAmount((r.month * 10_000n) / (r.account.type === "income" ? totalIncome : totalExpenses), 2),
    }));
  const checks: Check[] = [
    {
      name: "recap_matches_income_statement",
      passed: totalIncome - totalExpenses === statement.net,
      detail: `recap net ${formatAmount(totalIncome - totalExpenses, units)}, income statement net ${formatAmount(statement.net, units)}`,
    },
  ];
  return {
    income: show(income),
    expenses: show(expenses),
    totalIncome: formatAmount(totalIncome, units),
    totalExpenses: formatAmount(totalExpenses, units),
    net: formatAmount(totalIncome - totalExpenses, units),
    savingsRate: totalIncome === 0n ? "0.00" : formatAmount(((totalIncome - totalExpenses) * 10_000n) / totalIncome, 2),
    checks,
  };
}

export const allChecksPass = (report: { checks: Check[] }) => report.checks.every((check) => check.passed);
