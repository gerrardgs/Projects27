// Append-only, hash-chained audit trail (rule 17 section 5).

import { canonicalJson, sha256 } from "./canonical.ts";
import type { Db, Tx } from "./db.ts";

export interface AuditInput {
  entityId: string | null;
  actorUserId: string | null;
  action: string;
  objectType: string;
  objectId: string | null;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

const chainKey = (entityId: string | null) => (entityId === null ? "global" : `entity:${entityId}`);

export async function appendAudit(tx: Tx, input: AuditInput): Promise<void> {
  const key = chainKey(input.entityId);
  await tx.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [key]);
  const previous = await tx.query<{ hash: Buffer }>(
    "select hash from audit_events where chain_key = $1 order by seq desc limit 1",
    [key],
  );
  const prevHash = previous.rows[0]?.hash ?? null;
  const at = new Date().toISOString();
  const canonical = canonicalJson({
    action: input.action,
    actor: input.actorUserId,
    after: input.after ?? null,
    at,
    before: input.before ?? null,
    entity: input.entityId,
    ip: input.ip ?? null,
    object: input.objectId,
    objectType: input.objectType,
    reason: input.reason ?? null,
  });
  const hash = sha256(prevHash ?? Buffer.alloc(0), canonical);
  await tx.query(
    `insert into audit_events (chain_key, entity_id, actor_user_id, action, object_type, object_id, at, canonical, prev_hash, hash)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      key,
      input.entityId,
      input.actorUserId,
      input.action,
      input.objectType,
      input.objectId,
      at,
      canonical,
      prevHash,
      hash,
    ],
  );
}

export interface ChainCheck {
  events: number;
  valid: boolean;
  firstInvalidSeq: string | null;
}

/** Recomputes the chain of one entity: each hash covers its canonical record and the previous hash. */
export async function verifyChain(db: Db, entityId: string): Promise<ChainCheck> {
  const { rows } = await db.query<{
    seq: string;
    canonical: string;
    prev_hash: Buffer | null;
    hash: Buffer;
    action: string;
    at: Date;
  }>("select seq, canonical, prev_hash, hash, action, at from audit_events where chain_key = $1 order by seq", [
    chainKey(entityId),
  ]);
  let previous: Buffer | null = null;
  for (const row of rows) {
    const record = JSON.parse(row.canonical) as { action: string; at: string };
    const linked = previous === null ? row.prev_hash === null : row.prev_hash?.equals(previous) === true;
    const intact = sha256(row.prev_hash ?? Buffer.alloc(0), row.canonical).equals(row.hash);
    const consistent = record.action === row.action && new Date(record.at).getTime() === row.at.getTime();
    if (!linked || !intact || !consistent) return { events: rows.length, valid: false, firstInvalidSeq: row.seq };
    previous = row.hash;
  }
  return { events: rows.length, valid: true, firstInvalidSeq: null };
}
