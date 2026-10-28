import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { todayIn } from "../src/capture.ts";
import type { AiDraft, Extractor } from "../src/capture-ai.ts";
import { accountIds, api, type Entry, type Harness, signUp, startHarness } from "./helpers.ts";

interface Parsed {
  draftId: string;
  kind: string;
  amount: string | null;
  date: string;
  accountId: string | null;
  accountCode: string | null;
  fundingAccountId: string | null;
  fundingCode: string | null;
  description: string | null;
  counterparty: string | null;
  source: "ai" | "rules";
  model: string | null;
  missing: string[];
  note: string | null;
}

class FakeExtractor implements Extractor {
  readonly model = "fake-model";
  next: AiDraft | Error | null = null;
  seen: string[] = [];
  async extract(sentence: string): Promise<AiDraft | null> {
    this.seen.push(sentence);
    if (this.next instanceof Error) throw this.next;
    return this.next;
  }
}

const fake = new FakeExtractor();
let rulesOnly: Harness;
let withAi: Harness;
before(async () => {
  rulesOnly = await startHarness();
  withAi = await startHarness({ extractor: fake });
});
after(async () => {
  await rulesOnly.close();
  await withAi.close();
});

const today = todayIn("Asia/Jakarta");

test("without an AI model the rules fill the form, and nothing is posted", async () => {
  const { token, entityId } = await signUp(rulesOnly, "suara@example.test");
  const ids = await accountIds(rulesOnly, token, entityId);
  const res = await api<Parsed>(rulesOnly, "POST", `/v1/entities/${entityId}/capture/parse`, {
    token,
    body: { text: "Beli nasi padang di warung sederhana 35 ribu pakai gopay hari ini" },
  });
  assert.equal(res.status, 200);
  const { draftId, ...form } = res.body;
  assert.match(draftId, /^[0-9a-f-]{36}$/);
  assert.deepEqual(form, {
    kind: "expense",
    amount: "35000.00",
    date: today,
    accountId: ids.get("5100"),
    accountCode: "5100",
    fundingAccountId: ids.get("1300"),
    fundingCode: "1300",
    description: "Beli nasi padang di warung sederhana",
    counterparty: "Warung Sederhana",
    source: "rules",
    model: null,
    missing: [],
    note: null,
  });
  const entries = await api<{ entries: Entry[] }>(rulesOnly, "GET", `/v1/entities/${entityId}/journal-entries`, {
    token,
  });
  assert.equal(entries.body.entries.length, 0, "parsing only fills the form; the person saves");
});

test("valid model fields are used; invalid ones are replaced by the rules", async () => {
  const { token, entityId } = await signUp(withAi, "ai@example.test");
  const ids = await accountIds(withAi, token, entityId);
  fake.next = {
    kind: "expense",
    amount: "35.000",
    date: "2026-02-30",
    accountCode: "4100",
    fundingCode: "1100",
    description: "Makan siang",
    counterparty: "Warung Sederhana",
  };
  const res = await api<Parsed>(withAi, "POST", `/v1/entities/${entityId}/capture/parse`, {
    token,
    body: { text: "makan siang 35 ribu di warung sederhana pakai gopay" },
  });
  assert.equal(res.body.source, "ai");
  assert.equal(res.body.model, "fake-model");
  assert.equal(res.body.amount, "35000.00", "a malformed model amount falls back to the rules");
  assert.equal(res.body.date, today, "an impossible model date falls back to the rules");
  assert.equal(res.body.accountId, ids.get("5100"), "an income account for an expense falls back to the rules");
  assert.equal(res.body.fundingAccountId, ids.get("1100"), "a valid model choice is kept");
  assert.equal(res.body.description, "Makan siang");
  assert.deepEqual(fake.seen, ["makan siang 35 ribu di warung sederhana pakai gopay"]);
});

