import assert from "node:assert/strict";
import { test } from "node:test";
import { editCounts, normalizeTranscript, percentile, scoreField, sumEdits, wilson, words } from "../eval/metrics.ts";

test("edit counts split substitutions, deletions and insertions (Levenshtein)", () => {
  assert.deepEqual(editCounts(["a", "b", "c", "d"], ["a", "x", "c"]), {
    substitutions: 1,
    deletions: 1,
    insertions: 0,
    reference: 4,
  });
  assert.deepEqual(editCounts(["a"], ["b", "a", "c"]), { substitutions: 0, deletions: 0, insertions: 2, reference: 1 });
  assert.equal(editCounts([], []).reference, 0);
});

test("corpus WER sums edits over all references, not the mean of per-sentence rates", () => {
  const total = sumEdits([editCounts(["a", "b"], ["a", "x"]), editCounts(["c", "d", "e", "f"], ["c", "d", "e", "f"])]);
  assert.equal(total.rate, 1 / 6);
});

test("normalisation makes equivalent amounts and numbers compare equal", () => {
  const expected = "beli nasi padang 35000 pakai gopay kemarin";
  assert.equal(normalizeTranscript("Beli nasi Padang 35.000 pakai GoPay kemarin"), expected);
  assert.equal(normalizeTranscript("beli nasi padang 35 ribu pakai gopay kemarin"), expected);
  assert.equal(normalizeTranscript("beli nasi padang tiga puluh lima ribu pakai gopay, kemarin."), expected);
  assert.equal(normalizeTranscript("Rp 1.250.000,50 bayar listrik"), "1250000 50 bayar listrik");
  assert.equal(normalizeTranscript("beli beras lima kilo"), "beli beras 5 kilo");
  assert.equal(normalizeTranscript("bayar sekolah anak"), "bayar sekolah anak");
  assert.deepEqual(words("2 juta 500 ribu"), ["2500000"]);
});

test("Wilson 95% interval matches published values", () => {
  // 8 of 10: 0.4902 to 0.9433 (Newcombe 1998, method 3; the same with any Wilson calculator).
  const [low, high] = wilson(8, 10);
  assert.equal(low.toFixed(4), "0.4902");
  assert.equal(high.toFixed(4), "0.9433");
  assert.deepEqual(wilson(0, 0), [0, 1]);
  assert.equal(wilson(60, 60)[1], 1);
  assert.equal(wilson(60, 60)[0].toFixed(3), "0.940");
});

test("nearest-rank percentile", () => {
  assert.equal(percentile([5, 1, 4, 2, 3], 50), 3);
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95), 10);
  assert.equal(percentile([], 50), 0);
});

test("field scores separate a missing value from a silently wrong one", () => {
  const blank = { kind: null, amount: null, date: null, accountCode: null, fundingCode: null, counterparty: null };
  const pairs = [
    { expected: { ...blank, amount: "10.00" }, actual: { ...blank, amount: "10.00" } },
    { expected: { ...blank, amount: "10.00" }, actual: { ...blank } },
    { expected: { ...blank, amount: "10.00" }, actual: { ...blank, amount: "99.00" } },
    { expected: { ...blank, counterparty: "PT Maju" }, actual: { ...blank, counterparty: "pt  maju" } },
  ];
  assert.deepEqual(scoreField("amount", pairs.slice(0, 3)), {
    correct: 1,
    filled: 2,
    expected: 3,
    truePositive: 1,
    wrongFilled: 1,
    cases: 3,
  });
  assert.equal(scoreField("counterparty", pairs.slice(3)).correct, 1);
});
