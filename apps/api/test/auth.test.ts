import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { stepAt, totpAt } from "../src/totp.ts";
import { accountIds, api, type Entry, type Harness, PASSWORD, signUp, startHarness, WEB_ORIGIN } from "./helpers.ts";

let h: Harness;
before(async () => {
  h = await startHarness();
});
after(() => h.close());

const base32Decode = (text: string) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of text) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

test("registration validates input, creates a personal IDR entity and rejects duplicate emails", async () => {
  const bad = await api(h, "POST", "/v1/auth/register", {
    body: { email: "nope", password: "short", displayName: "" },
  });
  assert.equal(bad.status, 400);
  assert.deepEqual(Object.keys(bad.body.errors ?? {}).sort(), ["displayName", "email", "password"]);
  const { token } = await signUp(h, "pribadi@example.test", "Gerrard");
  const me = await api<{ entities: { kind: string; currency: string; role: string }[]; twoFactorEnabled: boolean }>(
    h,
    "GET",
    "/v1/me",
    { token },
  );
  assert.deepEqual(
    me.body.entities.map((e) => [e.kind, e.currency, e.role]),
    [["individual", "IDR", "owner"]],
  );
  assert.equal(me.body.twoFactorEnabled, false);
  const dup = await api(h, "POST", "/v1/auth/register", {
    body: { email: "PRIBADI@example.test", password: PASSWORD, displayName: "X" },
  });
  assert.equal(dup.status, 409);
});

test("wrong passwords and unknown emails get the same answer", async () => {
  const wrong = await api(h, "POST", "/v1/auth/login", {
    body: { email: "pribadi@example.test", password: "wrong password!", client: "native" },
  });
  const unknown = await api(h, "POST", "/v1/auth/login", {
    body: { email: "siapa@example.test", password: "wrong password!", client: "native" },
  });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.detail, unknown.body.detail);
});

test("web sign-in sets an HttpOnly cookie and never returns the token; cookie writes need an allowed Origin", async () => {
  const res = await api<{ token?: string }>(h, "POST", "/v1/auth/login", {
    body: { email: "pribadi@example.test", password: PASSWORD, client: "web" },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.token, undefined);
  const setCookie = res.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /^p27_session=[\w-]{43}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=43200$/);
  const cookie = setCookie.split(";")[0] ?? "";
  assert.equal((await api(h, "GET", "/v1/me", { headers: { cookie } })).status, 200);
  const crossSite = await api(h, "POST", "/v1/auth/logout", { headers: { cookie, origin: "https://evil.example" } });
  assert.equal(crossSite.status, 403);
  const sameSite = await api(h, "POST", "/v1/auth/logout", { headers: { cookie, origin: WEB_ORIGIN } });
  assert.equal(sameSite.status, 204);
  assert.equal((await api(h, "GET", "/v1/me", { headers: { cookie } })).status, 401);
});

