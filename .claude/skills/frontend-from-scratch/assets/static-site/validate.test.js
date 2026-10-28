// Run with: node --test

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, resolveTheme, validateSignup } from "./validate.js";

describe("validateSignup", () => {
  test("accepts valid input and trims it", () => {
    assert.deepEqual(validateSignup({ name: "  Ada Lovelace ", email: " ada@example.com " }), {
      ok: true,
      value: { name: "Ada Lovelace", email: "ada@example.com" },
    });
  });

  test("reports every missing field with an actionable message", () => {
    assert.deepEqual(validateSignup({ name: " ", email: "" }), {
      ok: false,
      errors: [
        { field: "name", message: "Enter your name" },
        { field: "email", message: "Enter your email address" },
      ],
    });
  });

  test("treats non-string values (for example a File from FormData) as missing", () => {
    const result = validateSignup({ name: 42, email: null });
    assert.equal(result.ok, false);
    assert.equal(result.errors.length, 2);
  });

  test("rejects malformed email addresses", () => {
    for (const email of ["plainaddress", "a@b", "a b@example.com", "@example.com", "a@@example.com"]) {
      const result = validateSignup({ name: "Ada", email });
      assert.equal(result.ok, false, email);
      assert.equal(result.errors[0]?.field, "email", email);
    }
  });

  test("accepts unusual but valid addresses", () => {
    for (const email of ["first.last+tag@example.co.uk", "o'neil@example.ie", "用户@例子.广告"]) {
      assert.equal(validateSignup({ name: "Ada", email }).ok, true, email);
    }
  });

  test("enforces length limits at the boundary", () => {
    assert.equal(validateSignup({ name: "x".repeat(NAME_MAX_LENGTH), email: "a@b.co" }).ok, true);
    assert.equal(validateSignup({ name: "x".repeat(NAME_MAX_LENGTH + 1), email: "a@b.co" }).ok, false);
    const longEmail = `${"a".repeat(EMAIL_MAX_LENGTH - "@b.co".length + 1)}@b.co`;
    assert.equal(validateSignup({ name: "Ada", email: longEmail }).ok, false);
  });
});

describe("resolveTheme", () => {
  test("an explicit saved choice wins over the system setting", () => {
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("dark", false), "dark");
  });

  test("falls back to the system setting for missing or unknown values", () => {
    assert.equal(resolveTheme(null, true), "dark");
    assert.equal(resolveTheme("sepia", false), "light");
  });
});
