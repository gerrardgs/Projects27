# Contributing to Projects 23

How to add or change rules, skills and templates without breaking any of the tools that load them.

## 1. Golden rules

- **Write instructions that work.** Following the [OpenSSF guide for AI code assistant instructions](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions): keep each instruction concise, specific and actionable; include only what applies (irrelevant rules make agents produce extraneous or wrong code); state requirements and standards explicitly instead of persona framing such as "act as a security expert", which the guide does not recommend because some experiments found it makes results worse.

- **Write for the agent that reads it** (from Matt Pocock's [writing-for-agents skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents), MIT):
  - A skill's `description` and every index line are triggers: front-load the key word, name each distinct case that should load the material once, and cut words the body already says. A must-have file behind a weak trigger is a reliability bug; sharpen the wording before inlining the content.
  - Everything always loaded costs context on every turn. Keep `AGENTS.md` and always-on rules to what every task needs; push detail that only some cases need into `references/` behind a clear pointer, and keep each topic's definition, rules and caveats together.
  - End each step on a checkable completion condition ("every changed function has a test"), not a vague one ("understand the code").
  - State the behaviour you want; when a prohibition is a hard guardrail, pair it with the positive target.
  - One meaning, one place. Do not restate what the environment already answers (`package.json` scripts, `--help`); record the unwritten conventions and reasons instead. Delete sentences that do not change an agent's behaviour, and remove stale lines.
  - When an agent keeps making a mechanical mistake (a banned API, an import shape, a file-location rule), add an automated check (lint rule, hook, CI job) rather than another instruction.
- **Verify every fact you add.** Versions, flags, paths, package names and extension IDs must come from official documentation, a registry, `--help` output, or running the tool. `node scripts/tech-lookup.mjs <ecosystem>:<name>` checks package names, latest stable versions, licences and end-of-life dates in one step. Write the verification date next to time-sensitive facts.
- **Every template must run.** Code in `assets/` is executed in CI. Do not add code that you have not run.
- **Edit sources, not copies.** Edit `AGENTS.md`, `.agents/rules/` and `.agents/skills/`. Never edit `.claude/skills/` by hand.

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
- Add the skill to the skills index in `AGENTS.md` and, if relevant, to the scenario router in `docs/AGENT-OPERATIONAL-MANUAL.md`.

## 3. Links

- Relative paths only; never `file://`.
- Links inside a skill are relative to that skill's folder (for example `../../rules/07-testing.md`).

## 4. Before you commit

```sh
node --test "scripts/*.test.mjs"                  # validator and lookup self-tests
node scripts/agents-sync.mjs                      # regenerate .claude/skills and validate
node scripts/agents-sync.mjs --check --all-markdown  # what CI runs
```

If you changed a template, also run its own commands (listed in the skill), for example `npm ci && npm run typecheck && npm test`, or `python -m pip install --group dev` then Ruff, mypy and `python -m unittest`.

Optional cross-check with the official Agent Skills validator:

```sh
pip install skills-ref
agentskills validate .agents/skills/<name>   # version 0.1.1 installs the command as "agentskills"
```

## 5. Commits and releases

Follow [rule 08](../../../.agents/rules/08-git-workflow.md): Conventional Commits, one logical change per commit, a `CHANGELOG.md` entry, and Semantic Versioning for releases. A changed rule meaning or a removed skill is a breaking change.
