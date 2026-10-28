// Data kept on this device so the app keeps working when the API or the hosting is down. IndexedDB
// holds two stores: "cache", the last good answer to every GET, shown with a notice when the server
// cannot be reached; and "outbox", transactions saved while offline, sent in order when the server is
// back. Each queued transaction keeps its idempotency key, so a retry after a lost response cannot post
// it twice. Both stores belong to the signed-in person and are cleared at sign-out.

const DB_NAME = "keuangan";
const DB_VERSION = 1;

export interface CachedResponse {
  path: string;
  data: unknown;
  savedAt: string;
}

export interface CaptureReview {
  draftId: string;
  changed: string[];
}

export interface QueuedTransaction {
  key: string;
  entityId: string;
  body: Record<string, string>;
  review: CaptureReview | null;
  createdAt: string;
  status: "pending" | "failed";
  error: string | null;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("cache", { keyPath: "path" });
      request.result.createObjectStore("outbox", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let database: Promise<IDBDatabase> | null = null;

async function run<T>(
  store: "cache" | "outbox",
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  database ??= open();
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = action(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Storage can be unavailable (private windows, blocked site data); the app then works online only.
async function safely<T>(action: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await action();
  } catch {
    return fallback;
  }
}

export const cache = {
  put: (path: string, data: unknown) =>
    safely(() => run("cache", "readwrite", (s) => s.put({ path, data, savedAt: new Date().toISOString() })), undefined),
  get: (path: string) =>
    safely(() => run<CachedResponse | undefined>("cache", "readonly", (s) => s.get(path)), undefined),
};

export const outbox = {
  add: (item: QueuedTransaction) => safely(() => run("outbox", "readwrite", (s) => s.put(item)), undefined),
  all: async () =>
    (await safely(() => run<QueuedTransaction[]>("outbox", "readonly", (s) => s.getAll()), [])).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
  remove: (key: string) => safely(() => run("outbox", "readwrite", (s) => s.delete(key)), undefined),
};

export async function clearDeviceData(): Promise<void> {
  await safely(() => run("cache", "readwrite", (s) => s.clear()), undefined);
  await safely(() => run("outbox", "readwrite", (s) => s.clear()), undefined);
  notify({ offlineSince: null, queued: [] });
}

export interface DeviceState {
  /** When the data on screen was saved, if the server could not be reached; otherwise null. */
  offlineSince: string | null;
  queued: QueuedTransaction[];
}

let state: DeviceState = { offlineSince: null, queued: [] };
const listeners = new Set<() => void>();

export function notify(patch: Partial<DeviceState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export const deviceState = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
};

export async function refreshQueue(): Promise<void> {
  notify({ queued: await outbox.all() });
}
