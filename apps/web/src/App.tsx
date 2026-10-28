import type { ReactNode } from "react";
import { api, type Me } from "./api.ts";
import { DeviceStatus } from "./components/DeviceStatus.tsx";
import { Loading, Status } from "./components/Status.tsx";
import { useAsync, useRoute } from "./lib/hooks.ts";
import { deviceState } from "./lib/offline.ts";
import { CapturePage } from "./pages/CapturePage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { ImportPage } from "./pages/ImportPage.tsx";
import { JournalPage } from "./pages/JournalPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { ReportsPage } from "./pages/ReportsPage.tsx";
import { SecurityPage } from "./pages/SecurityPage.tsx";

const NAV = [
  { path: "/", label: "Dasbor" },
  { path: "/catat", label: "Catat" },
  { path: "/jurnal", label: "Jurnal" },
  { path: "/laporan", label: "Laporan" },
  { path: "/impor", label: "Impor" },
  { path: "/keamanan", label: "Keamanan" },
];

async function loadMe(): Promise<Me | null> {
  try {
    return await api.me();
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 401) return null;
    throw error;
  }
}

function page(route: string, me: Me, reload: () => void): ReactNode {
  const entityId = me.entities[0]?.id ?? "";
  switch (route) {
    case "/catat":
      return <CapturePage entityId={entityId} />;
    case "/jurnal":
      return <JournalPage entityId={entityId} />;
    case "/laporan":
      return <ReportsPage entityId={entityId} />;
    case "/impor":
      return <ImportPage entityId={entityId} />;
    case "/keamanan":
      return <SecurityPage enabled={me.twoFactorEnabled} onChange={reload} />;
    default:
      return <DashboardPage entityId={entityId} />;
  }
}

/** Signing out clears this device's copy, so it first asks before dropping unsent transactions. */
async function signOut(done: () => void) {
  const waiting = deviceState.get().queued.length;
  if (
    waiting > 0 &&
    !window.confirm(`${waiting} transaksi belum terkirim dan akan dihapus dari perangkat ini. Tetap keluar?`)
  )
    return;
  await api.logout();
  done();
}

export function App() {
  const route = useRoute();
  const me = useAsync(loadMe, "me");
  const title = NAV.find((n) => n.path === route)?.label ?? "Dasbor";
  if (me.state === "loading")
    return (
      <main id="main" tabIndex={-1}>
        <Loading what="akun" />
      </main>
    );
  if (me.state === "error")
    return (
      <main id="main" tabIndex={-1}>
        <Status kind="error">{me.error.message}</Status>
      </main>
    );
  if (me.data === null) {
    document.title = "Masuk - Keuangan";
    return <LoginPage onSignedIn={me.reload} />;
  }
  document.title = `${title} - Keuangan`;
  return (
    <>
      <button className="skip-link" type="button" onClick={() => document.getElementById("main")?.focus()}>
        Langsung ke isi
      </button>
      <header className="app-header">
        <p>
          <strong>{me.data.entities[0]?.name ?? "Keuangan"}</strong>
        </p>
        <nav className="app-nav" aria-label="Utama">
          <ul>
            {NAV.map((n) => (
              <li key={n.path}>
                <a href={`#${n.path}`} aria-current={route === n.path ? "page" : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button className="button secondary" type="button" onClick={() => signOut(me.reload)}>
          Keluar
        </button>
      </header>
      <DeviceStatus />
      {page(route, me.data, me.reload)}
    </>
  );
}
