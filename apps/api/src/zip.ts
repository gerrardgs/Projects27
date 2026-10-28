// Minimal ZIP container (PKWARE APPNOTE): deflated entries, no ZIP64, no encryption. Enough for
// XLSX files. Reading is bounded so a small archive cannot expand into a huge one (zip bomb).

import { crc32, deflateRawSync, inflateRawSync } from "node:zlib";

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const END = 0x06054b50;
const UTF8_NAMES = 0x0800;
// 1980-01-01 00:00, the earliest DOS date: fixed so the same content always gives the same bytes.
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

export interface ZipEntry {
  name: string;
  data: Buffer;
}

export class ZipError extends Error {}

function localHeader(name: Buffer, crc: number, compressed: number, size: number): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(LOCAL, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(UTF8_NAMES, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(DOS_DATE, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressed, 18);
  header.writeUInt32LE(size, 22);
  header.writeUInt16LE(name.length, 26);
  return header;
}

function centralHeader(name: Buffer, local: Buffer, offset: number): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(CENTRAL, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  local.copy(header, 8, 6, 30);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, name]);
}

export function writeZip(entries: readonly ZipEntry[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const body = deflateRawSync(entry.data);
    const local = localHeader(name, crc32(entry.data), body.length, entry.data.length);
    central.push(centralHeader(name, local, offset));
    parts.push(local, name, body);
    offset += local.length + name.length + body.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(END, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

function findEnd(zip: Buffer): number {
  for (let at = zip.length - 22; at >= Math.max(0, zip.length - 22 - 65_535); at -= 1) {
    if (zip.readUInt32LE(at) === END) return at;
  }
  throw new ZipError("not a ZIP file");
}

function entryData(zip: Buffer, method: number, start: number, sizes: { compressed: number; budget: number }): Buffer {
  const raw = zip.subarray(start, start + sizes.compressed);
  if (method === 0) return Buffer.from(raw);
  if (method !== 8) throw new ZipError(`unsupported compression method ${method}`);
  try {
    return inflateRawSync(raw, { maxOutputLength: Math.max(sizes.budget, 1) });
  } catch {
    throw new ZipError("damaged entry or archive expands beyond the allowed size");
  }
}

/** Reads every entry; throws ZipError on damaged files or when the uncompressed total exceeds maxTotal bytes. */
export function readZip(zip: Buffer, maxTotal = 50 * 1024 * 1024): Map<string, Buffer> {
  if (zip.length < 22) throw new ZipError("not a ZIP file");
  const end = findEnd(zip);
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  let budget = maxTotal;
  const files = new Map<string, Buffer>();
  for (let index = 0; index < count; index += 1) {
    if (at + 46 > zip.length || zip.readUInt32LE(at) !== CENTRAL) throw new ZipError("damaged ZIP directory");
    const method = zip.readUInt16LE(at + 10);
    const compressed = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const skip = nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    const local = zip.readUInt32LE(at + 42);
    if (local + 30 > zip.length || zip.readUInt32LE(local) !== LOCAL) throw new ZipError("damaged ZIP entry");
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const data = entryData(zip, method, start, { compressed, budget });
    budget -= data.length;
    if (budget < 0) throw new ZipError("archive expands beyond the allowed size");
    files.set(name, data);
    at += 46 + skip;
  }
  return files;
}
