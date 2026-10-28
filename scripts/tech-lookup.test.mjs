// Run with: node --test "scripts/*.test.mjs"   (no network: parsers are tested on recorded shapes)

import assert from "node:assert/strict";
import { test } from "node:test";
import { compareVersions, escapeGoModule, isStableVersion, latestStable, parsers, requestFor } from "./tech-lookup.mjs";

test("recognizes stable and pre-release versions across ecosystems", () => {
  for (const version of ["1.2.3", "v1.12.0", "2024.1", "5.3.39.RELEASE", "6.6.1.Final"]) {
    assert.equal(isStableVersion(version), true, version);
  }
  for (const version of [
    "4.2.0-M2",
    "1.0.0-rc.1",
    "3.0.0-SNAPSHOT",
    "2.0b3",
    "1.0a1",
    "6.0.0.Beta1",
    "14.0.1-beta2",
    "1.0.0.CR1",
  ]) {
    assert.equal(isStableVersion(version), false, version);
  }
});

test("compares versions numerically, not alphabetically", () => {
  assert.equal(compareVersions("1.10.0", "1.9.9"), 1);
  assert.equal(compareVersions("v2.0.0", "2.0.0"), 0);
  assert.equal(compareVersions("3.5", "3.5.1"), -1);
  assert.equal(latestStable(["3.4.10", "4.2.0-M2", "3.5.6", "3.10.0", "4.0.0-RC1"]), "3.10.0");
});

test("escapes upper-case letters in Go module paths", () => {
  assert.equal(escapeGoModule("github.com/Azure/azure-sdk-for-go"), "github.com/!azure/azure-sdk-for-go");
});

test("builds request URLs and rejects malformed names", () => {
  assert.equal(requestFor("npm", "@types/node").url, "https://registry.npmjs.org/@types%2Fnode/latest");
  assert.equal(
    requestFor("maven", "org.springframework.boot:spring-boot").url,
    "https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/maven-metadata.xml",
  );
  assert.equal(
    requestFor("nuget", "Newtonsoft.Json").url,
    "https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json",
  );
  assert.throws(() => requestFor("maven", "spring-boot"), /group:artifact/);
  assert.throws(() => requestFor("packagist", "laravel"), /vendor\/package/);
  assert.throws(() => requestFor("cobol", "x"), /unknown ecosystem/);
  assert.equal(requestFor("github", "grafana/k6").url, "https://api.github.com/repos/grafana/k6/releases/latest");
  assert.throws(() => requestFor("github", "k6"), /owner\/repository/);
});

test("parses npm, including deprecation warnings", () => {
  const record = parsers.npm({
    version: "2.88.2",
    license: "Apache-2.0",
    repository: { url: "git+https://github.com/request/request.git" },
    deprecated: "request has been deprecated",
  });
  assert.deepEqual(record, {
    version: "2.88.2",
    license: "Apache-2.0",
    repository: "https://github.com/request/request",
    warning: "deprecated: request has been deprecated",
  });
});

test("parses PyPI", () => {
  const record = parsers.pypi({
    info: {
      version: "6.1.2",
      license_expression: "BSD-3-Clause",
      project_urls: { Source: "https://github.com/django/django" },
      requires_python: ">=3.12",
      yanked: false,
    },
    urls: [{ upload_time_iso_8601: "2026-10-06T12:53:17Z" }],
  });
  assert.equal(record.version, "6.1.2");
  assert.equal(record.requires, "Python >=3.12");
  assert.equal(record.warning, undefined);
});

test("parses Maven metadata XML by choosing the highest stable version", () => {
  const xml =
    "<metadata><versioning><release>4.2.0-M2</release><versions><version>3.5.6</version><version>4.1.1</version><version>4.2.0-M2</version></versions></versioning></metadata>";
  assert.deepEqual(parsers.maven(xml), { version: "4.1.1" });
});

test("parses endoflife.date maintained cycles", () => {
  const body = {
    result: {
      releases: [
        {
          name: "26",
          isEol: false,
          isMaintained: true,
          isLts: false,
          eolFrom: "2029-04-30",
          latest: { name: "26.12.0" },
        },
        {
          name: "24",
          isEol: false,
          isMaintained: true,
          isLts: true,
          eolFrom: "2028-04-30",
          latest: { name: "24.21.0" },
        },
        {
          name: "25",
          isEol: true,
          isMaintained: false,
          isLts: false,
          eolFrom: "2026-06-01",
          latest: { name: "25.9.0" },
        },
        {
          name: "20",
          isEol: true,
          isMaintained: true,
          isLts: true,
          eolFrom: "2026-04-30",
          latest: { name: "20.20.2" },
        },
      ],
    },
  };
  const record = parsers.eol(body);
  assert.equal(record.version, "26.12.0");
  assert.deepEqual(
    record.cycles.map((cycle) => cycle.cycle),
    ["26", "24"],
  );
  assert.match(record.warning, /extended .* support only: 20$/);
});

test("parses Packagist, crates.io and Hex", () => {
  assert.equal(
    parsers.packagist(
      {
        packages: {
          "laravel/framework": [
            { version: "v13.36.0", license: ["MIT"], source: { url: "https://github.com/laravel/framework.git" } },
          ],
        },
      },
      "laravel/framework",
    ).repository,
    "https://github.com/laravel/framework",
  );
  assert.equal(
    parsers.crates({
      crate: { max_stable_version: "0.8.9", repository: "https://github.com/tokio-rs/axum" },
      versions: [{ num: "0.8.9", license: "MIT", yanked: false }],
    }).license,
    "MIT",
  );
  assert.equal(
    parsers.hex({ latest_stable_version: "1.8.15", meta: { licenses: ["MIT"], links: {} }, retirements: {} }).warning,
    undefined,
  );
});

test("parses a GitHub release", () => {
  const record = parsers.github({
    tag_name: "v1.4.0",
    published_at: "2026-10-01T00:00:00Z",
    html_url: "https://github.com/grafana/k6/releases/tag/v1.4.0",
    prerelease: false,
  });
  assert.deepEqual(record, {
    version: "v1.4.0",
    released: "2026-10-01T00:00:00Z",
    repository: "https://github.com/grafana/k6",
    warning: undefined,
  });
});
