#!/usr/bin/env node
// Checks that a project's docs/ folder is complete: every standard document exists (or is listed as
// not applicable in docs/README.md), keeps every section of its template, has real content in each
// section, and has no {{placeholder}} left. It cannot judge whether the content is right; reviews do.
//
// Usage (Node.js 22+, no dependencies):
//   node check-docs.mjs [docs-dir]          (default: docs)
// Exit code 0 when complete, 1 when something is missing or unfilled, 2 on usage errors.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), "docs");
const TEMPLATE_SUFFIX = ".template.md";
const PLACEHOLDER = /\{\{[^}]*\}\}/;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/** Splits Markdown into its level-2 sections: heading text mapped to the body below it. Pure. */
export function sections(markdown) {
  const result = new Map();
  let current;
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^## (.+?)\s*$/);
    if (heading) {
      current = heading[1];
      result.set(current, "");
    } else if (current !== undefined) {
      result.set(current, `${result.get(current)}${line}\n`);
    }
  }
  return result;
}

/** True when a section body has text beyond HTML comments and whitespace. Pure. */
export function hasContent(body) {
  return body.replace(HTML_COMMENT, "").trim().length > 0;
}

/** Problems in one document compared with its template. Pure. */
export function documentProblems(templateText, documentText) {
  const problems = [];
  const actual = sections(documentText);
  for (const heading of sections(templateText).keys()) {
    if (!actual.has(heading)) problems.push(`missing section "${heading}"`);
    else if (!hasContent(actual.get(heading))) problems.push(`empty section "${heading}"`);
  }
  const placeholder = documentText.replace(HTML_COMMENT, "").match(PLACEHOLDER);
  if (placeholder) problems.push(`unfilled placeholder ${placeholder[0]}`);
  return problems;
}

/** True when docs/README.md lists the document as not applicable on one line. Pure. */
export function isMarkedNotApplicable(readmeText, documentName) {
  return readmeText.split("\n").some((line) => line.includes(documentName) && /not applicable/i.test(line));
}

async function readIfPresent(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function checkDocs(docsDirectory) {
  const templates = (await readdir(TEMPLATE_DIRECTORY)).filter((name) => name.endsWith(TEMPLATE_SUFFIX)).sort();
  const readme = (await readIfPresent(path.join(docsDirectory, "README.md"))) ?? "";
  const report = [];
  for (const template of templates) {
    const name = template.slice(0, -TEMPLATE_SUFFIX.length) + ".md";
    const document = await readIfPresent(path.join(docsDirectory, name));
    if (document === undefined) {
      if (!isMarkedNotApplicable(readme, name))
        report.push(`${name}: missing, and not listed as not applicable in README.md`);
      continue;
    }
    const templateText = await readFile(path.join(TEMPLATE_DIRECTORY, template), "utf8");
    for (const problem of documentProblems(templateText, document)) report.push(`${name}: ${problem}`);
  }
  return { checked: templates.length, report };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || args[0]?.startsWith("-")) {
    console.error("usage: node check-docs.mjs [docs-dir]");
    process.exitCode = 2;
    return;
  }
  const docsDirectory = path.resolve(args[0] ?? "docs");
  const { checked, report } = await checkDocs(docsDirectory);
  for (const line of report) console.log(line);
  console.log(`${checked} standard document(s) checked in ${docsDirectory}, ${report.length} problem(s)`);
  process.exitCode = report.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`check-docs: ${error.message}`);
    process.exitCode = 2;
  }
}
