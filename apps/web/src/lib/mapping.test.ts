import assert from "node:assert/strict";
import { test } from "node:test";
import { guessMapping } from "./mapping.ts";

test("guesses columns from Indonesian bank-export headers", () => {
  assert.deepEqual(guessMapping(["Tanggal", "Keterangan", "Nominal", "Jenis", "Kategori", "Saldo"]), {
    date: "Tanggal",
    description: "Keterangan",
    amount: "Nominal",
    kind: "Jenis",
    account: "Kategori",
  });
  assert.deepEqual(guessMapping(["x", "y"]), {});
});
