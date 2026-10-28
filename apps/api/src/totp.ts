// Time-based one-time passwords (RFC 6238, HMAC-SHA-1, 30-second steps) with RFC 4648 base32 secrets.

import { createHmac, randomBytes } from "node:crypto";

const STEP_SECONDS = 30;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newTotpSecret(): Buffer {
  return randomBytes(20);
}

export function base32Encode(data: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function totpAt(secret: Buffer, step: number, digits = 6): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", secret).update(counter).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return code.toString().padStart(digits, "0");
}

export function stepAt(unixSeconds: number): number {
  return Math.floor(unixSeconds / STEP_SECONDS);
}

/** Returns the matching step within one step of clock drift, or null. */
export function verifyTotp(secret: Buffer, code: string, unixSeconds: number): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const now = stepAt(unixSeconds);
  for (const step of [now - 1, now, now + 1]) {
    if (totpAt(secret, step) === code) return step;
  }
  return null;
}

export function otpauthUri(secret: Buffer, accountName: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret: base32Encode(secret),
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
