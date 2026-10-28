// Import of income and expense rows from CSV or XLSX: map columns, preview with validation and
// duplicate detection, then commit. Each row gets a stable idempotency key, so importing the same
// file twice never posts a row twice (rule 17 section 4).

import { canonicalJson, sha256 } from "./canonical.ts";
import { CsvError, parseCsv } from "./csv.ts";
import { badRequest, HttpError } from "./errors.ts";
import { listAccounts, recordTransaction, type Scope } from "./ledger.ts";
import { formatAmount, parseAmount } from "./money.ts";
import { readXlsx } from "./xlsx.ts";
import { ZipError } from "./zip.ts";

type Kind = "income" | "expense" | "transfer";
type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
const FIELDS = ["date", "description", "amount", "kind", "account", "funding", "counterparty"] as const;
type Field = (typeof FIELDS)[number];
const MAX_ROWS = 5000;

export interface ImportOptions {
  format: "csv" | "xlsx";
  rows: string[][];
  mapping: Partial<Record<Field, string>>;
  dateFormat: DateFormat;
  decimalSeparator: "," | ".";
  defaults: { funding: string; income: string; expense: string };
}

export interface ImportRow {
  row: number;
  status: "ok" | "duplicate" | "error";
  message: string | null;
  date: string | null;
  description: string | null;
  kind: Kind | null;
  amount: string | null;
  accountCode: string | null;
  fundingCode: string | null;
  counterparty: string | null;
  idempotencyKey: string | null;
}

const KIND_WORDS: Record<string, Kind> = {
  income: "income",
  pemasukan: "income",
  masuk: "income",
  cr: "income",
  kredit: "income",
  credit: "income",
  expense: "expense",
  pengeluaran: "expense",
  keluar: "expense",
  db: "expense",
  debit: "expense",
  transfer: "transfer",
  pindah: "transfer",
  mutasi: "transfer",
};

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value === "") throw badRequest(`${field} is required.`, { [field]: "Required." });
  return value;
}

const asRecord = (value: unknown) =>
  (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;

function parseMapping(value: unknown): Partial<Record<Field, string>> {
  const mapping = asRecord(value);
  const clean: Partial<Record<Field, string>> = {};
  for (const field of FIELDS) {
    const name = mapping[field];
    if (typeof name === "string" && name !== "") clean[field] = name;
  }
  for (const field of ["date", "description", "amount"] as const) {
    if (clean[field] === undefined) throw badRequest(`mapping.${field} is required.`);
  }
  return clean;
}

function parseDefaults(value: unknown): ImportOptions["defaults"] {
  const defaults = asRecord(value);
  return {
    funding: text(defaults.funding, "defaults.funding"),
    income: text(defaults.income, "defaults.income"),
    expense: text(defaults.expense, "defaults.expense"),
  };
}

function parseFormat(value: unknown): "csv" | "xlsx" {
  if (value === "csv" || value === "xlsx") return value;
  throw badRequest('format must be "csv" or "xlsx".');
}

/** Validates the request and decodes the file into rows (first row is the header). */
export function parseImportRequest(body: Record<string, unknown>): ImportOptions {
  const format = parseFormat(body.format);
  const dateFormat = (["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"] as const).find((f) => f === body.dateFormat);
  return {
    format,
    rows: decodeRows(format, text(body.content, "content")),
    mapping: parseMapping(body.mapping),
    dateFormat: dateFormat ?? "YYYY-MM-DD",
    decimalSeparator: body.decimalSeparator === "," ? "," : ".",
    defaults: parseDefaults(body.defaults),
  };
}

function decodeRows(format: "csv" | "xlsx", content: string): string[][] {
  try {
    const rows =
      format === "csv" ? parseCsv(content, MAX_ROWS + 1) : readXlsx(Buffer.from(content, "base64"), MAX_ROWS + 1);
    if (rows.length < 2) throw badRequest("The file needs a header row and at least one data row.");
    return rows;
  } catch (error) {
    if (error instanceof CsvError || error instanceof ZipError)
      throw badRequest(`The file could not be read: ${error.message}`);
    throw error;
  }
}

/** Header and the first rows of a file, so a client can offer column mapping before the preview. */
export function inspectImport(body: Record<string, unknown>) {
  const format = parseFormat(body.format);
  const [header = [], ...rows] = decodeRows(format, text(body.content, "content"));
  return { header, sample: rows.slice(0, 5), rowCount: rows.length };
}

const excelSerialToDate = (serial: number) =>
  new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000).toISOString().slice(0, 10);

