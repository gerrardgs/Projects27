import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "../src/config.ts";

test("configuration is validated at start-up", () => {
  assert.throws(() => loadConfig({}), /DATABASE_URL is required/);
  assert.throws(() => loadConfig({ DATABASE_URL: "postgres://x", PORT: "70000" }), /PORT/);
  assert.throws(
    () => loadConfig({ DATABASE_URL: "postgres://x", WEB_ORIGINS: "https://a.test/path" }),
    /not an origin/,
  );
  const config = loadConfig({
    DATABASE_URL: "postgres://x",
    WEB_ORIGINS: "https://a.test, http://localhost:5173",
    COOKIE_SECURE: "false",
  });
  assert.deepEqual(config, {
    databaseUrl: "postgres://x",
    port: 8080,
    webOrigins: ["https://a.test", "http://localhost:5173"],
    cookieSecure: false,
    authAttemptsPerMinute: 10,
    aiApiKey: null,
    aiModel: "claude-opus-5-5",
  });
});
