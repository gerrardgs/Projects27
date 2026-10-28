// How well capture fills the form in real use. Each filled form is recorded with the fields it filled;
// after Simpan the client reports which of those fields the person changed. A field kept as filled
// counts as right, a changed one as wrong: the person's own correction is the ground truth.

import type { EntityContext } from "./access.ts";
import type { Db, Tx } from "./db.ts";
import { badRequest, conflict, notFound } from "./errors.ts";
import type { Scope } from "./ledger.ts";
import { percentile, wilson } from "./stats.ts";

export const CAPTURE_FIELDS = [
  "kind",
  "amount",
  "date",
  "accountId",
  "fundingAccountId",
  "description",
  "counterparty",
] as const;

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function recordDraft(
  tx: Tx,
  scope: Scope,
  draft: { source: "ai" | "rules"; model: string | null; filled: string[]; latencyMs: number },
): Promise<string> {
  const { rows } = await tx.query<{ id: string }>(
    `insert into capture_drafts (entity_id, user_id, source, model, filled, latency_ms)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [scope.entity.id, scope.actor.userId, draft.source, draft.model, draft.filled, Math.round(draft.latencyMs)],
  );
  return (rows[0] as { id: string }).id;
}

/** Records which filled fields the person changed before pressing Simpan. Only the draft's author may. */
export async function reviewDraft(scope: Scope, draftId: string, body: Record<string, unknown>): Promise<void> {
  if (!isUuid(draftId)) throw notFound("Capture draft not found.");
  const changed = body.changed;
  if (
    body.outcome !== "saved" ||
    !Array.isArray(changed) ||
    !changed.every((f) => typeof f === "string" && (CAPTURE_FIELDS as readonly string[]).includes(f))
  ) {
    throw badRequest(`outcome must be "saved" and changed a list of ${CAPTURE_FIELDS.join(", ")}.`);
  }
  const { rows } = await scope.db.query<{ filled: string[]; reviewed: boolean }>(
    `select filled, reviewed_at is not null as reviewed from capture_drafts
     where id = $1 and entity_id = $2 and user_id = $3`,
    [draftId, scope.entity.id, scope.actor.userId],
  );
  const draft = rows[0];
  if (draft === undefined) throw notFound("Capture draft not found.");
  if (draft.reviewed) throw conflict("This capture draft was already reviewed.");
  // A field the form left empty cannot have been corrected, only completed.
  const corrected = [...new Set(changed as string[])].filter((f) => draft.filled.includes(f));
  await scope.db.query(
    "update capture_drafts set outcome = 'saved', changed = $2, reviewed_at = now() where id = $1 and reviewed_at is null",
    [draftId, corrected],
  );
}

interface DraftRow {
  source: string;
  filled: string[];
  changed: string[] | null;
  latency_ms: number;
}

const rate = (k: number, n: number) => ({ count: k, of: n, rate: n === 0 ? null : k / n, ci95: wilson(k, n) });

function summarize(rows: DraftRow[]) {
  const saved = rows.filter((r) => r.changed !== null);
  const untouched = saved.filter((r) => (r.changed as string[]).length === 0);
  return {
    drafts: rows.length,
    saved: saved.length,
    savedWithoutChanges: rate(untouched.length, saved.length),
    fields: CAPTURE_FIELDS.map((field) => {
      const filled = saved.filter((r) => r.filled.includes(field));
      const kept = filled.filter((r) => !(r.changed as string[]).includes(field));
      return { field, kept: rate(kept.length, filled.length) };
    }),
    latencyMs: {
      p50: percentile(
        rows.map((r) => r.latency_ms),
        50,
      ),
      p95: percentile(
        rows.map((r) => r.latency_ms),
        95,
      ),
    },
  };
}

/** Quality over the last `days` days (1 to 366, default 90), overall and per filling method. */
export async function captureQuality(db: Db, entity: EntityContext, query: URLSearchParams) {
  const days = query.has("days") ? Number(query.get("days")) : 90;
  if (!Number.isInteger(days) || days < 1 || days > 366) throw badRequest("days must be 1 to 366.");
  const { rows } = await db.query<DraftRow>(
    `select source, filled, changed, latency_ms from capture_drafts
     where entity_id = $1 and created_at >= now() - make_interval(days => $2)`,
    [entity.id, days],
  );
  return {
    days,
    ...summarize(rows),
    bySource: {
      ai: summarize(rows.filter((r) => r.source === "ai")),
      rules: summarize(rows.filter((r) => r.source === "rules")),
    },
  };
}
