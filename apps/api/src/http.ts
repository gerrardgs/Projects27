// Minimal HTTP layer on node:http: routing, JSON bodies with a size limit, RFC 9457 problem
// responses, security headers, CORS for the configured web origins and cookie or bearer sessions.

import type { IncomingMessage, ServerResponse } from "node:http";
import { type Session, sessionFromToken } from "./auth.ts";
import type { Config } from "./config.ts";
import type { Db } from "./db.ts";
import { badRequest, HttpError, unauthorized } from "./errors.ts";

export const SESSION_COOKIE = "p27_session";
const MAX_BODY_BYTES = 1_048_576;
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface RequestContext {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
  ip: string | null;
  session: Session | null;
  viaCookie: boolean;
  requestId: string;
}

export interface Reply {
  status: number;
  body?: unknown;
  /** A binary response (for example an Excel file); `headers` must then set content-type. */
  raw?: Buffer;
  headers?: Record<string, string | string[]>;
}

export type Handler = (ctx: RequestContext) => Promise<Reply>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  template: string;
  auth: boolean;
  maxBodyBytes: number;
  handler: Handler;
}

export class Router {
  readonly routes: Route[] = [];

  add(
    method: string,
    template: string,
    handler: Handler,
    options: { auth?: boolean; maxBodyBytes?: number } = {},
  ): void {
    const keys: string[] = [];
    const source = template.replace(/\{(\w+)\}/g, (_, key: string) => {
      keys.push(key);
      return "([^/]+)";
    });
    this.routes.push({
      method,
      pattern: new RegExp(`^${source}$`),
      keys,
      template,
      auth: options.auth ?? true,
      maxBodyBytes: options.maxBodyBytes ?? MAX_BODY_BYTES,
      handler,
    });
  }

  match(method: string, path: string) {
    let pathMatched = false;
    for (const route of this.routes) {
      const found = route.pattern.exec(path);
      if (found === null) continue;
      pathMatched = true;
      if (route.method !== method) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(found[index + 1] ?? "");
      });
      return { route, params };
    }
    return pathMatched ? "method-not-allowed" : null;
  }
}

async function readRaw(req: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new HttpError(413, "Payload too large", `The request body is larger than ${limit} bytes.`);
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function parseJsonObject(raw: Buffer): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    throw badRequest("The body must be a JSON object.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    throw badRequest("The body must be a JSON object.");
  return parsed as Record<string, unknown>;
}

async function readBody(req: IncomingMessage, limit: number): Promise<Record<string, unknown>> {
  if (req.method === "GET" || req.method === "HEAD") return {};
  const raw = await readRaw(req, limit);
  if (raw.length === 0) return {};
  if (!(req.headers["content-type"] ?? "").startsWith("application/json")) {
    throw new HttpError(415, "Unsupported media type", "Send the body as application/json.");
  }
  return parseJsonObject(raw);
}

function cookieValue(header: string | undefined, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function baseHeaders(origin: string | undefined, config: Config): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "cross-origin-resource-policy": "same-site",
  };
  if (config.cookieSecure) headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  if (origin !== undefined && config.webOrigins.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-credentials"] = "true";
    headers.vary = "Origin";
  }
  return headers;
}

function send(res: ServerResponse, status: number, headers: Record<string, string | string[]>, body: unknown): void {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, body === undefined ? { ...headers, "content-length": "0" } : headers);
  res.end(payload);
}

function problem(error: HttpError, requestId: string) {
  return {
    type: "about:blank",
    title: error.title,
    status: error.status,
    detail: error.message,
    ...(error.fields === undefined ? {} : { errors: error.fields }),
    requestId,
  };
}

const isAllowedOrigin = (origin: string | undefined, config: Config) =>
  origin !== undefined && config.webOrigins.includes(origin);

function preflight(
  res: ServerResponse,
  origin: string | undefined,
  headers: Record<string, string>,
  config: Config,
): void {
  if (!isAllowedOrigin(origin, config)) throw new HttpError(403, "Forbidden", "Origin not allowed.");
  send(
    res,
    204,
    {
      ...headers,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-max-age": "600",
    },
    undefined,
  );
}

function resolveRoute(router: Router, method: string, path: string) {
  const matched = router.match(method, path);
  if (matched === null) throw new HttpError(404, "Not found", "No such endpoint.");
  if (matched === "method-not-allowed")
    throw new HttpError(405, "Method not allowed", `${method} is not supported here.`);
  return matched;
}

function credentials(req: IncomingMessage) {
  const bearer = /^Bearer (\S+)$/.exec(req.headers.authorization ?? "")?.[1] ?? null;
  const cookie = cookieValue(req.headers.cookie, SESSION_COOKIE);
  return { token: bearer ?? cookie, viaCookie: bearer === null && cookie !== null };
}

async function authenticate(req: IncomingMessage, db: Db, config: Config, requiresAuth: boolean) {
  const { token, viaCookie } = credentials(req);
  const session = token === null ? null : await sessionFromToken(db, token);
  if (requiresAuth && session === null) throw unauthorized();
  // Cookie sessions are ambient credentials: state-changing requests must come from an allowed origin.
  const unsafe = UNSAFE.has(req.method ?? "");
  if (viaCookie && unsafe && !isAllowedOrigin(req.headers.origin, config)) {
    throw new HttpError(403, "Forbidden", "Cross-site request blocked.");
  }
  return { session, viaCookie };
}

function toHttpError(error: unknown, requestId: string, method: string, path: string): HttpError {
  if (error instanceof HttpError) return error;
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", requestId, method, path, message }));
  return new HttpError(500, "Internal error", "Something went wrong. Quote the request id when reporting it.");
}

export function createHandler(router: Router, db: Db, config: Config) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const requestId = crypto.randomUUID();
    const origin = req.headers.origin;
    const headers = baseHeaders(origin, config);
    const url = new URL(req.url ?? "/", "http://localhost");
    const method = req.method ?? "GET";
    try {
      if (method === "OPTIONS") {
        preflight(res, origin, headers, config);
        return;
      }
      const matched = resolveRoute(router, method, url.pathname);
      const { session, viaCookie } = await authenticate(req, db, config, matched.route.auth);
      const ctx: RequestContext = {
        method,
        path: url.pathname,
        params: matched.params,
        query: url.searchParams,
        body: await readBody(req, matched.route.maxBodyBytes),
        ip: req.socket.remoteAddress ?? null,
        session,
        viaCookie,
        requestId,
      };
      const reply = await matched.route.handler(ctx);
      if (reply.raw !== undefined) {
        res.writeHead(reply.status, { ...headers, ...reply.headers, "content-length": String(reply.raw.length) });
        res.end(reply.raw);
        return;
      }
      send(res, reply.status, { ...headers, ...reply.headers }, reply.body);
    } catch (error) {
      const httpError = toHttpError(error, requestId, method, url.pathname);
      send(
        res,
        httpError.status,
        { ...headers, "content-type": "application/problem+json; charset=utf-8" },
        problem(httpError, requestId),
      );
    }
  };
}
