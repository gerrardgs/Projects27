// Reports as Excel workbooks. The workbook is built from the same report object the API returns,
// so the file and the screen never disagree; a snapshot export also carries its SHA-256 hash.

import type { Cell, Sheet } from "./xlsx.ts";

type Row = Record<string, unknown>;
const t = (text: unknown, bold = false): Cell => ({ text: String(text ?? ""), bold });
const a = (amount: unknown, bold = false): Cell => ({ amount: String(amount ?? "0.00"), bold });

function header(report: Row, title: string): Cell[][] {
  return [
    [t(title, true)],
    [t("Entitas"), t(report.entityName)],
    [t("Mata uang"), t(report.currency)],
    [t("Dibuat"), t(report.generatedAt)],
    [],
  ];
}

const list = (value: unknown) => (Array.isArray(value) ? (value as Row[]) : []);

function amountSection(title: string, rows: Row[], total: unknown): Cell[][] {
  return [
    [t(title, true)],
    [t("Kode", true), t("Akun", true), t("Jumlah", true)],
    ...rows.map((r) => [t(r.code), t(r.name), a(r.amount)]),
    [t(""), t(`Total ${title.toLowerCase()}`, true), a(total, true)],
    [],
  ];
}

function recapSection(title: string, rows: Row[], total: unknown): Cell[][] {
  return [
    [t(title, true)],
    ["Kode", "Akun", "Bulan ini", "Bulan lalu", "Perubahan", "Sejak awal tahun", "Porsi (%)"].map((h) => t(h, true)),
    ...rows.map((r) => [
      t(r.code),
      t(r.name),
      a(r.month),
      a(r.previousMonth),
      a(r.change),
      a(r.yearToDate),
      a(r.shareOfTotal),
    ]),
    [t(""), t(`Total ${title.toLowerCase()}`, true), a(total, true)],
    [],
  ];
}

type Body = { title: string; rows: Cell[][] };
const pad2 = (n: unknown) => String(n).padStart(2, "0");

const BODIES: Record<string, (report: Row, period: Row) => Body> = {
  "monthly-recap": (report, period) => ({
    title: `Rekap bulanan ${period.year}-${pad2(period.month)}`,
    rows: [
      ...recapSection("Pemasukan", list(report.income), report.totalIncome),
      ...recapSection("Pengeluaran", list(report.expenses), report.totalExpenses),
      [t("Selisih (pemasukan - pengeluaran)", true), t(""), a(report.net, true)],
      [t("Tingkat tabungan (%)", true), t(""), a(report.savingsRate, true)],
    ],
  }),
  "monthly-trend": (report) => ({
    title: "Tren bulanan",
    rows: [
      ["Tahun", "Bulan", "Pemasukan", "Pengeluaran", "Selisih"].map((h) => t(h, true)),
      ...list(report.series).map((r) => [
        { number: Number(r.year) },
        { number: Number(r.month) },
        a(r.income),
        a(r.expenses),
        a(r.net),
      ]),
    ],
  }),
  "income-statement": (report, period) => ({
    title: `Laba rugi ${period.from} s.d. ${period.to}`,
    rows: [
      ...amountSection("Pemasukan", list(report.income), report.totalIncome),
      ...amountSection("Pengeluaran", list(report.expenses), report.totalExpenses),
      [t("Selisih", true), t(""), a(report.net, true)],
    ],
  }),
  "balance-sheet": (report) => ({
    title: `Neraca per ${report.asOf}`,
    rows: [
      ...amountSection("Aset", list(report.assets), report.totalAssets),
      ...amountSection("Liabilitas", list(report.liabilities), report.totalLiabilities),
      ...amountSection(
        "Ekuitas",
        [
          ...list(report.equity),
          { code: "", name: "Akumulasi selisih pemasukan dan pengeluaran", amount: report.accumulatedEarnings },
        ],
        report.totalEquity,
      ),
    ],
  }),
  "trial-balance": (report) => ({
    title: `Neraca saldo per ${report.asOf}`,
    rows: [
      ["Kode", "Akun", "Debit", "Kredit"].map((h) => t(h, true)),
      ...list(report.lines).map((r) => [t(r.code), t(r.name), a(r.debit), a(r.credit)]),
      [t(""), t("Total", true), a(report.totalDebit, true), a(report.totalCredit, true)],
    ],
  }),
};

function body(report: Row): Body {
  const build = BODIES[String(report.kind)];
  if (build === undefined) throw new Error(`no Excel layout for report kind ${String(report.kind)}`);
  return build(report, (report.period ?? {}) as Row);
}

/** Sheets for one report: the report itself, its self-checks, and the snapshot hash when there is one. */
export function reportSheets(report: Row, snapshot?: { id: string; contentHash: string; createdAt: string }): Sheet[] {
  const { title, rows } = body(report);
  const checks: Cell[][] = [
    ["Pemeriksaan", "Lulus", "Rincian"].map((h) => t(h, true)),
    ...list(report.checks).map((c) => [t(c.name), t(c.passed ? "ya" : "TIDAK"), t(c.detail)]),
  ];
  const sheets: Sheet[] = [
    { name: "Laporan", rows: [...header(report, title), ...rows], widths: [12, 44, 18, 18, 18, 18, 12] },
    { name: "Pemeriksaan", rows: checks, widths: [36, 8, 70] },
  ];
  if (snapshot !== undefined) {
    sheets.push({
      name: "Verifikasi",
      rows: [
        [t("Snapshot", true), t(snapshot.id)],
        [t("Dibuat", true), t(snapshot.createdAt)],
        [t("SHA-256", true), t(snapshot.contentHash)],
        [
          t("Cara cek", true),
          t(
            "Bandingkan hash ini dengan GET /v1/entities/{id}/periods/{tahun}/{bulan}/snapshots (hashVerified harus true).",
          ),
        ],
      ],
      widths: [14, 90],
    });
  }
  return sheets;
}
