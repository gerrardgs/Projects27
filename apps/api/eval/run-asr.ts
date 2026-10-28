// Speech recognition and end-to-end evaluation on macOS 26 or later. For every corpus sentence it makes
// audio with the Indonesian system voice (say -v Damayanti), or takes a person's recording, transcribes
// it with Apple's on-device dictation model (eval/asr-transcribe), scores WER and CER against the
// sentence, then fills the form from the transcript and scores each field against the labels.
// Usage, in apps/api:
//   node eval/run-asr.ts [--split dev|test|all] [--recordings <dir>] [--json <file>]
// A recordings folder holds files named after case ids (t01.m4a, d05.wav, ...); only those cases run.

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { characters, editCounts, percentile, sumEdits, words } from "./metrics.ts";
import { type CaptureCase, formatSummary, loadCorpus, loadGates, runCases, summarize } from "./run-capture.ts";

interface Condition {
  name: string;
  label: string;
  rate?: number;
  snr?: number;
}

// Rates in words per minute for say(1); the Damayanti voice speaks at about 175 by default.
const SYNTHETIC: Condition[] = [
  { name: "clean", label: "Bersih, kecepatan normal" },
  { name: "fast", label: "Bersih, cepat (230 kata/menit)", rate: 230 },
  { name: "noise10", label: "Derau putih SNR 10 dB", snr: 10 },
  { name: "noise0", label: "Derau putih SNR 0 dB", snr: 0 },
];

interface Transcript {
  path: string;
  text: string;
  audioSeconds: number;
  processingSeconds: number;
}

function buildTranscriber(dir: string): string {
  const binary = join(dir, "asr-transcribe");
  const source = new URL("./asr-transcribe/main.swift", import.meta.url).pathname;
  execFileSync("swiftc", ["-O", source, "-o", binary], { stdio: "inherit" });
  return binary;
}

