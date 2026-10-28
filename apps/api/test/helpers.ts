// Test harness: a fresh PostgreSQL database per test file, migrated, with the API on a random port.
// TEST_DATABASE_URL points at any database on the server used to create and drop the test database.

import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import pg from "pg";
import type { Extractor } from "../src/capture-ai.ts";
import type { Config } from "../src/config.ts";
import { createPool, type Db } from "../src/db.ts";
import { migrate } from "../src/migrate.ts";
import { createApp } from "../src/server.ts";

export const ADMIN_URL = process.env.TEST_DATABASE_URL ?? "postgres://localhost:5433/postgres";
export const WEB_ORIGIN = "https://app.example.test";
export const TOTP_KEY = randomBytes(32);

export interface Harness {
  db: Db;
  baseUrl: string;
  close: () => Promise<void>;
}

export async function startHarness(
  options: { authAttemptsPerMinute?: number; extractor?: Extractor } = {},
): Promise<Harness> {
  const name = `p27_test_${randomBytes(6).toString("hex")}`;
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();
  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  const db = createPool(url.toString());
  await migrate(db);
  const config: Config = {
    databaseUrl: url.toString(),
    port: 0,
    webOrigins: [WEB_ORIGIN],
    cookieSecure: false,
    authAttemptsPerMinute: options.authAttemptsPerMinute ?? 1000,
    aiApiKey: null,
    aiModel: "claude-opus-5-5",
  };
  const server = createApp(db, config, TOTP_KEY, options.extractor ?? null);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    db,
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.end();
      const cleanup = new pg.Client({ connectionString: ADMIN_URL });
      await cleanup.connect();
      await cleanup.query(`drop database if exists ${name} with (force)`);
      await cleanup.end();
    },
  };
}

export interface ApiResponse<T> {
  status: number;
  body: T;
  headers: Headers;
}

export async function api<T = Problem>(
  h: Harness,
  method: string,
  path: string,
  options: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${h.baseUrl}${path}`, {
    method,
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const text = await response.text();
  return { status: response.status, body: (text === "" ? null : JSON.parse(text)) as T, headers: response.headers };
}

export interface Problem {
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string>;
}

export interface Line {
  lineNo: number;
  accountId: string;
  accountCode: string;
  debit: string;
  credit: string;
}

export interface Entry {
  id: string;
  date: string;
  status: string;
  total: string;
  lines: Line[];
  reversesEntryId: string | null;
  reversedByEntryId: string | null;
}

export interface Check {
  name: string;
  passed: boolean;
}

export const PASSWORD = "correct horse battery staple";

/** Registers a user and signs in as a native client; returns the bearer token and personal entity id. */
export async function signUp(h: Harness, email: string, displayName = "Gerrard") {
  const registered = await api<{ userId: string; entityId: string }>(h, "POST", "/v1/auth/register", {
    body: { email, password: PASSWORD, displayName },
  });
  if (registered.status !== 201) throw new Error(`register failed: ${JSON.stringify(registered.body)}`);
  const login = await api<{ token: string }>(h, "POST", "/v1/auth/login", {
    body: { email, password: PASSWORD, client: "native" },
  });
  if (login.status !== 200) throw new Error(`login failed: ${JSON.stringify(login.body)}`);
  return { token: login.body.token, entityId: registered.body.entityId, userId: registered.body.userId };
}

export async function accountIds(h: Harness, token: string, entityId: string): Promise<Map<string, string>> {
  const res = await api<{ accounts: { code: string; id: string }[] }>(h, "GET", `/v1/entities/${entityId}/accounts`, {
    token,
  });
  return new Map(res.body.accounts.map((a) => [a.code, a.id]));
}
