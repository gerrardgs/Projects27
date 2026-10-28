// Entry point: node src/server.ts (Node.js 24.7+ runs TypeScript by stripping types).

import { createServer, type Server } from "node:http";
import { ClaudeExtractor, type Extractor } from "./capture-ai.ts";
import { type Config, loadConfig } from "./config.ts";
import { createPool, type Db } from "./db.ts";
import { createHandler } from "./http.ts";
import { buildRouter } from "./routes.ts";
import { parseKey } from "./secretbox.ts";

export function createApp(db: Db, config: Config, totpKey: Buffer, extractor: Extractor | null = null): Server {
  const server = createServer(createHandler(buildRouter(db, config, totpKey, extractor), db, config));
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  return server;
}

if (import.meta.main) {
  const config = loadConfig();
  const totpKey = parseKey(process.env.TOTP_KEY);
  const db = createPool(config.databaseUrl);
  const extractor = config.aiApiKey === null ? null : new ClaudeExtractor(config.aiApiKey, config.aiModel);
  const server = createApp(db, config, totpKey, extractor);
  server.listen(config.port, () =>
    console.log(JSON.stringify({ level: "info", message: "listening", port: config.port })),
  );
  const stop = () => {
    server.close(() => {
      db.end().finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
