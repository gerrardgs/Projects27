// Typed client for the core API (packages/contract/openapi.json). The session is the HttpOnly cookie
// set at sign-in; JavaScript never sees the token. GET answers are kept on the device and shown when the
// server cannot be reached; transactions saved then wait in the outbox (lib/offline.ts).

import {
  type CaptureReview,
  cache,
  clearDeviceData,
  notify,
  outbox,
  type QueuedTransaction,
  refreshQueue,
} from "./lib/offline.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly fields: Record<string, string>;

  constructor(status: number, title: string, detail: string, fields: Record<string, string> = {}) {
    super(detail);
    this.status = status;
    this.title = title;
    this.fields = fields;
  }
}

const UNREACHABLE =
  "Server API tidak dapat dihubungi. Pastikan API berjalan (di apps/api: npm run dev), lalu muat ulang halaman.";

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "Unreachable", UNREACHABLE);
  }
}

/** True when the server could not be reached, as opposed to answering with an error. */
export const isUnreachable = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || (error.status >= 502 && error.status <= 504));

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (method !== "GET") return fetchJson<T>(method, path, body);
  try {
    const data = await fetchJson<T>(method, path);
    void cache.put(path, data);
    notify({ offlineSince: null });
    return data;
  } catch (error) {
    const saved = isUnreachable(error) ? await cache.get(path) : undefined;
    if (saved === undefined) throw error;
    notify({ offlineSince: saved.savedAt });
    return saved.data as T;
  }
}

async function fetchJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(method, path, body);
  // 502 to 504 come from the dev proxy or a gateway when the API itself is down.
  if (response.status >= 502 && response.status <= 504) throw new ApiError(response.status, "Unreachable", UNREACHABLE);
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = (data ?? {}) as { title?: string; detail?: string; errors?: Record<string, string> };
    throw new ApiError(
      response.status,
      problem.title ?? "Error",
      problem.detail ?? `HTTP ${response.status}`,
      problem.errors,
    );
  }
  return data as T;
}

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  postable: boolean;
  active: boolean;
}
export interface Me {
  id: string;
  email: string;
  displayName: string;
  twoFactorEnabled: boolean;
  entities: { id: string; name: string; kind: string; currency: string; role: string }[];
}
export interface Line {
  lineNo: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  memo: string | null;
}
export interface Entry {
  id: string;
  date: string;
  description: string;
  counterparty: string | null;
  source: string;
  status: string;
  total: string;
  lines: Line[];
  reversesEntryId: string | null;
  reversedByEntryId: string | null;
}
export interface Check {
  name: string;
  passed: boolean;
  detail: string;
}
export interface RecapRow {
  accountId: string;
  code: string;
  name: string;
  month: string;
  previousMonth: string;
  change: string;
  yearToDate: string;
  shareOfTotal: string;
}
export interface MonthlyRecap {
  kind: "monthly-recap";
  income: RecapRow[];
  expenses: RecapRow[];
  totalIncome: string;
  totalExpenses: string;
  net: string;
  savingsRate: string;
  checks: Check[];
}
export interface TrendPoint {
  year: number;
  month: number;
  income: string;
  expenses: string;
  net: string;
}
export interface MonthlyTrend {
  kind: "monthly-trend";
  series: TrendPoint[];
  checks: Check[];
}
export interface AmountLine {
  accountId: string;
  code: string;
  name: string;
  amount: string;
}
export interface BalanceSheet {
  kind: "balance-sheet";
  asOf: string;
  assets: AmountLine[];
  liabilities: AmountLine[];
  equity: AmountLine[];
  accumulatedEarnings: string;
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  checks: Check[];
}
export interface IncomeStatement {
  kind: "income-statement";
  income: AmountLine[];
  expenses: AmountLine[];
  totalIncome: string;
  totalExpenses: string;
  net: string;
  checks: Check[];
}
export interface TrialBalance {
  kind: "trial-balance";
  asOf: string;
  lines: { code: string; name: string; debit: string; credit: string }[];
  totalDebit: string;
  totalCredit: string;
  checks: Check[];
}
export type Report = MonthlyRecap | MonthlyTrend | BalanceSheet | IncomeStatement | TrialBalance;
export type ReportKind = Report["kind"];
export interface Snapshot {
  id: string;
  kind: string;
  createdAt: string;
  contentHash: string;
  hashVerified: boolean;
}
export interface Period {
  year: number;
  month: number;
  status: "open" | "closed";
  changedAt: string;
  reason: string | null;
}
export interface ImportRow {
  row: number;
  status: "ok" | "duplicate" | "error";
  message: string | null;
  date: string | null;
  description: string | null;
  kind: string | null;
  amount: string | null;
  accountCode: string | null;
  fundingCode: string | null;
}
export interface ImportResult {
  summary: { total: number; ok: number; duplicate: number; error: number };
  rows: ImportRow[];
}
export interface CaptureDraft {
  draftId: string;
  kind: "income" | "expense" | "transfer";
  amount: string | null;
  date: string;
  accountId: string | null;
  accountCode: string | null;
  fundingAccountId: string | null;
  fundingCode: string | null;
  description: string | null;
  counterparty: string | null;
  source: "ai" | "rules";
  model: string | null;
  missing: string[];
  note: string | null;
}
export interface QualityRate {
  count: number;
  of: number;
  rate: number | null;
  ci95: [number, number];
}
export interface CaptureQuality {
  days: number;
  drafts: number;
  saved: number;
  savedWithoutChanges: QualityRate;
  fields: { field: string; kept: QualityRate }[];
  latencyMs: { p50: number; p95: number };
}
export interface ImportRequest {
  format: "csv" | "xlsx";
  content: string;
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  decimalSeparator: "," | ".";
  mapping: Partial<Record<string, string>>;
  defaults: { funding: string; income: string; expense: string };
}

