import { useState } from "react";
import { ApiError, api, type Report, type ReportKind } from "../api.ts";
import { ReportTable } from "../components/ReportTable.tsx";
import { Loading, Status } from "../components/Status.tsx";
import { TableWrap } from "../components/TableWrap.tsx";
import { monthBounds, monthLabel, today } from "../lib/dates.ts";
import { useAsync } from "../lib/hooks.ts";

const KINDS: { kind: ReportKind; label: string }[] = [
  { kind: "monthly-recap", label: "Rekap bulanan pemasukan dan pengeluaran" },
  { kind: "income-statement", label: "Laba rugi" },
  { kind: "balance-sheet", label: "Neraca" },
  { kind: "trial-balance", label: "Neraca saldo" },
  { kind: "monthly-trend", label: "Tren 12 bulan" },
];

function paramsFor(kind: ReportKind, yearMonth: string): Record<string, string | number> {
  const { year, month, from, to } = monthBounds(yearMonth);
  if (kind === "monthly-recap") return { year, month };
  if (kind === "monthly-trend") return { year, month, months: 12 };
  if (kind === "income-statement") return { from, to };
  return { asOf: to };
}

export function ReportsPage({ entityId }: { entityId: string }) {
  const [kind, setKind] = useState<ReportKind>("monthly-recap");
  const [yearMonth, setYearMonth] = useState(today().slice(0, 7));
  const params = paramsFor(kind, yearMonth);
  const report = useAsync(() => api.report<Report>(entityId, kind, params), `${entityId}:${kind}:${yearMonth}`);
  const failed = report.state === "ready" ? report.data.checks.filter((c) => !c.passed) : [];
  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>Laporan</h1>
      <div className="grid">
        <div className="field">
          <label htmlFor="report-kind">Jenis laporan</label>
          <select id="report-kind" value={kind} onChange={(e) => setKind(e.target.value as ReportKind)}>
            {KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="report-month">Bulan</label>
          <input
            id="report-month"
            type="month"
            value={yearMonth}
            onChange={(e) => e.target.value && setYearMonth(e.target.value)}
          />
        </div>
      </div>
      <div className="actions">
        <a className="button" href={api.reportXlsxUrl(entityId, kind, params)} download>
          Unduh Excel
        </a>
      </div>
      {report.state === "loading" && <Loading what="laporan" />}
      {report.state === "error" && <Status kind="error">{report.error.message}</Status>}
      {failed.length > 0 && <Status kind="error">Pemeriksaan gagal: {failed.map((c) => c.detail).join("; ")}</Status>}
      {report.state === "ready" && failed.length === 0 && (
        <p className="hint">
          Semua pemeriksaan otomatis laporan ini lulus ({report.data.checks.map((c) => c.name).join(", ")}).
        </p>
      )}
      {report.state === "ready" && <ReportTable report={report.data} />}
      <ClosePeriod entityId={entityId} yearMonth={yearMonth} />
    </main>
  );
}

function ClosePeriod({ entityId, yearMonth }: { entityId: string; yearMonth: string }) {
  const { year, month } = monthBounds(yearMonth);
  const snapshots = useAsync(() => api.snapshots(entityId, year, month), `${entityId}:${yearMonth}`);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  async function close() {
    try {
      await api.closePeriod(entityId, year, month);
      setMessage({ kind: "info", text: `${monthLabel(year, month)} ditutup. Laporan dibekukan dengan hash SHA-256.` });
      snapshots.reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : String(caught) });
    }
  }
  return (
    <section className="card" aria-labelledby="close-heading">
      <h2 id="close-heading">Tutup bulan {monthLabel(year, month)}</h2>
      <p>
        Menutup bulan membekukan rekap, laba rugi, neraca dan neraca saldo. Setelah itu transaksi baru di bulan ini
        ditolak; koreksi dicatat di bulan yang masih terbuka.
      </p>
      {message && <Status kind={message.kind}>{message.text}</Status>}
      <button className="button" type="button" onClick={close}>
        Tutup bulan
      </button>
      {snapshots.state === "ready" && snapshots.data.length > 0 && (
        <TableWrap label="Tabel laporan beku">
          <table>
            <caption>Laporan beku bulan ini</caption>
            <thead>
              <tr>
                <th scope="col">Laporan</th>
                <th scope="col">SHA-256</th>
                <th scope="col">Cocok</th>
                <th scope="col">
                  <span className="visually-hidden">Unduh</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshots.data.map((s) => (
                <tr key={s.id}>
                  <td>{s.kind}</td>
                  <td>
                    <code className="hash">{s.contentHash}</code>
                  </td>
                  <td>
                    <span className="badge">{s.hashVerified ? "Ya" : "TIDAK"}</span>
                  </td>
                  <td>
                    <a href={api.snapshotXlsxUrl(entityId, year, month, s.id)} download>
                      Unduh Excel<span className="visually-hidden"> {s.kind}</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </section>
  );
}