test("when the model call fails the rules still fill the form, with a note", async () => {
  const { token, entityId } = await signUp(withAi, "ai-gagal@example.test");
  fake.next = new Error("network down");
  const res = await api<Parsed>(withAi, "POST", `/v1/entities/${entityId}/capture/parse`, {
    token,
    body: { text: "bensin 50 ribu" },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.source, "rules");
  assert.equal(res.body.amount, "50000.00");
  assert.equal(res.body.accountCode, "5200");
  assert.match(res.body.note ?? "", /AI tidak tersedia/);
});

test("input limits, permissions and the audit trail", async () => {
  const a = await signUp(rulesOnly, "a-suara@example.test");
  const b = await signUp(rulesOnly, "b-suara@example.test");
  assert.equal(
    (await api(rulesOnly, "POST", `/v1/entities/${a.entityId}/capture/parse`, { token: a.token, body: { text: "" } }))
      .status,
    400,
  );
  assert.equal(
    (
      await api(rulesOnly, "POST", `/v1/entities/${a.entityId}/capture/parse`, {
        token: a.token,
        body: { text: "x".repeat(1001) },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api(rulesOnly, "POST", `/v1/entities/${a.entityId}/capture/parse`, {
        token: b.token,
        body: { text: "kopi 20 ribu" },
      })
    ).status,
    404,
  );
  const parsed = await api<Parsed>(rulesOnly, "POST", `/v1/entities/${a.entityId}/capture/parse`, {
    token: a.token,
    body: { text: "beli sesuatu" },
  });
  assert.deepEqual(parsed.body.missing, ["amount"]);
  const audit = await rulesOnly.db.query<{ canonical: string }>(
    "select canonical from audit_events where entity_id = $1 and action = 'capture.parsed'",
    [a.entityId],
  );
  assert.equal(audit.rows.length, 1);
  assert.ok(!audit.rows[0]?.canonical.includes("beli sesuatu"), "the spoken sentence is not stored in the audit trail");
});

interface Quality {
  days: number;
  drafts: number;
  saved: number;
  savedWithoutChanges: { count: number; of: number; rate: number | null; ci95: [number, number] };
  fields: { field: string; kept: { count: number; of: number } }[];
  bySource: { ai: { drafts: number }; rules: { drafts: number; saved: number } };
}

test("real-use quality: corrections made before Simpan are counted per field, and a draft is reviewed once", async () => {
  const { token, entityId } = await signUp(rulesOnly, "kualitas@example.test");
  const parse = (text: string) =>
    api<Parsed>(rulesOnly, "POST", `/v1/entities/${entityId}/capture/parse`, { token, body: { text } });
  const review = (draftId: string, body: unknown) =>
    api(rulesOnly, "POST", `/v1/entities/${entityId}/capture/${draftId}/review`, { token, body });
  const first = (await parse("beli kopi 18 ribu pakai gopay")).body;
  const second = (await parse("bayar listrik 250 ribu")).body;
  await parse("isi bensin 50 ribu");
  assert.equal((await review(first.draftId, { outcome: "saved", changed: [] })).status, 204);
  // "counterparty" was empty in this draft, so filling it in is not a correction.
  assert.equal(
    (await review(second.draftId, { outcome: "saved", changed: ["accountId", "counterparty"] })).status,
    204,
  );
  assert.equal((await review(second.draftId, { outcome: "saved", changed: [] })).status, 409);
  assert.equal((await review(first.draftId.replace(/.$/, "0"), { outcome: "saved", changed: [] })).status, 404);
  assert.equal((await review("not-a-uuid", { outcome: "saved", changed: [] })).status, 404);
  assert.equal((await review(first.draftId, { outcome: "saved", changed: ["password"] })).status, 400);

  const other = await signUp(rulesOnly, "orang-lain@example.test");
  const foreign = await api(rulesOnly, "POST", `/v1/entities/${entityId}/capture/${first.draftId}/review`, {
    token: other.token,
    body: { outcome: "saved", changed: [] },
  });
  assert.equal(foreign.status, 404);

  const quality = await api<Quality>(rulesOnly, "GET", `/v1/entities/${entityId}/capture/quality?days=30`, {
    token,
  });
  assert.equal(quality.status, 200);
  assert.equal(quality.body.drafts, 3);
  assert.equal(quality.body.saved, 2);
  assert.deepEqual(
    { count: quality.body.savedWithoutChanges.count, of: quality.body.savedWithoutChanges.of },
    { count: 1, of: 2 },
  );
  const field = (name: string) => quality.body.fields.find((f) => f.field === name)?.kept;
  assert.deepEqual(field("accountId"), { ...field("accountId"), count: 1, of: 2 });
  assert.deepEqual(field("amount"), { ...field("amount"), count: 2, of: 2 });
  assert.equal(quality.body.bySource.rules.saved, 2);
  assert.equal(quality.body.bySource.ai.drafts, 0);
  const bad = await api(rulesOnly, "GET", `/v1/entities/${entityId}/capture/quality?days=0`, { token });
  assert.equal(bad.status, 400);
});
