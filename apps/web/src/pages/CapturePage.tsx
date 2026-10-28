import { type FormEvent, useEffect, useRef, useState } from "react";
import { type Account, ApiError, api, type CaptureDraft, type Entry, saveTransaction } from "../api.ts";
import { Money } from "../components/Money.tsx";
import { Loading, Status } from "../components/Status.tsx";
import { today } from "../lib/dates.ts";
import { useAsync } from "../lib/hooks.ts";
import { parseRupiahInput, toInputAmount } from "../lib/money.ts";
import { listen, speechSupported } from "../lib/speech.ts";

type Kind = "expense" | "income" | "transfer";
const KIND_LABEL: Record<Kind, string> = { expense: "Pengeluaran", income: "Pemasukan", transfer: "Pindah dana" };

interface Form {
  kind: Kind;
  amount: string;
  date: string;
  accountId: string;
  fundingAccountId: string;
  description: string;
  counterparty: string;
}

const usable = (accounts: Account[], types: string[]) =>
  accounts.filter((a) => a.active && a.postable && types.includes(a.type));
const categoryTypes = (kind: Kind) => (kind === "transfer" ? ["asset", "liability"] : [kind]);

function emptyForm(accounts: Account[]): Form {
  return {
    kind: "expense",
    amount: "",
    date: today(),
    accountId: usable(accounts, ["expense"])[0]?.id ?? "",
    fundingAccountId: usable(accounts, ["asset", "liability"])[0]?.id ?? "",
    description: "",
    counterparty: "",
  };
}

/** Keeps every field the draft did not fill, so a partial result never erases what the person typed. */
function applyDraft(form: Form, draft: CaptureDraft): Form {
  return {
    kind: draft.kind,
    amount: draft.amount === null ? form.amount : toInputAmount(draft.amount),
    date: draft.date,
    accountId: draft.accountId ?? "",
    fundingAccountId: draft.fundingAccountId ?? form.fundingAccountId,
    description: draft.description ?? form.description,
    counterparty: draft.counterparty ?? form.counterparty,
  };
}

/** The fields the draft filled that the person changed before Simpan; what the quality report counts. */
export function changedFields(form: Form, draft: CaptureDraft, amount: string): string[] {
  const pairs: [string, string | null, string][] = [
    ["kind", draft.kind, form.kind],
    ["amount", draft.amount, amount],
    ["date", draft.date, form.date],
    ["accountId", draft.accountId, form.accountId],
    ["fundingAccountId", draft.fundingAccountId, form.fundingAccountId],
    ["description", draft.description, form.description.trim()],
    ["counterparty", draft.counterparty, form.counterparty.trim()],
  ];
  return pairs.filter(([, filled, now]) => filled !== null && filled !== "" && filled !== now).map(([f]) => f);
}

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

/** How often filled forms were saved without correction, from this person's own use. */
function CaptureQualityNote({ entityId, round }: { entityId: string; round: number }) {
  const quality = useAsync(() => api.captureQuality(entityId), `${entityId}:${round}`);
  if (quality.state !== "ready" || quality.data.saved === 0) return null;
  const { count, of, rate, ci95 } = quality.data.savedWithoutChanges;
  return (
    <p className="hint">
      Ketepatan isi otomatis ({quality.data.days} hari terakhir): {count} dari {of} formulir disimpan tanpa koreksi
      {rate === null ? "" : ` (${percent(rate)}; rentang 95%: ${percent(ci95[0])}–${percent(ci95[1])})`}.
    </p>
  );
}

/** Quick capture of one income, expense or transfer, by voice, by sentence or field by field. */
export function CapturePage({ entityId }: { entityId: string }) {
  const accounts = useAsync(() => api.accounts(entityId), entityId);
  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>Catat transaksi</h1>
      {accounts.state === "loading" && <Loading what="akun" />}
      {accounts.state === "error" && <Status kind="error">{accounts.error.message}</Status>}
      {accounts.state === "ready" && <CaptureForm entityId={entityId} accounts={accounts.data} />}
    </main>
  );
}

