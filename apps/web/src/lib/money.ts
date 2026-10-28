// Rupiah on screen. The API sends exact decimal strings ("725350.50"); they are formatted as strings,
// never converted to binary floating point, because Intl rounds IDR to whole rupiah by default and a
// float loses sen above 15 significant digits.

const AMOUNT = /^-?(0|[1-9]\d*)\.\d{2}$/;

const formatters = new Map<number, Intl.NumberFormat>();
function formatter(digits: number): Intl.NumberFormat {
  let f = formatters.get(digits);
  if (f === undefined) {
    f = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(digits, f);
  }
  return f;
}

/** "725350.50" -> "Rp 725.350,50"; "35000.00" -> "Rp 35.000" (sen shown only when there are any). */
export function formatRupiah(amount: string): string {
  if (!AMOUNT.test(amount)) throw new Error(`not an API amount: ${amount}`);
  const digits = amount.endsWith(".00") ? 0 : 2;
  // Intl.NumberFormat.format accepts a decimal string and formats it exactly (ECMA-402 NumberFormat v3).
  return formatter(digits).format(amount as Intl.StringNumericLiteral);
}

/**
 * Reads what a person types ("35.000", "1.250.000,50", "Rp 35000") as an Indonesian-format amount
 * and returns the API decimal string, or null when it is not a valid positive amount.
 */
export function parseRupiahInput(input: string): string | null {
  const text = input
    .trim()
    .replace(/^rp\.?\s*/i, "")
    .replace(/\s/g, "");
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(text);
  if (match === null) return null;
  const whole = (match[1] ?? "").replace(/\./g, "").replace(/^0+(?=\d)/, "");
  const sen = (match[2] ?? "").padEnd(2, "0");
  if (whole.length > 15 || (whole === "0" && sen === "00")) return null;
  return `${whole}.${sen}`;
}

/** Only for drawing charts: pixel positions do not need exact money. Never use the result in arithmetic on money. */
export function amountForChart(amount: string): number {
  return Number(amount);
}

/** "1250000.50" -> "1.250.000,50", "35000.00" -> "35.000": an API amount written the way the capture field expects it. */
export function toInputAmount(amount: string): string {
  const [whole = "0", sen = "00"] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sen === "00" ? grouped : `${grouped},${sen}`;
}
