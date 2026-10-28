// Run with: node --test
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkDoc, DOC_SET, parseDoc, relativeLinks } from "./check-docs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES = path.join(HERE, "templates");
const TODAY = "2026-10-23";
const errors = (issues) => issues.filter((issue) => issue.level === "error").map((issue) => issue.message);
const specFor = (file) => DOC_SET.find((spec) => spec.file === file);

/** A template filled the way a project would fill it: metadata set, every guidance comment replaced by content. */
function fill(template) {
  return template
    .replace(/^Owner: .*$/m, "Owner: Web platform team")
    .replace(/^Last reviewed: .*$/m, `Last reviewed: ${TODAY}`)
    .replace(/^Status: .*$/m, "Status: current")
    .replace(
      /<!--\s*doc:\s*([\s\S]*?)-->/g,
      (_, guidance) => `${guidance.trim()} Checked against the source on ${TODAY}.`,
    );
}

function runCheck(dir, args = []) {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(HERE, "check-docs.mjs"), "--dir", dir, ...args], (error, stdout, stderr) =>
      resolve({ code: error ? error.code : 0, stdout, stderr }),
    );
  });
}

describe("templates and the documentation set agree", () => {
  test("there is one template per document, and nothing else", async () => {
    const files = (await readdir(TEMPLATES)).filter((file) => file.endsWith(".md")).sort();
    assert.deepEqual(files, DOC_SET.map((spec) => spec.file).sort());
    assert.equal(files.length, 27);
  });

  test("each template has exactly the required sections", async () => {
    for (const spec of DOC_SET) {
      const doc = parseDoc(await readFile(path.join(TEMPLATES, spec.file), "utf8"));
      assert.deepEqual(
        [...doc.sections.keys()],
        spec.sections.map((heading) => heading.toLowerCase()),
        spec.file,
      );
    }
  });

  test("an unfilled template fails, and a filled one passes", async () => {
    for (const spec of DOC_SET) {
      const template = await readFile(path.join(TEMPLATES, spec.file), "utf8");
      assert.ok(errors(checkDoc(template, spec, { today: TODAY })).length > 0, `${spec.file} template must fail`);
      assert.deepEqual(errors(checkDoc(fill(template), spec, { today: TODAY })), [], `${spec.file} filled must pass`);
    }
  });
});

describe("document rules", () => {
  let api = "";
  before(async () => {
    api = fill(await readFile(path.join(TEMPLATES, "API.md"), "utf8"));
  });

  test("requires every section with real content", () => {
    const withoutErrors = api.replace(/## Errors[\s\S]*?(?=## Limits)/, "");
    assert.ok(
      errors(checkDoc(withoutErrors, specFor("API.md"), { today: TODAY })).includes('missing section "## Errors"'),
    );
    const emptyLimits = api.replace(/(## Limits\n\n)[^\n]+/, "$1Ask the team.");
    assert.ok(
      errors(checkDoc(emptyLimits, specFor("API.md"), { today: TODAY })).includes(
        'section "Limits" has no real content',
      ),
    );
  });

  test("requires enough words overall", () => {
    const thin = "# API\n\nOwner: Team\nLast reviewed: 2026-10-01\nStatus: current\n";
    assert.ok(
      errors(checkDoc(thin, specFor("API.md"), { today: TODAY })).some((message) => message.startsWith("only ")),
    );
  });

  test("checks the review date", () => {
    const future = api.replace(/^Last reviewed: .*$/m, "Last reviewed: 2030-01-01");
    assert.ok(
      errors(checkDoc(future, specFor("API.md"), { today: TODAY })).some((message) => message.includes("future")),
    );
    const old = api.replace(/^Last reviewed: .*$/m, "Last reviewed: 2025-01-01");
    const issues = checkDoc(old, specFor("API.md"), { today: TODAY, maxAgeDays: 180 });
    assert.deepEqual(errors(issues), []);
    assert.ok(issues.some((issue) => issue.level === "warning" && issue.message.includes("more than 180 days")));
  });

  test("not-applicable needs a reason and nothing else", () => {
    const base = "# Database\n\nOwner: Team\nLast reviewed: 2026-10-20\nStatus: not-applicable\n";
    assert.ok(
      errors(checkDoc(base, specFor("DATABASE.md"), { today: TODAY })).some((message) => message.includes("Reason")),
    );
    const withReason = `${base}Reason: static marketing site with no database; content comes from the CMS (see API.md).\n`;
    assert.deepEqual(errors(checkDoc(withReason, specFor("DATABASE.md"), { today: TODAY })), []);
  });

  test("rejects filler, flags unfinished markers, and requires the CLAUDE.md import", async () => {
    assert.ok(
      errors(checkDoc(`${api}\nLorem ipsum dolor sit amet.`, specFor("API.md"), { today: TODAY })).includes(
        "contains lorem ipsum filler",
      ),
    );
    const todo = checkDoc(`${api}\nRate limits: TBD.`, specFor("API.md"), { today: TODAY });
    assert.ok(todo.some((issue) => issue.level === "warning"));
    const claude = fill(await readFile(path.join(TEMPLATES, "CLAUDE.md"), "utf8")).replace("@AGENTS.md", "");
    assert.ok(errors(checkDoc(claude, specFor("CLAUDE.md"), { today: TODAY })).includes("must contain @AGENTS.md"));
  });

  test("finds relative links and skips external ones", () => {
    const text = "[a](API.md) [b](./adr/0001.md#why) [c](https://example.com) [d](#top) [e](mailto:x@example.com)";
    assert.deepEqual(relativeLinks(text), ["API.md", "./adr/0001.md"]);
  });
});

describe("command line", () => {
  let dir = "";
  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "docs-kit-"));
    for (const spec of DOC_SET) {
      await writeFile(path.join(dir, spec.file), fill(await readFile(path.join(TEMPLATES, spec.file), "utf8")));
    }
  });
  after(() => rm(dir, { recursive: true, force: true }));

  test("a complete, filled set passes", async () => {
    const result = await runCheck(dir);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /27 document\(s\) checked .*: 0 error\(s\)/);
  });

  test("a broken link fails", async () => {
    const file = path.join(dir, "README.md");
    const original = await readFile(file, "utf8");
    await writeFile(file, `${original}\nSee [the old guide](OLD-GUIDE.md).\n`);
    const result = await runCheck(dir);
    await writeFile(file, original);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /README\.md: broken link OLD-GUIDE\.md/);
  });

  test("an optional document may be absent, a required one may not", async () => {
    const optional = path.join(dir, "SEO.md");
    const original = await readFile(optional, "utf8");
    await unlink(optional);
    const result = await runCheck(dir);
    await writeFile(optional, original);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /26 document\(s\) checked/);
    assert.ok(DOC_SET.filter((spec) => !spec.optional).length === 23);
  });

  test("a missing document fails, and --strict turns warnings into errors", async () => {
    const file = path.join(dir, "TESTING.md");
    const original = await readFile(file, "utf8");
    await unlink(file);
    const missing = await runCheck(dir);
    await writeFile(file, original.replace("Status: current", "Status: draft"));
    const strict = await runCheck(dir, ["--strict"]);
    const lenient = await runCheck(dir);
    await writeFile(file, original);
    assert.equal(missing.code, 1);
    assert.match(missing.stderr, /TESTING\.md: missing/);
    assert.equal(strict.code, 1);
    assert.equal(lenient.code, 0);
  });
});
