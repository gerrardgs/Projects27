// Office Open XML spreadsheets (ECMA-376), written and read with the standard library only.
// Writing: one or more sheets of text, number and amount cells. Reading: the first sheet as rows of
// strings, which is what imports need.

import { readZip, writeZip, ZipError } from "./zip.ts";

export type Cell = { text: string; bold?: boolean } | { amount: string; bold?: boolean } | { number: number } | null;

export interface Sheet {
  name: string;
  rows: Cell[][];
  widths?: number[];
}

const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
// Excel stores numbers as IEEE doubles and keeps 15 significant digits; longer amounts are written as text.
const EXCEL_DIGITS = 15;

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Characters allowed in XML 1.0 documents (section 2.2); others, such as control characters, are dropped.
function isXmlChar(cp: number): boolean {
  return (
    cp === 0x9 ||
    cp === 0xa ||
    cp === 0xd ||
    (cp >= 0x20 && cp <= 0xd7ff) ||
    (cp >= 0xe000 && cp <= 0xfffd) ||
    cp >= 0x10000
  );
}

function escapeXml(text: string): string {
  return [...text]
    .filter((ch) => isXmlChar(ch.codePointAt(0) ?? 0))
    .join("")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function columnName(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

const significantDigits = (amount: string) => amount.replace(/^-/, "").replace(".", "").replace(/^0+/, "").length;

function cellXml(cell: Cell, ref: string): string {
  if (cell === null) return "";
  if ("number" in cell) return `<c r="${ref}"><v>${cell.number}</v></c>`;
  if ("amount" in cell && significantDigits(cell.amount) <= EXCEL_DIGITS) {
    return `<c r="${ref}" s="${cell.bold ? 3 : 2}"><v>${cell.amount}</v></c>`;
  }
  const text = "amount" in cell ? cell.amount : cell.text;
  return `<c r="${ref}" t="inlineStr"${cell.bold ? ' s="1"' : ""}><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function sheetXml(sheet: Sheet): string {
  const cols = (sheet.widths ?? [])
    .map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)
    .join("");
  const rows = sheet.rows
    .map(
      (row, r) => `<row r="${r + 1}">${row.map((cell, c) => cellXml(cell, `${columnName(c)}${r + 1}`)).join("")}</row>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="${MAIN}">${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${rows}</sheetData></worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${MAIN}"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const safeSheetName = (name: string) => name.replace(/[[\]:*?/\\]/g, " ").slice(0, 31) || "Sheet";

export function writeXlsx(sheets: readonly Sheet[]): Buffer {
  const xml = (body: string) => Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${body}`, "utf8");
  const sheetEntries = sheets.map((sheet, i) => ({
    name: `xl/worksheets/sheet${i + 1}.xml`,
    data: Buffer.from(sheetXml(sheet), "utf8"),
  }));
  const overrides = sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const sheetList = sheets
    .map((s, i) => `<sheet name="${escapeXml(safeSheetName(s.name))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  const sheetRels = sheets
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join("");
  return writeZip([
    {
      name: "[Content_Types].xml",
      data: xml(
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: xml(
        `<Relationships xmlns="${PKG_REL}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      data: xml(`<workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets>${sheetList}</sheets></workbook>`),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: xml(
        `<Relationships xmlns="${PKG_REL}">${sheetRels}<Relationship Id="rId${sheets.length + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
      ),
    },
    { name: "xl/styles.xml", data: Buffer.from(STYLES, "utf8") },
    ...sheetEntries,
  ]);
}

// ---- Reading ----

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, code: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (code[0] !== "#") return named[code.toLowerCase()] ?? "";
    return String.fromCodePoint(
      code[1] === "x" || code[1] === "X" ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1)),
    );
  });
}

/** Concatenates every <t> text run inside a fragment (shared strings may hold rich-text runs). */
const textRuns = (fragment: string) =>
  [...fragment.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1] ?? "")).join("");

function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

function firstSheetPath(files: Map<string, Buffer>): string {
  const workbook = files.get("xl/workbook.xml")?.toString("utf8") ?? "";
  const rid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(workbook)?.[1];
  const rels = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const target = [...rels.matchAll(/<Relationship\b[^>]*>/g)]
    .map((m) => m[0])
    .find((tag) => rid !== undefined && tag.includes(`Id="${rid}"`));
  const path = target === undefined ? undefined : /Target="([^"]+)"/.exec(target)?.[1];
  if (path === undefined) throw new ZipError("the workbook has no worksheet");
  return path.startsWith("/") ? path.slice(1) : `xl/${path.replace(/^\.\//, "")}`;
}

function cellValue(attributes: string, body: string, shared: string[]): string {
  const type = /\bt="([^"]+)"/.exec(attributes)?.[1];
  if (type === "inlineStr") return textRuns(body);
  const value = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
  return type === "s" ? (shared[Number(value)] ?? "") : value;
}

function rowCells(rowXml: string, shared: string[]): string[] {
  const cells: string[] = [];
  for (const cell of rowXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attributes = cell[1] ?? "";
    const ref = /\br="([A-Z]+\d+)"/.exec(attributes)?.[1];
    const index = ref === undefined ? cells.length : columnIndex(ref);
    while (cells.length < index) cells.push("");
    cells[index] = cellValue(attributes, cell[2] ?? "", shared);
  }
  return cells;
}

/** Returns the first worksheet as rows of cell strings. Numbers stay as written in the file. */
export function readXlsx(file: Buffer, maxRows = 10_000): string[][] {
  const files = readZip(file);
  const sharedXml = files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const shared = [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => textRuns(m[1] ?? ""));
  const sheet = files.get(firstSheetPath(files))?.toString("utf8");
  if (sheet === undefined) throw new ZipError("the first worksheet is missing");
  const rows = [...sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];
  if (rows.length > maxRows) throw new ZipError(`the sheet has more than ${maxRows} rows`);
  return rows.map((row) => rowCells(row[1] ?? "", shared));
}
