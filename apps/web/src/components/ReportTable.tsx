import type { ReactNode } from "react";
import type { AmountLine, Report } from "../api.ts";
import { monthLabel } from "../lib/dates.ts";
import { Money } from "./Money.tsx";
import { TableWrap } from "./TableWrap.tsx";

function AmountRows({ title, lines, total }: { title: string; lines: AmountLine[]; total: string }) {
  return (
    <tbody>
      <tr>
        <th scope="rowgroup" colSpan={2}>
          {title}
        </th>
      </tr>
      {lines.map((l) => (
        <tr key={l.accountId || l.name}>
          <td>
            {l.code} {l.name}
          </td>
          <td className="num">
            <Money amount={l.amount} />
          </td>
        </tr>
      ))}
      <tr>
        <th scope="row">Total {title.toLowerCase()}</th>
        <td className="num">
          <strong>
            <Money amount={total} />
          </strong>
        </td>
      </tr>
    </tbody>
  );
}

function TwoColumn({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <TableWrap label={caption}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Akun</th>
            <th scope="col" className="num">
              Jumlah
            </th>
          </tr>
        </thead>
        {children}
      </table>
    </TableWrap>
  );
}

/** Renders any report kind as accessible tables with captions and row headers. */
export function ReportTable({ report }: { report: Report }) {
  switch (report.kind) {
    case "balance-sheet":
      return (
        <TwoColumn caption={`Neraca per ${report.asOf}`}>
          <AmountRows title="Aset" lines={report.assets} total={report.totalAssets} />
          <AmountRows title="Liabilitas" lines={report.liabilities} total={report.totalLiabilities} />
          <AmountRows
            title="Ekuitas"
            lines={[
              ...report.equity,
              {
                accountId: "",
                code: "",
                name: "Akumulasi selisih pemasukan dan pengeluaran",
                amount: report.accumulatedEarnings,
              },
            ]}
            total={report.totalEquity}
          />
        </TwoColumn>
      );
    case "income-statement":
      return (
        <TwoColumn caption="Laba rugi">
          <AmountRows title="Pemasukan" lines={report.income} total={report.totalIncome} />
          <AmountRows title="Pengeluaran" lines={report.expenses} total={report.totalExpenses} />
          <tbody>
            <tr>
              <th scope="row">Selisih</th>
              <td className="num">
                <strong>
                  <Money amount={report.net} />
                </strong>
              </td>
            </tr>
          </tbody>
        </TwoColumn>
      );
    case "trial-balance":
      return (
        <TableWrap label="Tabel neraca saldo">
          <table>
            <caption>Neraca saldo per {report.asOf}</caption>
            <thead>
              <tr>
                <th scope="col">Akun</th>
                <th scope="col" className="num">
                  Debit
                </th>
                <th scope="col" className="num">
                  Kredit
                </th>
              </tr>
            </thead>
            <tbody>
              {report.lines.map((l) => (
                <tr key={l.code}>
                  <td>
                    {l.code} {l.name}
                  </td>
                  <td className="num">
                    <Money amount={l.debit} />
                  </td>
                  <td className="num">
                    <Money amount={l.credit} />
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row">Total</th>
                <td className="num">
                  <strong>
                    <Money amount={report.totalDebit} />
                  </strong>
                </td>
                <td className="num">
                  <strong>
                    <Money amount={report.totalCredit} />
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </TableWrap>
      );
    case "monthly-trend":
      return (
        <TableWrap label="Tabel tren bulanan">
          <table>
            <caption>Tren bulanan</caption>
            <thead>
              <tr>
                <th scope="col">Bulan</th>
                <th scope="col" className="num">
                  Pemasukan
                </th>
                <th scope="col" className="num">
                  Pengeluaran
                </th>
                <th scope="col" className="num">
                  Selisih
                </th>
              </tr>
            </thead>
            <tbody>
              {report.series.map((p) => (
                <tr key={`${p.year}-${p.month}`}>
                  <th scope="row">{monthLabel(p.year, p.month)}</th>
                  <td className="num">
                    <Money amount={p.income} />
                  </td>
                  <td className="num">
                    <Money amount={p.expenses} />
                  </td>
                  <td className="num">
                    <Money amount={p.net} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      );
    default:
      return <RecapTable report={report} />;
  }
}

function RecapTable({ report }: { report: Extract<Report, { kind: "monthly-recap" }> }) {
  const section = (title: string, rows: typeof report.income, total: string) => (
    <tbody>
      <tr>
        <th scope="rowgroup" colSpan={5}>
          {title}
        </th>
      </tr>
      {rows.map((r) => (
        <tr key={r.accountId}>
          <td>
            {r.code} {r.name}
          </td>
          <td className="num">
            <Money amount={r.month} />
          </td>
          <td className="num">
            <Money amount={r.previousMonth} />
          </td>
          <td className="num">
            <Money amount={r.yearToDate} />
          </td>
          <td className="num">{r.shareOfTotal.replace(".", ",")}%</td>
        </tr>
      ))}
      <tr>
        <th scope="row">Total {title.toLowerCase()}</th>
        <td className="num">
          <strong>
            <Money amount={total} />
          </strong>
        </td>
        <td colSpan={3} />
      </tr>
    </tbody>
  );
  return (
    <TableWrap label="Tabel rekap bulanan">
      <table>
        <caption>
          Rekap bulanan: selisih <Money amount={report.net} />, tingkat tabungan {report.savingsRate.replace(".", ",")}%
        </caption>
        <thead>
          <tr>
            <th scope="col">Akun</th>
            <th scope="col" className="num">
              Bulan ini
            </th>
            <th scope="col" className="num">
              Bulan lalu
            </th>
            <th scope="col" className="num">
              Sejak awal tahun
            </th>
            <th scope="col" className="num">
              Porsi
            </th>
          </tr>
        </thead>
        {section("Pemasukan", report.income, report.totalIncome)}
        {section("Pengeluaran", report.expenses, report.totalExpenses)}
      </table>
    </TableWrap>
  );
}
