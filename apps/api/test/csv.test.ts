import assert from "node:assert/strict";
import { test } from "node:test";
import { CsvError, parseCsv } from "../src/csv.ts";

test("parses RFC 4180 quoting, CRLF line ends and a byte-order mark", () => {
  const text =
    '﻿Tanggal,Keterangan,Nominal\r\n2026-10-01,"Listrik, air ""PLN""",725350.50\r\n2026-10-02,"baris\nkedua",1000\r\n';
  assert.deepEqual(parseCsv(text), [
    ["Tanggal", "Keterangan", "Nominal"],
    ["2026-10-01", 'Listrik, air "PLN"', "725350.50"],
    ["2026-10-02", "baris\nkedua", "1000"],
  ]);
});

test("detects semicolon and tab delimiters from the header", () => {
  assert.deepEqual(parseCsv("a;b\n1,5;2\n"), [
    ["a", "b"],
    ["1,5", "2"],
  ]);
  assert.deepEqual(parseCsv("a\tb\nx\ty"), [
    ["a", "b"],
    ["x", "y"],
  ]);
});

test("rejects an unclosed quote and too many rows", () => {
  assert.throws(() => parseCsv('a,b\n"open,1\n'), CsvError);
  assert.throws(() => parseCsv("a\n1\n2\n3\n", 2), CsvError);
});
