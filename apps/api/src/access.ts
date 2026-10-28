// Role-based permissions per entity, checked on the server for every request (rule 06 section 4).

import type { Db, Tx } from "./db.ts";
import { forbidden, notFound } from "./errors.ts";

export type Role = "owner" | "controller" | "accountant" | "approver" | "preparer" | "viewer" | "auditor";
export type Permission = "read" | "write" | "approve" | "close" | "manage_accounts" | "read_audit";

const GRANTS: Record<Role, readonly Permission[]> = {
  owner: ["read", "write", "approve", "close", "manage_accounts", "read_audit"],
  controller: ["read", "write", "approve", "close", "manage_accounts", "read_audit"],
  accountant: ["read", "write", "manage_accounts"],
  approver: ["read", "approve"],
  preparer: ["read", "write"],
  viewer: ["read"],
  auditor: ["read", "read_audit"],
};

export interface EntityContext {
  id: string;
  kind: "individual" | "company";
  name: string;
  currency: string;
  minorUnits: number;
  timeZone: string;
  approvalRequired: boolean;
  role: Role;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads the entity if the user is a member with the permission; non-members get 404 so ids are not probed. */
export async function requireEntity(
  db: Db | Tx,
  userId: string,
  entityId: string,
  permission: Permission,
): Promise<EntityContext> {
  if (!UUID.test(entityId)) throw notFound("Entity not found.");
  const { rows } = await db.query<{
    id: string;
    kind: "individual" | "company";
    name: string;
    currency: string;
    minor_units: number;
    time_zone: string;
    approval_required: boolean;
    role: Role;
  }>(
    `select e.id, e.kind, e.name, e.functional_currency as currency, c.minor_units, e.time_zone, e.approval_required, m.role
       from entities e
       join memberships m on m.entity_id = e.id and m.user_id = $1
       join currencies c on c.code = e.functional_currency
      where e.id = $2`,
    [userId, entityId],
  );
  const row = rows[0];
  if (row === undefined) throw notFound("Entity not found.");
  if (!GRANTS[row.role].includes(permission)) throw forbidden();
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    currency: row.currency.trim(),
    minorUnits: row.minor_units,
    timeZone: row.time_zone,
    approvalRequired: row.approval_required,
    role: row.role,
  };
}

export function can(entity: EntityContext, permission: Permission): boolean {
  return GRANTS[entity.role].includes(permission);
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
