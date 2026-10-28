import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { parseImportAmount, parseImportDate } from "../src/imports.ts";
import { readXlsx } from "../src/xlsx.ts";
import { readZip } from "../src/zip.ts";
import { fixture, postFixture } from "./fixture.ts";
import { api, type Entry, type Harness, signUp, startHarness } from "./helpers.ts";

test("amounts in Indonesian and international notation", () => {
  assert.deepEqual(parseImportAmount("Rp 1.250.000,50", ","), { negative: false, amount: "1250000.50" });
  assert.deepEqual(parseImportAmount("(35.000)", ","), { negative: true, amount: "35000" });
  assert.deepEqual(parseImportAmount("-725,350.5", "."), { negative: true, amount: "725350.5" });
  assert.deepEqual(parseImportAmount("12,345", "."), { negative: false, amount: "12345" });
  assert.throws(() => parseImportAmount("Rp abc", ","), /not a number/);
  assert.throws(() => parseImportAmount("1.5.0", "."), /not a number/);
});

test("dates in the chosen format, real calendar dates only, and Excel serial numbers", () => {
  assert.equal(parseImportDate("03/10/2026", "DD/MM/YYYY", false), "2026-10-03");
  assert.equal(parseImportDate("10/03/2026", "MM/DD/YYYY", false), "2026-10-03");
  assert.equal(parseImportDate("2026-10-03", "YYYY-MM-DD", false), "2026-10-03");
  assert.equal(parseImportDate("46298", "YYYY-MM-DD", true), "2026-10-03");
  assert.throws(() => parseImportDate("31/02/2026", "DD/MM/YYYY", false), /not a real date/);
  assert.throws(() => parseImportDate("46298", "YYYY-MM-DD", false), /does not match/);
});

let h: Harness;
let token: string;
let entityId: string;
before(async () => {
  h = await startHarness();
  ({ token, entityId } = await signUp(h, "impor@example.test"));
});
after(() => h.close());

const csv = [
  "Tanggal;Keterangan;Nominal;Jenis;Kategori",
  "01/11/2026;Gaji November;12.000.000,00;CR;4100",
  "02/11/2026;Kopi;35.000;DB;5100",
  "02/11/2026;Kopi;35.000;DB;5100",
  "03/11/2026;Akun salah;10.000;DB;9999",
  "31/11/2026;Tanggal salah;10.000;DB;5100",
].join("\n");

const request = (content: string, format = "csv") => ({
  format,
  content,
  dateFormat: "DD/MM/YYYY",
  decimalSeparator: ",",
  mapping: { date: "Tanggal", description: "Keterangan", amount: "Nominal", kind: "Jenis", account: "Kategori" },
  defaults: { funding: "1200", income: "4900", expense: "5990" },
});

type ImportResult = {
  summary: { total: number; ok: number; duplicate: number; error: number };
  rows: { row: number; status: string; message: string | null; kind: string | null }[];
};

