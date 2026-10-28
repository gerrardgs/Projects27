// Run with: node --test

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { documentProblems, hasContent, isMarkedNotApplicable, sections } from "./check-docs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECKER = path.join(HERE, "check-docs.mjs");
const TEMPLATES = path.join(HERE, "docs");
const TEMPLATE = "# T\n\n## Goals\n\n<!-- guidance -->\n\n{{goal}}\n\n## Risks\n\n{{risk}}\n";

test("splits level-2 sections and ignores comments when judging content", () => {
  const parsed = sections("# Title\n\nintro\n\n## A\n\ntext\n\n## B\n\n<!-- only a comment -->\n");
  assert.deepEqual([...parsed.keys()], ["A", "B"]);
  assert.equal(hasContent(parsed.get("A")), true);
  assert.equal(hasContent(parsed.get("B")), false);
});

test("reports missing, empty and unfilled sections", () => {
  assert.deepEqual(
    documentProblems(TEMPLATE, "# T\n\n## Goals\n\nShip the export by June.\n\n## Risks\n\nVendor delay.\n"),
    [],
  );
  assert.deepEqual(documentProblems(TEMPLATE, "# T\n\n## Goals\n\nShip it.\n"), ['missing section "Risks"']);
  assert.deepEqual(documentProblems(TEMPLATE, "# T\n\n## Goals\n\n<!-- todo -->\n\n## Risks\n\nNone known.\n"), [
    'empty section "Goals"',
  ]);
  assert.deepEqual(documentProblems(TEMPLATE, "# T\n\n## Goals\n\n{{goal}}\n\n## Risks\n\nNone.\n"), [
    "unfilled placeholder {{goal}}",
  ]);
});

test("accepts a document listed as not applicable, with its reason, on one line", () => {
  const readme = "## Not applicable\n\n- DATABASE.md: not applicable, the service stores no data\n";
  assert.equal(isMarkedNotApplicable(readme, "DATABASE.md"), true);
  assert.equal(isMarkedNotApplicable(readme, "SCHEMA.md"), false);
});

test("every template passes against itself once its placeholders are filled", () => {
  for (const name of readdirSync(TEMPLATES)) {
    const template = readFileSync(path.join(TEMPLATES, name), "utf8");
    const filled = template.replace(/\{\{[^}]*\}\}/g, "filled");
    assert.deepEqual(documentProblems(template, filled), [], name);
    assert.ok(documentProblems(template, template).length > 0, `${name} should fail while unfilled`);
  }
});

test("the CLI fails on an incomplete docs folder and passes on a complete one", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "check-docs-"));
  try {
    assert.throws(
      () => execFileSync("node", [CHECKER, directory], { stdio: "pipe" }),
      (error) => error.status === 1,
    );
    for (const name of readdirSync(TEMPLATES)) {
      const filled = readFileSync(path.join(TEMPLATES, name), "utf8").replace(/\{\{[^}]*\}\}/g, "filled");
      writeFileSync(path.join(directory, name.replace(".template.md", ".md")), filled);
    }
    rmSync(path.join(directory, "DATABASE.md"));
    const readme = readFileSync(path.join(directory, "README.md"), "utf8");
    writeFileSync(path.join(directory, "README.md"), `${readme}\n- DATABASE.md: not applicable, no data store\n`);
    const output = execFileSync("node", [CHECKER, directory]).toString();
    assert.match(output, new RegExp(`${readdirSync(TEMPLATES).length} standard document\\(s\\) checked`));
    assert.match(output, /0 problem\(s\)/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
