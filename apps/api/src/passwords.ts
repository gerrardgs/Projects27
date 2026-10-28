// Password hashing with Argon2id at the OWASP Password Storage Cheat Sheet minimum
// (19 MiB memory, 2 iterations, parallelism 1), using node:crypto (Node.js 24.7 and later).

import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const argon2Async = promisify(argon2);
const MEMORY_KIB = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

interface Cost {
  memory: number;
  passes: number;
  parallelism: number;
}

const DEFAULT_COST: Cost = { memory: MEMORY_KIB, passes: PASSES, parallelism: PARALLELISM };

async function derive(password: string, nonce: Buffer, cost: Cost) {
  return argon2Async("argon2id", { message: password, nonce, ...cost, tagLength: TAG_LENGTH });
}

export async function hashPassword(password: string): Promise<string> {
  const nonce = randomBytes(16);
  const tag = await derive(password, nonce, DEFAULT_COST);
  return `$argon2id$v=19$m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}$${nonce.toString("base64url")}$${tag.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([\w-]+)\$([\w-]+)$/.exec(stored);
  if (match === null) return false;
  const [, memory, passes, parallelism, nonce, tag] = match;
  const expected = Buffer.from(tag ?? "", "base64url");
  const actual = await derive(password, Buffer.from(nonce ?? "", "base64url"), {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