type Phase =
  | { name: "idle" }
  | { name: "listening"; recording: boolean; heard: string }
  | { name: "processing"; text: string };

/** A visible sign that the microphone is recording, with the elapsed time. */
function RecordingIndicator({ recording }: { recording: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(timer);
  }, [recording]);
  if (!recording) return <p className="recording">Menyalakan mikrofon…</p>;
  return (
    <p className="recording" data-testid="recording-indicator">
      <span className="recording-dot" aria-hidden="true" />
      <strong>Merekam</strong>
      <span aria-hidden="true">
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </span>
    </p>
  );
}

function VoiceCapture({
  entityId,
  onDraft,
}: {
  entityId: string;
  onDraft: (draft: CaptureDraft, text: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [sentence, setSentence] = useState("");
  const stop = useRef<() => void>(() => undefined);

  async function fill(text: string) {
    if (text.trim() === "") {
      setPhase({ name: "idle" });
      setError("Tidak ada kalimat yang terdengar. Coba lagi.");
      return;
    }
    setPhase({ name: "processing", text });
    try {
      onDraft(await api.parseCapture(entityId, text), text);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught));
    }
    setPhase({ name: "idle" });
  }

  function start() {
    setError(null);
    setPhase({ name: "listening", recording: false, heard: "" });
    stop.current = listen({
      onAudioStart: () => setPhase({ name: "listening", recording: true, heard: "" }),
      onInterim: (heard) => setPhase({ name: "listening", recording: true, heard }),
      onFinal: (text) => void fill(text),
      onError: (message) => {
        setError(message);
        setPhase({ name: "idle" });
      },
    });
  }

  const busy = phase.name !== "idle";
  return (
    <section className="card" aria-labelledby="voice-heading">
      <h2 id="voice-heading">Isi dengan suara atau kalimat</h2>
      <p className="hint">
        Contoh: “beli nasi padang 35 ribu pakai GoPay kemarin”. Formulir diisi otomatis; periksa dulu, lalu tekan
        Simpan.
        {speechSupported() && " Suara diproses oleh layanan pengenal suara browser Anda."}
      </p>
      <div className="actions">
        {phase.name === "listening" ? (
          <button className="button" type="button" aria-pressed="true" onClick={() => stop.current()}>
            Selesai bicara
          </button>
        ) : (
          <button
            className="button"
            type="button"
            aria-pressed="false"
            onClick={start}
            disabled={busy || !speechSupported()}
          >
            Bicara
          </button>
        )}
      </div>
      {!speechSupported() && (
        <p className="hint">Browser ini tidak mendukung pengenalan suara; ketik kalimatnya di bawah.</p>
      )}
      {phase.name === "listening" && (
        <>
          <RecordingIndicator recording={phase.recording} />
          <Status kind="info">
            {phase.recording
              ? `Mendengarkan… ${phase.heard ? `“${phase.heard}”` : "silakan bicara."}`
              : "Meminta izin dan menyalakan mikrofon…"}
          </Status>
        </>
      )}
      {phase.name === "processing" && <Status kind="info">Memproses “{phase.text}”…</Status>}
      {error && <Status kind="error">{error}</Status>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void fill(sentence);
        }}
      >
        <div className="field">
          <label htmlFor="capture-sentence">Atau ketik kalimatnya</label>
          <input
            id="capture-sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            maxLength={1000}
          />
        </div>
        <button className="button secondary" type="submit" disabled={busy}>
          Isi otomatis
        </button>
      </form>
    </section>
  );
}

