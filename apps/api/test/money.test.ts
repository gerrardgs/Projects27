import assert from "node:assert/strict";
import { test } from "node:test";
import { AmountError, formatAmount, parseAmount } from "../src/money.ts";

test("parses IDR amounts into sen without floating point", () => {
  assert.equal(parseAmount("125000", 2), 12_500_000n);
  assert.equal(parseAmount("125000.5", 2), 12_500_050n);
  assert.equal(parseAmount("725350.50", 2), 72_535_050n);
  assert.equal(parseAmount("0.01", 2), 1n);
  assert.equal(parseAmount("999999999999999.99", 2), 99_999_999_999_999_999n);
});

test("rejects malformed, negative, over-precise and oversized amounts", () => {
  for (const bad of ["", "-1", "1.234", "1e5", "01", "1,000", " 1", "1.", ".5", "1000000000000000", "NaN"]) {
    assert.throws(() => parseAmount(bad, 2), AmountError, bad);
  }
});

test("formats minor units with exactly the currency's decimals", () => {
  assert.equal(formatAmount(12_500_050n, 2), "125000.50");
  assert.equal(formatAmount(1n, 2), "0.01");
  assert.equal(formatAmount(0n, 2), "0.00");
  assert.equal(formatAmount(-18_600_000n, 2), "-186000.00");
  assert.equal(formatAmount(42n, 0), "42");
});

test("parse and format round-trip", () => {
  for (const text of ["0.00", "0.10", "15000000.00", "32879649.50"])
    assert.equal(formatAmount(parseAmount(text, 2), 2), text);
});
