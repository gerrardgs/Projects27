// Turns a spoken or typed Indonesian sentence ("beli nasi padang 35 ribu pakai gopay kemarin") into a
// transaction draft with plain rules. It is the fallback when no AI model is configured and the safety
// net for every field the model gets wrong. Amounts are computed in minor units with bigint only.

import { formatAmount } from "./money.ts";

export type Kind = "income" | "expense" | "transfer";

export interface RuleDraft {
  kind: Kind;
  amount: string | null;
  date: string;
  accountCode: string | null;
  fundingCode: string | null;
  description: string;
  counterparty: string | null;
}

const MONTHS = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];
const SCALE: Record<string, bigint> = {
  ribu: 1_000n,
  rb: 1_000n,
  k: 1_000n,
  juta: 1_000_000n,
  jt: 1_000_000n,
  miliar: 1_000_000_000n,
  milyar: 1_000_000_000n,
};

const TRANSFER_WORDS = [
  "transfer ke",
  "pindah",
  "pindahkan",
  "isi saldo",
  "top up",
  "topup",
  "tarik tunai",
  "setor tunai",
  "bayar kartu kredit",
  "bayar tagihan kartu kredit",
];
const INCOME_WORDS = [
  "gaji",
  "gajian",
  "dikasih",
  "diberi",
  "dikirimi",
  "terima",
  "menerima",
  "dapat",
  "dapet",
  "pemasukan",
  "bonus",
  "thr",
  "honor",
  "komisi",
  "dibayar",
  "jual",
  "menjual",
  "dividen",
  "bunga deposito",
  "cashback",
  "refund",
];

// Keyword lists per account code of the personal chart (apps/api/src/chart-template.ts).
const CATEGORY_WORDS: [string, string[]][] = Object.entries({
  "5100": [
    "makan",
    "minum",
    "kopi",
    "nasi",
    "sarapan",
    "makan siang",
    "makan malam",
    "jajan",
    "restoran",
    "warung",
    "bakso",
    "mie",
    "gofood",
    "grabfood",
    "shopeefood",
    "martabak",
    "roti",
    "gorengan",
    "pizza",
    "burger",
    "ayam",
    "soto",
    "es teh",
    "boba",
  ],
  "5200": [
    "ojek",
    "ojol",
    "gojek",
    "grab",
    "taksi",
    "bensin",
    "pertalite",
    "pertamax",
    "parkir",
    "tol",
    "krl",
    "mrt",
    "lrt",
    "transjakarta",
    "busway",
    "kereta",
    "bus",
    "pesawat",
    "angkot",
    "motor",
    "bengkel",
    "servis motor",
    "modif",
    "onderdil",
    "sparepart",
    "oli",
  ],
  "5300": ["sewa", "kos", "kost", "kontrakan", "cicilan rumah", "kpr", "apartemen"],
  "5400": [
    "listrik",
    "pln",
    "token listrik",
    "air",
    "pdam",
    "internet",
    "wifi",
    "indihome",
    "pulsa",
    "paket data",
    "kuota",
  ],
  "5500": ["obat", "dokter", "rumah sakit", "klinik", "apotek", "bpjs", "vitamin"],
  "5600": ["sekolah", "kuliah", "kursus", "les", "buku", "spp", "ukt", "pelatihan"],
  "5700": [
    "belanja",
    "supermarket",
    "indomaret",
    "alfamart",
    "sabun",
    "sembako",
    "beras",
    "galon",
    "keperluan rumah",
    "baju",
    "celana",
    "sepatu",
    "pakaian",
    "kaos",
    "jaket",
    "makan kucing",
    "makanan kucing",
    "pakan",
    "petshop",
    "pet shop",
  ],
  "5800": [
    "netflix",
    "spotify",
    "youtube premium",
    "bioskop",
    "nonton",
    "game",
    "langganan",
    "hiburan",
    "liburan",
    "konser",
  ],
  "5900": ["pajak", "pbb", "pph"],
  "5910": ["donasi", "zakat", "sedekah", "infak", "infaq", "sumbangan", "amal"],
  "5950": ["biaya admin", "admin bank", "biaya transfer", "materai"],
  "4100": ["gaji", "gajian"],
  "4200": ["bonus", "thr", "tunjangan"],
  "4300": ["freelance", "proyek", "project", "jualan", "usaha", "honor", "komisi"],
  "4400": ["bunga", "dividen", "deposito"],
});

