// The /v1 API. Every route here is documented in packages/contract/openapi.json (checked by test/contract.test.ts).

import { isUuid, type Permission, requireEntity } from "./access.ts";
import { verifyChain } from "./audit.ts";
import {
  enableTotp,
  login,
  logout,
  register,
  SESSION_TTL_MS,
  startTotpSetup,
  validateLogin,
  validateRegistration,
} from "./auth.ts";
import { parseCapture } from "./capture.ts";
import type { Extractor } from "./capture-ai.ts";
import { captureQuality, reviewDraft } from "./capture-quality.ts";
import type { Config } from "./config.ts";
import type { Db } from "./db.ts";
import { badRequest, notFound, tooMany } from "./errors.ts";
import { reportSheets } from "./export.ts";
import { type RequestContext, Router, SESSION_COOKIE } from "./http.ts";
import { commitImport, inspectImport, parseImportRequest, previewImport, summarise } from "./imports.ts";
import {
  buildReport,
  closePeriod,
  createAccount,
  createJournalEntry,
  decideEntry,
  getEntry,
  getSnapshot,
  listAccounts,
  listEntries,
  listPeriods,
  listSnapshots,
  type ReportKind,
  recordTransaction,
  reopenPeriod,
  reverseEntry,
  type Scope,
} from "./ledger.ts";
import { RateLimiter } from "./rate-limit.ts";
import { writeXlsx, XLSX_MIME } from "./xlsx.ts";

const REPORT_KINDS = new Set<ReportKind>([
  "monthly-recap",
  "monthly-trend",
  "trial-balance",
  "income-statement",
  "balance-sheet",
]);
const IMPORT_BODY_BYTES = 8 * 1024 * 1024;

interface Deps {
  db: Db;
  config: Config;
  totpKey: Buffer;
  extractor: Extractor | null;
}

function session(ctx: RequestContext) {
  if (ctx.session === null) throw new Error("route requires a session");
  return ctx.session;
}

const param = (ctx: RequestContext, key: string) => ctx.params[key] ?? "";

/** Loads the entity named in the path, checking the permission, and returns the scope for ledger calls. */
async function scopeFor(db: Db, ctx: RequestContext, permission: Permission): Promise<Scope> {
  const entity = await requireEntity(db, session(ctx).userId, param(ctx, "entityId"), permission);
  return { db, actor: { userId: session(ctx).userId, ip: ctx.ip }, entity };
}

function yearMonth(ctx: RequestContext) {
  const year = Number(param(ctx, "year"));
  const month = Number(param(ctx, "month"));
  if (!Number.isInteger(year) || year < 1900 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw badRequest("year must be 1900 to 9999 and month 1 to 12.");
  }
  return { year, month };
}

function entryId(ctx: RequestContext) {
  const id = param(ctx, "entryId");
  if (!isUuid(id)) throw notFound("Journal entry not found.");
  return id;
}

const created = (result: { entry: unknown; created: boolean }) => ({
  status: result.created ? 201 : 200,
  body: result.entry,
});

