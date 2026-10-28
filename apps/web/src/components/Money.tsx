import { formatRupiah } from "../lib/money.ts";

/** An amount from the API, shown in rupiah; the exact value stays machine-readable in `value`. */
export function Money({ amount, tone }: { amount: string; tone?: "income" | "expense" }) {
  return (
    <data value={amount} className={tone}>
      {formatRupiah(amount)}
    </data>
  );
}
