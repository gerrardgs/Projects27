// Run with: node --test
import assert from "node:assert/strict";
import path from "node:path";
import { describe, test } from "node:test";
import { contextsOf, parseResolver, RESOLVER_VERSION, resolveTokens, safeTokenPath } from "./resolver.ts";

const files: Record<string, unknown> = {
  "base.json": {
    color: { $type: "color", red: { $value: { colorSpace: "srgb", components: [1, 0, 0], hex: "#ff0000" } } },
  },
  "light.json": { theme: { $type: "color", text: { $value: "{color.red}" } } },
  "dark.json": {
    theme: { $type: "color", text: { $value: { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" } } },
  },
};
const load = async (ref: string) => {
  const file = files[ref];
  if (file === undefined) throw new Error(`no file ${ref}`);
  return file;
};
const document = {
  version: RESOLVER_VERSION,
  sets: { base: { sources: [{ $ref: "base.json" }] } },
  modifiers: {
    theme: { contexts: { light: [{ $ref: "light.json" }], dark: [{ $ref: "dark.json" }] }, default: "light" },
  },
  resolutionOrder: [{ $ref: "#/sets/base" }, { $ref: "#/modifiers/theme" }],
};

describe("parseResolver", () => {
  test("accepts the spec's version and the two placeholder values of the published report", () => {
    for (const version of ["2025.10", "2025-10-01", "2025-11-01"]) assert.ok(parseResolver({ ...document, version }));
    assert.throws(() => parseResolver({ ...document, version: "1.0" }), /version must be "2025\.10"/);
  });

  test("lists contexts with the default first", () => {
    const resolver = parseResolver({
      ...document,
      modifiers: { theme: { ...document.modifiers.theme, default: "dark" } },
    });
    assert.deepEqual(contextsOf(resolver, "theme"), ["dark", "light"]);
    assert.throws(() => contextsOf(resolver, "brand"), /no modifier "brand"/);
  });

  test("rejects references to unknown sets and malformed order entries", () => {
    assert.throws(
      () => parseResolver({ ...document, resolutionOrder: [{ $ref: "#/sets/missing" }] }),
      /unknown sets "missing"/,
    );
    assert.throws(
      () => parseResolver({ ...document, resolutionOrder: [{ name: "inline", type: "set" }] }),
      /expected \{ "\$ref"/,
    );
    assert.throws(
      () => parseResolver({ ...document, modifiers: { theme: { ...document.modifiers.theme, default: "sepia" } } }),
      /default must name one of its contexts/,
    );
  });
});

describe("resolveTokens", () => {
  const resolver = parseResolver(document);

  test("applies sets, then the selected context, with later sources overriding earlier ones", async () => {
    const light = await resolveTokens(resolver, { theme: "light" }, load);
    const dark = await resolveTokens(resolver, { theme: "dark" }, load);
    assert.equal(light.get("theme.text")?.value, "{color.red}");
    assert.deepEqual(dark.get("theme.text")?.value, { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" });
    const overriding = parseResolver({
      ...document,
      sets: {
        base: { sources: [{ $ref: "base.json" }, { color: { $type: "color", red: { $value: "{color.red}" } } }] },
      },
    });
    assert.equal((await resolveTokens(overriding, {}, load)).get("color.red")?.value, "{color.red}");
  });

  test("uses the default context when the input omits the modifier, and rejects unknown contexts", async () => {
    assert.equal((await resolveTokens(resolver, {}, load)).get("theme.text")?.value, "{color.red}");
    await assert.rejects(resolveTokens(resolver, { theme: "sepia" }, load), /must be one of its contexts/);
  });
});

describe("safeTokenPath", () => {
  test("allows relative JSON files and rejects everything that could leave the token directory", () => {
    assert.equal(safeTokenPath("/tokens", "themes/dark.json", path.join), path.join("/tokens", "themes/dark.json"));
    for (const ref of [
      "../secrets.json",
      "/etc/passwd.json",
      "a/../../b.json",
      "https://evil.example/x.json",
      "base.yaml",
    ]) {
      assert.throws(() => safeTokenPath("/tokens", ref, path.join), /must be a relative \.json path/, ref);
    }
  });
});
