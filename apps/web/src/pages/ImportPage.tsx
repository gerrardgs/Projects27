import { type ChangeEvent, useState } from "react";
import { type Account, ApiError, api, type ImportRequest, type ImportResult } from "../api.ts";
import { Money } from "../components/Money.tsx";
import { Loading, Status } from "../components/Status.tsx";
import { TableWrap } from "../components/TableWrap.tsx";
import { useAsync } from "../lib/hooks.ts";
import { guessMapping, IMPORT_FIELDS, type ImportField } from "../lib/mapping.ts";

const FIELD_LABEL: Record<ImportField, string> = {
  date: "Tanggal (wajib)",
  description: "Keterangan (wajib)",
  amount: "Jumlah (wajib)",
  kind: "Jenis: pemasukan/pengeluaran, CR/DB",
  account: "Kode kategori",
  funding: "Kode sumber dana",
  counterparty: "Pihak lain",
};
const STATUS_LABEL = { ok: "Siap", duplicate: "Sudah pernah diimpor", error: "Galat" } as const;

async function readFile(file: File): Promise<{ format: "csv" | "xlsx"; content: string }> {
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { format: "xlsx", content: btoa(binary) };
  }
  return { format: "csv", content: await file.text() };
}

export function ImportPage({ entityId }: { entityId: string }) {
  const accounts = useAsync(() => api.accounts(entityId), entityId);
  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>Impor transaksi</h1>
      <p>
        Unggah CSV atau Excel (.xlsx) dari bank, dompet digital atau catatan sendiri. Baris pertama harus berisi judul
        kolom. Mengimpor file yang sama dua kali tidak menggandakan transaksi.
      </p>
      {accounts.state === "loading" && <Loading what="akun" />}
      {accounts.state === "error" && <Status kind="error">{accounts.error.message}</Status>}
      {accounts.state === "ready" && <ImportWizard entityId={entityId} accounts={accounts.data} />}
    </main>
  );
}

function ImportWizard({ entityId, accounts }: { entityId: string; accounts: Account[] }) {
  const [file, setFile] = useState<{ format: "csv" | "xlsx"; content: string } | null>(null);
  const [header, setHeader] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportField, string>>>({});
  const [options, setOptions] = useState({
    dateFormat: "DD/MM/YYYY" as ImportRequest["dateFormat"],
    decimalSeparator: "," as ImportRequest["decimalSeparator"],
  });
  const [defaults, setDefaults] = useState({ funding: "1200", income: "4900", expense: "5990" });
  const [result, setResult] = useState<{ committed: boolean; data: ImportResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught));
    }
  };

  const choose = (event: ChangeEvent<HTMLInputElement>) =>
    run(async () => {
      const chosen = event.target.files?.[0];
      if (chosen === undefined) return;
      const read = await readFile(chosen);
      const inspected = await api.inspectImport(entityId, read.format, read.content);
      setFile(read);
      setHeader(inspected.header);
      setMapping(guessMapping(inspected.header));
      setResult(null);
    });

  const request = (): ImportRequest => ({ ...(file ?? { format: "csv", content: "" }), ...options, mapping, defaults });
  const preview = () =>
    run(async () => setResult({ committed: false, data: await api.previewImport(entityId, request()) }));
  const commit = () =>
    run(async () => setResult({ committed: true, data: await api.commitImport(entityId, request()) }));
  const option = (types: string[]) =>
    accounts
      .filter((a) => types.includes(a.type))
      .map((a) => (
        <option key={a.id} value={a.code}>
          {a.code} {a.name}
        </option>
      ));

  return (
    <>
      {error && <Status kind="error">{error}</Status>}
      <div className="field">
        <label htmlFor="import-file">File CSV atau Excel</label>
        <input
          id="import-file"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={choose}
        />
      </div>
      {file && (
        <fieldset>
          <legend>Kolom di file</legend>
          {IMPORT_FIELDS.map((field) => (
            <div className="field" key={field}>
              <label htmlFor={`map-${field}`}>{FIELD_LABEL[field]}</label>
              <select
                id={`map-${field}`}
                value={mapping[field] ?? ""}
                onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || undefined })}
              >
                <option value="">Tidak ada</option>
                {header.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="field">
            <label htmlFor="date-format">Format tanggal</label>
            <select
              id="date-format"
              value={options.dateFormat}
              onChange={(e) => setOptions({ ...options, dateFormat: e.target.value as ImportRequest["dateFormat"] })}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (31/10/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-31)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (10/31/2026)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="decimal">Tanda desimal di file</label>
            <select
              id="decimal"
              value={options.decimalSeparator}
              onChange={(e) => setOptions({ ...options, decimalSeparator: e.target.value as "," | "." })}
            >
              <option value=",">Koma (1.250.000,50)</option>
              <option value=".">Titik (1,250,000.50)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="default-funding">Sumber dana bila tidak ada kolomnya</label>
            <select
              id="default-funding"
              value={defaults.funding}
              onChange={(e) => setDefaults({ ...defaults, funding: e.target.value })}
            >
              {option(["asset", "liability"])}
            </select>
          </div>
          <div className="field">
            <label htmlFor="default-income">Kategori pemasukan bila tidak ada kolomnya</label>
            <select
              id="default-income"
              value={defaults.income}
              onChange={(e) => setDefaults({ ...defaults, income: e.target.value })}
            >
              {option(["income"])}
            </select>
          </div>
          <div className="field">
            <label htmlFor="default-expense">Kategori pengeluaran bila tidak ada kolomnya</label>
            <select
              id="default-expense"
              value={defaults.expense}
              onChange={(e) => setDefaults({ ...defaults, expense: e.target.value })}
            >
              {option(["expense"])}
            </select>
          </div>
          <div className="actions">
            <button className="button secondary" type="button" onClick={preview}>
              Pratinjau
            </button>
            <button
              className="button"
              type="button"
              onClick={commit}
              disabled={result === null || result.committed || result.data.summary.ok === 0}
            >
              Impor {result && !result.committed ? `${result.data.summary.ok} baris` : ""}
            </button>
          </div>
        </fieldset>
      )}
      {result && <ImportSummary result={result} />}
    </>
  );
}

function ImportSummary({ result }: { result: { committed: boolean; data: ImportResult } }) {
  const { summary, rows } = result.data;
  return (
    <section aria-labelledby="import-result">
      <h2 id="import-result">{result.committed ? "Hasil impor" : "Pratinjau"}</h2>
      <Status kind={summary.error > 0 ? "error" : "info"}>
        {summary.total} baris: {summary.ok} {result.committed ? "diimpor" : "siap"}, {summary.duplicate} sudah ada,{" "}
        {summary.error} galat.
      </Status>
      <TableWrap label="Tabel hasil impor">
        <table>
          <thead>
            <tr>
              <th scope="col">Baris</th>
              <th scope="col">Status</th>
              <th scope="col">Tanggal</th>
              <th scope="col">Keterangan</th>
              <th scope="col">Jenis</th>
              <th scope="col" className="num">
                Jumlah
              </th>
              <th scope="col">Akun</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.row}>
                <td>{r.row}</td>
                <td>
                  {STATUS_LABEL[r.status]}
                  {r.message ? `: ${r.message}` : ""}
                </td>
                <td>{r.date ?? ""}</td>
                <td>{r.description ?? ""}</td>
                <td>{r.kind ?? ""}</td>
                <td className="num">{r.amount ? <Money amount={r.amount} /> : ""}</td>
                <td>
                  {r.accountCode ?? ""} / {r.fundingCode ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </section>
  );
}
