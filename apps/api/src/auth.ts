// Accounts, sign-in and sessions. Web clients get an HttpOnly cookie; native apps (iOS, Android)
// get a bearer token to keep in the Keychain or Android Keystore. Tokens are random, stored only as
// SHA-256 hashes, revocable, and expire (12 hours on the web, 30 days in native apps).

import { randomBytes } from "node:crypto";
import { appendAudit } from "./audit.ts";
import { sha256 } from "./canonical.ts";
import { PERSONAL_CHART } from "./chart-template.ts";
import { type Db, pgErrorCode, withTransaction } from "./db.ts";
import { badRequest, conflict, HttpError, unauthorized } from "./errors.ts";
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, verifyPassword } from "./passwords.ts";
import { open, seal } from "./secretbox.ts";
import { base32Encode, newTotpSecret, otpauthUri, verifyTotp } from "./totp.ts";

export type Client = "web" | "native";
export const SESSION_TTL_MS: Record<Client, number> = { web: 12 * 3600_000, native: 30 * 24 * 3600_000 };
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
// Hash of a random password, verified when the email is unknown so both paths cost the same.
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"));

/** Database plus the key that encrypts TOTP seeds at rest. */
export interface AuthDeps {
  db: Db;
  totpKey: Buffer;
}

export interface Session {
  sessionId: string;
  userId: string;
  client: Client;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export function validateRegistration(body: Record<string, unknown>): RegisterInput {
  const fields: Record<string, string> = {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  if ([...password].length < PASSWORD_MIN_LENGTH || [...password].length > PASSWORD_MAX_LENGTH) {
    fields.password = `Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (displayName.length < 1 || displayName.length > 120) fields.displayName = "Enter a name of 1 to 120 characters.";
  if (Object.keys(fields).length > 0) throw badRequest("Some fields are invalid.", fields);
  return { email, password, displayName };
}

/** Creates the user, a personal entity in IDR with the starting chart of accounts, and the owner membership. */
export async function register(db: Db, input: RegisterInput, ip: string | null) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await withTransaction(db, async (tx) => {
      const user = await tx.query<{ id: string }>(
        "insert into users (email, display_name, password_hash) values ($1, $2, $3) returning id",
        [input.email, input.displayName, passwordHash],
      );
      const userId = user.rows[0]?.id as string;
      const entity = await tx.query<{ id: string }>(
        "insert into entities (kind, name, functional_currency) values ('individual', $1, 'IDR') returning id",
        [`Keuangan Pribadi ${input.displayName}`],
      );
      const entityId = entity.rows[0]?.id as string;
      await tx.query("insert into memberships (entity_id, user_id, role) values ($1, $2, 'owner')", [entityId, userId]);
      for (const account of PERSONAL_CHART) {
        await tx.query("insert into accounts (entity_id, code, name, type) values ($1, $2, $3, $4)", [
          entityId,
          account.code,
          account.name,
          account.type,
        ]);
      }
      await appendAudit(tx, {
        entityId: null,
        actorUserId: userId,
        action: "user.registered",
        objectType: "user",
        objectId: userId,
        ip,
      });
      await appendAudit(tx, {
        entityId,
        actorUserId: userId,
        action: "entity.created",
        objectType: "entity",
        objectId: entityId,
        after: { kind: "individual", currency: "IDR", accounts: PERSONAL_CHART.length },
        ip,
      });
      return { userId, entityId };
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") throw conflict("An account with this email already exists.");
    throw error;
  }
}

export interface LoginInput {
  email: string;
  password: string;
  totp: string | undefined;
  client: Client;
}

export function validateLogin(body: Record<string, unknown>): LoginInput {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const client = body.client === "native" ? "native" : body.client === "web" ? "web" : null;
  if (email === "" || password === "" || client === null) {
    throw badRequest('email, password and client ("web" or "native") are required.');
  }
  return { email, password, client, totp: typeof body.totp === "string" ? body.totp : undefined };
}

interface SecondFactorState {
  totp_enabled: boolean;
  totp_secret: Buffer | null;
  totp_last_step: string | null;
}

/** Returns the TOTP step used, null when two-factor is off; throws when the code is missing, wrong or replayed. */
function checkSecondFactor(totpKey: Buffer, user: SecondFactorState, code: string | undefined): number | null {
  if (!user.totp_enabled || user.totp_secret === null) return null;
  if (code === undefined) {
    throw new HttpError(401, "Second factor required", "Enter the 6-digit code from your authenticator app.");
  }
  const step = verifyTotp(open(totpKey, user.totp_secret), code, Date.now() / 1000);
  const replayed = step !== null && user.totp_last_step !== null && step <= Number(user.totp_last_step);
  if (step === null || replayed) throw unauthorized("The authenticator code is incorrect or was already used.");
  return step;
}

export async function login({ db, totpKey }: AuthDeps, input: LoginInput, ip: string | null) {
  const { rows } = await db.query<{
    id: string;
    password_hash: string;
    totp_enabled: boolean;
    totp_secret: Buffer | null;
    totp_last_step: string | null;
  }>("select id, password_hash, totp_enabled, totp_secret, totp_last_step from users where lower(email) = lower($1)", [
    input.email,
  ]);
  const user = rows[0];
  const passwordOk = await verifyPassword(input.password, user?.password_hash ?? (await DUMMY_HASH));
  if (user === undefined || !passwordOk) {
    await withTransaction(db, (tx) =>
      appendAudit(tx, {
        entityId: null,
        actorUserId: user?.id ?? null,
        action: "auth.login_failed",
        objectType: "user",
        objectId: user?.id ?? null,
        ip,
      }),
    );
    throw unauthorized("Email or password is incorrect.");
  }
  const usedStep = checkSecondFactor(totpKey, user, input.totp);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS[input.client]);
  await withTransaction(db, async (tx) => {
    if (usedStep !== null) await tx.query("update users set totp_last_step = $2 where id = $1", [user.id, usedStep]);
    await tx.query("insert into sessions (user_id, token_hash, client, expires_at) values ($1, $2, $3, $4)", [
      user.id,
      sha256(token),
      input.client,
      expiresAt,
    ]);
    await appendAudit(tx, {
      entityId: null,
      actorUserId: user.id,
      action: "auth.login",
      objectType: "user",
      objectId: user.id,
      after: { client: input.client },
      ip,
    });
  });
  return { token, expiresAt };
}

export async function sessionFromToken(db: Db, token: string): Promise<Session | null> {
  if (!/^[\w-]{43}$/.test(token)) return null;
  const { rows } = await db.query<{ id: string; user_id: string; client: Client }>(
    "select id, user_id, client from sessions where token_hash = $1 and revoked_at is null and expires_at > now()",
    [sha256(token)],
  );
  const row = rows[0];
  return row === undefined ? null : { sessionId: row.id, userId: row.user_id, client: row.client };
}

export async function logout(db: Db, session: Session, ip: string | null): Promise<void> {
  await withTransaction(db, async (tx) => {
    await tx.query("update sessions set revoked_at = now() where id = $1 and revoked_at is null", [session.sessionId]);
    await appendAudit(tx, {
      entityId: null,
      actorUserId: session.userId,
      action: "auth.logout",
      objectType: "session",
      objectId: session.sessionId,
      ip,
    });
  });
}

export async function startTotpSetup({ db, totpKey }: AuthDeps, session: Session) {
  const { rows } = await db.query<{ email: string; totp_enabled: boolean }>(
    "select email, totp_enabled from users where id = $1",
    [session.userId],
  );
  const user = rows[0];
  if (user === undefined) throw unauthorized();
  if (user.totp_enabled) throw conflict("Two-factor sign-in is already on.");
  const secret = newTotpSecret();
  await db.query("update users set totp_secret = $2 where id = $1", [session.userId, seal(totpKey, secret)]);
  return { secret: base32Encode(secret), otpauthUri: otpauthUri(secret, user.email, "Projects 27") };
}

export async function enableTotp({ db, totpKey }: AuthDeps, session: Session, code: string, ip: string | null) {
  await withTransaction(db, async (tx) => {
    const { rows } = await tx.query<{ totp_secret: Buffer | null; totp_enabled: boolean }>(
      "select totp_secret, totp_enabled from users where id = $1 for update",
      [session.userId],
    );
    const user = rows[0];
    if (user === undefined || user.totp_secret === null || user.totp_enabled)
      throw conflict("Start two-factor setup first.");
    const step = verifyTotp(open(totpKey, user.totp_secret), code, Date.now() / 1000);
    if (step === null)
      throw badRequest("The authenticator code is incorrect.", { code: "Enter the current 6-digit code." });
    await tx.query("update users set totp_enabled = true, totp_last_step = $2 where id = $1", [session.userId, step]);
    await appendAudit(tx, {
      entityId: null,
      actorUserId: session.userId,
      action: "auth.totp_enabled",
      objectType: "user",
      objectId: session.userId,
      ip,
    });
  });
}
