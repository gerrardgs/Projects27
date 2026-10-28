// Run with: node --test

import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, test } from "node:test";
// Integration check with the token pipeline of the design-system-and-tokens skill in this repository.
import {
  contextsOf,
  parseResolver,
  resolveTokens,
} from "../../../design-system-and-tokens/assets/design-tokens/resolver.ts";
import {
  checkContrast,
  flattenTokens,
  mergeTokenSets,
  resolveToken,
  toCssValue,
} from "../../../design-system-and-tokens/assets/design-tokens/tokens.ts";
import { FigmaApiError, fetchLocalVariables, parseVariablesResponse } from "./client.ts";
import { colorValue, convertVariables, parseFileKey, slug } from "./convert.ts";
import { fixture } from "./fixture.ts";

const result = convertVariables(fixture);
const file = (name: string) => {
  const tree = result.files.get(name);
  assert.ok(tree !== undefined, `missing ${name}; have ${[...result.files.keys()].join(", ")}`);
  return tree;
};

/** Reads a token by dot path from a converted file, failing the test if any segment is missing. */
function token(name: string, path: string): { $type?: unknown; $value?: unknown; [key: string]: unknown } {
  let node: unknown = file(name);
  for (const segment of path.split(".")) {
    assert.ok(typeof node === "object" && node !== null && segment in node, `${name}: missing ${path} at ${segment}`);
    node = (node as Record<string, unknown>)[segment];
  }
  assert.ok(typeof node === "object" && node !== null, `${name}: ${path} is not a token`);
  return node as Record<string, unknown>;
}
const P = "primitives.value.tokens.json";

describe("convertVariables", () => {
  test("writes one file per local collection and mode", () => {
    assert.deepEqual([...result.files.keys()].sort(), [
      "primitives.value.tokens.json",
      "theme.dark.tokens.json",
      "theme.light.tokens.json",
    ]);
  });

  test("converts colours, keeps descriptions and records the Figma source", () => {
    assert.deepEqual(token(P, "primitives.color.blue.600"), {
      $type: "color",
      $value: { colorSpace: "srgb", components: [0.1412, 0.3412, 0.8392], hex: "#2457d6" },
      $description: "Primary brand blue",
      $extensions: {
        "com.figma": {
          variableId: "VariableID:1:12",
          scopes: ["ALL_FILLS", "STROKE_COLOR"],
          codeSyntax: "var(--color-blue-600)",
        },
      },
    });
    assert.deepEqual(token(P, "primitives.color.overlay").$value, {
      colorSpace: "srgb",
      components: [0, 0, 0],
      alpha: 0.5,
      hex: "#000000",
    });
  });

  test("chooses dimension, fontWeight, number and fontFamily from scopes", () => {
    const expected: [string, string, unknown][] = [
      ["space.4", "dimension", { value: 16, unit: "px" }],
      ["radius.medium", "dimension", { value: 8, unit: "px" }],
      ["font.weight.bold", "fontWeight", 700],
      ["opacity.disabled", "number", 0.4],
      ["font.family.sans", "fontFamily", "Inter"],
    ];
    for (const [path, type, value] of expected) {
      const converted = token(P, `primitives.${path}`);
      assert.deepEqual([converted.$type, converted.$value], [type, value], path);
    }
  });

  test("turns aliases into references per mode", () => {
    assert.equal(token("theme.light.tokens.json", "theme.surface.default").$value, "{primitives.color.neutral.0}");
    assert.equal(token("theme.dark.tokens.json", "theme.surface.default").$value, "{primitives.color.neutral.900}");
    assert.equal(token("theme.dark.tokens.json", "theme.action.default").$value, "{primitives.color.blue.600}");
  });

  test("skips what it cannot represent, with a reason for each, instead of guessing", () => {
    const joined = result.warnings.join("\n");
    assert.match(joined, /primitives\.copy\.brand-name: skipped, STRING variables/);
    assert.match(joined, /primitives\.flags\.beta: skipped, BOOLEAN/);
    assert.match(joined, /theme\.action\.tint \(Light\): skipped, unsupported value/);
    assert.match(joined, /theme\.brand\.accent \(Dark\): skipped, alias to a variable outside this file/);
    assert.match(joined, /collection "Library": remote/);
    assert.doesNotMatch(joined, /legacy/, "deleted variables are dropped silently");
  });

  test("output is valid input for the design-tokens pipeline, and the theme passes contrast", () => {
    const primitives = flattenTokens(file("primitives.value.tokens.json"));
    for (const mode of ["light", "dark"]) {
      const tokens = mergeTokenSets(primitives, flattenTokens(file(`theme.${mode}.tokens.json`)));
      assert.equal(toCssValue(resolveToken(tokens, "theme.action.default")), "#2457d6");
      const [pair] = checkContrast(tokens, [
        { foreground: "theme.text.default", background: "theme.surface.default", minimum: 4.5 },
      ]);
      assert.ok(pair?.passes, `${mode}: ${pair?.ratio}`);
    }
  });

  test("writes a standard resolver: one-mode collections as sets, multi-mode collections as modifiers", async () => {
    assert.deepEqual(result.resolver, {
      version: "2025.10",
      sets: { primitives: { sources: [{ $ref: "primitives.value.tokens.json" }] } },
      modifiers: {
        theme: {
          contexts: { light: [{ $ref: "theme.light.tokens.json" }], dark: [{ $ref: "theme.dark.tokens.json" }] },
          default: "light",
        },
      },
      resolutionOrder: [{ $ref: "#/sets/primitives" }, { $ref: "#/modifiers/theme" }],
    });
    // The design-tokens pipeline reads it as is and every theme still passes contrast.
    const resolver = parseResolver(result.resolver);
    const load = async (ref: string) => file(ref);
    assert.deepEqual(contextsOf(resolver, "theme"), ["light", "dark"]);
    for (const theme of contextsOf(resolver, "theme")) {
      const tokens = await resolveTokens(resolver, { theme }, load);
      const [pair] = checkContrast(tokens, [
        { foreground: "theme.text.default", background: "theme.surface.default", minimum: 4.5 },
      ]);
      assert.ok(pair?.passes, theme);
    }
  });

  test("reports each problem once, not once per mode", () => {
    assert.equal(new Set(result.warnings).size, result.warnings.length);
  });

  test("rejects two variables that map to the same token path", () => {
    const clash = structuredClone(fixture);
    const target = clash.meta.variables["VariableID:1:11"];
    assert.ok(target !== undefined);
    target.name = "Color/Neutral/0";
    assert.throws(() => convertVariables(clash), /produced by two variables/);
  });
});

