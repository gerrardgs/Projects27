// Run with: node --test

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { build } from "./build.ts";
import {
  colorToHex,
  contrastRatio,
  cssVariableName,
  flattenTokens,
  mergeTokenSets,
  relativeLuminance,
  resolveToken,
  toCssValue,
} from "./tokens.ts";

const srgb = (hex: string) => ({ colorSpace: "srgb", components: [0, 0, 0], hex });

describe("WCAG contrast math", () => {
  test("black on white is 21:1 and identical colors are 1:1", () => {
    assert.equal(contrastRatio("#000000", "#ffffff"), 21);
    assert.equal(contrastRatio("#777777", "#777777"), 1);
  });

  test("order of foreground and background does not matter", () => {
    assert.equal(contrastRatio("#2457d6", "#ffffff"), contrastRatio("#ffffff", "#2457d6"));
  });

  test("matches the published value for #767676 on white (4.54:1, the lightest AA gray)", () => {
    assert.equal(contrastRatio("#767676", "#ffffff").toFixed(2), "4.54");
  });

  test("luminance of white is 1 and of black is 0", () => {
    assert.equal(relativeLuminance("#ffffff"), 1);
    assert.equal(relativeLuminance("#000000"), 0);
  });

  test("rejects malformed hex", () => {
    assert.throws(() => relativeLuminance("#fff"), /invalid hex/);
  });
});

describe("token parsing", () => {
  test("inherits $type from the group and keeps descriptions", () => {
    const tokens = flattenTokens({
      space: { $type: "dimension", small: { $value: { value: 4, unit: "px" }, $description: "gap" } },
    });
    assert.deepEqual(tokens, [
      { path: "space.small", type: "dimension", value: { value: 4, unit: "px" }, description: "gap" },
    ]);
  });

  test("rejects tokens without a known type", () => {
    assert.throws(() => flattenTokens({ shadow: { $value: "0 1px red" } }), /unsupported or missing \$type/);
  });

  test("rejects names containing reserved characters", () => {
    assert.throws(() => flattenTokens({ "a.b": { $type: "number", $value: 1 } }), /cannot contain/);
  });

  test("rejects the same path defined in two sets", () => {
    const set = flattenTokens({ n: { $type: "number", $value: 1 } });
    assert.throws(() => mergeTokenSets(set, set), /defined twice/);
  });
});

describe("alias resolution", () => {
  const tokens = mergeTokenSets(
    flattenTokens({
      color: {
        $type: "color",
        blue: { $value: srgb("#2457d6") },
        brand: { $value: "{color.blue}" },
        link: { $value: "{color.brand}" },
      },
      size: { $type: "dimension", base: { $value: { value: 1, unit: "rem" } } },
      loop: { $type: "number", a: { $value: "{loop.b}" }, b: { $value: "{loop.a}" } },
      wrong: { $type: "color", type: { $value: "{size.base}" }, missing: { $value: "{color.nope}" } },
    }),
  );

  test("follows chains of aliases and keeps the requested path", () => {
    const resolved = resolveToken(tokens, "color.link");
    assert.equal(resolved.path, "color.link");
    assert.equal(colorToHex(resolved.value), "#2457d6");
  });

  test("detects cycles", () => {
    assert.throws(() => resolveToken(tokens, "loop.a"), /alias cycle: loop\.a -> loop\.b -> loop\.a/);
  });

  test("rejects aliases that change type or point nowhere", () => {
    assert.throws(() => resolveToken(tokens, "wrong.type"), /changes type color -> dimension/);
    assert.throws(() => resolveToken(tokens, "wrong.missing"), /unknown token "color\.nope"/);
  });
});

describe("CSS conversion", () => {
  const token = (type: Parameters<typeof toCssValue>[0]["type"], value: unknown) =>
    toCssValue({ path: "t", type, value });

  test("converts each supported type", () => {
    assert.equal(token("color", { colorSpace: "srgb", components: [1, 0.5, 0] }), "#ff8000");
    assert.equal(token("dimension", { value: 1.5, unit: "rem" }), "1.5rem");
    assert.equal(token("dimension", { value: 0, unit: "px" }), "0");
    assert.equal(token("duration", { value: 200, unit: "ms" }), "200ms");
    assert.equal(token("number", 1.5), "1.5");
    assert.equal(
      token("fontFamily", ["Inter Variable", "system-ui", "sans-serif"]),
      '"Inter Variable", system-ui, sans-serif',
    );
    assert.equal(token("fontWeight", "semi-bold"), "600");
    assert.equal(token("cubicBezier", [0.2, 0, 0, 1]), "cubic-bezier(0.2, 0, 0, 1)");
  });

  test("rejects invalid values instead of emitting broken CSS", () => {
    assert.throws(() => token("dimension", { value: 1, unit: "em" }), /unit must be one of px, rem/);
    assert.throws(() => token("color", { colorSpace: "display-p3", components: [1, 0, 0] }), /only the "srgb"/);
    assert.throws(() => token("cubicBezier", [2, 0, 0, 1]), /x coordinates/);
    assert.throws(() => token("fontWeight", "chunky"), /invalid font weight/);
  });

  test("names variables from the token path", () => {
    assert.equal(cssVariableName("theme.text.on-action"), "--theme-text-on-action");
  });
});

describe("the shipped token set", () => {
  test("every contrast pair passes in both themes", async () => {
    const { contrast } = await build();
    for (const [theme, results] of contrast) {
      for (const result of results) {
        assert.ok(
          result.passes,
          `${theme}: ${result.foreground} on ${result.background} is ${result.ratio.toFixed(2)}:1`,
        );
      }
    }
  });

  test("emits light defaults, an OS dark mode and a forced dark theme", async () => {
    const { css } = await build();
    assert.match(css, /--theme-surface-default: #ffffff;/);
    assert.match(css, /@media \(prefers-color-scheme: dark\)/);
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /--motion-easing-standard: cubic-bezier\(0\.2, 0, 0, 1\);/);
  });
});
