// Voice and text capture: a sentence becomes a filled-in, unsaved transaction form. The AI model (when
// configured) proposes the fields; every field is validated here and replaced by the rule-based value
// when it is missing or invalid. Nothing is posted: the person reviews the form and presses Simpan.

import { appendAudit } from "./audit.ts";
import type { AiDraft, Extractor } from "./capture-ai.ts";
import { CAPTURE_FIELDS, recordDraft } from "./capture-quality.ts";
import { type Kind, parseWithRules, type RuleDraft } from "./capture-rules.ts";
import { withTransaction } from "./db.ts";
import { badRequest } from "./errors.ts";
import { listAccounts, type Scope } from "./ledger.ts";
import { formatAmount, parseAmount } from "./money.ts";

export type Account = Awaited<ReturnType<typeof listAccounts>>[number];
const MAX_SENTENCE = 1_000;
const MAX_DAYS_AWAY = 366;

export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const CATEGORY_TYPES: Record<Kind, string[]> = {
  income: ["income"],
  expense: ["expense"],
  transfer: ["asset", "liability"],
};

function validAmount(value: string | null): string | null {
  if (value === null || !/^\d{1,15}(\.\d{1,2})?$/.test(value)) return null;
  const minor = parseAmount(value, 2);
  return minor > 0n ? formatAmount(minor, 2) : null;
}

function validDate(value: string | null, today: string): string | null {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  const days = Math.abs(date.getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000;
  return days <= MAX_DAYS_AWAY ? value : null;
}

function accountFor(code: string | null, types: string[], byCode: Map<string, Account>): Account | null {
  const account = code === null ? undefined : byCode.get(code);
  return account !== undefined && account.active && account.postable && types.includes(account.type) ? account : null;
}

const cleanText = (value: string | null, max: number) => {
  const text = value?.trim() ?? "";
  return text === "" ? null : text.slice(0, max);
};

interface MergeContext {
  today: string;
  byCode: Map<string, Account>;
}

function pickAccounts(ai: AiDraft | null, rules: RuleDraft, kind: Kind, byCode: Map<string, Account>) {
  const categoryTypes = CATEGORY_TYPES[kind];
  const fundingTypes = ["asset", "liability"];
  const account =
    accountFor(ai?.accountCode ?? null, categoryTypes, byCode) ?? accountFor(rules.accountCode, categoryTypes, byCode);
  const candidates = [
    accountFor(ai?.fundingCode ?? null, fundingTypes, byCode),
    accountFor(rules.fundingCode, fundingTypes, byCode),
  ];
  const funding = candidates.find((c) => c !== null && c.id !== account?.id) ?? null;
  return { account, funding };
}

function pickScalars(ai: AiDraft | null, rules: RuleDraft, today: string) {
  if (ai === null) {
    return {
      amount: rules.amount,
      date: rules.date,
      description: cleanText(rules.description, 500),
      counterparty: cleanText(rules.counterparty, 200),
    };
  }
  return {
    amount: validAmount(ai.amount) ?? rules.amount,
    date: validDate(ai.date, today) ?? rules.date,
    description: cleanText(ai.description, 500) ?? cleanText(rules.description, 500),
    counterparty: cleanText(ai.counterparty, 200) ?? cleanText(rules.counterparty, 200),
  };
}

/** Picks each field from the model when it passes validation, otherwise from the rules. */
function merge(ai: AiDraft | null, rules: RuleDraft, context: MergeContext) {
  const kind = ai?.kind ?? rules.kind;
  return { kind, ...pickAccounts(ai, rules, kind, context.byCode), ...pickScalars(ai, rules, context.today) };
}

function missingFields(fields: ReturnType<typeof merge>): string[] {
  const checks: [string, unknown][] = [
    ["amount", fields.amount],
    ["accountId", fields.account],
    ["fundingAccountId", fields.funding],
    ["description", fields.description],
  ];
  return checks.filter(([, value]) => value === null).map(([name]) => name);
}

function present(fields: ReturnType<typeof merge>, model: string | null, note: string | null) {
  return {
    kind: fields.kind,
    amount: fields.amount,
    date: fields.date,
    accountId: fields.account?.id ?? null,
    accountCode: fields.account?.code ?? null,
    fundingAccountId: fields.funding?.id ?? null,
    fundingCode: fields.funding?.code ?? null,
    description: fields.description,
    counterparty: fields.counterparty,
    source: model === null ? ("rules" as const) : ("ai" as const),
    model,
    missing: missingFields(fields),
    note,
  };
}

async function askModel(
  extractor: Extractor | null,
  sentence: string,
  context: { accounts: Account[]; today: string },
) {
  if (extractor === null) return { draft: null, note: null };
  try {
    return { draft: await extractor.extract(sentence, context), note: null };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "warn",
        message: "capture model call failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { draft: null, note: "Layanan AI tidak tersedia; formulir diisi dengan aturan bawaan." };
  }
}

/** The form a sentence fills, from the entity's postable accounts; the same path the API serves and the evaluation measures. */
export async function draftFor(
  sentence: string,
  accounts: Account[],
  today: string,
  extractor: Extractor | null,
): Promise<ReturnType<typeof present>> {
  const rules = parseWithRules(sentence, new Set(accounts.map((a) => a.code)), today);
  const { draft, note } = await askModel(extractor, sentence, { accounts, today });
  const fields = merge(draft, rules, { today, byCode: new Map(accounts.map((a) => [a.code, a])) });
  return present(fields, draft === null ? null : (extractor?.model ?? null), note);
}

export async function parseCapture(scope: Scope, body: Record<string, unknown>, extractor: Extractor | null) {
  const sentence = typeof body.text === "string" ? body.text.trim() : "";
  if (sentence === "" || sentence.length > MAX_SENTENCE) {
    throw badRequest(`text must be 1 to ${MAX_SENTENCE} characters.`, { text: "Ucapkan atau tulis transaksinya." });
  }
  const accounts = (await listAccounts(scope.db, scope.entity)).filter((a) => a.active && a.postable);
  const started = performance.now();
  const result = await draftFor(sentence, accounts, todayIn(scope.entity.timeZone), extractor);
  const latencyMs = performance.now() - started;
  const filled = CAPTURE_FIELDS.filter((field) => result[field] !== null && result[field] !== "");
  // The sentence itself is not stored: only which method filled which fields, and what is still missing.
  const draftId = await withTransaction(scope.db, async (tx) => {
    const id = await recordDraft(tx, scope, { source: result.source, model: result.model, filled, latencyMs });
    await appendAudit(tx, {
      entityId: scope.entity.id,
      actorUserId: scope.actor.userId,
      action: "capture.parsed",
      objectType: "capture",
      objectId: id,
      after: { source: result.source, model: result.model, missing: result.missing },
      ip: scope.actor.ip,
    });
    return id;
  });
  return { draftId, ...result };
}
