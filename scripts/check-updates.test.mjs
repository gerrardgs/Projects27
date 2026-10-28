// Run with: node --test "scripts/*.test.mjs"   (no network: only the pure functions are tested)

import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, parsePyprojectPins, parseWorkflowPins } from "./check-updates.mjs";

const NOW = Date.parse("2026-10-22T00:00:00Z");

test("reads exact pins from pyproject dependency groups and ignores ranges", () => {
  const text =
    '[dependency-groups]\ndev = ["mypy==2.4.0", "ruff==0.17.0", "setuptools>=83.0.0", "Pip-Audit==2.10.1"]\n';
  assert.deepEqual(parsePyprojectPins(text, "a/pyproject.toml"), [
    { file: "a/pyproject.toml", spec: "pypi:mypy", current: "2.4.0" },
    { file: "a/pyproject.toml", spec: "pypi:ruff", current: "0.17.0" },
    { file: "a/pyproject.toml", spec: "pypi:pip-audit", current: "2.10.1" },
  ]);
});

test("reads known workflow pin variables, quoted or not", () => {
  const text =
    '    env:\n      GITLEAKS_VERSION: 8.30.1\n      TOOLBOX_VERSION: "1.14.0"\n      OTHER_VERSION: 9.9.9\n';
  assert.deepEqual(parseWorkflowPins(text, "ci.yml"), [
    { file: "ci.yml", spec: "github:gitleaks/gitleaks", current: "8.30.1" },
    { file: "ci.yml", spec: "github:googleapis/mcp-toolbox", current: "1.14.0" },
  ]);
  assert.deepEqual(parseWorkflowPins("jobs: {}\n", "ci.yml"), []);
});

test("classifies pins as current, in cooldown or due", () => {
  const base = { current: "1.2.0", now: NOW, cooldownDays: 7 };
  assert.equal(classify({ ...base, latest: "1.2.0", released: "2026-01-01T00:00:00Z" }).status, "current");
  assert.equal(classify({ ...base, latest: "v1.2.0", released: "2026-01-01T00:00:00Z" }).status, "current");
  assert.deepEqual(classify({ ...base, latest: "1.3.0", released: "2026-10-20T00:00:00Z" }), {
    status: "cooldown",
    note: "eligible on 2026-10-27",
  });
  assert.equal(classify({ ...base, latest: "1.3.0", released: "2026-10-01T00:00:00Z" }).status, "due");
  assert.equal(classify({ ...base, latest: "1.10.0", released: undefined }).status, "due");
  assert.equal(classify({ ...base, latest: "1.3.0", released: "2026-10-21T00:00:00Z", cooldownDays: 0 }).status, "due");
});
