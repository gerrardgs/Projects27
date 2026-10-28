// Reads a resolver document from the Design Tokens Resolver Module 2025.10 and resolves token sets for one input,
// for example { theme: "dark" }. Spec: https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/
//
// Supported: sets and modifier contexts whose sources are file references ({ "$ref": "base.json" }) or inline
// token groups, and a resolutionOrder of references to them ({ "$ref": "#/sets/base" }). Later sources override
// earlier ones, as the spec requires. Inline resolutionOrder entries are rejected rather than half-supported.

import { type FlatToken, flattenTokens } from "./tokens.ts";

/**
 * The spec intends "2025.10". The published report's table and section 4.1.2 contain the placeholders
 * "2025-10-01" and "2025-11-01", corrected upstream in design-tokens/community-group PRs #357 and #408,
 * so documents written against the published text are accepted too.
 */
export const RESOLVER_VERSION = "2025.10";
const ACCEPTED_VERSIONS: ReadonlySet<unknown> = new Set([RESOLVER_VERSION, "2025-10-01", "2025-11-01"]);

export type Source = { readonly ref: string } | { readonly inline: unknown };

export interface Modifier {
  readonly contexts: Readonly<Record<string, readonly Source[]>>;
  readonly defaultContext: string | undefined;
}

export interface Resolver {
  readonly sets: Readonly<Record<string, readonly Source[]>>;
  readonly modifiers: Readonly<Record<string, Modifier>>;
  readonly order: readonly { readonly kind: "sets" | "modifiers"; readonly name: string }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseSources(raw: unknown, where: string): Source[] {
  if (!Array.isArray(raw)) throw new Error(`${where}: expected an array of sources`);
  return raw.map((source: unknown, index) => {
    if (!isRecord(source)) throw new Error(`${where}[${index}]: expected an object`);
    if (!("$ref" in source)) return { inline: source };
    if (typeof source.$ref !== "string") throw new Error(`${where}[${index}]: $ref must be a string`);
    return { ref: source.$ref };
  });
}

function parseModifier(name: string, raw: unknown): Modifier {
  if (!isRecord(raw) || !isRecord(raw.contexts)) throw new Error(`modifiers.${name}: expected "contexts"`);
  const contexts = Object.fromEntries(
    Object.entries(raw.contexts).map(([context, sources]) => [
      context,
      parseSources(sources, `modifiers.${name}.${context}`),
    ]),
  );
  const defaultContext = raw.default;
  if (defaultContext !== undefined && (typeof defaultContext !== "string" || !(defaultContext in contexts))) {
    throw new Error(`modifiers.${name}: default must name one of its contexts`);
  }
  return { contexts, defaultContext };
}

function parseOrder(raw: unknown, sets: Resolver["sets"], modifiers: Resolver["modifiers"]): Resolver["order"] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("resolutionOrder: expected a non-empty array");
  return raw.map((item: unknown, index) => {
    const pointer = isRecord(item) && typeof item.$ref === "string" ? item.$ref : undefined;
    const match = pointer === undefined ? null : /^#\/(sets|modifiers)\/([^/]+)$/.exec(pointer);
    if (match === null)
      throw new Error(`resolutionOrder[${index}]: expected { "$ref": "#/sets/<name>" or "#/modifiers/<name>" }`);
    const kind = match[1] === "sets" ? "sets" : "modifiers";
    const name = match[2] ?? "";
    if (!(name in (kind === "sets" ? sets : modifiers)))
      throw new Error(`resolutionOrder[${index}]: unknown ${kind} "${name}"`);
    return { kind, name };
  });
}

/** Validates a resolver document; throws with the first problem found. */
export function parseResolver(raw: unknown): Resolver {
  if (!isRecord(raw)) throw new Error("resolver: expected a JSON object");
  if (!ACCEPTED_VERSIONS.has(raw.version)) throw new Error(`resolver: version must be "${RESOLVER_VERSION}"`);
  const rawSets = raw.sets ?? {};
  const rawModifiers = raw.modifiers ?? {};
  if (!isRecord(rawSets) || !isRecord(rawModifiers)) throw new Error("resolver: sets and modifiers must be objects");
  const sets = Object.fromEntries(
    Object.entries(rawSets).map(([name, set]) => [
      name,
      parseSources(isRecord(set) ? set.sources : undefined, `sets.${name}.sources`),
    ]),
  );
  const modifiers = Object.fromEntries(
    Object.entries(rawModifiers).map(([name, value]) => [name, parseModifier(name, value)]),
  );
  return { sets, modifiers, order: parseOrder(raw.resolutionOrder, sets, modifiers) };
}

/** The contexts a modifier offers, default first, for example ["light", "dark"]. */
export function contextsOf(resolver: Resolver, modifier: string): string[] {
  const found = resolver.modifiers[modifier];
  if (found === undefined) throw new Error(`resolver has no modifier "${modifier}"`);
  const names = Object.keys(found.contexts);
  return found.defaultContext === undefined
    ? names
    : [found.defaultContext, ...names.filter((name) => name !== found.defaultContext)];
}

function sourcesFor(
  resolver: Resolver,
  item: Resolver["order"][number],
  input: Readonly<Record<string, string>>,
): readonly Source[] {
  if (item.kind === "sets") return resolver.sets[item.name] ?? [];
  const modifier = resolver.modifiers[item.name];
  const context = input[item.name] ?? modifier?.defaultContext;
  const sources = context === undefined ? undefined : modifier?.contexts[context];
  if (sources === undefined)
    throw new Error(`input for modifier "${item.name}" must be one of its contexts (got "${String(context)}")`);
  return sources;
}

/**
 * Resolves the token set for one input. `load` reads a referenced file; it must reject references that leave the
 * token directory. Later sources override earlier ones; aliases are resolved afterwards by `resolveToken`.
 */
export async function resolveTokens(
  resolver: Resolver,
  input: Readonly<Record<string, string>>,
  load: (ref: string) => Promise<unknown>,
): Promise<Map<string, FlatToken>> {
  const tokens = new Map<string, FlatToken>();
  for (const item of resolver.order) {
    for (const source of sourcesFor(resolver, item, input)) {
      const tree = "ref" in source ? await load(source.ref) : source.inline;
      for (const token of flattenTokens(tree)) tokens.set(token.path, token);
    }
  }
  return tokens;
}

/** Maps a `$ref` to a file inside `root`, rejecting absolute paths, URLs, traversal and non-JSON files. */
export function safeTokenPath(root: string, ref: string, join: (...parts: string[]) => string): string {
  if (!/^[\w./-]+\.json$/.test(ref) || ref.startsWith("/") || ref.split("/").includes("..")) {
    throw new Error(`$ref "${ref}" must be a relative .json path inside the token directory`);
  }
  return join(root, ref);
}
