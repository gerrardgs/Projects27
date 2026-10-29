# Code style

## Enforced by tools

| Code | Tool | Command |
| :--- | :--- | :--- |
| TypeScript, JavaScript, CSS (API, web, scripts, skill assets) | Biome 2.5 (`biome.json`: 2 spaces, 120 columns, double quotes, trailing commas, cognitive complexity at most 15) | `npm run lint` at the root (`biome ci`) |
| TypeScript types | TypeScript 7, `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | `npx tsc --noEmit` in `apps/api` and `apps/web` |
| Dart | `flutter_lints` 6 (`analysis_options.yaml`), `dart format` | `flutter analyze`, `dart format lib test` |
| Swift | Swift 6 language mode with strict concurrency; the compiler's warnings | `swift build` in `apps/ios/KeuanganCore`, `xcodebuild` |
| Agent spec (Markdown, frontmatter, links, mirror) | `scripts/agents-sync.mjs` | `npm run check` |

`npm run verify` runs the spec check, Biome and the script tests with one line per step.

## Naming

Domain names in English in code (`journalEntry`, `fundingAccountId`, `postTransaction`); interface text in Indonesian ("Simpan", "Catat transaksi"). Money values are named for what they hold: `amount` (decimal string at the API boundary), `debitMinor` (integer minor units inside the ledger). Account codes stay as strings (`"5100"`). Test names are sentences that state the behaviour.

## Project structure

```text
apps/api        Node.js API: src/ (one module per concern), migrations/, test/, eval/
apps/web        React app: src/pages, src/components, src/lib, e2e/
apps/android    Flutter app: lib/screens, lib/src (API client, models, storage), lib/widgets, test/, integration_test/
apps/ios        KeuanganCore Swift package (client, models, storage) and the Keuangan SwiftUI app (XcodeGen)
packages/contract  OpenAPI contract and the shared sample ledger
docs/           This documentation set; docs/spec holds the agent specification
```

Business rules are pure functions (`capture-rules.ts`, `money.ts`, report builders); I/O stays at the edges (`routes.ts`, `db.ts`, the clients' API classes).

## Error handling and logging

- Validate input at the boundary and answer with an RFC 9457 problem naming the field ([API.md](API.md#errors)).
- Never catch and ignore: a failure either becomes a problem response, a fallback that the user is told about (for example "Layanan AI tidak tersedia; formulir diisi dengan aturan bawaan."), or a visible error in the client.
- Logs are one JSON object per line with `level`, `message` and a request ID; no request bodies, tokens, passwords or spoken sentences.

## Comments and documentation

Comments explain why (a constraint, a browser quirk, a regulation), not what the code does; for example the comment on why Safari's interim transcript is used. Public functions get a one-line doc comment. Interface text, error messages and documentation follow [14-ux-writing-and-ethics](../.agents/rules/14-ux-writing-and-ethics.md).

## Testing conventions

Tests sit next to their app (`apps/api/test`, `apps/web/e2e`, `apps/android/test`) and run against a real PostgreSQL, not mocks of the database. External services are replaced by small fakes behind an interface (`Extractor` for Claude, `VoiceInput` and fake recognisers for speech, a transport function for HTTP). See [TESTING.md](TESTING.md).

## Commits and pull requests

Conventional commit messages (`feat:`, `fix:`, `docs:`), one logical change each, and only the repository owner's identity: no AI co-author or "Generated with" lines ([08-git-workflow](../.agents/rules/08-git-workflow.md); checked by `scripts/check-authorship.mjs` in CI). Pull requests list what changed, what was verified, and what was not.
