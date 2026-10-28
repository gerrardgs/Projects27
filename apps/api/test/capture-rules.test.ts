import assert from "node:assert/strict";
import { test } from "node:test";
import { findAmount, parseWithRules, wordsToNumber } from "../src/capture-rules.ts";
import { PERSONAL_CHART } from "../src/chart-template.ts";

const codes = new Set(PERSONAL_CHART.map((a) => a.code));
const TODAY = "2026-10-28";
const parse = (s: string) => parseWithRules(s, codes, TODAY);

test("everyday expenses: amount, date, category, funding, counterparty, description", () => {
  assert.deepEqual(parse("Beli nasi padang di warung sederhana 35 ribu pakai gopay kemarin"), {
    kind: "expense",
    amount: "35000.00",
    date: "2026-10-27",
    accountCode: "5100",
    fundingCode: "1300",
    description: "Beli nasi padang di warung sederhana",
    counterparty: "Warung Sederhana",
  });
  const listrik = parse("bayar token listrik 250.000 tunai");
  assert.equal(listrik.kind, "expense");
  assert.equal(listrik.amount, "250000.00");
  assert.equal(listrik.accountCode, "5400");
  assert.equal(listrik.fundingCode, "1100");
  assert.equal(listrik.date, TODAY);
});

test("income goes to the bank by default and reads 'juta' with decimals exactly", () => {
  const gaji = parse("terima gaji 12,5 juta dari PT Maju Jaya tanggal 25");
  assert.equal(gaji.kind, "income");
  assert.equal(gaji.amount, "12500000.00");
  assert.equal(gaji.accountCode, "4100");
  assert.equal(gaji.fundingCode, "1200");
  assert.equal(gaji.date, "2026-10-25");
  assert.equal(gaji.counterparty, "PT Maju Jaya");
});

test("transfers between own accounts", () => {
  const topup = parse("top up gopay 100 ribu dari bca");
  assert.deepEqual(
    [topup.kind, topup.accountCode, topup.fundingCode, topup.amount],
    ["transfer", "1300", "1200", "100000.00"],
  );
  const tarik = parse("tarik tunai 500rb");
  assert.deepEqual([tarik.kind, tarik.accountCode, tarik.fundingCode], ["transfer", "1100", "1200"]);
});

test("amount formats: Indonesian thousands and sen, spelled-out words, k and rb", () => {
  assert.equal(parse("listrik 1.250.000,50").amount, "1250000.50");
  assert.equal(parse("ongkos ojek dua puluh lima ribu").amount, "25000.00");
  assert.equal(parse("parkir 5k").amount, "5000.00");
  assert.equal(findAmount("tanggal 12 beli buku")?.minor ?? null, null, "a day of the month is not an amount");
  assert.equal(wordsToNumber(["satu", "juta", "lima", "ratus", "ribu"]), 1_500_000n);
  assert.equal(wordsToNumber(["seratus", "dua", "puluh"]), 120n);
});

test("dates: relative words, explicit dates, and a future date without a year means the past", () => {
  assert.equal(parse("makan siang 40 ribu kemarin lusa").date, "2026-10-26");
  assert.equal(parse("bensin 50 ribu 3 hari lalu").date, "2026-10-25");
  assert.equal(parse("sewa kos 1,5 juta 1 oktober").date, "2026-10-01");
  assert.equal(parse("bayar pajak 2 juta 15 desember").date, "2025-12-15");
});

test("unknown words fall back to the 'other' categories and leave no amount when none was said", () => {
  const other = parse("beli sesuatu");
  assert.deepEqual([other.kind, other.accountCode, other.fundingCode, other.amount], ["expense", "5990", "1100", null]);
});
