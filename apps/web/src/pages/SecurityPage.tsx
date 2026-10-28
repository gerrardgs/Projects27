import { type FormEvent, useState } from "react";
import { ApiError, api } from "../api.ts";
import { Status } from "../components/Status.tsx";

/** Turns on two-factor sign-in with an authenticator app (RFC 6238). */
export function SecurityPage({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const fail = (caught: unknown) =>
    setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : String(caught) });

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.totpEnable(String(new FormData(event.currentTarget).get("code") ?? ""));
      setMessage({
        kind: "info",
        text: "Verifikasi dua langkah aktif. Setiap masuk akan meminta kode dari aplikasi autentikator.",
      });
      setSetup(null);
      onChange();
    } catch (caught) {
      fail(caught);
    }
  }

  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>Keamanan</h1>
      {message && <Status kind={message.kind}>{message.text}</Status>}
      <section className="card" aria-labelledby="totp-heading">
        <h2 id="totp-heading">Verifikasi dua langkah</h2>
        {enabled ? (
          <p>Aktif.</p>
        ) : (
          <>
            <p>
              Tambahkan akun ini ke aplikasi autentikator (misalnya aplikasi bawaan ponsel atau pengelola kata sandi),
              lalu masukkan kode 6 digit.
            </p>
            {!setup && (
              <button className="button" type="button" onClick={() => api.totpSetup().then(setSetup, fail)}>
                Mulai pengaturan
              </button>
            )}
            {setup && (
              <form onSubmit={enable}>
                <p>
                  Kunci rahasia: <code className="hash">{setup.secret}</code>
                </p>
                <p>
                  <a href={setup.otpauthUri}>Buka di aplikasi autentikator</a>
                </p>
                <div className="field">
                  <label htmlFor="totp-code">Kode 6 digit</label>
                  <input
                    id="totp-code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    required
                  />
                </div>
                <button className="button" type="submit">
                  Aktifkan
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
