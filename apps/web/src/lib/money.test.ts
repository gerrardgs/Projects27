import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRupiah, parseRupiahInput, toInputAmount } from "./money.ts";

const nbsp = (s: string) => s.replace(/ /g, " ");

test("formats API amounts exactly, with sen only when present", () => {
  assert.equal(nbsp(formatRupiah("725350.50")), "Rp 725.350,50");
  assert.equal(nbsp(formatRupiah("35000.00")), "Rp 35.000");
  assert.equal(nbsp(formatRupiah("-186000.00")), "-Rp 186.000");
  assert.equal(nbsp(formatRupiah("999999999999999.99")), "Rp 999.999.999.999.999,99");
  assert.throws(() => formatRupiah("35000"));
});

test("reads amounts typed the Indonesian way", () => {
  assert.equal(parseRupiahInput("35.000"), "35000.00");
  assert.equal(parseRupiahInput("Rp 1.250.000,50"), "1250000.50");
  assert.equal(parseRupiahInput("35000"), "35000.00");
  assert.equal(parseRupiahInput("0,5"), "0.50");
  for (const bad of ["", "abc", "-5", "1,234", "12.34", "1.2345", "0", "1,234,5"])
    assert.equal(parseRupiahInput(bad), null, bad);
});

test("API amounts become typed amounts that read back to the same value", () => {
  for (const amount of ["35000.00", "1250000.50", "0.50", "999999999999999.99"]) {
    assert.equal(parseRupiahInput(toInputAmount(amount)), amount, amount);
  }
  assert.equal(toInputAmount("1250000.50"), "1.250.000,50");
});
