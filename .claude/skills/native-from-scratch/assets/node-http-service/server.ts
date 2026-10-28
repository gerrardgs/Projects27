// Minimal JSON HTTP service using only Node.js built-ins.
// Runs directly with `node server.ts` on Node.js 22.18+ / 23.6+ (built-in type stripping).

import { randomUUID } from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface NewUser {
  readonly name: string;
  readonly email: string;
}

export type Validation<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly string[] };

const MAX_BODY_BYTES = 16 * 1024;
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_PATH_PATTERN = /^\/users\/([^/]+)$/;

export class UserStore {
  readonly #users = new Map<string, User>();

  create(newUser: NewUser): User {
    const user: User = { id: randomUUID(), ...newUser };
    this.#users.set(user.id, user);
    return user;
  }

  findById(id: string): User | undefined {
    return this.#users.get(id);
  }
}

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Pure validation: turns untrusted JSON into a typed NewUser or a list of problems. */
export function parseNewUser(input: unknown): Validation<NewUser> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["body must be a JSON object"] };
  }
  const { name, email } = input as Record<string, unknown>;
  const errors = [nameProblem(name), emailProblem(email)].filter((problem) => problem !== undefined);
  if (errors.length > 0 || typeof name !== "string" || typeof email !== "string") {
    return { ok: false, errors };
  }
  return { ok: true, value: { name: name.trim(), email: email.toLowerCase() } };
}

function nameProblem(name: unknown): string | undefined {
  if (typeof name !== "string" || name.trim().length === 0) return "name is required";
  if (name.length > MAX_NAME_LENGTH) return `name must be at most ${MAX_NAME_LENGTH} characters`;
  return undefined;
}

function emailProblem(email: unknown): string | undefined {
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) return "email must be a valid address";
  if (email.length > MAX_EMAIL_LENGTH) return `email must be at most ${MAX_EMAIL_LENGTH} characters`;
  return undefined;
}

async function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json");
  }

  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    receivedBytes += buffer.length;
    if (receivedBytes > MAX_BODY_BYTES) {
      throw new HttpError(413, `Request body exceeds ${MAX_BODY_BYTES} bytes`);
    }
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Request body is not valid JSON");
  }
}

function sendJson(
  response: http.ServerResponse,
  status: number,
  body: unknown,
  headers: Readonly<Record<string, string>> = {},
): void {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(payload);
}

/** Sends 405 with an Allow header and returns false when the method does not match. */
function methodAllowed(method: string, allowed: string, response: http.ServerResponse): boolean {
  if (method === allowed) return true;
  sendJson(response, 405, { error: "Method not allowed" }, { Allow: allowed });
  return false;
}

async function createUser(
  store: UserStore,
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<void> {
  const parsed = parseNewUser(await readJsonBody(request));
  if (!parsed.ok) {
    sendJson(response, 400, { error: "Validation failed", details: parsed.errors });
    return;
  }
  sendJson(response, 201, store.create(parsed.value));
}

function showUser(store: UserStore, id: string, response: http.ServerResponse): void {
  const user = store.findById(id);
  if (user === undefined) {
    sendJson(response, 404, { error: "User not found" });
    return;
  }
  sendJson(response, 200, user);
}

async function route(store: UserStore, request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  const method = request.method ?? "GET";

  if (pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (pathname === "/users") {
    if (methodAllowed(method, "POST", response)) await createUser(store, request, response);
    return;
  }

  const userMatch = USER_PATH_PATTERN.exec(pathname);
  if (userMatch?.[1] !== undefined) {
    if (methodAllowed(method, "GET", response)) showUser(store, decodeURIComponent(userMatch[1]), response);
    return;
  }

  sendJson(response, 404, { error: "Route not found" });
}

export function createServer(store: UserStore): http.Server {
  return http.createServer((request, response) => {
    route(store, request, response).catch((error: unknown) => {
      if (error instanceof HttpError) {
        // Close the connection so an oversized or unread body cannot linger.
        sendJson(response, error.status, { error: error.message }, { Connection: "close" });
        return;
      }
      console.error(JSON.stringify({ level: "error", message: "unhandled request error", error: String(error) }));
      if (!response.headersSent) {
        sendJson(response, 500, { error: "Internal server error" });
      } else {
        response.destroy();
      }
    });
  });
}

function readPort(rawPort: string | undefined): number {
  const port = Number(rawPort ?? "3000");
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`PORT must be an integer between 0 and 65535, got "${rawPort}"`);
  }
  return port;
}

function main(): void {
  const port = readPort(process.env["PORT"]);
  const server = createServer(new UserStore());
  server.listen(port, () => {
    const { port: boundPort } = server.address() as AddressInfo;
    console.log(JSON.stringify({ level: "info", message: "listening", port: boundPort }));
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    console.log(JSON.stringify({ level: "info", message: "shutting down", signal }));
    server.close((error) => {
      process.exitCode = error === undefined ? 0 : 1;
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