function CaptureForm({ entityId, accounts }: { entityId: string; accounts: Account[] }) {
  const [form, setForm] = useState<Form>(() => emptyForm(accounts));
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState<Entry | "queued" | null>(null);
  const [round, setRound] = useState(0);
  const [filled, setFilled] = useState<{ text: string; draft: CaptureDraft } | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const amountField = useRef<HTMLInputElement>(null);
  const saveButton = useRef<HTMLButtonElement>(null);
  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));
  const categories = usable(accounts, categoryTypes(form.kind));
  const funding = usable(accounts, ["asset", "liability"]);

  function onDraft(draft: CaptureDraft, text: string) {
    setForm((current) => applyDraft(current, draft));
    setFilled({ text, draft });
    setSaved(null);
    // Move focus to what still needs attention, or to Simpan when the form is complete.
    requestAnimationFrame(() => (draft.amount === null ? amountField.current : saveButton.current)?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseRupiahInput(form.amount);
    setAmountError(amount === null ? "Tulis jumlah seperti 35.000 atau 1.250.000,50." : null);
    if (amount === null) return;
    setError(null);
    const body = {
      kind: form.kind,
      date: form.date,
      amount,
      accountId: form.accountId || (categories[0]?.id ?? ""),
      fundingAccountId: form.fundingAccountId,
      description: form.description,
      counterparty: form.counterparty,
      idempotencyKey: key,
    };
    const review = filled && { draftId: filled.draft.draftId, changed: changedFields(form, filled.draft, amount) };
    try {
      const result = await saveTransaction(entityId, body, review);
      setSaved(result.status === "saved" ? result.entry : "queued");
      setRound((n) => n + 1);
      setFilled(null);
      setKey(crypto.randomUUID());
      setForm(emptyForm(accounts));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "Error", String(caught)));
    }
  }

  return (
    <>
      <VoiceCapture entityId={entityId} onDraft={onDraft} />
      <CaptureQualityNote entityId={entityId} round={round} />
      <form onSubmit={submit} noValidate>
        {saved === "queued" && (
          <Status kind="info">
            Server tidak dapat dihubungi. Transaksi disimpan di perangkat ini dan dikirim otomatis saat server tersedia.
          </Status>
        )}
        {saved && saved !== "queued" && (
          <Status kind="info">
            Tersimpan: {saved.description}, <Money amount={saved.total} />.
          </Status>
        )}
        {filled && (
          <Status kind="info">
            Formulir terisi otomatis dari “{filled.text}” ({filled.draft.source === "ai" ? "AI" : "aturan bawaan"}).
            {filled.draft.missing.length > 0 && " Lengkapi kolom yang kosong."} Periksa lalu tekan Simpan.
            {filled.draft.note && ` ${filled.draft.note}`}
          </Status>
        )}
        {error && <Status kind="error">{error.message}</Status>}
        <fieldset>
          <legend>Jenis</legend>
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <label key={k} className="choice">
              <input
                type="radio"
                name="kind"
                value={k}
                checked={form.kind === k}
                onChange={() => set({ kind: k, accountId: usable(accounts, categoryTypes(k))[0]?.id ?? "" })}
              />
              {KIND_LABEL[k]}
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="amount">Jumlah (Rp)</label>
          <input
            id="amount"
            ref={amountField}
            inputMode="decimal"
            required
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
            aria-invalid={amountError !== null}
            aria-describedby="amount-hint amount-error"
          />
          <span id="amount-hint" className="hint">
            Contoh: 35.000 atau 1.250.000,50
          </span>
          <span id="amount-error" className="error-text">
            {amountError}
          </span>
        </div>
        <div className="field">
          <label htmlFor="date">Tanggal</label>
          <input id="date" type="date" required value={form.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="accountId">{form.kind === "transfer" ? "Ke akun" : "Kategori"}</label>
          <select id="accountId" required value={form.accountId} onChange={(e) => set({ accountId: e.target.value })}>
            {categories.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fundingAccountId">{form.kind === "income" ? "Masuk ke" : "Dari"}</label>
          <select
            id="fundingAccountId"
            required
            value={form.fundingAccountId}
            onChange={(e) => set({ fundingAccountId: e.target.value })}
          >
            {funding.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="description">Keterangan</label>
          <input
            id="description"
            required
            maxLength={500}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="counterparty">Pihak lain (opsional)</label>
          <input
            id="counterparty"
            maxLength={200}
            value={form.counterparty}
            onChange={(e) => set({ counterparty: e.target.value })}
          />
        </div>
        <button className="button" type="submit" ref={saveButton}>
          Simpan
        </button>
      </form>
    </>
  );
}