const entity = (id: string) => `/v1/entities/${encodeURIComponent(id)}`;
const query = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();

export const api = {
  me: () => request<Me>("GET", "/v1/me"),
  register: (email: string, password: string, displayName: string) =>
    request<{ entityId: string }>("POST", "/v1/auth/register", { email, password, displayName }),
  login: (email: string, password: string, totp?: string) =>
    request<{ expiresAt: string }>("POST", "/v1/auth/login", {
      email,
      password,
      client: "web",
      ...(totp ? { totp } : {}),
    }),
  logout: async () => {
    await request<void>("POST", "/v1/auth/logout").catch((error: unknown) => {
      if (!isUnreachable(error)) throw error;
    });
    await clearDeviceData();
  },
  totpSetup: () => request<{ secret: string; otpauthUri: string }>("POST", "/v1/auth/totp/setup"),
  totpEnable: (code: string) => request<void>("POST", "/v1/auth/totp/enable", { code }),
  accounts: (id: string) => request<{ accounts: Account[] }>("GET", `${entity(id)}/accounts`).then((r) => r.accounts),
  recordTransaction: (id: string, body: Record<string, string>) =>
    request<Entry>("POST", `${entity(id)}/transactions`, body),
  entries: (id: string, from: string, to: string) =>
    request<{ entries: Entry[] }>("GET", `${entity(id)}/journal-entries?${query({ from, to, limit: 500 })}`).then(
      (r) => r.entries,
    ),
  reverse: (id: string, entryId: string, reason: string, date?: string) =>
    request<Entry>("POST", `${entity(id)}/journal-entries/${entryId}/reverse`, { reason, ...(date ? { date } : {}) }),
  report: <T extends Report>(id: string, kind: T["kind"], params: Record<string, string | number>) =>
    request<T>("GET", `${entity(id)}/reports/${kind}?${query(params)}`),
  reportXlsxUrl: (id: string, kind: ReportKind, params: Record<string, string | number>) =>
    `${entity(id)}/reports/${kind}/xlsx?${query(params)}`,
  periods: (id: string) => request<{ periods: Period[] }>("GET", `${entity(id)}/periods`).then((r) => r.periods),
  closePeriod: (id: string, year: number, month: number) =>
    request<{ snapshots: Snapshot[] }>("POST", `${entity(id)}/periods/${year}/${month}/close`),
  reopenPeriod: (id: string, year: number, month: number, reason: string) =>
    request<unknown>("POST", `${entity(id)}/periods/${year}/${month}/reopen`, { reason }),
  snapshots: (id: string, year: number, month: number) =>
    request<{ snapshots: Snapshot[] }>("GET", `${entity(id)}/periods/${year}/${month}/snapshots`).then(
      (r) => r.snapshots,
    ),
  snapshotXlsxUrl: (id: string, year: number, month: number, snapshotId: string) =>
    `${entity(id)}/periods/${year}/${month}/snapshots/${snapshotId}/xlsx`,
  parseCapture: (id: string, text: string) => request<CaptureDraft>("POST", `${entity(id)}/capture/parse`, { text }),
  reviewCapture: (id: string, review: CaptureReview) =>
    request<void>("POST", `${entity(id)}/capture/${review.draftId}/review`, {
      outcome: "saved",
      changed: review.changed,
    }),
  captureQuality: (id: string, days = 90) =>
    request<CaptureQuality>("GET", `${entity(id)}/capture/quality?${query({ days })}`),
  inspectImport: (id: string, format: "csv" | "xlsx", content: string) =>
    request<{ header: string[]; sample: string[][]; rowCount: number }>("POST", `${entity(id)}/imports/inspect`, {
      format,
      content,
    }),
  previewImport: (id: string, body: ImportRequest) =>
    request<ImportResult>("POST", `${entity(id)}/imports/preview`, body),
  commitImport: (id: string, body: ImportRequest) =>
    request<ImportResult>("POST", `${entity(id)}/imports/commit`, body),
};

