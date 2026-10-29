# Tech stack

## Runtimes and languages

| Runtime | Version | Where |
| :--- | :--- | :--- |
| Node.js | 24 LTS (24.22.1 locally; end of life 2028-04-30) | API, web build, scripts |
| TypeScript | 7.0 | API and web |
| PostgreSQL | 18 (18.6 locally; end of life 2030-11-14) | Database |
| Dart / Flutter | Flutter 3.47.8 | Android app |
| Swift / SwiftUI | Swift 6 with Xcode 27.1, iOS 17 minimum | iOS app |

## Frameworks and libraries

| Package | Version | Use |
| :--- | :--- | :--- |
| `pg` | 8.23.1 | PostgreSQL client |
| `@anthropic-ai/sdk` | 1.3.0 | Claude API |
| React, React DOM | 19.3.1 | Web interface |
| Vite, `@vitejs/plugin-react` | 8.3.5, 6.1.2 | Web build and dev server |
| `flutter_secure_storage` | 11.2.0 | Android Keystore token storage |
| `speech_to_text` | 7.5.0 | Android speech recognition |
| `sqflite` | 2.4.4+2 | Android device copy |
| Swift Charts, Speech, SQLite3 | System frameworks | iOS charts, speech, device copy |

The API uses the Node.js standard library for HTTP, crypto (Argon2id, AES-GCM, SHA-256), zlib (ZIP and XLSX) and testing.

## Infrastructure and services

Local today: Homebrew PostgreSQL 18.6 on port 5433. Production hosting is not chosen; the target is a container platform and managed PostgreSQL in an Indonesian region ([DEPLOYMENT.md](DEPLOYMENT.md)). External services: Claude API (optional), platform speech services.

## Tooling

| Tool | Version | Use |
| :--- | :--- | :--- |
| Biome | 2.5 | Format and lint |
| Playwright, `@axe-core/playwright` | 1.64.1, 4.14.0 | End-to-end and accessibility tests |
| XcodeGen | 2.46.0 | iOS project generation |
| `scripts/run-quiet.mjs` | — | `npm run verify` summaries |
| GitHub Actions, CodeQL, gitleaks, Dependabot | — | CI and supply chain |

## Why these choices

Node.js and TypeScript match the spec's tooling and keep one language for API and web. PostgreSQL enforces money rules in the database with constraint triggers. React and Vite were already used in Projects 26. Swift and Dart were the owner's choices for iOS and Android. Few dependencies keep the supply chain small. Details: [ARCHITECTURE.md](ARCHITECTURE.md#key-decisions).

## Upgrade policy

Dependabot checks daily, with a 7-day cooldown on version updates; security fixes are applied at once. Exact versions in manifests, lockfiles committed. Runtimes stay on supported LTS lines, checked against endoflife.date by `.github/workflows/freshness.yml`. New dependencies wait until a release is at least 14 days old unless it fixes a vulnerability.
