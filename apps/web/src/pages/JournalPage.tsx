import { type FormEvent, useRef, useState } from "react";
import { ApiError, api, type Entry } from "../api.ts";
import { Money } from "../components/Money.tsx";
import { Loading, Status } from "../components/Status.tsx";
import { TableWrap } from "../components/TableWrap.tsx";
import { formatDate, monthBounds, today } from "../lib/dates.ts";
import { useAsync } from "../lib/hooks.ts";

const STATUS_LABEL: Record<string, string> = {
  posted: "Diposting",
  reversed: "Dibalik",
  submitted: "Menunggu persetujuan",
  rejected: "Ditolak",
};

/** Entries of one month, newest first, with reversal as the only correction. */
export function JournalPage({ entityId }: { entityId: string }) {
  const [yearMonth, setYearMonth] = useState(today().slice(0, 7));
  const { from, to } = monthBounds(yearMonth);
  const entries = useAsync(() => api.entries(entityId, from, to), `${entityId}:${yearMonth}`);
  const [target, setTarget] = useState<Entry | null>(null);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  async function reverse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (target === null) return;
    const form = new FormData(event.currentTarget);
    try {
      await api.reverse(
        entityId,
        target.id,
        String(form.get("reason") ?? ""),
        String(form.get("date") ?? "") || undefined,
      );
      setMessage({ kind: "info", text: `Transaksi "${target.description}" dibalik.` });
      entries.reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : String(caught) });
    }
    dialog.current?.close();
  }

  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>Jurnal</h1>
      <div className="field">
        <label htmlFor="journal-month">Bulan</label>
        <input
          id="journal-month"
          type="month"
          value={yearMonth}
          onChange={(e) => e.target.value && setYearMonth(e.target.value)}
        />
      </div>
      {message && <Status kind={message.kind}>{message.text}</Status>}
      {entries.state === "loading" && <Loading what="jurnal" />}
      {entries.state === "error" && <Status kind="error">{entries.error.message}</Status>}
      {entries.state === "ready" && entries.data.length === 0 && <p>Belum ada transaksi pada bulan ini.</p>}
      {entries.state === "ready" && entries.data.length > 0 && (
        <TableWrap label="Tabel jurnal">
          <table>
            <thead>
              <tr>
                <th scope="col">Tanggal</th>
                <th scope="col">Keterangan</th>
                <th scope="col">Akun (debit / kredit)</th>
                <th scope="col" className="num">
                  Jumlah
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.data.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.description}</td>
                  <td>{e.lines.map((l) => `${l.accountName} ${l.debit !== "0.00" ? "D" : "K"}`).join(" · ")}</td>
                  <td className="num">
                    <Money amount={e.total} />
                  </td>
                  <td>{STATUS_LABEL[e.status] ?? e.status}</td>
                  <td>
                    {e.status === "posted" && e.source !== "reversal" && (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          setTarget(e);
                          dialog.current?.showModal();
                        }}
                      >
                        Balik<span className="visually-hidden"> transaksi {e.description}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <dialog ref={dialog} aria-labelledby="reverse-title">
        <form onSubmit={reverse}>
          <h2 id="reverse-title">Balik transaksi</h2>
          <p>Transaksi asli tetap tercatat; pembaliknya meniadakan efeknya. Ini tidak bisa dihapus.</p>
          <div className="field">
            <label htmlFor="reason">Alasan</label>
            <input id="reason" name="reason" required maxLength={500} />
          </div>
          <div className="field">
            <label htmlFor="reverse-date">Tanggal pembalikan (kosongkan untuk tanggal asli)</label>
            <input id="reverse-date" name="date" type="date" />
          </div>
          <div className="actions">
            <button className="button" type="submit">
              Balik
            </button>
            <button className="button secondary" type="button" onClick={() => dialog.current?.close()}>
              Batal
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
