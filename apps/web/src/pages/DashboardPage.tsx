import { useState } from "react";
import { api, type BalanceSheet, type MonthlyRecap, type MonthlyTrend } from "../api.ts";
import { CategoryBars } from "../components/CategoryBars.tsx";
import { Money } from "../components/Money.tsx";
import { Loading, Status } from "../components/Status.tsx";
import { TableWrap } from "../components/TableWrap.tsx";
import { TrendChart } from "../components/TrendChart.tsx";
import { monthBounds, monthLabel, today } from "../lib/dates.ts";
import { useAsync } from "../lib/hooks.ts";

async function loadDashboard(entityId: string, yearMonth: string) {
  const { year, month, to } = monthBounds(yearMonth);
  const [recap, trend, balances] = await Promise.all([
    api.report<MonthlyRecap>(entityId, "monthly-recap", { year, month }),
    api.report<MonthlyTrend>(entityId, "monthly-trend", { year, month, months: 12 }),
    api.report<BalanceSheet>(entityId, "balance-sheet", { asOf: to }),
  ]);
  return { recap, trend, balances, year, month };
}

export function DashboardPage({ entityId }: { entityId: string }) {
  const [yearMonth, setYearMonth] = useState(today().slice(0, 7));
  const data = useAsync(() => loadDashboard(entityId, yearMonth), `${entityId}:${yearMonth}`);
  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>Dasbor</h1>
      <div className="field">
        <label htmlFor="dashboard-month">Bulan</label>
        <input
          id="dashboard-month"
          type="month"
          value={yearMonth}
          onChange={(e) => e.target.value && setYearMonth(e.target.value)}
        />
      </div>
      {data.state === "loading" && <Loading what="dasbor" />}
      {data.state === "error" && <Status kind="error">{data.error.message}</Status>}
      {data.state === "ready" && <DashboardBody {...data.data} />}
    </main>
  );
}

function DashboardBody({ recap, trend, balances, year, month }: Awaited<ReturnType<typeof loadDashboard>>) {
  const failed = [...recap.checks, ...balances.checks].filter((c) => !c.passed);
  return (
    <>
      {failed.length > 0 && (
        <Status kind="error">Pemeriksaan laporan gagal: {failed.map((c) => c.detail).join("; ")}</Status>
      )}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading">{monthLabel(year, month)}</h2>
        <div className="grid">
          <div className="card">
            <p className="kpi-label">Pemasukan</p>
            <p className="kpi-value">
              <Money amount={recap.totalIncome} tone="income" />
            </p>
          </div>
          <div className="card">
            <p className="kpi-label">Pengeluaran</p>
            <p className="kpi-value">
              <Money amount={recap.totalExpenses} tone="expense" />
            </p>
          </div>
          <div className="card">
            <p className="kpi-label">Selisih</p>
            <p className="kpi-value">
              <Money amount={recap.net} />
            </p>
          </div>
          <div className="card">
            <p className="kpi-label">Tingkat tabungan</p>
            <p className="kpi-value">{recap.savingsRate.replace(".", ",")}%</p>
          </div>
        </div>
      </section>
      <section className="card">
        <TrendChart series={trend.series} />
      </section>
      <section className="card" aria-labelledby="category-heading">
        <h2 id="category-heading">Pengeluaran per kategori</h2>
        <CategoryBars rows={recap.expenses} total={recap.totalExpenses} />
      </section>
      <section className="card" aria-labelledby="balances-heading">
        <h2 id="balances-heading">Saldo per akhir bulan</h2>
        <TableWrap label="Tabel saldo">
          <table>
            <thead>
              <tr>
                <th scope="col">Akun</th>
                <th scope="col" className="num">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ...balances.assets.map((l) => ({ ...l, label: l.name })),
                ...balances.liabilities.map((l) => ({ ...l, label: `${l.name} (utang)` })),
              ].map((line) => (
                <tr key={line.accountId}>
                  <th scope="row">{line.label}</th>
                  <td className="num">
                    <Money amount={line.amount} />
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row">Total aset</th>
                <td className="num">
                  <strong>
                    <Money amount={balances.totalAssets} />
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      </section>
    </>
  );
}
