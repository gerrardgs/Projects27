// Applies migrations/*.sql in order, each in its own transaction, and records a checksum so an
// edited migration is detected instead of silently skipped.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./canonical.ts";
import { createPool, type Db, withTransaction } from "./db.ts";

const MIGRATIONS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

export async function migrate(db: Db): Promise<string[]> {
  await db.query(
    "create table if not exists schema_migrations (version text primary key, checksum text not null, applied_at timestamptz not null default now())",
  );
  const applied = new Map(
    (await db.query<{ version: string; checksum: string }>("select version, checksum from schema_migrations")).rows.map(
      (r) => [r.version, r.checksum],
    ),
  );
  const done: string[] = [];
  for (const file of (await readdir(MIGRATIONS)).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = await readFile(path.join(MIGRATIONS, file), "utf8");
    const checksum = sha256(sql).toString("hex");
    const previous = applied.get(file);
    if (previous !== undefined) {
      if (previous !== checksum)
        throw new Error(`migration ${file} changed after it was applied; add a new migration instead`);
      continue;
    }
    await withTransaction(db, async (tx) => {
      await tx.query(sql);
      await tx.query("insert into schema_migrations (version, checksum) values ($1, $2)", [file, checksum]);
    });
    done.push(file);
  }
  return done;
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const db = createPool(url);
  try {
    const done = await migrate(db);
    console.log(done.length === 0 ? "database is up to date" : `applied: ${done.join(", ")}`);
  } finally {
    await db.end();
  }
}
