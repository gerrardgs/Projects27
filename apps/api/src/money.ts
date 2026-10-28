// Exact money: amounts travel as decimal strings ("125000.50") and are stored as bigint minor units.
// Binary floating point is never used (rule 17 section 1).

const MAX_INTEGER_DIGITS = 15;

export class AmountError extends Error {}

/** Parses a non-negative decimal string into minor units for a currency with `minorUnits` decimals. */
export function parseAmount(text: string, minorUnits: number): bigint {
  const fraction = minorUnits > 0 ? `(?:\\.(\\d{1,${minorUnits}}))?` : "";
  const pattern = new RegExp(`^(0|[1-9]\\d{0,${MAX_INTEGER_DIGITS - 1}})${fraction}$`);
  const match = pattern.exec(text);
  if (match === null) {
    throw new AmountError(
      `amount must be a decimal string with at most ${MAX_INTEGER_DIGITS} integer digits and ${minorUnits} decimals, for example "125000.50"`,
    );
  }
  const whole = BigInt(match[1] ?? "0");
  const decimals = (match[2] ?? "").padEnd(minorUnits, "0");
  return whole * 10n ** BigInt(minorUnits) + BigInt(decimals === "" ? "0" : decimals);
}

/** Formats minor units as a decimal string with exactly `minorUnits` decimals; negative values keep their sign. */
export function formatAmount(minor: bigint, minorUnits: number): string {
  const negative = minor < 0n;
  const digits = (negative ? -minor : minor).toString().padStart(minorUnits + 1, "0");
  const whole = minorUnits > 0 ? digits.slice(0, -minorUnits) : digits;
  const decimals = minorUnits > 0 ? `.${digits.slice(-minorUnits)}` : "";
  return `${negative ? "-" : ""}${whole}${decimals}`;
}
