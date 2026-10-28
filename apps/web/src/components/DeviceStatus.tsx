import { useEffect, useSyncExternalStore } from "react";
import { discardQueued, syncOutbox } from "../api.ts";
import { deviceState, refreshQueue } from "../lib/offline.ts";
import { Money } from "./Money.tsx";

const SYNC_EVERY_MS = 30_000;

const savedAt = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(
    new Date(iso),
  );

/**
 * Says when the screen shows data saved on this device because the server is unreachable, and lists
 * transactions waiting to be sent. Sends them when the browser comes back online and every 30 seconds.
 */
export function DeviceStatus() {
  const state = useSyncExternalStore(deviceState.subscribe, deviceState.get);
  const pending = state.queued.filter((q) => q.status === "pending");
  const failed = state.queued.filter((q) => q.status === "failed");

  useEffect(() => {
    void refreshQueue().then(() => syncOutbox());
    const sync = () => void syncOutbox();
    window.addEventListener("online", sync);
    const timer = setInterval(sync, SYNC_EVERY_MS);
    return () => {
      window.removeEventListener("online", sync);
      clearInterval(timer);
    };
  }, []);

  if (state.offlineSince === null && state.queued.length === 0) return null;
  return (
    <section className="device-status" aria-label="Data di perangkat">
      {state.offlineSince !== null && (
        <p role="status">
          Server tidak dapat dihubungi. Data yang tampil tersimpan di perangkat ini pada {savedAt(state.offlineSince)}.
        </p>
      )}
      {pending.length > 0 && (
        <details>
          <summary>{pending.length} transaksi tersimpan di perangkat, menunggu dikirim</summary>
          <ul>
            {pending.map((q) => (
              <li key={q.key}>
                {q.body.date} · {q.body.description || "(tanpa keterangan)"} · <Money amount={q.body.amount ?? "0"} />
              </li>
            ))}
          </ul>
          <button className="button secondary" type="button" onClick={() => void syncOutbox()}>
            Kirim sekarang
          </button>
        </details>
      )}
      {failed.length > 0 && (
        <div role="alert">
          <p>{failed.length} transaksi ditolak server dan belum tercatat:</p>
          <ul>
            {failed.map((q) => (
              <li key={q.key}>
                {q.body.date} · {q.body.description || "(tanpa keterangan)"}: {q.error}{" "}
                <button className="button secondary" type="button" onClick={() => void discardQueued(q.key)}>
                  Hapus dari antrean
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
