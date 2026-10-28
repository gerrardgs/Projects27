// Usage:
//   FIGMA_TOKEN=... node cli.ts <file-key-or-url> [out-dir]     fetch from the Figma REST API
//   node cli.ts --input variables.json [out-dir]                  convert a saved API response (no token needed)
// Writes one DTCG token file per collection and mode, plus tokens.resolver.json (DTCG Resolver Module 2025.10),
// into out-dir (default: ./out) and prints warnings.
// The token is read from the environment only; it is never printed or written to disk.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GetLocalVariablesResponse } from "@figma/rest-api-spec";
import { fetchLocalVariables, parseVariablesResponse } from "./client.ts";
import { convertVariables, parseFileKey } from "./convert.ts";

async function load(args: string[]): Promise<{ response: GetLocalVariablesResponse; rest: string[] }> {
  if (args[0] === "--input") {
    const file = args[1];
    if (file === undefined) throw new Error("--input needs a file path");
    return { response: parseVariablesResponse(JSON.parse(await readFile(file, "utf8"))), rest: args.slice(2) };
  }
  const source = args[0];
  if (source === undefined)
    throw new Error("usage: node cli.ts <file-key-or-url> [out-dir] | --input <file.json> [out-dir]");
  const token = process.env.FIGMA_TOKEN;
  if (token === undefined || token === "")
    throw new Error("set FIGMA_TOKEN (a personal access token with file_variables:read)");
  return { response: await fetchLocalVariables(parseFileKey(source), token), rest: args.slice(1) };
}

async function main(): Promise<void> {
  const { response, rest } = await load(process.argv.slice(2));
  const outDir = path.resolve(rest[0] ?? "out");
  const { files, resolver, warnings } = convertVariables(response);
  await mkdir(outDir, { recursive: true });
  for (const [name, tree] of [...files, ["tokens.resolver.json", resolver] as const]) {
    await writeFile(path.join(outDir, name), `${JSON.stringify(tree, null, 2)}\n`);
    console.log(`wrote ${path.relative(process.cwd(), path.join(outDir, name))}`);
  }
  for (const warning of warnings) console.warn(`warning: ${warning}`);
  console.log(`${files.size} token file(s) and a resolver, ${warnings.length} warning(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
