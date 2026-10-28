// Converts Figma variables (REST API: GET /v1/files/:file_key/variables/local) into design tokens in the
// Design Tokens Community Group format 2025.10: one token file per collection and mode.
// Types come from Figma's official OpenAPI typings (@figma/rest-api-spec); this file has no runtime dependencies.
//
// Mapping decisions (documented in ../../SKILL.md section 4):
// - Variable "color/blue/600" in collection "Primitives" becomes token path "primitives.color.blue.600".
// - COLOR -> color (sRGB, with alpha when below 1). FLOAT -> dimension (px) or fontWeight or number, chosen
//   from the variable's scopes. STRING with only the FONT_FAMILY scope -> fontFamily.
// - Aliases become "{token.path}" references. Unsupported values are skipped with a warning, never guessed.

import type {
  GetLocalVariablesResponse,
  LocalVariable,
  LocalVariableCollection,
  RGBA,
  VariableAlias,
  VariableResolvedDataType,
  VariableScope,
} from "@figma/rest-api-spec";

/** A DTCG group: nested groups and tokens keyed by name. */
export type TokenTree = Record<string, unknown>;

export interface ConversionResult {
  /** Output file name (`<collection>.<mode>.tokens.json`) mapped to its token tree. */
  readonly files: Map<string, TokenTree>;
  /**
   * A DTCG Resolver Module 2025.10 document for the files: one-mode collections become sets, collections with
   * several modes become modifiers (for example `theme` with `light` and `dark`). Save it next to the files.
   */
  readonly resolver: TokenTree;
  /** Variables that were skipped or need attention, with the reason. */
  readonly warnings: string[];
}

/** The file name a collection and mode are written to. */
const fileName = (collection: LocalVariableCollection, modeName: string) =>
  `${slug(collection.name)}.${slug(modeName)}.tokens.json`;

/** Builds the resolver: sets first (alphabetical), then modifiers, so mode-specific values override shared ones. */
export function buildResolver(collections: readonly LocalVariableCollection[]): TokenTree {
  const single = collections.filter((collection) => collection.modes.length === 1);
  const multi = collections.filter((collection) => collection.modes.length > 1);
  const sets = Object.fromEntries(
    single.map((collection) => [
      slug(collection.name),
      { sources: collection.modes.map((mode) => ({ $ref: fileName(collection, mode.name) })) },
    ]),
  );
  const modifiers = Object.fromEntries(
    multi.map((collection) => {
      const contexts = Object.fromEntries(
        collection.modes.map((mode) => [slug(mode.name), [{ $ref: fileName(collection, mode.name) }]]),
      );
      const defaultMode = collection.modes.find((mode) => mode.modeId === collection.defaultModeId);
      return [slug(collection.name), { contexts, ...(defaultMode ? { default: slug(defaultMode.name) } : {}) }];
    }),
  );
  const resolutionOrder = [
    ...Object.keys(sets).map((name) => ({ $ref: `#/sets/${name}` })),
    ...Object.keys(modifiers).map((name) => ({ $ref: `#/modifiers/${name}` })),
  ];
  return { version: "2025.10", sets, modifiers, resolutionOrder };
}

// Scopes whose values are lengths in pixels in Figma.
const DIMENSION_SCOPES: ReadonlySet<VariableScope> = new Set([
  "CORNER_RADIUS",
  "WIDTH_HEIGHT",
  "GAP",
  "STROKE_FLOAT",
  "EFFECT_FLOAT",
  "FONT_SIZE",
  "LINE_HEIGHT",
  "LETTER_SPACING",
  "PARAGRAPH_SPACING",
  "PARAGRAPH_INDENT",
]);

