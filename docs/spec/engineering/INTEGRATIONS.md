# Integrations

External services that this repository's scripts and CI call. Projects 23 offers no API of its own.

## Inventory

| Provider | Purpose | Data sent | Owner | Criticality |
| :--- | :--- | :--- | :--- | :--- |
| Package registries: npm, PyPI, crates.io, Go module proxy, Maven Central, NuGet, RubyGems, Packagist, pub.dev, Hex | Latest versions, licences, release dates (`tech-lookup.mjs`, `check-updates.mjs`) | The package name in a public GET request | Repository owner | Low: a failed lookup is reported, nothing else breaks |
| endoflife.date | Release cycles and end-of-life dates (`tech-lookup.mjs eol:`) | Product name | Repository owner | Low |
| OpenSSF Scorecard API | Security score of a repository (`tech-lookup.mjs scorecard:`) | Repository path | Repository owner | Low |
| GitHub REST API | Latest releases (`tech-lookup.mjs github:`) | Repository path | Repository owner | Low |
| GitHub archive downloads and raw content | `install.sh` downloads `github.com/<repository>/archive/<ref>.tar.gz`; users fetch the installer itself from raw.githubusercontent.com | The ref | Repository owner | High for users installing |
| GitHub Actions, Dependabot, CodeQL | CI, updates, code scanning | Repository contents (GitHub-hosted) | Repository owner | High for releases |
| GitHub release downloads, Google Cloud Storage | gitleaks and MCP Toolbox binaries in CI | None beyond the request | Repository owner | Medium: those CI jobs fail closed |

## Authentication and credentials

None. All lookups and downloads are anonymous HTTPS GET requests, and the scripts read no tokens. CI jobs use the default `GITHUB_TOKEN` with `contents: read` (CodeQL adds `security-events: write`); checkouts set `persist-credentials: false`.

## Limits and costs

- GitHub's unauthenticated REST API allows 60 requests per hour per IP address (stated in `tech-lookup.mjs`); `check-updates.mjs` looks each repository up only once per run.
- `tech-lookup.mjs` gives every request a 20-second timeout.
- All services used are free for public repositories.

## Webhooks received

None.

## Failure behaviour

- A failed lookup prints an error for that item and the script exits 1; the remaining items are still reported.
- `freshness.yml` fails when a lookup fails, so an outage is visible rather than silent.
- CI downloads verify a published or pinned SHA-256; a mismatch fails the job.
- `install.sh` stops before installing anything when the download fails, the archive has no `AGENTS.md`, or the `--sha256` value does not match.

## Environments and sandboxes

Not applicable: every service is used read-only and anonymously, so tests of parsing use recorded response shapes (`scripts/tech-lookup.test.mjs`) instead of live calls.

## Contacts and status pages

- GitHub: githubstatus.com
- npm: status.npmjs.org
- PyPI: status.python.org
- Other registries: their project sites; failures are tolerated as described above.
