// CSV as in RFC 4180, with the delimiter detected from the header line (comma, semicolon or tab;
// spreadsheet exports in Indonesian locales often use semicolons) and a UTF-8 byte-order mark ignored.

export class CsvError extends Error {}

function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => ({ d, n: header.split(d).length }));
  return counts.reduce((best, c) => (c.n > best.n ? c : best)).d;
}

interface State {
  rows: string[][];
  row: string[];
  field: string;
  quoted: boolean;
}

function endField(s: State): void {
  s.row.push(s.field);
  s.field = "";
}

function endRow(s: State, maxRows: number): void {
  endField(s);
  if (s.row.length > 1 || s.row[0] !== "") s.rows.push(s.row);
  if (s.rows.length > maxRows) throw new CsvError(`the file has more than ${maxRows} rows`);
  s.row = [];
}

function quotedChar(s: State, ch: string, next: string | undefined): number {
  if (ch !== '"') {
    s.field += ch;
    return 1;
  }
  if (next === '"') {
    s.field += '"';
    return 2;
  }
  s.quoted = false;
  return 1;
}

function step(s: State, text: string, i: number, options: { delimiter: string; maxRows: number }): number {
  const ch = text[i] as string;
  if (s.quoted) return quotedChar(s, ch, text[i + 1]);
  if (ch === '"' && s.field === "") s.quoted = true;
  else if (ch === options.delimiter) endField(s);
  else if (ch === "\n") endRow(s, options.maxRows);
  else if (ch !== "\r") s.field += ch;
  return 1;
}

export function parseCsv(input: string, maxRows = 10_000): string[][] {
  const text = input.startsWith("\uFEFF") ? input.slice(1) : input;
  const options = { delimiter: detectDelimiter(text), maxRows };
  const s: State = { rows: [], row: [], field: "", quoted: false };
  for (let i = 0; i < text.length; ) i += step(s, text, i, options);
  if (s.quoted) throw new CsvError("a quoted field is not closed");
  if (s.field !== "" || s.row.length > 0) endRow(s, maxRows);
  return s.rows;
}