/** "Brand Colors" -> "brand-colors". Rejects names that would produce an empty or reserved segment. */
export function slug(segment: string): string {
  const result = segment
    .trim()
    .toLowerCase()
    .replace(/[{}.$]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  if (result === "") throw new Error(`name segment "${segment}" has no letters or digits`);
  return result;
}

/** Token path for a variable: collection name plus the variable's slash-separated name. */
export function tokenPath(collection: LocalVariableCollection, variable: LocalVariable): string {
  return [collection.name, ...variable.name.split("/")].map(slug).join(".");
}

const isAlias = (value: unknown): value is VariableAlias =>
  typeof value === "object" && value !== null && "type" in value && value.type === "VARIABLE_ALIAS";

const isRgba = (value: unknown): value is RGBA =>
  typeof value === "object" &&
  value !== null &&
  "r" in value &&
  "g" in value &&
  "b" in value &&
  typeof value.r === "number" &&
  typeof value.g === "number" &&
  typeof value.b === "number";

const toByte = (channel: number): string =>
  Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, "0");

/** Figma colours are sRGB with channels from 0 to 1 (alpha optional). */
export function colorValue(color: RGBA): Record<string, unknown> {
  const components = [color.r, color.g, color.b].map((channel) => Math.round(channel * 10_000) / 10_000);
  const hex = `#${toByte(color.r)}${toByte(color.g)}${toByte(color.b)}`;
  const alpha = typeof color.a === "number" ? color.a : 1;
  return alpha < 1
    ? { colorSpace: "srgb", components, alpha: Math.round(alpha * 10_000) / 10_000, hex }
    : { colorSpace: "srgb", components, hex };
}

type Mapped = { readonly type: string; readonly convert: (value: unknown) => unknown } | { readonly skip: string };

const asNumber = (value: unknown) => (typeof value === "number" ? value : undefined);
const allScopesIn = (scopes: ReadonlySet<VariableScope>, allowed: (scope: VariableScope) => boolean) =>
  scopes.size > 0 && [...scopes].every(allowed);

function mapFloat(scopes: ReadonlySet<VariableScope>): Mapped {
  if (allScopesIn(scopes, (scope) => scope === "FONT_WEIGHT")) return { type: "fontWeight", convert: asNumber };
  if (allScopesIn(scopes, (scope) => DIMENSION_SCOPES.has(scope))) {
    return { type: "dimension", convert: (value) => (typeof value === "number" ? { value, unit: "px" } : undefined) };
  }
  return { type: "number", convert: asNumber };
}

function mapString(scopes: ReadonlySet<VariableScope>): Mapped {
  if (scopes.size === 1 && scopes.has("FONT_FAMILY")) {
    return { type: "fontFamily", convert: (value) => (typeof value === "string" ? value : undefined) };
  }
  return { skip: "STRING variables are only exported when their only scope is FONT_FAMILY" };
}

const MAPPERS: Readonly<Record<VariableResolvedDataType, (scopes: ReadonlySet<VariableScope>) => Mapped>> = {
  COLOR: () => ({ type: "color", convert: (value) => (isRgba(value) ? colorValue(value) : undefined) }),
  FLOAT: mapFloat,
  STRING: mapString,
  BOOLEAN: () => ({ skip: "BOOLEAN variables have no DTCG token type" }),
};

/** Chooses the DTCG type for a variable from its resolved type and scopes. */
export function mapType(variable: LocalVariable): Mapped {
  return MAPPERS[variable.resolvedType](new Set(variable.scopes));
}

const isGroup = (value: unknown): value is TokenTree =>
  typeof value === "object" && value !== null && !Array.isArray(value) && !("$value" in value);

function setPath(tree: TokenTree, path: string, token: TokenTree): void {
  const segments = path.split(".");
  let node = tree;
  for (const segment of segments.slice(0, -1)) {
    const next = node[segment] ?? {};
    if (!isGroup(next)) throw new Error(`token path "${path}" collides with an existing token at "${segment}"`);
    node[segment] = next;
    node = next;
  }
  const leaf = segments.at(-1) ?? "";
  if (node[leaf] !== undefined)
    throw new Error(`token path "${path}" is produced by two variables; rename one in Figma`);
  node[leaf] = token;
}

interface Context {
  readonly response: GetLocalVariablesResponse;
  readonly pathById: ReadonlyMap<string, string>;
}

