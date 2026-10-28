import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
};

/** The current hash route, for example "/laporan" for "#/laporan". */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash.replace(/^#/, "") || "/");
}

export type Async<T> = { state: "loading" } | { state: "ready"; data: T } | { state: "error"; error: Error };

export interface LoadRequest {
  key: string;
  attempt: number;
}

/** Loads data when `key` changes; `reload` runs it again (for example after saving) with a new attempt number. */
export function useAsync<T>(
  load: (request: LoadRequest) => Promise<T>,
  key: string,
): Async<T> & { reload: () => void } {
  const [result, setResult] = useState<Async<T>>({ state: "loading" });
  const [round, setRound] = useState(0);
  // The latest loader is kept in a ref, so the effect reruns only when `key` or `round` changes.
  const loader = useRef(load);
  loader.current = load;
  useEffect(() => {
    let current = true;
    setResult({ state: "loading" });
    loader.current({ key, attempt: round }).then(
      (data) => current && setResult({ state: "ready", data }),
      (error: unknown) =>
        current && setResult({ state: "error", error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      current = false;
    };
  }, [key, round]);
  const reload = useCallback(() => setRound((n) => n + 1), []);
  return { ...result, reload };
}
