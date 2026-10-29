# Documentation

## Structure

| Place | Holds |
| :--- | :--- |
| `README.md` (root) | What the repository is, how to install the spec |
| `CHANGELOG.md` | Every release and unreleased change |
| `docs/` | This product documentation set ([README.md](README.md)) |
| `docs/spec/`, `docs/spec/engineering/` | The agent specification's reference library from Projects 24 and Projects 23 |
| `apps/*/README.md` | How to run and check each app |
| `packages/contract/README.md` | The API contract |
| `.agents/` | Rules and skills for AI agents |

## Where things go

A new endpoint goes into the contract and [API.md](API.md); a variable into [CONFIGURATION.md](CONFIGURATION.md); a table or trigger into [SCHEMA.md](SCHEMA.md) and [DATABASE.md](DATABASE.md); a domain rule into [RULES.md](RULES.md); a decision with lasting effect into [ARCHITECTURE.md](ARCHITECTURE.md#key-decisions) (or an ADR in `docs/adr/` once one is needed); a measured result into [EVALUATION.md](EVALUATION.md); every user-visible change into `CHANGELOG.md`.

## Writing rules

Facts that the code or a command confirms; exact versions and absolute dates; planned work marked as planned; English for documentation, Indonesian for interface text. Rules: [docs/AGENTS.md](AGENTS.md).

## Keeping docs current

Documents change in the same change as the code. Checked automatically: `check-docs.mjs` (every document and section present and filled), `agents-sync.mjs --check --all-markdown` (links), and the weekly link check in CI. Not checked automatically: whether the content is right, which needs review.

## Ownership and review

The repository owner owns all documents and reviews changes to them. AI agents may draft documentation under the rules above; the owner approves it like code.

## Generated documentation

The OpenAPI contract is hand-written and checked against the running API by the contract test; there is no generated API reference site yet. `.claude/skills/` is generated from `.agents/skills/` by `node scripts/agents-sync.mjs` and is never edited by hand.
