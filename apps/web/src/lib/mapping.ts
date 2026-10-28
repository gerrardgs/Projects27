// Suggests which file column holds which import field, from common Indonesian and English headers.

export const IMPORT_FIELDS = ["date", "description", "amount", "kind", "account", "funding", "counterparty"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

const HINTS: Record<ImportField, string[]> = {
  date: ["tanggal", "tgl", "date", "tanggal transaksi"],
  description: ["keterangan", "deskripsi", "uraian", "description", "memo", "catatan"],
  amount: ["nominal", "jumlah", "amount", "nilai", "mutasi"],
  kind: ["jenis", "tipe", "type", "db/cr", "d/k"],
  account: ["kategori", "akun", "category", "account"],
  funding: ["sumber", "sumber dana", "rekening", "dompet", "funding"],
  counterparty: ["pihak", "penerima", "toko", "counterparty", "merchant"],
};

export function guessMapping(header: readonly string[]): Partial<Record<ImportField, string>> {
  const result: Partial<Record<ImportField, string>> = {};
  for (const field of IMPORT_FIELDS) {
    const found = header.find((h) => HINTS[field].includes(h.trim().toLowerCase()));
    if (found !== undefined) result[field] = found;
  }
  return result;
}