describe("parseVariablesResponse (untrusted JSON)", () => {
  test("accepts a real response shape", () => {
    assert.equal(
      parseVariablesResponse(JSON.parse(JSON.stringify(fixture))).meta.variables["VariableID:1:12"]?.name,
      "color/blue/600",
    );
  });

  test("rejects malformed input with a precise message", () => {
    assert.throws(() => parseVariablesResponse([]), /missing meta/);
    assert.throws(() => parseVariablesResponse({ meta: { variables: {} } }), /meta\.variableCollections/);
    const broken = structuredClone(fixture) as unknown as {
      meta: { variables: Record<string, Record<string, unknown>> };
    };
    delete broken.meta.variables["VariableID:1:10"]?.valuesByMode;
    assert.throws(() => parseVariablesResponse(broken), /VariableID:1:10 lacks valuesByMode/);
  });
});

describe("helpers", () => {
  test("slug normalises names and rejects empty ones", () => {
    assert.equal(slug(" Brand Colors "), "brand-colors");
    assert.equal(slug("Größe/2"), "größe-2");
    assert.equal(slug("{a.b}"), "ab");
    assert.throws(() => slug("..."), /no letters or digits/);
  });

  test("colorValue clamps and omits opaque alpha", () => {
    assert.deepEqual(colorValue({ r: 1, g: 0, b: 0, a: 1 }), {
      colorSpace: "srgb",
      components: [1, 0, 0],
      hex: "#ff0000",
    });
  });

  test("parseFileKey accepts keys and every Figma URL form", () => {
    assert.equal(parseFileKey("AbCdEf1234567890"), "AbCdEf1234567890");
    assert.equal(parseFileKey("https://www.figma.com/design/AbCdEf1234567890/My-File?node-id=1-2"), "AbCdEf1234567890");
    assert.equal(parseFileKey("https://figma.com/file/AbCdEf1234567890/x"), "AbCdEf1234567890");
    assert.throws(() => parseFileKey("https://evil.example/design/AbCdEf1234567890/x"), /not a Figma host/);
    assert.throws(() => parseFileKey("https://www.figma.com/community"), /no file key/);
  });
});

describe("fetchLocalVariables against a local stand-in for the API", () => {
  let base = "";
  const seen: { path: string | undefined; token: string | undefined } = { path: undefined, token: undefined };
  const server = http.createServer((request, response) => {
    seen.path = request.url;
    const header = request.headers["x-figma-token"];
    seen.token = typeof header === "string" ? header : undefined;
    if (request.url?.includes("/forbidden/")) {
      response.writeHead(403).end('{"status":403,"err":"Forbidden"}');
    } else if (request.url?.includes("/limited/")) {
      response.writeHead(429, { "retry-after": "60" }).end();
    } else {
      response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(fixture));
    }
  });

  before(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  test("sends the token in X-Figma-Token and parses the response", async () => {
    const response = await fetchLocalVariables("AbCdEf1234567890", "figd_test", { baseUrl: base });
    assert.equal(seen.path, "/v1/files/AbCdEf1234567890/variables/local");
    assert.equal(seen.token, "figd_test");
    assert.equal(Object.keys(response.meta.variableCollections).length, 3);
  });

  test("explains 403 and 429 without leaking the token", async () => {
    await assert.rejects(
      fetchLocalVariables("forbidden", "figd_secret", { baseUrl: `${base}/forbidden/` }),
      (error: unknown) => {
        assert.ok(error instanceof FigmaApiError);
        assert.equal(error.status, 403);
        assert.match(error.message, /file_variables:read/);
        assert.doesNotMatch(error.message, /figd_secret/);
        return true;
      },
    );
    await assert.rejects(
      fetchLocalVariables("limited", "t", { baseUrl: `${base}/limited/` }),
      /retry after 60 seconds/,
    );
  });

  test("validates inputs before any request", async () => {
    await assert.rejects(fetchLocalVariables("../etc", "t"), /letters and digits/);
    await assert.rejects(fetchLocalVariables("abc", " "), /FIGMA_TOKEN is empty/);
  });
});
