// Runs the capture pipeline (rules, plus Claude when --ai and ANTHROPIC_API_KEY are set) over the labelled
// corpus and prints per-field metrics with 95% Wilson intervals. Usage, in apps/api:
//   node eval/run-capture.ts [--split dev|test|all] [--ai] [--errors] [--json <file>]

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { type Account, draftFor } from "../src/capture.ts";
import { ClaudeExtractor, type Extractor } from "../src/capture-ai.ts";
import { PERSONAL_CHART } from "../src/chart-template.ts";
import { FIELDS, type FieldScore, type FormValues, fieldRates, percentile, scoreField, wilson } from "./metrics.ts";

export interface CaptureCase {
  id: string;
  split: "dev" | "test";
  text: string;
  expect: FormValues;
}

export interface Corpus {
  today: string;
  cases: CaptureCase[];
}

export const loadCorpus = (): Corpus =>
  JSON.parse(readFileSync(new URL("./capture-cases.json", import.meta.url), "utf8")) as Corpus;

export const loadGates = () =>
  JSON.parse(readFileSync(new URL("./gates.json", import.meta.url), "utf8")) as {
    form: Record<string, number>;
    asr: Record<string, number>;
  };

/** The personal chart as the API lists it; ids equal codes because only codes are compared. */
export const PERSONAL_ACCOUNTS: Account[] = PERSONAL_CHART.map((a) => ({
  id: a.code,
  code: a.code,
  name: a.name,
  type: a.type,
  postable: true,
  active: true,
}));

export interface CaseResult {
  id: string;
  text: string;
  expected: FormValues;
  actual: FormValues;
  source: string;
  milliseconds: number;
}

export async function runCases(
  cases: readonly { id: string; text: string; expect: FormValues }[],
  today: string,
  extractor: Extractor | null,
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const c of cases) {
    const started = performance.now();
    const draft = await draftFor(c.text, PERSONAL_ACCOUNTS, today, extractor);
    results.push({
      id: c.id,
      text: c.text,
      expected: c.expect,
      actual: {
        kind: draft.kind,
        amount: draft.amount,
        date: draft.date,
        accountCode: draft.accountCode,
        fundingCode: draft.fundingCode,
        counterparty: draft.counterparty,
      },
      source: draft.source,
      milliseconds: performance.now() - started,
    });
  }
  return results;
}

const CORE = FIELDS.filter((f) => f !== "counterparty");

export function summarize(results: readonly CaseResult[]) {
  const pairs = results.map((r) => ({ expected: r.expected, actual: r.actual }));
  const fields = Object.fromEntries(
    FIELDS.map((f) => {
      const score: FieldScore = scoreField(f, pairs);
      return [f, { ...score, ...fieldRates(score) }];
    }),
  ) as Record<(typeof FIELDS)[number], FieldScore & ReturnType<typeof fieldRates>>;
  const same = (r: CaseResult, list: readonly string[]) =>
    list.every((f) => scoreField(f as (typeof FIELDS)[number], [r]).correct === 1);
  const core = results.filter((r) => same(r, CORE)).length;
  const all = results.filter((r) => same(r, FIELDS)).length;
  const times = results.map((r) => r.milliseconds);
  return {
    cases: results.length,
    fields,
    coreExactMatch: core / Math.max(1, results.length),
    coreExactMatchCi: wilson(core, results.length),
    fullExactMatch: all / Math.max(1, results.length),
    fullExactMatchCi: wilson(all, results.length),
    aiShare: results.filter((r) => r.source === "ai").length / Math.max(1, results.length),
    latencyMs: { p50: percentile(times, 50), p95: percentile(times, 95) },
  };
}

export type Summary = ReturnType<typeof summarize>;

