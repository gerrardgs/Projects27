# Contributing to Projects 24

How to add or change rules, skills and templates without breaking any of the tools that load them.

## 1. Golden rules

- **Verify every fact you add.** Versions, flags, paths, package names and extension IDs must come from official documentation, a registry, `--help` output, or running the tool. Write the verification date next to time-sensitive facts.
- **Every template must run.** Code in `assets/` is executed in CI. Do not add code that you have not run.
- **Edit sources, not copies.** Edit `AGENTS.md`, `.agents/rules/` and `.agents/skills/`. Never edit `.claude/skills/` by hand.
- **Prefer primary sources.** Link standards and official documentation first (W3C, WHATWG, MDN, the vendor's docs); add blogs and courses as secondary reading. Check new links with `node scripts/check-links.mjs <file>`.
- **One writing style.** Plain, direct British English in prose (colour, behaviour, optimise, licence as a noun). Code identifiers, CSS keywords (`forced-colors`), API fields, product and plan names, quotations and titles keep their own spelling.
- **Clean code and clean execution apply to this repository too.** Code is formatted and linted by Biome (`npm run lint`, fix with `npm run format`), TypeScript templates type-check with `noUnusedLocals` and `noUnusedParameters`, and changes follow [rule 15](../../.agents/rules/15-clean-execution.md): verified step by step, generated files regenerated, nothing temporary left behind.
- **Design facts are facts.** Contrast ratios, Baseline status, platform sizes, licence terms and tool availability need a source and a date, like versions do.

## 2. Frontmatter

Frontmatter must be valid YAML. **Wrap any value that contains `: ` (colon and space) or starts with a special character (`-`, `*`, `&`, `!`, `[`, `{`, `>`, `|`, `#`, `@`, a quote, or a backtick) in double quotes.** An unquoted `description: Rules: be careful` is invalid YAML, and Antigravity silently drops a rule whose frontmatter it cannot read. The validator rejects these cases.

### Rules (`.agents/rules/NN-name.md`)

```yaml
---
trigger: model_decision
description: "When this rule applies, in one sentence."
---
```

- `trigger`: `always_on` (loaded for every task; keep these few and short), `model_decision` (loaded when relevant; `description` required), `glob` (needs `globs`), or `manual`.
- At most 12,000 characters per file (Windsurf's limit, the strictest of the supported tools).
- Add the rule to the rules index in `AGENTS.md`. If it is `always_on`, also add an `@.agents/rules/<file>` import line to `CLAUDE.md`.

### Skills (`.agents/skills/<name>/SKILL.md`)

```yaml
---
name: skill-name
description: What the skill does and when to use it, with the words a user would type.
license: MIT
metadata:
  version: "1.0.0"
---
```

- `name`: 1 to 64 characters, lowercase letters, digits and single hyphens, identical to the folder name.
- `description`: 1 to 1,024 characters; the agent decides from this text alone whether to load the skill.
- Body under 500 lines; move detail to `references/` and templates to `assets/`, linked one level deep from `SKILL.md`.
- Add the skill to the skills index `.agents/SKILLS.md` (and its category to `AGENTS.md` section 5 if it is new) and, if relevant, to the scenario router in `docs/AGENT-OPERATIONAL-MANUAL.md`.

## 3. Links

- Relative paths only; never `file://`.
- Links inside a skill are relative to that skill's folder (for example `../../rules/07-testing.md`).

## 4. Before you commit

```sh
npm ci && npm run lint                            # Biome: format, lint, import order, complexity
node --test "scripts/*.test.mjs"                  # validator self-tests
node scripts/agents-sync.mjs                      # regenerate .claude/skills and validate
node scripts/agents-sync.mjs --check --all-markdown  # what CI runs
node scripts/check-links.mjs                      # external links (needs network; also runs weekly in CI)
```

If you changed a template, also run its own commands (listed in the skill), for example `npm ci && npm run typecheck && npm test`, or `python -m pip install --group dev` then Ruff, mypy and `python -m unittest`. For the front-end templates: `npm ci && npm run lint && npm test` in `frontend-from-scratch/assets/static-site`, `npm ci && npm run typecheck && npm test && npm run check` in `design-system-and-tokens/assets/design-tokens`, and the axe check in `accessibility-audit/assets/axe-check` against the static site.

Optional cross-check with the official Agent Skills validator:

```sh
pip install skills-ref
agentskills validate .agents/skills/<name>   # version 0.1.1 installs the command as "agentskills"
```

## 5. Commits and releases

Follow [rule 08](../../.agents/rules/08-git-workflow.md): Conventional Commits, one logical change per commit, a `CHANGELOG.md` entry, and Semantic Versioning for releases. A changed rule meaning or a removed skill is a breaking change.

Dependency updates arrive daily from Dependabot; patch and minor updates merge on their own once checks pass. When the daily freshness workflow fails, update the named pin (for gitleaks, also its checksum), the CI matrix or `.github/accepted-advisories.json`, then run the checks. For each release, bump `version` in `package.json`, add the `CHANGELOG.md` entry, and write `.github/releases/v<version>.md` (first line `# v<version> - <Title>`, then the notes; see the earlier files for the format). CI fails without it. Pushing the tag `v<version>` runs the release workflow, which publishes the notes as the GitHub release; for an older tag, run the workflow by hand with that tag. Removing a skill, rule or file needs the maintainer's explicit approval ([rule 01](../../.agents/rules/01-core-principles.md) section 8).
