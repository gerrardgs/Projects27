# Deployment

How a release of Projects 23 is made and how it reaches users. There is no server: a release is a commit and tag on GitHub, and users install it with `scripts/install.sh`.

## Environments

| Environment | Purpose | URL | Deployed by |
| :--- | :--- | :--- | :--- |
| `main` branch | Latest released spec; the default `--ref` of the installer | `https://github.com/gerrardgs/Projects23` | The repository owner pushing a release commit |
| Version tags (`vX.Y.Z`) | Fixed releases that users pin with `--ref` | `https://github.com/gerrardgs/Projects23/tags` | The repository owner creating the tag |

## Pipeline

1. Changes are made on a branch or in the working tree and recorded under a new version heading in `CHANGELOG.md`.
2. Locally: the commands in [TESTING.md](TESTING.md) pass.
3. A release commit named `feat: release vX.Y.Z - <summary>`, carrying only the owner's identity and no AI attribution, is pushed to `main`; `validate.yml` (including the `authorship` job) and `codeql.yml` run on the push.
4. The commit is tagged `vX.Y.Z` and the tag is pushed.
5. Daily, `validate.yml`, `codeql.yml` and `freshness.yml` re-run on `main`, and Dependabot proposes updates as pull requests.

## Configuration and secrets

No secrets are needed to build or release. CI uses the default `GITHUB_TOKEN` with read-only permissions. The pinned tool versions and checksums are in `tools/ci/requirements.txt`, `tools/lint/package.json` and `validate.yml` ([TECHSTACKS.md](TECHSTACKS.md)).

## Database migrations

Not applicable: there is no database. The equivalent concern is compatibility for installed projects: a renamed or removed rule or skill is a breaking change and needs a major version and a migration note in `CHANGELOG.md`.

## Release and rollout

Semantic Versioning: a changed rule meaning or a removed skill is MAJOR, a new skill or rule is MINOR, a fix is PATCH ([rule 08](../../../.agents/rules/08-git-workflow.md)). Users who run the installer without `--ref` get `main` immediately; users who pin a tag move only when they choose. The installer prints the archive's SHA-256 so users can pin it with `--sha256`.

## Rollback

Releases are not rolled back by rewriting history. To undo a bad release, `git revert` the release commit on `main`, publish a new PATCH version, and tell users to install the previous or the new tag: `bash scripts/install.sh --ref vX.Y.Z` (existing files are kept unless `--force` is given). On 2026-10-23 `bash scripts/install.sh --source . --dry-run <empty dir>` listed 142 files to write and wrote nothing; a real revert has not been needed yet.

## Monitoring and alerts

A release is healthy when every job of `validate.yml` and `codeql.yml` passes on its commit. The daily scheduled runs and `freshness.yml` notify the owner by GitHub's failed-workflow notifications.

## Runbooks

- Release: the pipeline above.
- Revert a release: the rollback above.
- Update a pin Dependabot cannot change: edit the version and its checksum in `validate.yml` or the template's `pyproject.toml`, run the template's commands, and commit ([DEBUGGING.md](DEBUGGING.md), `freshness.yml` row).
