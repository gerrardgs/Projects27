import type { ReactNode } from "react";

/** Announced politely to screen readers; errors use role="alert". */
export function Status({ kind, children }: { kind: "info" | "error"; children: ReactNode }) {
  return kind === "error" ? (
    <div className="status error" role="alert">
      {children}
    </div>
  ) : (
    <div className="status" role="status">
      {children}
    </div>
  );
}

export function Loading({ what }: { what: string }) {
  return <p role="status">Memuat {what}…</p>;
}
