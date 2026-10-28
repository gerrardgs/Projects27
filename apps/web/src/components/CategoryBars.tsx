import type { CSSProperties } from "react";
import type { RecapRow } from "../api.ts";
import { Money } from "./Money.tsx";
import { TableWrap } from "./TableWrap.tsx";

/** Spending per category: a table whose bar column is decoration; the amount and share are text. */
export function CategoryBars({ rows, total }: { rows: RecapRow[]; total: string }) {
  const sorted = [...rows]
    .filter((r) => r.month !== "0.00")
    .sort((a, b) => Number(b.shareOfTotal) - Number(a.shareOfTotal));
  if (sorted.length === 0) return <p>Belum ada pengeluaran bulan ini.</p>;
  return (
    <TableWrap label="Tabel pengeluaran per kategori">
      <table>
        <caption className="visually-hidden">
          Pengeluaran per kategori, total <Money amount={total} />
        </caption>
        <thead>
          <tr>
            <th scope="col">Kategori</th>
            <th scope="col" className="num">
              Jumlah
            </th>
            <th scope="col" className="num">
              Porsi
            </th>
            <th scope="col">
              <span className="visually-hidden">Grafik porsi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.accountId}>
              <th scope="row">{r.name}</th>
              <td className="num">
                <Money amount={r.month} />
              </td>
              <td className="num">{r.shareOfTotal.replace(".", ",")}%</td>
              <td className="meter-cell">
                <span
                  className="meter"
                  style={{ "--share": `${Math.min(100, Number(r.shareOfTotal))}%` } as CSSProperties}
                  aria-hidden="true"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
