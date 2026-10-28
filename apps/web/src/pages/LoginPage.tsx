import { type FormEvent, useState } from "react";
import { ApiError, api } from "../api.ts";
import { Status } from "../components/Status.tsx";

async function signIn(mode: "login" | "register", form: FormData, withCode: boolean) {
  const value = (name: string) => String(form.get(name) ?? "");
  if (mode === "register") await api.register(value("email"), value("password"), value("displayName"));
  await api.login(value("email"), value("password"), withCode ? value("totp") : undefined);
}

/** Sign in or create an account. Registration creates a personal entity in rupiah. */
export function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(mode, new FormData(event.currentTarget), needsCode);
      onSignedIn();
    } catch (caught) {
      const failure = caught instanceof ApiError ? caught : new ApiError(0, "Error", String(caught));
      if (failure.title === "Second factor required") setNeedsCode(true);
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name: string) =>
    error?.fields[name] ? (
      <span id={`${name}-error`} className="error-text">
        {error.fields[name]}
      </span>
    ) : null;
  const describedBy = (name: string) => (error?.fields[name] ? `${name}-error` : undefined);

  return (
    <main id="main" tabIndex={-1} className="stack">
      <h1>{mode === "login" ? "Masuk" : "Buat akun"}</h1>
      {error && <Status kind="error">{error.message}</Status>}
      <form onSubmit={submit} noValidate>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="displayName">Nama</label>
            <input
              id="displayName"
              name="displayName"
              autoComplete="name"
              required
              aria-describedby={describedBy("displayName")}
            />
            {fieldError("displayName")}
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={describedBy("email")}
          />
          {fieldError("email")}
        </div>
        <div className="field">
          <label htmlFor="password">Kata sandi</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            aria-describedby={["password-hint", describedBy("password")].filter(Boolean).join(" ")}
          />
          {mode === "register" && (
            <span id="password-hint" className="hint">
              12 sampai 128 karakter. Pengelola kata sandi boleh dipakai.
            </span>
          )}
          {fieldError("password")}
        </div>
        {needsCode && (
          <div className="field">
            <label htmlFor="totp">Kode 6 digit dari aplikasi autentikator</label>
            <input id="totp" name="totp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required />
          </div>
        )}
        <div className="actions">
          <button className="button" type="submit" disabled={busy}>
            {mode === "login" ? "Masuk" : "Buat akun dan masuk"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
        </div>
      </form>
    </main>
  );
}
