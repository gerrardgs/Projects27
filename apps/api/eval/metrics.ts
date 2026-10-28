// Evaluation metrics for voice capture. Speech recognition is scored with word and character error rate
// (WER, CER), the standard ASR measures: (substitutions + deletions + insertions) / reference length,
// summed over the corpus. Form filling is scored per field, as in slot-filling evaluation: accuracy,
// precision over filled fields, recall over expected fields, and the rate of silently wrong values.
// Proportions carry a 95% Wilson score interval, which stays valid for small samples and rates near 0 or 1.

import { findAmount, wordsToNumber } from "../src/capture-rules.ts";
import { wilson } from "../src/stats.ts";

export interface EditCounts {
  substitutions: number;
  deletions: number;
  insertions: number;
  reference: number;
}

/** Minimum edits turning `reference` into `hypothesis` (Levenshtein), split by kind. */
export function editCounts(reference: readonly string[], hypothesis: readonly string[]): EditCounts {
  type Cell = { cost: number; s: number; d: number; i: number };
  let previous: Cell[] = hypothesis.map((_, j) => ({ cost: j + 1, s: 0, d: 0, i: j + 1 }));
  previous.unshift({ cost: 0, s: 0, d: 0, i: 0 });
  for (let r = 1; r <= reference.length; r += 1) {
    const row: Cell[] = [{ cost: r, s: 0, d: r, i: 0 }];
    for (let h = 1; h <= hypothesis.length; h += 1) {
      const diagonal = previous[h - 1] as Cell;
      const up = previous[h] as Cell;
      const left = row[h - 1] as Cell;
      const same = reference[r - 1] === hypothesis[h - 1];
      const options: Cell[] = [
        { ...diagonal, cost: diagonal.cost + (same ? 0 : 1), s: diagonal.s + (same ? 0 : 1) },
        { ...up, cost: up.cost + 1, d: up.d + 1 },
        { ...left, cost: left.cost + 1, i: left.i + 1 },
      ];
      row.push(options.reduce((best, option) => (option.cost < best.cost ? option : best)));
    }
    previous = row;
  }
  const last = previous[hypothesis.length] as Cell;
  return { substitutions: last.s, deletions: last.d, insertions: last.i, reference: reference.length };
}

export function sumEdits(all: readonly EditCounts[]): EditCounts & { rate: number } {
  const total = all.reduce(
    (sum, e) => ({
      substitutions: sum.substitutions + e.substitutions,
      deletions: sum.deletions + e.deletions,
      insertions: sum.insertions + e.insertions,
      reference: sum.reference + e.reference,
    }),
    { substitutions: 0, deletions: 0, insertions: 0, reference: 0 },
  );
  const errors = total.substitutions + total.deletions + total.insertions;
  return { ...total, rate: total.reference === 0 ? 0 : errors / total.reference };
}

const SPELLED =
  /\b(?:(?:nol|satu|se|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|belas|puluh|ratus|ribu|juta|miliar)\b\s*)+/;

/**
 * Normalises a transcript before scoring, the same way on both sides: lower case, no punctuation, no
 * "Rp", and every amount or spelled number written as plain digits ("35 ribu", "35.000" and "tiga puluh
 * lima ribu" all become "35000"). Without this, WER would count "35.000" against "35 ribu" as an error
 * although both mean the same amount.
 */
export function normalizeTranscript(text: string): string {
  let rest = text.toLowerCase().replace(/\brp\.?\s*/g, " ");
  let out = "";
  for (let match = findAmount(rest); match !== null; match = findAmount(rest)) {
    const at = rest.indexOf(match.text);
    const whole = match.minor / 100n;
    const cents = match.minor % 100n;
    out += `${rest.slice(0, at)} ${whole}${cents === 0n ? "" : ` ${cents}`} `;
    rest = rest.slice(at + match.text.length);
  }
  out += rest;
  for (let match = SPELLED.exec(out); match !== null; match = SPELLED.exec(out)) {
    const value = wordsToNumber(match[0].trim().split(/\s+/));
    out = out.replace(match[0], value === null ? ` ${match[0].replace(/\s+/g, "_")} ` : ` ${value} `);
  }
  return out
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const words = (text: string) => normalizeTranscript(text).split(" ").filter(Boolean);
export const characters = (text: string) => [...normalizeTranscript(text).replace(/ /g, "")];

export { percentile, wilson } from "../src/stats.ts";

export const FIELDS = ["kind", "amount", "date", "accountCode", "fundingCode", "counterparty"] as const;
export type Field = (typeof FIELDS)[number];
export type FormValues = Record<Field, string | null>;

const comparable = (field: Field, value: string | null) =>
  value === null ? null : field === "counterparty" ? value.toLowerCase().replace(/\s+/g, " ").trim() : value;

export interface FieldScore {
  /** Cases where the field was right (both empty counts as right). */
  correct: number;
  /** Cases where the form filled the field. */
  filled: number;
  /** Cases where a value was expected. */
  expected: number;
  /** Filled and expected and equal. */
  truePositive: number;
  /** Filled but wrong: the error a person is most likely to miss. */
  wrongFilled: number;
  cases: number;
}

export function scoreField(field: Field, pairs: readonly { expected: FormValues; actual: FormValues }[]): FieldScore {
  const score: FieldScore = { correct: 0, filled: 0, expected: 0, truePositive: 0, wrongFilled: 0, cases: 0 };
  for (const { expected, actual } of pairs) {
    const want = comparable(field, expected[field]);
    const got = comparable(field, actual[field]);
    score.cases += 1;
    if (got === want) score.correct += 1;
    if (got !== null) score.filled += 1;
    if (want !== null) score.expected += 1;
    if (got !== null && want !== null && got === want) score.truePositive += 1;
    if (got !== null && got !== want) score.wrongFilled += 1;
  }
  return score;
}

export const fieldRates = (s: FieldScore) => ({
  accuracy: s.correct / s.cases,
  accuracyCi: wilson(s.correct, s.cases),
  precision: s.filled === 0 ? 1 : s.truePositive / s.filled,
  recall: s.expected === 0 ? 1 : s.truePositive / s.expected,
  wrongFilledRate: s.wrongFilled / s.cases,
  wrongFilledCi: wilson(s.wrongFilled, s.cases),
});
