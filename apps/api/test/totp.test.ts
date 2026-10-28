import assert from "node:assert/strict";
import { test } from "node:test";
import { base32Encode, stepAt, totpAt, verifyTotp } from "../src/totp.ts";

// RFC 6238 appendix B test vectors for HMAC-SHA-1 (8 digits, secret "12345678901234567890").
const SECRET = Buffer.from("12345678901234567890", "ascii");
const VECTORS: [number, string][] = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
];

test("matches the RFC 6238 SHA-1 test vectors", () => {
  for (const [time, code] of VECTORS) assert.equal(totpAt(SECRET, stepAt(time), 8), code, `T=${time}`);
});

test("base32 matches the RFC 4648 test vectors (unpadded)", () => {
  assert.equal(base32Encode(Buffer.from("f")), "MY");
  assert.equal(base32Encode(Buffer.from("fo")), "MZXQ");
  assert.equal(base32Encode(Buffer.from("foobar")), "MZXW6YTBOI");
});

test("accepts one step of clock drift and nothing beyond", () => {
  const now = 1_800_000_000;
  const code = totpAt(SECRET, stepAt(now));
  assert.equal(verifyTotp(SECRET, code, now), stepAt(now));
  assert.equal(verifyTotp(SECRET, code, now + 30), stepAt(now));
  assert.equal(verifyTotp(SECRET, code, now + 90), null);
  assert.equal(verifyTotp(SECRET, "12345", now), null);
});
