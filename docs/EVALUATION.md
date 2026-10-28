# Evaluation: speech recognition and automatic form filling

Last run: 2026-10-28 on macOS 27.0.1 (Apple silicon), Node.js 24.22.1. This document reports what was measured, how, and what the numbers do and do not show. Every number here comes from a command in this repository that anyone can run again.

## 1. What is evaluated

Voice capture has two stages, and each fails in its own way:

1. **Speech recognition (ASR)** turns speech into text on the device: the browser's Web Speech API (Chrome, Edge: Google; Safari: Apple), Android's SpeechRecognizer, and Apple's Speech framework on iOS.
2. **Form filling** turns that text into the form fields Jenis, Jumlah, Tanggal, Kategori, Dari, Keterangan and Pihak lain. The API does it with the Indonesian rule parser (`apps/api/src/capture-rules.ts`), plus Claude when `ANTHROPIC_API_KEY` is set. Every field is validated, and nothing is saved until the person presses Simpan.

So there are three evaluations: form filling from text, ASR plus form filling end to end, and quality in real use.

## 2. Metrics and why

| Metric | Definition | Why this one |
| :--- | :--- | :--- |
| WER, word error rate | (substitutions + deletions + insertions) / words in the reference, summed over the corpus | The standard ASR measure, as computed by NIST's sclite. Summing over the corpus weights long sentences correctly; the mean of per-sentence rates does not. |
| CER, character error rate | The same over characters, spaces removed | Shows near misses ("infaq" vs "infak") that WER counts as whole-word errors. |
| Normalised and raw WER | Normalised: lower case, no punctuation, no "Rp", and every amount or number as plain digits ("35 ribu" = "35.000" = "tiga puluh lima ribu" = 35000). Raw: lower case and punctuation only | Recognisers write numbers in different forms. Without normalisation, "35.000" against "35 ribu" counts as an error even though both mean the same amount. Whisper's evaluation normalises text for the same reason (Radford et al., 2022, [arXiv:2212.04356](https://arxiv.org/abs/2212.04356)). Both figures are reported, so the normalisation hides nothing. |
| Field accuracy | Share of sentences where the field equals the label (both empty counts as right) | The direct question: was this field right? |
| Precision and recall per field | Precision: right / filled. Recall: right / expected | Slot-filling measures. They separate a field left empty from a field filled wrongly. |
| Silently wrong rate | Filled but wrong / sentences | The costly error in finance: a wrong amount looks plausible and may be saved unnoticed. An empty field is visible and gets filled in. |
| Exact form match | All of Jenis, Jumlah, Tanggal, Kategori and Dari right ("core"); the same plus Pihak lain ("full") | How often the person can press Simpan without changing anything. |
| 95% Wilson interval | Score interval for a proportion (Wilson, 1927, *JASA* 22:209–212; recommended over the normal approximation by Newcombe, 1998, *Statistics in Medicine* 17:857–872) | 60 sentences give wide uncertainty. The interval shows it, and it stays valid at 0% and 100%. |
| Real-time factor | Recognition time / audio duration | Whether recognition keeps up with speech on the device. |
| Real-use quality | Of the forms filled automatically and saved: the share saved without any correction, and per field the share kept as filled | The only measure based on real people, real voices and real transactions. Their own corrections are the ground truth. |

## 3. Data and how it was labelled

`apps/api/eval/capture-cases.json` holds 120 Indonesian sentences with expected form values. They cover everyday spending, income, transfers between own accounts, all number forms ("35 ribu", "45.000", "50rb", "1,5 juta", "2 juta 500 ribu", "dua ratus ribu"), relative and explicit dates, wallets, banks and credit cards, and named payees.

- **Labels.** The developer wrote the labels on 2026-10-28 by these rules: the account codes of the personal chart (`apps/api/src/chart-template.ts`); when no payment method is said, Dari is 1100 Kas Tunai for spending and 1200 Rekening Bank for income; the date is relative to 2026-10-28, and a date without a year that lies in the future means last year; Pihak lain is the place or person after "di", "dari" or "kirim uang ke", and is empty for own accounts.
- **Splits.** 60 `dev` sentences may be used to improve the parser; 60 `test` sentences may not. Both splits were written before any change to the parser. A test (`apps/api/test/capture-eval.test.ts`) checks that no sentence appears twice.
- **Pass thresholds** (`apps/api/eval/gates.json`) were set before the first run and are checked on the test split by `npm test`.

## 4. Results: form filling from text (rules only)

`cd apps/api && node eval/run-capture.ts`

| Field (test split, 60 sentences) | Before tuning | After tuning (95% CI) |
| :--- | ---: | ---: |
| Jenis (kind) | 98.3% | 98.3% (91.1–99.7) |
| Jumlah (amount) | 96.7%, of which 1.7% silently wrong | **100%** (94.0–100), 0% silently wrong |
| Tanggal (date) | 100% | 100% (94.0–100) |
| Kategori (account) | 81.7% | 81.7% (70.1–89.4) |
| Dari (funding) | 98.3% | 98.3% (91.1–99.7) |
| Pihak lain (counterparty) | 93.3% | 98.3% (91.1–99.7) |
| Core form exactly right | 78.3% (66.4–86.9) | **81.7%** (70.1–89.4) |
| Full form exactly right | 73.3% | 81.7% (70.1–89.4) |

All gates pass. The dev split reaches 100% after tuning. That number was tuned on, so it is not evidence of quality.

**What was changed, and why** (all prompted by dev failures):

