// Starting chart of accounts for an individual (personal) entity in IDR. Names are in Indonesian,
// the interface language of the first users; codes follow the usual 1 to 5 grouping.

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface TemplateAccount {
  code: string;
  name: string;
  type: AccountType;
}

export const PERSONAL_CHART: readonly TemplateAccount[] = [
  { code: "1100", name: "Kas Tunai", type: "asset" },
  { code: "1200", name: "Rekening Bank", type: "asset" },
  { code: "1300", name: "Dompet Digital", type: "asset" },
  { code: "1400", name: "Piutang", type: "asset" },
  { code: "1500", name: "Investasi", type: "asset" },
  { code: "2100", name: "Kartu Kredit", type: "liability" },
  { code: "2200", name: "Pinjaman", type: "liability" },
  { code: "3100", name: "Saldo Awal", type: "equity" },
  { code: "4100", name: "Gaji", type: "income" },
  { code: "4200", name: "Bonus dan Tunjangan", type: "income" },
  { code: "4300", name: "Usaha dan Freelance", type: "income" },
  { code: "4400", name: "Bunga dan Dividen", type: "income" },
  { code: "4900", name: "Pendapatan Lain", type: "income" },
  { code: "5100", name: "Makan dan Minum", type: "expense" },
  { code: "5200", name: "Transportasi", type: "expense" },
  { code: "5300", name: "Tempat Tinggal", type: "expense" },
  { code: "5400", name: "Listrik, Air dan Internet", type: "expense" },
  { code: "5500", name: "Kesehatan", type: "expense" },
  { code: "5600", name: "Pendidikan", type: "expense" },
  { code: "5700", name: "Belanja Kebutuhan", type: "expense" },
  { code: "5800", name: "Hiburan dan Langganan", type: "expense" },
  { code: "5900", name: "Pajak", type: "expense" },
  { code: "5910", name: "Donasi dan Zakat", type: "expense" },
  { code: "5950", name: "Biaya Bank dan Admin", type: "expense" },
  { code: "5990", name: "Pengeluaran Lain", type: "expense" },
];
