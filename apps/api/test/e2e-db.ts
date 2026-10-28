// Recreates the end-to-end test database and applies the migrations. Used by apps/web/playwright.config.ts.

import pg from "pg";
import { createPool } from "../src/db.ts";
import { migrate } from "../src/migrate.ts";

const url = new URL(process.env.DATABASE_URL ?? "");
const name = url.pathname.slice(1);
if (!/^p27_e2e\w*$/.test(name)) throw new Error("DATABASE_URL must name a database starting with p27_e2e");
const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
await admin.query(`drop database if exists ${name} with (force)`);
await admin.query(`create database ${name}`);
await admin.end();
const db = createPool(url.toString());
await migrate(db);
await db.end();
console.log(`e2e database ${name} ready`);