- "2 juta 500 ribu" was read as 2,000,000. Compound amounts are now summed.
- "internet banking Danamon" was read as an internet bill. Payment phrases are now removed before the category is matched, and more banks are known.
- "modif motor" and "servis motor" now go to Transportasi. "gajian" and "dikasih" now mean income. The most specific keyword now wins, so "makan kucing" goes to Belanja and not to Makan.
- Own accounts are no longer named as Pihak lain. "kirim uang ke adik" names the payee. Names keep the speaker's capitals ("PT Maju Jaya").
- A boundary bug in spelled-out numbers ("bayar **se**kolah lima ratus ribu" read no amount) was found by reading the code, and fixed.

**Honesty about the test split.** The test split's errors were printed once, at the baseline run. After that, the runner prints only dev errors. The policy was that no keyword is added if it appears in a test sentence unless it also appears in a dev sentence; a check found one overlap, "rekening", which is in both. Even so, the developer saw the test errors, so the after-tuning test numbers may be slightly optimistic. The real-use measure (section 6) has no such bias.

**What remains.** Kategori is the weakest field: 11 of 60 test sentences use words the keyword lists do not know ("seblak", "kacamata", "asuransi", "elpiji"). That is the limit of a keyword parser, and the reason for the AI path.

## 5. Results: speech recognition and the whole chain

`cd apps/api && node eval/run-asr.ts --split test` (macOS 26 or later)

**Method.** Each sentence is spoken by macOS's Indonesian voice (`say -v Damayanti`), with half a second of silence before and after, as a live microphone gives. Apple's on-device dictation model transcribes it (`DictationTranscriber`, locale id_ID, in `apps/api/eval/asr-transcribe`); this is the engine family behind Indonesian dictation in Safari and on iOS. The transcript then goes through the same form filling as the API. Noise is white Gaussian noise added at a fixed signal-to-noise ratio, with a fixed seed, so runs repeat exactly.

| Condition (test split, 60 sentences, 327 words) | WER (raw) | CER | Amount right (silently wrong) | Kategori right | Core form exactly right (95% CI) | RTF p95 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Text, no speech (section 4) | — | — | 100% (0%) | 81.7% | 81.7% (70.1–89.4) | — |
| Clean, normal pace | 5.5% (27.9%) | 2.3% | 100% (0%) | 78.3% | 75.0% (62.8–84.2) | 0.024 |
| Clean, fast (230 words/min) | 5.5% (27.9%) | 2.4% | 100% (0%) | 78.3% | 75.0% (62.8–84.2) | 0.029 |
| Noise, SNR 10 dB | 10.7% (32.4%) | 6.3% | 100% (0%) | 71.7% | 66.7% (54.1–77.3) | 0.027 |
| Noise, SNR 0 dB | 22.6% (41.8%) | 16.5% | 95.0% (5.0%) | 56.7% | 53.3% (40.9–65.4) | 0.031 |

ASR gates (clean: WER ≤ 15%, end-to-end amount ≥ 90%) pass.

**What the recogniser gets wrong**, from the transcripts:

- **Run-together numbers.** "delapan belas ribu tiga hari lalu" was written as "18003 hari lalu" (eighteen thousand and three days). The amount was wrong and the date was lost. The parser now splits such a number when the day count would exceed a year. This was found on a dev sentence and also fixes the same case in test.
- **Spelled-out days.** "tanggal 5" was written as "tanggal lima". This is now read.
- **Brand names.** dana became "denah", ovo became "Oso", shopeepay became "Shopee", qris became "Chris", honor became "owner". "pakai shopee" is now read as ShopeePay; the others remain errors.
- **Opening words.** "top up" was sometimes lost at the start. Without the half second of silence, more opening and closing words were lost: an earlier run on all 120 sentences with no padding had 6.2% WER.

**Limits of this test.** It uses one synthetic voice, and a synthetic voice is clearer than people are. White noise is not street or café noise. Google's recognisers (Chrome, Android) were not measured, because they run only inside their apps or services. Read these figures as an upper bound for clean speech on Apple's engine, not as a promise for every phone.

**Real voices.** The same runner scores human recordings: `node eval/run-asr.ts --recordings <folder>`, with files named after case ids (`t01.m4a`, `t02.m4a`, …) and recorded with any phone or QuickTime.

## 6. Quality in real use

Every automatic fill is recorded in `capture_drafts` (migration `002_capture_quality.sql`). The record holds the method (AI or rules), the model, which fields were filled and how long filling took; the spoken sentence is never stored. After Simpan, the web, Android and iOS apps send which of those fields the person changed (`POST /v1/entities/{id}/capture/{draftId}/review`). `GET /v1/entities/{id}/capture/quality?days=90` returns:

- the share of saved forms with no correction, with a 95% Wilson interval;
- for each field, the share kept as filled;
- the same figures per method (AI or rules), and latency p50 and p95.

The Catat screen on all three apps shows the first figure, for example "Ketepatan isi otomatis (90 hari terakhir): 18 dari 20 formulir disimpan tanpa koreksi (90%; rentang 95%: 70%–97%)".

## 7. Not measured yet

- **AI mode (Claude).** No `ANTHROPIC_API_KEY` is configured, so the AI path has been tested only with a fake model. With a key, run `node eval/run-capture.ts --ai --split test`, then compare with the rules figures in section 4 and with real-use quality per method.
- **Google speech recognition** (Chrome, Android) and **real human voices**: use the recordings mode in section 5, and the real-use quality report.
- **Labels by a second person.** One developer wrote all labels. A second labeller and an agreement measure (Cohen's kappa) would show how clear the labelling rules are.

## 8. How to rerun

```sh
cd apps/api
node eval/run-capture.ts                          # text → form, both splits, gates on test
node eval/run-capture.ts --errors --split dev     # what the parser gets wrong on dev
node eval/run-asr.ts --split test --json out.json # speech → text → form (macOS 26 or later, about 3 minutes)
TEST_DATABASE_URL=postgres://localhost:5433/postgres npm test   # includes metric unit tests and the gates
```
