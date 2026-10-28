// Run with: node --test

import assert from "node:assert/strict";
import type http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, test } from "node:test";
import { createServer, parseNewUser, UserStore } from "./server.ts";

describe("parseNewUser (pure validation)", () => {
  test("accepts a valid user and normalises it", () => {
    const result = parseNewUser({ name: "  Ada Lovelace ", email: "Ada@Example.com" });
    assert.deepEqual(result, { ok: true, value: { name: "Ada Lovelace", email: "ada@example.com" } });
  });

  test("rejects non-object bodies", () => {
    for (const input of [null, 42, "text", ["a"]]) {
      assert.equal(parseNewUser(input).ok, false, `input ${JSON.stringify(input)}`);
    }
  });

  test("reports every invalid field", () => {
    const result = parseNewUser({ name: "", email: "not-an-email" });
    assert.deepEqual(result, {
      ok: false,
      errors: ["name is required", "email must be a valid address"],
    });
  });

  test("rejects an over-long name", () => {
    const result = parseNewUser({ name: "x".repeat(201), email: "a@example.com" });
    assert.equal(result.ok, false);
  });
});

describe("HTTP service", () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    server = createServer(new UserStore());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error === undefined ? resolve() : reject(error))),
    );
  });

  const postJson = (path: string, body: string): Promise<Response> =>
    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

  test("creates a user and reads it back", async () => {
    const created = await postJson("/users", JSON.stringify({ name: "Ada", email: "ada@example.com" }));
    assert.equal(created.status, 201);
    const user = (await created.json()) as { id: string; name: string; email: string };
    assert.match(user.id, /^[0-9a-f-]{36}$/);

    const fetched = await fetch(`${baseUrl}/users/${user.id}`);
    assert.equal(fetched.status, 200);
    assert.deepEqual(await fetched.json(), user);
  });

  test("returns 404 for an unknown user", async () => {
    const response = await fetch(`${baseUrl}/users/does-not-exist`);
    assert.equal(response.status, 404);
  });

  test("returns 400 for malformed JSON", async () => {
    const response = await postJson("/users", "{not json");
    assert.equal(response.status, 400);
  });

  test("returns 400 with details for invalid fields", async () => {
    const response = await postJson("/users", JSON.stringify({ name: "Ada" }));
    assert.equal(response.status, 400);
    const body = (await response.json()) as { details: string[] };
    assert.deepEqual(body.details, ["email must be a valid address"]);
  });

  test("returns 413 when the body is too large", async () => {
    const response = await postJson("/users", JSON.stringify({ name: "x".repeat(20_000), email: "a@example.com" }));
    assert.equal(response.status, 413);
  });

  test("returns 415 for a non-JSON content type", async () => {
    const response = await fetch(`${baseUrl}/users`, { method: "POST", body: "name=Ada" });
    assert.equal(response.status, 415);
  });

  test("returns 405 with an Allow header for the wrong method", async () => {
    const response = await fetch(`${baseUrl}/users`);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  });

  test("reports health", async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});