test("preview validates rows, keeps two identical rows apart and reports errors per row", async () => {
  const res = await api<ImportResult>(h, "POST", `/v1/entities/${entityId}/imports/preview`, {
    token,
    body: request(csv),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.summary, { total: 5, ok: 3, duplicate: 0, error: 2 });
  assert.deepEqual(
    res.body.rows.map((r) => [r.row, r.status]),
    [
      [2, "ok"],
      [3, "ok"],
      [4, "ok"],
      [5, "error"],
      [6, "error"],
    ],
  );
  assert.match(res.body.rows[3]?.message ?? "", /9999/);
  assert.match(res.body.rows[4]?.message ?? "", /not a real date/);
});

test("commit posts the valid rows once; importing the same file again posts nothing new", async () => {
  const first = await api<ImportResult>(h, "POST", `/v1/entities/${entityId}/imports/commit`, {
    token,
    body: request(csv),
  });
  assert.deepEqual(first.body.summary, { total: 5, ok: 3, duplicate: 0, error: 2 });
  const again = await api<ImportResult>(h, "POST", `/v1/entities/${entityId}/imports/commit`, {
    token,
    body: request(csv),
  });
  assert.deepEqual(again.body.summary, { total: 5, ok: 0, duplicate: 3, error: 2 });
  const entries = await api<{ entries: (Entry & { source: string })[] }>(
    h,
    "GET",
    `/v1/entities/${entityId}/journal-entries?from=2026-11-01&to=2026-11-30`,
    { token },
  );
  assert.equal(entries.body.entries.length, 3);
  assert.ok(entries.body.entries.every((e) => e.source === "import"));
  const recap = await api<{ totalIncome: string; totalExpenses: string }>(
    h,
    "GET",
    `/v1/entities/${entityId}/reports/monthly-recap?year=2026&month=11`,
    { token },
  );
  assert.equal(recap.body.totalIncome, "12000000.00");
  assert.equal(recap.body.totalExpenses, "70000.00");
});

test("an XLSX bank export imports with Excel date serials and DB/CR types", async () => {
  const content = readFileSync(new URL("fixtures/openpyxl-mutasi.xlsx", import.meta.url)).toString("base64");
  const body = { ...request(content, "xlsx"), decimalSeparator: "." };
  const res = await api<ImportResult>(h, "POST", `/v1/entities/${entityId}/imports/commit`, { token, body });
  assert.deepEqual(res.body.summary, { total: 3, ok: 3, duplicate: 0, error: 0 });
  assert.deepEqual(
    res.body.rows.map((r) => r.kind),
    ["expense", "income", "expense"],
  );
});

test("a malformed file or an unknown column is a clear 400", async () => {
  const broken = await api(h, "POST", `/v1/entities/${entityId}/imports/preview`, {
    token,
    body: request("bukan zip", "xlsx"),
  });
  assert.equal(broken.status, 400);
  const column = await api(h, "POST", `/v1/entities/${entityId}/imports/preview`, {
    token,
    body: { ...request(csv), mapping: { date: "Tgl", description: "Keterangan", amount: "Nominal" } },
  });
  assert.equal(column.status, 400);
  assert.match(column.body.detail, /Tgl/);
});

test("reports export to Excel with the same figures as the API, and snapshots carry their hash", async () => {
  const other = await signUp(h, "ekspor@example.test");
  await postFixture(h, other.token, other.entityId);
  const response = await fetch(
    `${h.baseUrl}/v1/entities/${other.entityId}/reports/monthly-recap/xlsx?year=2026&month=10`,
    {
      headers: { authorization: `Bearer ${other.token}` },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("content-type"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  assert.match(response.headers.get("content-disposition") ?? "", /attachment; filename="monthly-recap.xlsx"/);
  const rows = readXlsx(Buffer.from(await response.arrayBuffer()));
  const find = (label: string) => rows.find((r) => r[1] === label || r[0] === label);
  assert.equal(find("Total pemasukan")?.[2], fixture.expected.monthlyRecap.totalIncome);
  assert.equal(find("Total pengeluaran")?.[2], fixture.expected.monthlyRecap.totalExpenses);
  assert.equal(find("Selisih (pemasukan - pengeluaran)")?.[2], fixture.expected.monthlyRecap.net);

  const close = await api<{ snapshots: { id: string; kind: string; contentHash: string }[] }>(
    h,
    "POST",
    `/v1/entities/${other.entityId}/periods/2026/10/close`,
    { token: other.token },
  );
  const recap = close.body.snapshots.find((s) => s.kind === "monthly-recap");
  assert.ok(recap);
  const snap = await fetch(`${h.baseUrl}/v1/entities/${other.entityId}/periods/2026/10/snapshots/${recap.id}/xlsx`, {
    headers: { authorization: `Bearer ${other.token}` },
  });
  assert.equal(snap.status, 200);
  const workbook = Buffer.from(await snap.arrayBuffer());
  assert.equal(
    readXlsx(workbook).find((r) => r[1] === "Total pemasukan")?.[2],
    fixture.expected.monthlyRecap.totalIncome,
  );
  const verification = readZip(workbook).get("xl/worksheets/sheet3.xml")?.toString("utf8") ?? "";
  assert.ok(verification.includes(recap.contentHash), "the Verifikasi sheet holds the snapshot hash");
});

test("the monthly trend gives income, expenses and net per month", async () => {
  const other = await signUp(h, "tren@example.test");
  await postFixture(h, other.token, other.entityId);
  const res = await api<{ series: { year: number; month: number; income: string; expenses: string; net: string }[] }>(
    h,
    "GET",
    `/v1/entities/${other.entityId}/reports/monthly-trend?year=2026&month=10&months=3`,
    { token: other.token },
  );
  assert.deepEqual(res.body.series, [
    { year: 2026, month: 8, income: "0.00", expenses: "0.00", net: "0.00" },
    { year: 2026, month: 9, income: "12000000.00", expenses: "4350000.00", net: "7650000.00" },
    {
      year: 2026,
      month: 10,
      income: fixture.expected.monthlyRecap.totalIncome,
      expenses: fixture.expected.monthlyRecap.totalExpenses,
      net: fixture.expected.monthlyRecap.net,
    },
  ]);
});