function addAuthRoutes(router: Router, { db, config, totpKey }: Deps): void {
  const limiter = new RateLimiter(config.authAttemptsPerMinute, 60_000);
  const limit = (ctx: RequestContext, scope: string) => {
    if (!limiter.allow(`${scope}:${ctx.ip ?? "unknown"}`)) throw tooMany();
  };
  const cookie = (token: string, maxAgeSeconds: number) =>
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${config.cookieSecure ? "; Secure" : ""}`;

  router.add(
    "POST",
    "/v1/auth/register",
    async (ctx) => {
      limit(ctx, "register");
      const result = await register(db, validateRegistration(ctx.body), ctx.ip);
      return { status: 201, body: { userId: result.userId, entityId: result.entityId } };
    },
    { auth: false },
  );

  router.add(
    "POST",
    "/v1/auth/login",
    async (ctx) => {
      limit(ctx, "login");
      const input = validateLogin(ctx.body);
      const { token, expiresAt } = await login({ db, totpKey }, input, ctx.ip);
      if (input.client === "native") {
        return { status: 200, body: { token, tokenType: "Bearer", expiresAt: expiresAt.toISOString() } };
      }
      const setCookie = cookie(token, SESSION_TTL_MS.web / 1000);
      return { status: 200, body: { expiresAt: expiresAt.toISOString() }, headers: { "set-cookie": setCookie } };
    },
    { auth: false },
  );

  router.add("POST", "/v1/auth/logout", async (ctx) => {
    await logout(db, session(ctx), ctx.ip);
    return { status: 204, headers: ctx.viaCookie ? { "set-cookie": cookie("", 0) } : {} };
  });

  router.add("POST", "/v1/auth/totp/setup", async (ctx) => ({
    status: 200,
    body: await startTotpSetup({ db, totpKey }, session(ctx)),
  }));

  router.add("POST", "/v1/auth/totp/enable", async (ctx) => {
    const code = typeof ctx.body.code === "string" ? ctx.body.code : "";
    await enableTotp({ db, totpKey }, session(ctx), code, ctx.ip);
    return { status: 204 };
  });
}

async function me(db: Db, userId: string) {
  const user = await db.query<{ id: string; email: string; display_name: string; totp_enabled: boolean }>(
    "select id, email, display_name, totp_enabled from users where id = $1",
    [userId],
  );
  const memberships = await db.query<{ id: string; name: string; kind: string; currency: string; role: string }>(
    `select e.id, e.name, e.kind, e.functional_currency as currency, m.role
       from memberships m join entities e on e.id = m.entity_id where m.user_id = $1 order by e.created_at`,
    [userId],
  );
  const row = user.rows[0];
  if (row === undefined) throw notFound();
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    twoFactorEnabled: row.totp_enabled,
    entities: memberships.rows.map((m) => ({ ...m, currency: m.currency.trim() })),
  };
}

function addLedgerRoutes(router: Router, { db }: Deps): void {
  const base = "/v1/entities/{entityId}";
  router.add("GET", `${base}/accounts`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    return { status: 200, body: { accounts: await listAccounts(db, entity) } };
  });
  router.add("POST", `${base}/accounts`, async (ctx) => ({
    status: 201,
    body: await createAccount(await scopeFor(db, ctx, "manage_accounts"), ctx.body),
  }));
  router.add("POST", `${base}/transactions`, async (ctx) =>
    created(await recordTransaction(await scopeFor(db, ctx, "write"), ctx.body)),
  );
  router.add("GET", `${base}/journal-entries`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    return { status: 200, body: { entries: await listEntries(db, entity, ctx.query) } };
  });
  router.add("POST", `${base}/journal-entries`, async (ctx) =>
    created(await createJournalEntry(await scopeFor(db, ctx, "write"), ctx.body)),
  );
  router.add("GET", `${base}/journal-entries/{entryId}`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    return { status: 200, body: await getEntry(db, entity, entryId(ctx)) };
  });
  router.add("POST", `${base}/journal-entries/{entryId}/reverse`, async (ctx) =>
    created(await reverseEntry(await scopeFor(db, ctx, "write"), entryId(ctx), ctx.body)),
  );
  for (const decision of ["approve", "reject"] as const) {
    router.add("POST", `${base}/journal-entries/{entryId}/${decision}`, async (ctx) => ({
      status: 200,
      body: await decideEntry(await scopeFor(db, ctx, "approve"), entryId(ctx), decision, ctx.body),
    }));
  }
}

function xlsxReply(sheets: ReturnType<typeof reportSheets>, filename: string) {
  return {
    status: 200,
    raw: writeXlsx(sheets),
    headers: { "content-type": XLSX_MIME, "content-disposition": `attachment; filename="${filename}"` },
  };
}

function reportKind(ctx: RequestContext): ReportKind {
  const kind = param(ctx, "kind") as ReportKind;
  if (!REPORT_KINDS.has(kind)) throw notFound("Unknown report.");
  return kind;
}

function addImportExportRoutes(router: Router, { db }: Deps): void {
  const base = "/v1/entities/{entityId}";
  const options = { maxBodyBytes: IMPORT_BODY_BYTES };
  router.add(
    "POST",
    `${base}/imports/inspect`,
    async (ctx) => {
      await scopeFor(db, ctx, "write");
      return { status: 200, body: inspectImport(ctx.body) };
    },
    options,
  );
  router.add(
    "POST",
    `${base}/imports/preview`,
    async (ctx) => {
      const rows = await previewImport(await scopeFor(db, ctx, "write"), parseImportRequest(ctx.body));
      return { status: 200, body: { summary: summarise(rows), rows } };
    },
    options,
  );
  router.add(
    "POST",
    `${base}/imports/commit`,
    async (ctx) => {
      const rows = await commitImport(await scopeFor(db, ctx, "write"), parseImportRequest(ctx.body));
      return { status: 200, body: { summary: summarise(rows), rows } };
    },
    options,
  );
  router.add("GET", `${base}/reports/{kind}/xlsx`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    const kind = reportKind(ctx);
    return xlsxReply(reportSheets(await buildReport(db, entity, kind, ctx.query)), `${kind}.xlsx`);
  });
  router.add("GET", `${base}/periods/{year}/{month}/snapshots/{snapshotId}/xlsx`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    const id = param(ctx, "snapshotId");
    if (!isUuid(id)) throw notFound("Snapshot not found.");
    const { year, month } = yearMonth(ctx);
    const snapshot = await getSnapshot(db, entity, id);
    const name = `${String(snapshot.report.kind ?? "laporan")}-${year}-${String(month).padStart(2, "0")}.xlsx`;
    return xlsxReply(reportSheets(snapshot.report, snapshot), name);
  });
}

function addPeriodAndReportRoutes(router: Router, { db }: Deps): void {
  const base = "/v1/entities/{entityId}";
  router.add("GET", `${base}/reports/{kind}`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    return { status: 200, body: await buildReport(db, entity, reportKind(ctx), ctx.query) };
  });
  router.add("GET", `${base}/periods`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    return { status: 200, body: { periods: await listPeriods(db, entity) } };
  });
  router.add("POST", `${base}/periods/{year}/{month}/close`, async (ctx) => {
    const { year, month } = yearMonth(ctx);
    return { status: 200, body: await closePeriod(await scopeFor(db, ctx, "close"), year, month) };
  });
  router.add("POST", `${base}/periods/{year}/{month}/reopen`, async (ctx) => {
    const { year, month } = yearMonth(ctx);
    return { status: 200, body: await reopenPeriod(await scopeFor(db, ctx, "close"), year, month, ctx.body) };
  });
  router.add("GET", `${base}/periods/{year}/{month}/snapshots`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    const { year, month } = yearMonth(ctx);
    return { status: 200, body: { snapshots: await listSnapshots(db, entity, year, month) } };
  });
  router.add("GET", `${base}/audit/verify`, async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read_audit");
    return { status: 200, body: await verifyChain(db, entity.id) };
  });
}

function addCaptureRoutes(router: Router, { db, extractor }: Deps): void {
  // Each parse may call a paid AI model, so it is limited per user.
  const limiter = new RateLimiter(30, 60_000);
  router.add("POST", "/v1/entities/{entityId}/capture/parse", async (ctx) => {
    const scope = await scopeFor(db, ctx, "write");
    if (!limiter.allow(scope.actor.userId))
      throw tooMany("Terlalu banyak permintaan isi otomatis; coba lagi sebentar lagi.");
    return { status: 200, body: await parseCapture(scope, ctx.body, extractor) };
  });
  router.add("POST", "/v1/entities/{entityId}/capture/{draftId}/review", async (ctx) => {
    await reviewDraft(await scopeFor(db, ctx, "write"), param(ctx, "draftId"), ctx.body);
    return { status: 204 };
  });
  router.add("GET", "/v1/entities/{entityId}/capture/quality", async (ctx) => {
    const { entity } = await scopeFor(db, ctx, "read");
    return { status: 200, body: await captureQuality(db, entity, ctx.query) };
  });
}

export function buildRouter(db: Db, config: Config, totpKey: Buffer, extractor: Extractor | null = null): Router {
  const deps: Deps = { db, config, totpKey, extractor };
  const router = new Router();
  router.add(
    "GET",
    "/v1/health",
    async () => {
      await db.query("select 1");
      return { status: 200, body: { status: "ok" } };
    },
    { auth: false },
  );
  addAuthRoutes(router, deps);
  router.add("GET", "/v1/me", async (ctx) => ({ status: 200, body: await me(db, session(ctx).userId) }));
  addLedgerRoutes(router, deps);
  addPeriodAndReportRoutes(router, deps);
  addImportExportRoutes(router, deps);
  addCaptureRoutes(router, deps);
  return router;
}