export function parseImportDate(value: string, format: DateFormat, fromXlsx: boolean): string {
  const v = value.trim();
  // XLSX stores dates as day counts from 1899-12-30 (1900 date system); 61 is 1900-03-01, after Excel's fictitious 1900-02-29.
  if (fromXlsx && /^\d{2,6}(\.\d+)?$/.test(v) && Number(v) >= 61) return excelSerialToDate(Number(v));
  const parts =
    format === "YYYY-MM-DD" ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v) : /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
  if (parts === null) throw new Error(`date "${value}" does not match ${format}`);
  const [year, month, day] =
    format === "YYYY-MM-DD"
      ? [parts[1], parts[2], parts[3]]
      : format === "DD/MM/YYYY"
        ? [parts[3], parts[2], parts[1]]
        : [parts[3], parts[1], parts[2]];
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== iso)
    throw new Error(`date "${value}" is not a real date`);
  return iso;
}

/** Normalises "Rp 1.250.000,50", "(35.000)" or "-35000.00" to a signed decimal string with a dot. */
export function parseImportAmount(value: string, decimalSeparator: "," | "."): { negative: boolean; amount: string } {
  let v = value
    .trim()
    .replace(/^rp\.?\s*/i, "")
    .replace(/\s/g, "");
  let negative = false;
  if (/^\(.*\)$/.test(v)) [negative, v] = [true, v.slice(1, -1)];
  if (v.startsWith("-")) [negative, v] = [true, v.slice(1)];
  const thousands = decimalSeparator === "," ? "." : ",";
  v = v.split(thousands).join("").replace(decimalSeparator, ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) throw new Error(`amount "${value}" is not a number with at most 2 decimals`);
  return { negative, amount: v };
}

function kindFor(word: string | undefined, negative: boolean): Kind {
  if (word === undefined || word.trim() === "") return negative ? "expense" : "income";
  const kind = KIND_WORDS[word.trim().toLowerCase()];
  if (kind === undefined) throw new Error(`type "${word}" is not income, expense or transfer`);
  return kind;
}

interface RowContext {
  options: ImportOptions;
  columns: Map<Field, number>;
  codes: Set<string>;
}

function rowValue(ctx: RowContext, cells: string[], field: Field): string | undefined {
  const index = ctx.columns.get(field);
  return index === undefined ? undefined : (cells[index] ?? "").trim();
}

function rowAccounts(ctx: RowContext, cells: string[], kind: Kind) {
  const { defaults } = ctx.options;
  const fallback = kind === "income" ? defaults.income : kind === "expense" ? defaults.expense : "";
  const accountCode = rowValue(ctx, cells, "account") || fallback;
  const fundingCode = rowValue(ctx, cells, "funding") || defaults.funding;
  for (const code of [accountCode, fundingCode]) {
    if (!ctx.codes.has(code)) throw new Error(`account code "${code}" does not exist`);
  }
  return { accountCode, fundingCode };
}

function parseRow(ctx: RowContext, cells: string[]) {
  const { options } = ctx;
  const date = parseImportDate(rowValue(ctx, cells, "date") ?? "", options.dateFormat, options.format === "xlsx");
  const description = rowValue(ctx, cells, "description") ?? "";
  if (description === "") throw new Error("description is empty");
  const { negative, amount } = parseImportAmount(rowValue(ctx, cells, "amount") ?? "", options.decimalSeparator);
  const minor = parseAmount(amount, 2);
  if (minor === 0n) throw new Error("amount is zero");
  const kind = kindFor(rowValue(ctx, cells, "kind"), negative);
  const counterparty = rowValue(ctx, cells, "counterparty") || null;
  return { date, description, kind, amount: formatAmount(minor, 2), ...rowAccounts(ctx, cells, kind), counterparty };
}