/** Gate names map to summary values; returns the failures. */
export function checkFormGates(summary: Summary, gates: Record<string, number>): string[] {
  const failures: string[] = [];
  for (const [name, limit] of Object.entries(gates)) {
    const [field, metric, bound] = name.split(".");
    const value =
      field === "coreExactMatch"
        ? summary.coreExactMatch
        : (summary.fields[field as (typeof FIELDS)[number]][metric as "accuracy" | "wrongFilledRate"] as number);
    const ok = bound === "max" ? value <= limit : value >= limit;
    if (!ok) failures.push(`${name}: ${value.toFixed(3)} (gate ${bound === "max" ? "≤" : "≥"} ${limit})`);
  }
  return failures;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const ci = ([lo, hi]: [number, number]) => `${pct(lo)}–${pct(hi)}`;

export function formatSummary(title: string, s: Summary): string {
  const lines = [
    `${title}: ${s.cases} kalimat`,
    "| Kolom | Akurasi (95% CI) | Presisi | Recall | Salah terisi (95% CI) |",
    "| :--- | ---: | ---: | ---: | ---: |",
    ...FIELDS.map((f) => {
      const r = s.fields[f];
      return `| ${f} | ${pct(r.accuracy)} (${ci(r.accuracyCi)}) | ${pct(r.precision)} | ${pct(r.recall)} | ${pct(r.wrongFilledRate)} (${ci(r.wrongFilledCi)}) |`;
    }),
    "",
    `Formulir inti benar semua (jenis, jumlah, tanggal, kategori, dari): ${pct(s.coreExactMatch)} (${ci(s.coreExactMatchCi)})`,
    `Formulir lengkap benar semua (termasuk pihak lain): ${pct(s.fullExactMatch)} (${ci(s.fullExactMatchCi)})`,
    `Diisi AI: ${pct(s.aiShare)}; latensi p50 ${s.latencyMs.p50.toFixed(1)} ms, p95 ${s.latencyMs.p95.toFixed(1)} ms`,
  ];
  return lines.join("\n");
}

function printErrors(results: readonly CaseResult[]) {
  for (const r of results) {
    const wrong = FIELDS.filter((f) => scoreField(f, [r]).correct === 0);
    if (wrong.length === 0) continue;
    console.log(`${r.id} "${r.text}"\n  ${wrong.map((f) => `${f}: ${r.actual[f]} ≠ ${r.expected[f]}`).join("; ")}`);
  }
  console.log("");
}

function extractorFromEnvironment(useAi: boolean): Extractor | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!useAi) return null;
  if (!key) throw new Error("--ai needs ANTHROPIC_API_KEY in the environment.");
  return new ClaudeExtractor(key, process.env.CAPTURE_AI_MODEL?.trim() || "claude-opus-5-5");
}

function reportGates(summary: Summary) {
  const failures = checkFormGates(summary, loadGates().form);
  console.log(failures.length === 0 ? "Gates: semua lulus." : `Gates gagal:\n  ${failures.join("\n  ")}`);
  process.exitCode = failures.length === 0 ? 0 : 1;
}

async function main() {
  const { values } = parseArgs({
    options: {
      split: { type: "string", default: "all" },
      ai: { type: "boolean", default: false },
      errors: { type: "boolean", default: false },
      json: { type: "string" },
    },
  });
  const corpus = loadCorpus();
  const extractor = extractorFromEnvironment(values.ai);
  const report: Record<string, unknown> = { today: corpus.today, mode: extractor ? extractor.model : "rules" };
  for (const split of values.split === "all" ? ["dev", "test"] : [values.split]) {
    const results = await runCases(
      corpus.cases.filter((c) => c.split === split),
      corpus.today,
      extractor,
    );
    const summary = summarize(results);
    console.log(`${formatSummary(`Split ${split} (${report.mode})`, summary)}\n`);
    // Test-split errors stay hidden unless asked for, so tuning looks at the dev split only.
    if (values.errors && split === "dev") printErrors(results);
    if (split === "test") reportGates(summary);
    report[split] = { summary, results };
  }
  if (values.json) writeFileSync(values.json, `${JSON.stringify(report, null, 2)}\n`);
}

if (import.meta.main) await main();