// Ordered: the more specific instruments first. Arrays, because JavaScript sorts integer-like object keys.
const FUNDING_WORDS: [string, string[]][] = [
  [
    "1300",
    [
      "gopay",
      "ovo",
      "dana",
      "shopeepay",
      "shopee pay",
      "pakai shopee",
      "lewat shopee",
      "via shopee",
      "linkaja",
      "dompet digital",
      "e-wallet",
      "ewallet",
    ],
  ],
  ["2100", ["kartu kredit", "credit card", "paylater"]],
  [
    "1200",
    [
      "rekening",
      "bank",
      "bca",
      "bri",
      "bni",
      "mandiri",
      "bsi",
      "jago",
      "seabank",
      "transfer bank",
      "m-banking",
      "mobile banking",
      "internet banking",
      "debit",
      "danamon",
      "cimb",
      "permata",
      "btn",
      "ocbc",
      "maybank",
      "panin",
      "jenius",
      "blu",
      "livin",
      "brimo",
    ],
  ],
  ["1100", ["tunai", "cash", "uang tunai", "kas"]],
];

const DIGIT_WORDS: Record<string, bigint> = {
  nol: 0n,
  satu: 1n,
  se: 1n,
  dua: 2n,
  tiga: 3n,
  empat: 4n,
  lima: 5n,
  enam: 6n,
  tujuh: 7n,
  delapan: 8n,
  sembilan: 9n,
  sepuluh: 10n,
  sebelas: 11n,
  seratus: 100n,
  seribu: 1_000n,
};

const containsWord = (text: string, word: string) =>
  new RegExp(`(^|[^a-z0-9])${word.replace(/[-]/g, "\\-")}([^a-z0-9]|$)`).test(text);
const firstMatching = (text: string, table: [string, string[]][], allowed: ReadonlySet<string>) =>
  table.find(([code, words]) => allowed.has(code) && words.some((w) => containsWord(text, w)))?.[0] ?? null;

/** The code whose matching keyword is longest, so "makan kucing" beats "makan"; ties keep table order. */
function mostSpecific(text: string, table: [string, string[]][], allowed: ReadonlySet<string>): string | null {
  let best: { code: string; length: number } | null = null;
  for (const [code, words] of table) {
    if (!allowed.has(code)) continue;
    for (const word of words) {
      if (containsWord(text, word) && (best === null || word.length > best.length))
        best = { code, length: word.length };
    }
  }
  return best?.code ?? null;
}

/** The sentence without payment instruments, so "internet banking" does not read as an internet bill. */
const withoutFunding = (text: string) =>
  FUNDING_WORDS.flatMap(([, words]) => words)
    .sort((a, b) => b.length - a.length)
    .reduce((rest, word) => rest.replace(new RegExp(`(^|[^a-z0-9])${word}(?=[^a-z0-9]|$)`, "g"), "$1 "), text);