function columnMap(header: string[], mapping: ImportOptions["mapping"]): Map<Field, number> {
  const columns = new Map<Field, number>();
  for (const field of FIELDS) {
    const name = mapping[field];
    if (name === undefined) continue;
    const index = header.findIndex((h) => h.trim().toLowerCase() === name.trim().toLowerCase());
    if (index < 0) throw badRequest(`Column "${name}" for ${field} is not in the header row.`);
    columns.set(field, index);
  }
  return columns;
}

const emptyRow = (row: number, message: string): ImportRow => ({
  row,
  status: "error",
  message,
  date: null,
  description: null,
  kind: null,
  amount: null,
  accountCode: null,
  fundingCode: null,
  counterparty: null,
  idempotencyKey: null,
});

/** Parses every row and marks rows already imported (same key) as duplicates. */
export async function previewImport(scope: Scope, options: ImportOptions): Promise<ImportRow[]> {
  const [header = [], ...data] = options.rows;
  if (data.length > MAX_ROWS) throw badRequest(`Import at most ${MAX_ROWS} rows at a time.`);
  const accounts = await listAccounts(scope.db, scope.entity);
  const ctx: RowContext = {
    options,
    columns: columnMap(header, options.mapping),
    codes: new Set(accounts.map((a) => a.code)),
  };
  const seen = new Map<string, number>();
  const rows = data.map((cells, index): ImportRow => {
    try {
      const parsed = parseRow(ctx, cells);
      const base = sha256(canonicalJson(parsed)).toString("hex").slice(0, 32);
      const occurrence = (seen.get(base) ?? 0) + 1;
      seen.set(base, occurrence);
      return { row: index + 2, status: "ok", message: null, ...parsed, idempotencyKey: `import:${base}:${occurrence}` };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      return emptyRow(index + 2, error instanceof Error ? error.message : String(error));
    }
  });
  const keys = rows.flatMap((r) => (r.idempotencyKey === null ? [] : [r.idempotencyKey]));
  const existing = await scope.db.query<{ idempotency_key: string }>(
    "select idempotency_key from journal_entries where entity_id = $1 and idempotency_key = any($2)",
    [scope.entity.id, keys],
  );
  const done = new Set(existing.rows.map((r) => r.idempotency_key));
  return rows.map((r) =>
    r.idempotencyKey !== null && done.has(r.idempotencyKey)
      ? { ...r, status: "duplicate", message: "already imported" }
      : r,
  );
}

export function summarise(rows: readonly ImportRow[]) {
  const count = (status: ImportRow["status"]) => rows.filter((r) => r.status === status).length;
  return { total: rows.length, ok: count("ok"), duplicate: count("duplicate"), error: count("error") };
}

/** Posts every row that previewed as ok; a row that fails at posting (for example a closed month) is reported, not skipped silently. */
export async function commitImport(scope: Scope, options: ImportOptions) {
  const rows = await previewImport(scope, options);
  const ids = new Map((await listAccounts(scope.db, scope.entity)).map((a) => [a.code, a.id]));
  const results: ImportRow[] = [];
  for (const row of rows) {
    if (row.status !== "ok") {
      results.push(row);
      continue;
    }
    try {
      await recordTransaction(
        scope,
        {
          kind: row.kind,
          date: row.date,
          description: row.description,
          counterparty: row.counterparty,
          amount: row.amount,
          accountId: ids.get(row.accountCode ?? ""),
          fundingAccountId: ids.get(row.fundingCode ?? ""),
          idempotencyKey: row.idempotencyKey,
        },
        "import",
      );
      results.push(row);
    } catch (error) {
      results.push({ ...row, status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}