export type SaveResult = { status: "saved"; entry: Entry } | { status: "queued" };

/**
 * Saves a transaction, or keeps it in the outbox when the server cannot be reached. `body` must carry an
 * idempotencyKey; the review, if any, is sent after the transaction is saved.
 */
export async function saveTransaction(
  entityId: string,
  body: Record<string, string>,
  review: CaptureReview | null,
): Promise<SaveResult> {
  try {
    const entry = await api.recordTransaction(entityId, body);
    // The review only feeds the quality report; failing to send it never fails the save.
    if (review !== null) await api.reviewCapture(entityId, review).catch(() => undefined);
    return { status: "saved", entry };
  } catch (error) {
    if (!isUnreachable(error)) throw error;
    await outbox.add({
      key: body.idempotencyKey ?? crypto.randomUUID(),
      entityId,
      body,
      review,
      createdAt: new Date().toISOString(),
      status: "pending",
      error: null,
    });
    await refreshQueue();
    return { status: "queued" };
  }
}

let syncing: Promise<number> | null = null;

/** A refusal the server will repeat on retry (for example a closed period), unlike an outage or an expired session. */
const isRefusal = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500 && ![401, 408, 429].includes(error.status);

/** Sends one queued transaction; returns false when sending should stop for now. */
async function sendQueued(item: QueuedTransaction): Promise<boolean> {
  try {
    await api.recordTransaction(item.entityId, item.body);
    if (item.review !== null) await api.reviewCapture(item.entityId, item.review).catch(() => undefined);
    await outbox.remove(item.key);
    return true;
  } catch (error) {
    if (!isRefusal(error)) return false;
    await outbox.add({ ...item, status: "failed", error: error instanceof Error ? error.message : String(error) });
    return true;
  }
}

/** Sends queued transactions oldest first; stops at the first outage. Returns how many were tried. */
export function syncOutbox(): Promise<number> {
  syncing ??= (async () => {
    let tried = 0;
    try {
      for (const item of (await outbox.all()).filter((q) => q.status === "pending")) {
        if (!(await sendQueued(item))) break;
        tried += 1;
      }
    } finally {
      await refreshQueue();
      syncing = null;
    }
    return tried;
  })();
  return syncing;
}

export const discardQueued = async (key: string) => {
  await outbox.remove(key);
  await refreshQueue();
};