test("CORS answers only the configured web origin", async () => {
  const allowed = await fetch(`${h.baseUrl}/v1/me`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN } });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), WEB_ORIGIN);
  const denied = await fetch(`${h.baseUrl}/v1/me`, { method: "OPTIONS", headers: { origin: "https://evil.example" } });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("two-factor sign-in: setup, enable, require the code and refuse a reused code", async () => {
  const { token } = await signUp(h, "dua@example.test");
  const setup = await api<{ secret: string; otpauthUri: string }>(h, "POST", "/v1/auth/totp/setup", { token });
  assert.equal(setup.status, 200);
  assert.match(setup.body.otpauthUri, /^otpauth:\/\/totp\//);
  const secret = base32Decode(setup.body.secret);
  const now = Math.floor(Date.now() / 1000);
  assert.equal(
    (
      await api(h, "POST", "/v1/auth/totp/enable", {
        token,
        body: { code: "000000" === totpAt(secret, stepAt(now)) ? "111111" : "000000" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await api(h, "POST", "/v1/auth/totp/enable", { token, body: { code: totpAt(secret, stepAt(now) - 1) } })).status,
    204,
  );
  const login = { email: "dua@example.test", password: PASSWORD, client: "native" };
  const missing = await api(h, "POST", "/v1/auth/login", { body: login });
  assert.equal(missing.status, 401);
  assert.equal(missing.body.title, "Second factor required");
  const code = totpAt(secret, stepAt(now));
  assert.equal((await api(h, "POST", "/v1/auth/login", { body: { ...login, totp: code } })).status, 200);
  assert.equal((await api(h, "POST", "/v1/auth/login", { body: { ...login, totp: code } })).status, 401);
  const stored = await h.db.query<{ totp_secret: Buffer }>(
    "select totp_secret from users where lower(email) = 'dua@example.test'",
  );
  assert.ok(!stored.rows[0]?.totp_secret.includes(secret), "the TOTP seed is stored encrypted");
});

test("one user cannot see or write another user's entity", async () => {
  const a = await signUp(h, "a@example.test");
  const b = await signUp(h, "b@example.test");
  assert.equal((await api(h, "GET", `/v1/entities/${a.entityId}/accounts`, { token: b.token })).status, 404);
  assert.equal(
    (await api(h, "GET", `/v1/entities/${a.entityId}/reports/trial-balance?asOf=2026-10-31`, { token: b.token }))
      .status,
    404,
  );
  assert.equal(
    (await api(h, "POST", `/v1/entities/${a.entityId}/transactions`, { token: b.token, body: {} })).status,
    404,
  );
  assert.equal((await api(h, "GET", "/v1/entities/not-a-uuid/accounts", { token: b.token })).status, 404);
  assert.equal((await api(h, "GET", "/v1/me")).status, 401);
});

test("maker-checker: in an entity that requires approval, the preparer cannot approve their own entry", async () => {
  const maker = await signUp(h, "maker@example.test");
  const checker = await signUp(h, "checker@example.test");
  const entity = await h.db.query<{ id: string }>(
    "update entities set kind = 'company', approval_required = true where id = $1 returning id",
    [maker.entityId],
  );
  await h.db.query("update memberships set role = 'preparer' where entity_id = $1 and user_id = $2", [
    maker.entityId,
    maker.userId,
  ]);
  await h.db.query("insert into memberships (entity_id, user_id, role) values ($1, $2, 'approver')", [
    entity.rows[0]?.id,
    checker.userId,
  ]);
  const ids = await accountIds(h, maker.token, maker.entityId);
  const created = await api<Entry>(h, "POST", `/v1/entities/${maker.entityId}/transactions`, {
    token: maker.token,
    body: {
      kind: "expense",
      date: "2026-10-20",
      description: "Alat kantor",
      accountId: ids.get("5700"),
      fundingAccountId: ids.get("1200"),
      amount: "500000.00",
    },
  });
  assert.equal(created.body.status, "submitted");
  assert.equal(
    (
      await api(h, "POST", `/v1/entities/${maker.entityId}/journal-entries/${created.body.id}/approve`, {
        token: maker.token,
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api(h, "POST", `/v1/entities/${maker.entityId}/journal-entries/${created.body.id}/reverse`, {
        token: maker.token,
        body: { reason: "x" },
      })
    ).status,
    409,
  );
  const close = await api(h, "POST", `/v1/entities/${maker.entityId}/periods/2026/10/close`, { token: checker.token });
  assert.equal(close.status, 403);
  const approved = await api<Entry>(
    h,
    "POST",
    `/v1/entities/${maker.entityId}/journal-entries/${created.body.id}/approve`,
    { token: checker.token, body: {} },
  );
  assert.equal(approved.status, 200);
  assert.equal(approved.body.status, "posted");
  assert.equal(
    (
      await api(h, "POST", `/v1/entities/${maker.entityId}/journal-entries/${created.body.id}/reverse`, {
        token: maker.token,
        body: { reason: "x" },
      })
    ).status,
    403,
  );
});

test("sign-in attempts are rate limited per client address", async () => {
  const limited = await startHarness({ authAttemptsPerMinute: 3 });
  try {
    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push(
        (
          await api(limited, "POST", "/v1/auth/login", {
            body: { email: "x@example.test", password: "wrong password!", client: "native" },
          })
        ).status,
      );
    }
    assert.deepEqual(statuses, [401, 401, 401, 429]);
  } finally {
    await limited.close();
  }
});
