import { useId } from "react";
import type { TrendPoint } from "../api.ts";
import { monthLabel } from "../lib/dates.ts";
import { amountForChart } from "../lib/money.ts";
import { Money } from "./Money.tsx";
import { TableWrap } from "./TableWrap.tsx";

const WIDTH = 720;
const HEIGHT = 240;
const PAD = { top: 12, right: 8, bottom: 28, left: 8 };

/** Income and expense per month as grouped bars, with a legend, a text summary and the full data table. */
export function TrendChart({ series }: { series: TrendPoint[] }) {
  const titleId = useId();
  const max = Math.max(1, ...series.flatMap((p) => [amountForChart(p.income), amountForChart(p.expenses)]));
  const slot = (WIDTH - PAD.left - PAD.right) / Math.max(series.length, 1);
  const barWidth = Math.max(4, slot * 0.35);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const y = (amount: string) => (amountForChart(amount) / max) * plotHeight;
  return (
    <figure>
      <figcaption id={titleId}>
        <h2>Tren {series.length} bulan</h2>
      </figcaption>
      <ul className="legend" aria-label="Keterangan grafik">
        <li>
          <span className="swatch income" aria-hidden="true" />
          Pemasukan (batang polos, kiri)
        </li>
        <li>
          <span className="swatch expense" aria-hidden="true" />
          Pengeluaran (batang bergaris, kanan)
        </li>
      </ul>
      <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={titleId}>
        <title>{`Tren ${series.length} bulan: pemasukan dan pengeluaran per bulan`}</title>
        <defs>
          <pattern
            id="expense-pattern"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="var(--bg)" />
            <rect width="3" height="6" fill="var(--expense)" />
          </pattern>
        </defs>
        <line className="axis" x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} />
        {series.map((p, i) => {
          const x = PAD.left + i * slot + slot / 2;
          const base = HEIGHT - PAD.bottom;
          return (
            <g key={`${p.year}-${p.month}`}>
              <rect
                className="bar-income"
                x={x - barWidth - 1}
                y={base - y(p.income)}
                width={barWidth}
                height={y(p.income)}
              />
              <rect
                className="bar-expense"
                x={x + 1}
                y={base - y(p.expenses)}
                width={barWidth}
                height={y(p.expenses)}
                stroke="var(--expense)"
              />
              <text x={x} y={HEIGHT - 10} textAnchor="middle">
                {monthLabel(p.year, p.month).slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
      <details>
        <summary>Lihat data grafik dalam tabel</summary>
        <TableWrap label="Tabel tren bulanan">
          <table>
            <caption className="visually-hidden">Pemasukan, pengeluaran dan selisih per bulan</caption>
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
              {series.map((p) => (
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
      </details>
    </figure>
  );
}
