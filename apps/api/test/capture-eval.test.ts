import assert from "node:assert/strict";
import { test } from "node:test";
import { checkFormGates, loadCorpus, loadGates, runCases, summarize } from "../eval/run-capture.ts";

test("the labelled corpus is well formed and its splits do not overlap", () => {
  const { cases } = loadCorpus();
  const ids = new Set(cases.map((c) => c.id));
  assert.equal(ids.size, cases.length);
  const texts = new Set(cases.map((c) => c.text.toLowerCase()));
  assert.equal(texts.size, cases.length, "a sentence appears twice");
  for (const c of cases) {
    assert.match(c.expect.amount ?? "", /^\d+\.\d{2}$/, c.id);
    assert.match(c.expect.date ?? "", /^\d{4}-\d{2}-\d{2}$/, c.id);
    assert.ok(["expense", "income", "transfer"].includes(c.expect.kind ?? ""), c.id);
  }
  assert.ok(cases.filter((c) => c.split === "test").length >= 60);
});

test("rule-based filling meets the evaluation gates on the held-out test split", async () => {
  const corpus = loadCorpus();
  const results = await runCases(
    corpus.cases.filter((c) => c.split === "test"),
    corpus.today,
    null,
  );
  assert.deepEqual(checkFormGates(summarize(results), loadGates().form), []);
});