/** Token paths for every live variable, so aliases can be written as references. */
function indexPaths(response: GetLocalVariablesResponse): Map<string, string> {
  const { variables, variableCollections } = response.meta;
  const pathById = new Map<string, string>();
  for (const variable of Object.values(variables)) {
    const collection = variableCollections[variable.variableCollectionId];
    if (collection !== undefined && !variable.deletedButReferenced)
      pathById.set(variable.id, tokenPath(collection, variable));
  }
  return pathById;
}

type Outcome = { readonly value: unknown } | { readonly reason: string };

function resolveValue(raw: unknown, convert: (value: unknown) => unknown, context: Context): Outcome {
  if (isAlias(raw)) {
    const target = context.pathById.get(raw.id);
    return target === undefined
      ? { reason: `alias to a variable outside this file (${raw.id})` }
      : { value: `{${target}}` };
  }
  const value = convert(raw);
  return value === undefined ? { reason: `unsupported value ${JSON.stringify(raw)}` } : { value };
}

function buildToken(variable: LocalVariable, type: string, value: unknown): TokenTree {
  const token: TokenTree = { $type: type, $value: value };
  const description = variable.description.trim();
  if (description !== "") token.$description = description;
  const codeSyntax = variable.codeSyntax.WEB;
  token.$extensions = {
    "com.figma": { variableId: variable.id, scopes: variable.scopes, ...(codeSyntax ? { codeSyntax } : {}) },
  };
  return token;
}

/** Converts one mode of one collection into a token tree, collecting a warning for every skipped variable. */
function convertMode(
  collection: LocalVariableCollection,
  mode: LocalVariableCollection["modes"][number],
  context: Context,
  warnings: string[],
): TokenTree {
  const tree: TokenTree = {};
  for (const variableId of collection.variableIds) {
    const variable = context.response.meta.variables[variableId];
    if (variable === undefined || variable.deletedButReferenced) continue;
    const path = context.pathById.get(variable.id) ?? tokenPath(collection, variable);
    const mapped = mapType(variable);
    if ("skip" in mapped) {
      // Type-level skips are the same in every mode; report them once, for the default mode.
      if (mode.modeId === collection.defaultModeId) warnings.push(`${path}: skipped, ${mapped.skip}`);
      continue;
    }
    const raw = variable.valuesByMode[mode.modeId] ?? variable.valuesByMode[collection.defaultModeId];
    const outcome = resolveValue(raw, mapped.convert, context);
    if ("reason" in outcome) {
      warnings.push(`${path} (${mode.name}): skipped, ${outcome.reason}`);
      continue;
    }
    setPath(tree, path, buildToken(variable, mapped.type, outcome.value));
  }
  return tree;
}

export function convertVariables(response: GetLocalVariablesResponse): ConversionResult {
  const context: Context = { response, pathById: indexPaths(response) };
  const files = new Map<string, TokenTree>();
  const warnings: string[] = [];
  const collections = Object.values(response.meta.variableCollections).sort((a, b) => a.name.localeCompare(b.name));
  for (const collection of collections.filter((candidate) => candidate.remote)) {
    warnings.push(`collection "${collection.name}": remote (from a library); convert it from its source file`);
  }
  const local = collections.filter((collection) => !collection.remote);
  for (const collection of local) {
    for (const mode of collection.modes) {
      files.set(fileName(collection, mode.name), convertMode(collection, mode, context, warnings));
    }
  }
  return { files, resolver: buildResolver(local), warnings };
}

/** Accepts a file key or any Figma file URL (design, file, proto, board, slides) and returns the key. */
export function parseFileKey(input: string): string {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9]{10,}$/.test(trimmed)) return trimmed;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`"${input}" is neither a Figma file key nor a URL`);
  }
  if (url.hostname !== "figma.com" && !url.hostname.endsWith(".figma.com"))
    throw new Error(`"${url.hostname}" is not a Figma host`);
  const match = /^\/(?:design|file|proto|board|slides)\/([A-Za-z0-9]+)/.exec(url.pathname);
  if (match?.[1] === undefined) throw new Error(`no file key found in "${input}"`);
  return match[1];
}
