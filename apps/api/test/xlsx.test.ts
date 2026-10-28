import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { columnName, readXlsx, writeXlsx } from "../src/xlsx.ts";
import { readZip, ZipError } from "../src/zip.ts";

test("reads a workbook written by another library (openpyxl 3.1.5)", () => {
  const rows = readXlsx(readFileSync(new URL("fixtures/openpyxl-mutasi.xlsx", import.meta.url)));
  assert.deepEqual(rows[0], ["Tanggal", "Keterangan", "Nominal", "Jenis", "Kategori"]);
  // openpyxl stores dates as serial day numbers: 2026-10-03 is day 46298 counted from 1899-12-30.
  assert.deepEqual(rows[1], ["46298", 'Belanja & makan "mingguan"', "-1135000", "DB", "5100"]);
  assert.deepEqual(rows[2], ["46310", "Proyek freelance <desain>", "4250000.5", "CR", "4300"]);
  assert.equal(rows.length, 4);
});

test("round-trips text, amounts and escaping through its own writer", () => {
  const file = writeXlsx([
    {
      name: "Laporan: Okt/2026",
      rows: [
        [{ text: "Akun & <keterangan>", bold: true }, { amount: "725350.50" }],
        [null, { amount: "-186000.00" }, { number: 7 }],
        [{ text: "Sangat besar" }, { amount: "99999999999999999.99" }],
      ],
    },
  ]);
  assert.deepEqual(readXlsx(file), [
    ["Akun & <keterangan>", "725350.50"],
    ["", "-186000.00", "7"],
    ["Sangat besar", "99999999999999999.99"],
  ]);
  const xml = readZip(file).get("xl/worksheets/sheet1.xml")?.toString("utf8") ?? "";
  assert.match(xml, /<c r="B1" s="2"><v>725350.50<\/v><\/c>/);
  assert.match(xml, /<c r="B3" t="inlineStr">/, "amounts beyond 15 significant digits stay exact as text");
  assert.equal(columnName(0), "A");
  assert.equal(columnName(25), "Z");
  assert.equal(columnName(26), "AA");
  assert.equal(columnName(701), "ZZ");
});

test("refuses archives that are not ZIP files or expand too far", () => {
  assert.throws(() => readZip(Buffer.from("not a zip at all, definitely not")), ZipError);
  const bomb = writeXlsx([{ name: "S", rows: [[{ text: "x".repeat(200_000) }]] }]);
  assert.throws(() => readZip(bomb, 10_000), ZipError);
});
