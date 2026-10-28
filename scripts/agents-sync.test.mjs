// Run with: node --test "scripts/*.test.mjs"

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFrontmatter, ruleFrontmatterProblems, skillFrontmatterProblems } from "./agents-sync.mjs";

test("parses scalars, quoted values and folded block scalars", () => {
  const { data, body } = parseFrontmatter(
    [
      "---",
      "name: my-skill",
      'title: "Quoted: value"',
      "description: >-",
      "  first line",
      "  second line",
      "---",
      "# Body",
    ].join("\n"),
  );
  assert.deepEqual(data, { name: "my-skill", title: "Quoted: value", description: "first line second line" });
  assert.equal(body, "# Body");
});

test("parses nested string maps and lists", () => {
  const { data } = parseFrontmatter(
    [
      "---",
      "metadata:",
      '  version: "2.0.0"',
      "  author: team",
      "paths:",
      '  - "src/**/*.ts"',
      "  - lib/*.ts",
      "globs: [a.ts, b.ts]",
      "---",
      "",
    ].join("\n"),
  );
  assert.deepEqual(data, {
    metadata: { version: "2.0.0", author: "team" },
    paths: ["src/**/*.ts", "lib/*.ts"],
    globs: ["a.ts", "b.ts"],
  });
});

test("returns null data when there is no frontmatter", () => {
  assert.deepEqual(parseFrontmatter("# Just markdown\n"), { data: null, body: "# Just markdown\n" });
});

test("rejects lines it cannot parse instead of guessing", () => {
  assert.throws(() => parseFrontmatter("---\nnot a key value line\n---\n"), /unsupported frontmatter line 1/);
});

test("rejects an unquoted value containing ': ' (invalid YAML)", () => {
  assert.throws(
    () => parseFrontmatter("---\ndescription: Core principles: scope and simplicity\n---\n"),
    /unquoted value contains ": "/,
  );
});

test("accepts the same value when double-quoted, and decodes escapes", () => {
  const { data } = parseFrontmatter('---\ndescription: "Core principles: \\"scope\\" and simplicity"\n---\n');
  assert.equal(data.description, 'Core principles: "scope" and simplicity');
});

test("decodes doubled quotes in single-quoted values", () => {
  const { data } = parseFrontmatter("---\nnote: 'it''s fine: really'\n---\n");
  assert.equal(data.note, "it's fine: really");
});

test("rejects plain values starting with a YAML indicator", () => {
  assert.throws(() => parseFrontmatter("---\nglobs: *.ts\n---\n"), /cannot start with "\*"/);
});

test("rejects duplicate keys", () => {
  assert.throws(() => parseFrontmatter("---\nname: a\nname: b\n---\n"), /duplicate key "name"/);
});

test("skill frontmatter: accepts a valid skill and reports each invalid field", () => {
  assert.deepEqual(skillFrontmatterProblems({ name: "ok-skill", description: "Does a thing." }, "ok-skill"), []);
  assert.deepEqual(skillFrontmatterProblems({ name: "Bad_Name", description: "" }, "bad-name"), [
    "name may contain only lowercase letters, digits and single hyphens, not at the start or end",
    "description is required",
  ]);
  assert.match(skillFrontmatterProblems({ name: "a", description: "d" }, "b")[0], /must match its directory name "b"/);
  assert.match(skillFrontmatterProblems({ name: "a", description: "x".repeat(1025) }, "a")[0], /maximum is 1024/);
  assert.match(
    skillFrontmatterProblems({ name: "claude-design", description: "d" }, "claude-design")[0],
    /reserved word "claude"/,
  );
});

test("rule frontmatter: requires a known trigger and what each trigger needs", () => {
  assert.deepEqual(ruleFrontmatterProblems({ trigger: "always_on" }), []);
  assert.match(ruleFrontmatterProblems(null)[0], /needs frontmatter "trigger/);
  assert.match(ruleFrontmatterProblems({ trigger: "sometimes" })[0], /needs frontmatter "trigger/);
  assert.deepEqual(ruleFrontmatterProblems({ trigger: "model_decision" }), ["model_decision rules need a description"]);
  assert.deepEqual(ruleFrontmatterProblems({ trigger: "glob" }), ["glob rules need globs"]);
});