/** "1,5" or "1.5" or "35" as minor units (two decimals). */
function decimalToMinor(text: string): bigint {
  const [whole = "0", fraction = ""] = text.replace(",", ".").split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

interface NumberState {
  total: bigint;
  current: bigint;
}

/** Applies one number word; returns false for a word that is not part of a number. */
function applyNumberWord(state: NumberState, part: string): boolean {
  const units = state.current % 10n;
  if (part in DIGIT_WORDS) state.current += DIGIT_WORDS[part] as bigint;
  else if (part === "belas") state.current += 10n;
  else if (part === "puluh") state.current = units * 10n + (state.current - units);
  else if (part === "ratus") state.current = units * 100n + (state.current - units);
  else if (part in SCALE) {
    state.total += (state.current === 0n ? 1n : state.current) * (SCALE[part] as bigint);
    state.current = 0n;
  } else return false;
  return true;
}

/** Spelled-out Indonesian numbers, for example "dua puluh lima ribu" or "satu juta lima ratus ribu". */
export function wordsToNumber(words: string[]): bigint | null {
  const state: NumberState = { total: 0n, current: 0n };
  const parts = words.flatMap((raw) => raw.replace(/^se(ratus|ribu|puluh|belas|juta)$/, "satu $1").split(" "));
  if (parts.length === 0 || !parts.every((part) => applyNumberWord(state, part))) return null;
  return state.total + state.current;
}

interface AmountMatch {
  minor: bigint;
  text: string;
}

const SCALED_PART = /(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt|miliar|milyar)\b/;

/** "35 ribu", and compounds with falling scales such as "2 juta 500 ribu". */
function scaledAmount(text: string): AmountMatch | null {
  const first = SCALED_PART.exec(text);
  if (first === null) return null;
  let minor = decimalToMinor(first[1] ?? "0") * (SCALE[first[2] ?? ""] ?? 1n);
  let scale = SCALE[first[2] ?? ""] ?? 1n;
  let end = (first.index ?? 0) + first[0].length;
  for (;;) {
    const next = new RegExp(`^\\s+${SCALED_PART.source}`).exec(text.slice(end));
    const nextScale = SCALE[next?.[2] ?? ""];
    if (next === null || nextScale === undefined || nextScale >= scale) break;
    minor += decimalToMinor(next[1] ?? "0") * nextScale;
    scale = nextScale;
    end += next[0].length;
  }
  return { minor, text: text.slice(first.index, end) };
}

function spelledAmount(text: string): AmountMatch | null {
  const vocabulary =
    "nol|satu|se|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|belas|puluh|ratus|ribu|juta|miliar";
  const match = new RegExp(`\\b(?:(?:${vocabulary})\\b\\s*)+`).exec(text);
  if (match === null) return null;
  const value = wordsToNumber(match[0].trim().split(/\s+/));
  return value === null || value < 100n ? null : { minor: value * 100n, text: match[0].trim() };
}

function plainAmount(text: string): AmountMatch | null {
  const candidates = [
    ...text.matchAll(/(?<![\d/-])(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{3,15}(?:,\d{1,2})?)(?![\d/-])/g),
  ]
    .filter((m) => !/(tanggal|tgl)\s*$/.test(text.slice(0, m.index)))
    .filter((m) => !new RegExp(`^\\s*(${MONTHS.join("|")})`).test(text.slice((m.index ?? 0) + m[0].length)));
  const best = candidates.at(-1);
  if (best === undefined) return null;
  const [whole = "0", sen = ""] = (best[1] ?? "").replace(/\./g, "").split(",");
  return { minor: BigInt(whole) * 100n + BigInt((sen + "00").slice(0, 2)), text: best[0] };
}

export function findAmount(text: string): AmountMatch | null {
  return scaledAmount(text) ?? plainAmount(text) ?? spelledAmount(text);
}

function shiftDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function explicitDate(text: string, today: string): { date: string; text: string } | null {
  const match = new RegExp(
    `(?:tanggal|tgl)?\\s*(\\d{1,2})\\s+(${MONTHS.join("|")})(?:\\s+(\\d{4}))?|(?:tanggal|tgl)\\s*(\\d{1,2})`,
  ).exec(text);
  if (match === null) return null;
  const [year, month] = today.split("-").map(Number) as [number, number];
  const day = Number(match[1] ?? match[4]);
  const monthIndex = match[2] === undefined ? month : MONTHS.indexOf(match[2]) + 1;
  const y = match[3] === undefined ? year : Number(match[3]);
  let iso = `${y}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  // A date without a year that lies in the future most likely meant last year (or last month for "tanggal 30").
  if (match[3] === undefined && iso > today) {
    if (match[2] === undefined) iso = shiftDays(iso, -new Date(Date.UTC(year, month - 1, 0)).getUTCDate());
    else iso = `${y - 1}-${iso.slice(5)}`;
  }
  const check = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== iso
    ? null
    : { date: iso, text: match[0].trim() };
}

export function findDate(text: string, today: string): { date: string; text: string | null } {
  const relative: [RegExp, number | ((m: RegExpExecArray) => number)][] = [
    [/kemarin lusa/, -2],
    [/(\d+)\s+hari\s+(?:yang\s+)?lalu/, (m) => -Number(m[1])],
    [/kemarin|kmrn/, -1],
    [/hari ini|tadi|barusan|sekarang/, 0],
  ];
  for (const [pattern, offset] of relative) {
    const match = pattern.exec(text);
    if (match !== null)
      return { date: shiftDays(today, typeof offset === "number" ? offset : offset(match)), text: match[0] };
  }
  return explicitDate(text, today) ?? { date: today, text: null };
}

export function findKind(text: string): Kind {
  if (TRANSFER_WORDS.some((w) => text.includes(w))) return "transfer";
  return INCOME_WORDS.some((w) => containsWord(text, w)) ? "income" : "expense";
}

function transferAccounts(
  text: string,
  codes: ReadonlySet<string>,
): { account: string | null; funding: string | null } {
  const has = (code: string) => (codes.has(code) ? code : null);
  if (text.includes("tarik tunai")) return { account: has("1100"), funding: has("1200") };
  if (text.includes("setor tunai")) return { account: has("1200"), funding: has("1100") };
  if (text.includes("kartu kredit")) return { account: has("2100"), funding: has("1200") };
  // "top up gopay dari bca": the words after "dari" name the source, the rest the destination.
  const [toPart = text, fromPart = ""] = text.split(/\bdari\b/, 2);
  const destination = firstMatching(toPart, FUNDING_WORDS, codes);
  const source = firstMatching(fromPart, FUNDING_WORDS, codes);
  return { account: destination, funding: source ?? (destination === "1200" ? has("1100") : has("1200")) };
}

const OWN_ACCOUNT_WORDS = new Set([...FUNDING_WORDS.flatMap(([, words]) => words), "atm", "rekening"]);

/** The payee or payer; `original` is `text` before lower-casing, so names keep the speaker's capitals. */
function findCounterparty(text: string, kind: Kind, original: string): string | null {
  const name = "([a-z][a-z.&' -]{1,60}?)";
  const stop =
    "(?:\\s+(?:pakai|pake|dengan|lewat|via|sebesar|seharga|senilai|rp|kemarin|tadi|hari|tanggal|tgl|\\d)|\\s*\\d|$)";
  const patterns = {
    income: [`\\bdari\\s+${name}${stop}`],
    transfer: [`\\bke\\s+${name}${stop}`],
    // "kirim uang ke adik": money given to someone; "ke kantor" alone is a destination, not a payee.
    expense: [
      `\\bdi\\s+${name}${stop}`,
      `\\b(?:kirim|kasih|beri|transfer)(?:kan)?\\s+(?:uang\\s+)?ke\\s+${name}${stop}`,
    ],
  }[kind];
  for (const pattern of patterns) {
    const match = new RegExp(pattern, "d").exec(text);
    const span = match?.indices?.[1];
    const found = match?.[1]?.trim();
    if (found === undefined || found.split(" ").length > 5 || /^(sana|sini|situ|rumah)$/.test(found)) continue;
    if (OWN_ACCOUNT_WORDS.has(found) || found.split(" ").some((w) => OWN_ACCOUNT_WORDS.has(w) && w !== found)) continue;
    const spoken = span === undefined ? found : original.slice(span[0], span[1]).trim();
    return spoken === spoken.toLowerCase() ? spoken.replace(/\b\w/g, (c) => c.toUpperCase()) : spoken;
  }
  return null;
}

function cleanDescription(original: string, removals: (string | null)[]): string {
  let text = original;
  for (const part of removals) {
    if (part) text = text.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ");
  }
  text = text
    .replace(
      /\b(?:pakai|pake|dengan|lewat|via)\s+(?:uang\s+)?(?:tunai|cash|gopay|ovo|dana|shopeepay|linkaja|kartu kredit|rekening|bank\s*\w*|bca|bri|bni|mandiri|bsi)\b/gi,
      " ",
    )
    .replace(/\b(?:sebesar|seharga|senilai)\b/gi, " ")
    .replace(/\brp\.?\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/[\s,.;]+$/, "")
    .trim();
  const short = text.length > 120 ? `${text.slice(0, 117)}...` : text;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Parses one sentence. `codes` are the entity's postable account codes; `today` is YYYY-MM-DD in the entity's time zone. */
function accountsFor(text: string, kind: Kind, codes: ReadonlySet<string>) {
  if (kind === "transfer") {
    const transfer = transferAccounts(text, codes);
    return { accountCode: transfer.account, fundingCode: transfer.funding };
  }
  const prefix = kind === "income" ? "4" : "5";
  const fallbackCategory = kind === "income" ? "4900" : "5990";
  const defaultFunding = kind === "income" ? "1200" : "1100";
  const category = mostSpecific(
    withoutFunding(text),
    CATEGORY_WORDS.filter(([code]) => code.startsWith(prefix)),
    codes,
  );
  const funding = firstMatching(text, FUNDING_WORDS, codes);
  return {
    accountCode: category ?? (codes.has(fallbackCategory) ? fallbackCategory : null),
    fundingCode: funding ?? (codes.has(defaultFunding) ? defaultFunding : null),
  };
}

/** Parses one sentence. `codes` are the entity's postable account codes; `today` is YYYY-MM-DD in the entity's time zone. */
/**
 * Speech recognisers write "delapan belas ribu tiga hari lalu" as "18003 hari lalu" (eighteen thousand and
 * three days). A day offset above a year is not a date, so such a number splits into the amount and the days.
 */
function splitMergedDayCount(text: string): string {
  return text.replace(
    /\b(\d{1,3}(?:\.\d{3})+|\d{4,})(\s+hari\s+(?:yang\s+)?lalu)/i,
    (whole, digits: string, rest: string) => {
      const value = Number(digits.replace(/\./g, ""));
      const days = value % 1000;
      return value > 366 && days >= 1 && days <= 31 ? `${value - days} ${days}${rest}` : whole;
    },
  );
}

/** "tanggal lima" as "tanggal 5": recognisers often spell out small numbers. */
function spelledDay(text: string): string {
  return text.replace(
    /\b(tanggal|tgl)\s+((?:(?:satu|se|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh)\b\s*)+)/i,
    (whole, word: string, spelled: string) => {
      const day = wordsToNumber(spelled.trim().toLowerCase().split(/\s+/));
      return day === null || day < 1n || day > 31n ? whole : `${word} ${day} `;
    },
  );
}

export function parseWithRules(sentence: string, codes: ReadonlySet<string>, today: string): RuleDraft {
  const prepared = spelledDay(splitMergedDayCount(sentence.replace(/\s+/g, " ").trim()))
    .replace(/\s+/g, " ")
    .trim();
  const text = prepared.toLowerCase();
  const kind = findKind(text);
  const amount = findAmount(text);
  const date = findDate(text, today);
  return {
    kind,
    amount: amount === null || amount.minor <= 0n ? null : formatAmount(amount.minor, 2),
    date: date.date,
    ...accountsFor(text, kind, codes),
    description: cleanDescription(prepared, [amount?.text ?? null, date.text]),
    counterparty: findCounterparty(text, kind, prepared),
  };
}
