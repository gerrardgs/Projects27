// The API and packages/contract/openapi.json must agree: the same operations, and real responses
// that validate against the documented schemas. The web, iOS and Android clients rely on this.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import type { Db } from "../src/db.ts";
import { buildRouter } from "../src/routes.ts";
import { postFixture } from "./fixture.ts";
import { api, type Entry, type Harness, signUp, startHarness, TOTP_KEY } from "./helpers.ts";
import { validate } from "./schema.ts";

type Operation = {
  security?: unknown[];
  responses: Record<string, { content?: Record<string, { schema: Record<string, unknown> }> }>;
};
const spec = JSON.parse(readFileSync(new URL("../../../packages/contract/openapi.json", import.meta.url), "utf8")) as {
  paths: Record<string, Record<string, Operation | unknown>>;
};
const METHODS = new Set(["get", "post", "put", "patch", "delete"]);

function operation(method: string, path: string): Operation {
  const op = spec.paths[path]?.[method] as Operation | undefined;
  if (op === undefined) throw new Error(`${method.toUpperCase()} ${path} is not in openapi.json`);
  return op;
}

function assertMatches(method: string, path: string, status: number, body: unknown) {
  const content = operation(method, path).responses[String(status)]?.content;
  assert.ok(content, `${method.toUpperCase()} ${path} does not document status ${status}`);
  const schema = (content["application/json"] ?? content["application/problem+json"])?.schema;
  assert.ok(schema);
  assert.deepEqual(
    validate(spec as unknown as Record<string, unknown>, schema, body),
    [],
    `${method.toUpperCase()} ${path} ${status}`,
  );
}

test("every route is documented, and every documented operation exists", () => {
  const config = {
    databaseUrl: "",
    port: 0,
    webOrigins: [],
    cookieSecure: true,
    authAttemptsPerMinute: 10,
    aiApiKey: null,
    aiModel: "claude-opus-5-5",
  };
  const routes = buildRouter({} as Db, config, TOTP_KEY)
    .routes.map((r) => `${r.method} ${r.template}`)
    .sort();
  const documented = Object.entries(spec.paths)
    .flatMap(([path, item]) =>
      Object.keys(item)
        .filter((m) => METHODS.has(m))
        .map((m) => `${m.toUpperCase()} ${path}`),
    )
    .sort();
  assert.deepEqual(routes, documented);
  const publicRoutes = buildRouter({} as Db, config, TOTP_KEY)
    .routes.filter((r) => !r.auth)
    .map((r) => `${r.method} ${r.template}`)
    .sort();
  const documentedPublic = documented.filter((key) => {
    const [method = "", path = ""] = key.split(" ");
    return (
      Array.isArray(operation(method.toLowerCase(), path).security) &&
      operation(method.toLowerCase(), path).security?.length === 0
    );
  });
  assert.deepEqual(publicRoutes, documentedPublic);
});

let h: Harness;
before(async () => {
  h = await startHarness();
});
after(() => h.close());

test("real responses validate against the contract", async () => {
  const health = await api(h, "GET", "/v1/health");
  assertMatches("get", "/v1/health", health.status, health.body);
  const { token, entityId } = await signUp(h, "kontrak@example.test");
  const login = await api(h, "POST", "/v1/auth/login", {
    body: { email: "kontrak@example.test", password: "correct horse battery staple", client: "native" },
  });
  assertMatches("post", "/v1/auth/login", login.status, login.body);
  const me = await api(h, "GET", "/v1/me", { token });
  assertMatches("get", "/v1/me", me.status, me.body);
  const base = "/v1/entities/{entityId}";
  const accounts = await api(h, "GET", `/v1/entities/${entityId}/accounts`, { token });
  assertMatches("get", `${base}/accounts`, accounts.status, accounts.body);
  const entries = await postFixture(h, token, entityId);
  const first = entries[0] as Entry;
  assertMatches("post", `${base}/journal-entries`, 201, first);
  assertMatches("post", `${base}/transactions`, 201, entries[1]);
  const list = await api(h, "GET", `/v1/entities/${entityId}/journal-entries?from=2026-10-01&to=2026-10-31`, { token });
  assertMatches("get", `${base}/journal-entries`, list.status, list.body);
  for (const query of [
    "monthly-recap?year=2026&month=10",
    "trial-balance?asOf=2026-10-31",
    "income-statement?from=2026-10-01&to=2026-10-31",
    "balance-sheet?asOf=2026-10-31",
  ]) {
    const res = await api(h, "GET", `/v1/entities/${entityId}/reports/${query}`, { token });
    assertMatches("get", `${base}/reports/{kind}`, res.status, res.body);
  }
  const reversed = await api(h, "POST", `/v1/entities/${entityId}/journal-entries/${entries[5]?.id}/reverse`, {
    token,
    body: { reason: "Uji kontrak" },
  });
  assertMatches("post", `${base}/journal-entries/{entryId}/reverse`, reversed.status, reversed.body);
  const close = await api(h, "POST", `/v1/entities/${entityId}/periods/2026/9/close`, { token });
  assertMatches("post", `${base}/periods/{year}/{month}/close`, close.status, close.body);
  const snaps = await api(h, "GET", `/v1/entities/${entityId}/periods/2026/9/snapshots`, { token });
  assertMatches("get", `${base}/periods/{year}/{month}/snapshots`, snaps.status, snaps.body);
  const periods = await api(h, "GET", `/v1/entities/${entityId}/periods`, { token });
  assertMatches("get", `${base}/periods`, periods.status, periods.body);
  const audit = await api(h, "GET", `/v1/entities/${entityId}/audit/verify`, { token });
  assertMatches("get", `${base}/audit/verify`, audit.status, audit.body);
  const trend = await api(h, "GET", `/v1/entities/${entityId}/reports/monthly-trend?year=2026&month=10`, { token });
  assertMatches("get", `${base}/reports/{kind}`, trend.status, trend.body);
  const importBody = {
    format: "csv",
    content: "Tanggal,Keterangan,Nominal\n2026-10-30,Parkir,-5000\n2026-10-31,Salah,abc\n",
    mapping: { date: "Tanggal", description: "Keterangan", amount: "Nominal" },
    defaults: { funding: "1100", income: "4900", expense: "5990" },
  };
  for (const step of ["inspect", "preview", "commit"]) {
    const res = await api(h, "POST", `/v1/entities/${entityId}/imports/${step}`, { token, body: importBody });
    assertMatches("post", `${base}/imports/${step}`, res.status, res.body);
  }
  const capture = await api(h, "POST", `/v1/entities/${entityId}/capture/parse`, {
    token,
    body: { text: "kopi 20 ribu tadi pakai ovo" },
  });
  assertMatches("post", `${base}/capture/parse`, capture.status, capture.body);
  const draftId = (capture.body as unknown as { draftId: string }).draftId;
  const review = await api(h, "POST", `/v1/entities/${entityId}/capture/${draftId}/review`, {
    token,
    body: { outcome: "saved", changed: ["accountId"] },
  });
  assert.equal(review.status, 204);
  assert.ok(operation("post", `${base}/capture/{draftId}/review`).responses["204"]);
  const quality = await api(h, "GET", `/v1/entities/${entityId}/capture/quality`, { token });
  assertMatches("get", `${base}/capture/quality`, quality.status, quality.body);
  const problem = await api(h, "POST", `/v1/entities/${entityId}/transactions`, { token, body: { kind: "gift" } });
  assertMatches("post", `${base}/transactions`, problem.status, problem.body);
});
