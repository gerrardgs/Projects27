// Reads design tokens in the Design Tokens Community Group format (2025.10), resolves aliases,
// converts values to CSS, and checks WCAG 2.2 contrast between token pairs.
// Spec: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
// No dependencies: Node.js 22.18+ runs this file directly (type stripping).

export type TokenType = "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "number";

export interface FlatToken {
  readonly path: string;
  readonly type: TokenType;
  readonly value: unknown;
  readonly description?: string;
}

const TOKEN_TYPES: ReadonlySet<string> = new Set([
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
]);
const ALIAS_PATTERN = /^\{([^{}]+)\}$/;
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

// Named weights from the DTCG fontWeight type.
const FONT_WEIGHT_NAMES: Readonly<Record<string, number>> = {
  thin: 100,
  hairline: 100,
  "extra-light": 200,
  "ultra-light": 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  "semi-bold": 600,
  "demi-bold": 600,
  bold: 700,
  "extra-bold": 800,
  "ultra-bold": 800,
  black: 900,
  heavy: 900,
  "extra-black": 950,
  "ultra-black": 950,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTokenType = (value: unknown): value is TokenType => typeof value === "string" && TOKEN_TYPES.has(value);

function leafToken(tree: Record<string, unknown>, path: string, type: string | undefined): FlatToken {
  if (!isTokenType(type)) throw new Error(`${path}: unsupported or missing $type "${String(type)}"`);
  const token: FlatToken = { path, type, value: tree.$value };
  return typeof tree.$description === "string" ? { ...token, description: tree.$description } : token;
}

function assertValidName(key: string, prefix: string): void {
  if (/[.{}]/.test(key)) {
    throw new Error(`${prefix}: token and group names cannot contain ".", "{" or "}" (got "${key}")`);
  }
}

/** Flattens a token tree into dot-separated paths. `$type` set on a group is inherited by its children. */
export function flattenTokens(tree: unknown, prefix = "", inheritedType?: string): FlatToken[] {
  if (!isRecord(tree)) throw new Error(`${prefix || "root"}: expected a group object`);
  const groupType = typeof tree.$type === "string" ? tree.$type : inheritedType;
  if (Object.hasOwn(tree, "$value")) return [leafToken(tree, prefix, groupType)];
  return Object.entries(tree)
    .filter(([key]) => !key.startsWith("$"))
    .flatMap(([key, child]) => {
      assertValidName(key, prefix);
      return flattenTokens(child, prefix === "" ? key : `${prefix}.${key}`, groupType);
    });
}

/** Merges several flattened token sets; a later set may not redefine a path from an earlier one. */
export function mergeTokenSets(...sets: readonly FlatToken[][]): Map<string, FlatToken> {
  const merged = new Map<string, FlatToken>();
  for (const set of sets) {
    for (const token of set) {
      if (merged.has(token.path)) throw new Error(`${token.path}: defined twice`);
      merged.set(token.path, token);
    }
  }
  return merged;
}

/** Follows `{alias}` references to a literal value. Rejects unknown targets, type mismatches and cycles. */
export function resolveToken(tokens: ReadonlyMap<string, FlatToken>, path: string): FlatToken {
  const seen: string[] = [];
  let current = tokens.get(path);
  if (current === undefined) throw new Error(`unknown token "${path}"`);
  const expectedType = current.type;
  for (;;) {
    if (seen.includes(current.path)) throw new Error(`alias cycle: ${[...seen, current.path].join(" -> ")}`);
    seen.push(current.path);
    const alias = typeof current.value === "string" ? ALIAS_PATTERN.exec(current.value) : null;
    if (alias === null) return { ...current, path };
    const targetPath = alias[1] ?? "";
    const target = tokens.get(targetPath);
    if (target === undefined) throw new Error(`${current.path}: alias to unknown token "${targetPath}"`);
    if (target.type !== expectedType) {
      throw new Error(`${current.path}: alias to "${targetPath}" changes type ${expectedType} -> ${target.type}`);
    }
    current = target;
  }
}

/** Returns the color as a lowercase 6-digit hex string. Only sRGB colors are supported by this template. */
export function colorToHex(value: unknown, path = "color"): string {
  if (!isRecord(value)) throw new Error(`${path}: color value must be an object`);
  if (value.colorSpace !== "srgb") throw new Error(`${path}: only the "srgb" colorSpace is supported here`);
  if (typeof value.hex === "string") {
    if (!HEX_PATTERN.test(value.hex)) throw new Error(`${path}: hex must look like #rrggbb`);
    return value.hex.toLowerCase();
  }
  const { components } = value;
  if (!Array.isArray(components) || components.length !== 3) throw new Error(`${path}: needs 3 components`);
  return `#${components
    .map((component: unknown) => {
      if (typeof component !== "number" || component < 0 || component > 1) {
        throw new Error(`${path}: components must be numbers from 0 to 1`);
      }
      return Math.round(component * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

function measure(value: unknown, path: string, units: readonly string[]): string {
  if (!isRecord(value) || typeof value.value !== "number" || typeof value.unit !== "string") {
    throw new Error(`${path}: expected { "value": number, "unit": string }`);
  }
  if (!units.includes(value.unit)) throw new Error(`${path}: unit must be one of ${units.join(", ")}`);
  return value.value === 0 ? "0" : `${value.value}${value.unit}`;
}

const quoteFamily = (family: string): string =>
  /^[a-z-]+$/i.test(family) ? family : `"${family.replaceAll('"', '\\"')}"`;

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number");

function numberValue(value: unknown, path: string): string {
  if (typeof value !== "number") throw new Error(`${path}: expected a number`);
  return String(value);
}

function fontFamilyValue(value: unknown, path: string): string {
  const families = typeof value === "string" ? [value] : value;
  if (!Array.isArray(families) || !families.every((item): item is string => typeof item === "string")) {
    throw new Error(`${path}: expected a string or an array of strings`);
  }
  return families.map(quoteFamily).join(", ");
}

function fontWeightValue(value: unknown, path: string): string {
  const weight = typeof value === "string" ? FONT_WEIGHT_NAMES[value] : value;
  if (typeof weight !== "number" || weight < 1 || weight > 1000) throw new Error(`${path}: invalid font weight`);
  return String(weight);
}

function cubicBezierValue(value: unknown, path: string): string {
  if (!isNumberArray(value) || value.length !== 4) throw new Error(`${path}: expected 4 numbers`);
  const inUnitRange = (x: number | undefined) => x !== undefined && x >= 0 && x <= 1;
  if (!inUnitRange(value[0]) || !inUnitRange(value[2]))
    throw new Error(`${path}: x coordinates must be between 0 and 1`);
  return `cubic-bezier(${value.join(", ")})`;
}

const CSS_CONVERTERS: Readonly<Record<TokenType, (value: unknown, path: string) => string>> = {
  color: (value, path) => colorToHex(value, path),
  dimension: (value, path) => measure(value, path, ["px", "rem"]),
  duration: (value, path) => measure(value, path, ["ms", "s"]),
  number: numberValue,
  fontFamily: fontFamilyValue,
  fontWeight: fontWeightValue,
  cubicBezier: cubicBezierValue,
};

/** Converts a resolved token to a CSS value. */
export function toCssValue(token: FlatToken): string {
  return CSS_CONVERTERS[token.type](token.value, token.path);
}

/** `color.blue.600` -> `--color-blue-600` */
export const cssVariableName = (path: string): string => `--${path.replaceAll(".", "-")}`;

/** Relative luminance as defined in WCAG 2.2 (https://www.w3.org/TR/WCAG22/#dfn-relative-luminance). */
export function relativeLuminance(hex: string): number {
  if (!HEX_PATTERN.test(hex)) throw new Error(`invalid hex color "${hex}"`);
  const channel = (offset: number): number => {
    const srgb = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Contrast ratio from 1 to 21 (https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio). */
export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

export interface ContrastPair {
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

export interface ContrastResult extends ContrastPair {
  readonly ratio: number;
  readonly passes: boolean;
}

/** Checks each pair. Ratios are not rounded up before comparing: 4.49 fails a 4.5 minimum, as WCAG requires. */
export function checkContrast(
  tokens: ReadonlyMap<string, FlatToken>,
  pairs: readonly ContrastPair[],
): ContrastResult[] {
  return pairs.map((pair) => {
    const foreground = resolveToken(tokens, pair.foreground);
    const background = resolveToken(tokens, pair.background);
    if (foreground.type !== "color" || background.type !== "color") {
      throw new Error(`${pair.foreground} / ${pair.background}: both tokens must be colors`);
    }
    const ratio = contrastRatio(
      colorToHex(foreground.value, pair.foreground),
      colorToHex(background.value, pair.background),
    );
    return { ...pair, ratio, passes: ratio >= pair.minimum };
  });
}

/** Builds `name: value;` declarations for every token, resolving aliases to literal values. */
export function cssDeclarations(tokens: ReadonlyMap<string, FlatToken>, filter: (path: string) => boolean): string[] {
  return [...tokens.keys()]
    .filter(filter)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((path) => `${cssVariableName(path)}: ${toCssValue(resolveToken(tokens, path))};`);
}