function transcribe(binary: string, lines: string[]): Map<string, Transcript> {
  const run = spawnSync(binary, [], { input: `${lines.join("\n")}\n`, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(`asr-transcribe failed: ${run.stderr}`);
  const rows = run.stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Transcript & { snr: number | null });
  return new Map(rows.map((r) => [`${r.path}\t${r.snr ?? ""}`, r]));
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

async function scoreCondition(label: string, cases: CaptureCase[], heard: Map<string, Transcript>, today: string) {
  const pairs = cases.map((c) => ({ c, t: heard.get(c.id) as Transcript }));
  const wer = sumEdits(pairs.map(({ c, t }) => editCounts(words(c.text), words(t.text))));
  const cer = sumEdits(pairs.map(({ c, t }) => editCounts(characters(c.text), characters(t.text))));
  const raw = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const rawWer = sumEdits(pairs.map(({ c, t }) => editCounts(raw(c.text), raw(t.text))));
  const exact = pairs.filter(({ c, t }) => words(c.text).join(" ") === words(t.text).join(" ")).length;
  const rtf = pairs.map(({ t }) => t.processingSeconds / Math.max(0.001, t.audioSeconds));
  const endToEnd = summarize(
    await runCases(
      pairs.map(({ c, t }) => ({ id: c.id, text: t.text || "-", expect: c.expect })),
      today,
      null,
    ),
  );
  const lines = [
    `### ${label} (${pairs.length} kalimat)`,
    `WER ${pct(wer.rate)} (S ${wer.substitutions}, D ${wer.deletions}, I ${wer.insertions} dari ${wer.reference} kata); CER ${pct(cer.rate)}; WER mentah tanpa normalisasi angka ${pct(rawWer.rate)}; kalimat persis sama ${exact}/${pairs.length}`,
    `Faktor waktu nyata (RTF) p50 ${percentile(rtf, 50).toFixed(3)}, p95 ${percentile(rtf, 95).toFixed(3)}`,
    "",
    formatSummary("Formulir dari transkrip", endToEnd),
    "",
    ...pairs
      .filter(({ c, t }) => words(c.text).join(" ") !== words(t.text).join(" "))
      .map(({ c, t }) => `- ${c.id}: "${c.text}" → "${t.text}"`),
  ];
  return { wer, cer, rawWer, exact, rtf: { p50: percentile(rtf, 50), p95: percentile(rtf, 95) }, endToEnd, lines };
}

type Planned = { condition: Condition; files: Map<string, string> };

function recordedCondition(dir: string): Planned {
  const files = new Map(
    readdirSync(dir)
      .filter((f) => /\.(m4a|wav|aiff?|caf|mp3)$/i.test(f))
      .map((f) => [f.replace(/\.[^.]+$/, ""), join(dir, f)] as const),
  );
  return { condition: { name: "recorded", label: `Rekaman manusia (${dir})` }, files };
}

/** Synthesises each sentence, with half a second of silence before and after, as a live microphone has. */
function syntheticConditions(cases: CaptureCase[], work: string): Planned[] {
  return SYNTHETIC.map((condition) => {
    const files = new Map<string, string>();
    for (const c of cases) {
      const path = join(work, `${c.id}-${condition.name}.aiff`);
      const rate = condition.rate === undefined ? [] : ["-r", String(condition.rate)];
      execFileSync("say", ["-v", "Damayanti", ...rate, "-o", path, `[[slnc 500]] ${c.text} [[slnc 500]]`]);
      files.set(c.id, path);
    }
    return { condition, files };
  });
}

function gateFailures(name: string, result: Awaited<ReturnType<typeof scoreCondition>>): string[] {
  if (name !== "clean") return [];
  const gates = loadGates().asr;
  const amount = result.endToEnd.fields.amount.accuracy;
  return [
    ...(result.wer.rate > (gates["wer.max"] ?? 1) ? [`WER ${pct(result.wer.rate)}`] : []),
    ...(amount < (gates["endToEnd.amount.accuracy"] ?? 0) ? [`jumlah end-to-end ${pct(amount)}`] : []),
  ];
}

async function main() {
  const { values } = parseArgs({
    options: {
      split: { type: "string", default: "all" },
      recordings: { type: "string" },
      json: { type: "string" },
    },
  });
  const corpus = loadCorpus();
  const work = mkdtempSync(join(tmpdir(), "p27-asr-"));
  try {
    const binary = buildTranscriber(work);
    let cases = corpus.cases.filter((c) => values.split === "all" || c.split === values.split);
    let planned: Planned[];
    if (values.recordings) {
      const recorded = recordedCondition(values.recordings);
      cases = cases.filter((c) => recorded.files.has(c.id));
      planned = [recorded];
    } else {
      planned = syntheticConditions(cases, work);
    }
    const heard = transcribe(
      binary,
      planned.flatMap(({ condition, files }) =>
        cases.map((c) => `${files.get(c.id)}${condition.snr === undefined ? "" : `\t${condition.snr}`}`),
      ),
    );
    const report: Record<string, unknown> = { today: corpus.today, engine: "Apple DictationTranscriber id_ID" };
    const failures: string[] = [];
    for (const { condition, files } of planned) {
      const byCase = new Map(
        cases.map((c) => [c.id, heard.get(`${files.get(c.id)}\t${condition.snr ?? ""}`) as Transcript]),
      );
      const result = await scoreCondition(condition.label, cases, byCase, corpus.today);
      console.log(`${result.lines.join("\n")}\n`);
      failures.push(...gateFailures(condition.name, result));
      const { lines: _printed, ...numbers } = result;
      report[condition.name] = {
        ...numbers,
        transcripts: cases.map((c) => ({ id: c.id, reference: c.text, heard: byCase.get(c.id)?.text })),
      };
    }
    if (!values.recordings) {
      console.log(failures.length === 0 ? "Gates ASR: semua lulus." : `Gates ASR gagal: ${failures.join("; ")}`);
      process.exitCode = failures.length === 0 ? 0 : 1;
    }
    if (values.json) writeFileSync(values.json, `${JSON.stringify(report, null, 2)}\n`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

await main();
