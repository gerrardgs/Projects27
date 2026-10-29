# Testing

## Strategy

Money rules are tested against a real PostgreSQL, not mocks. Every client is tested end to end against the real API. External services (Claude, speech) are replaced by fakes behind interfaces. Accessibility is part of every web end-to-end test. Automatic form filling is measured on a labelled corpus with pass gates ([EVALUATION.md](EVALUATION.md)).

## Test levels and locations

| Level | Location | Count (2026-10-29) |
| :--- | :--- | :--- |
| API unit, integration and contract | `apps/api/test/*.test.ts` | 60 |
| Capture evaluation gates and metric tests | `apps/api/test/capture-eval.test.ts`, `eval-metrics.test.ts` (part of the 60) | 8 |
| Web unit | `apps/web/src/lib/*.test.ts` | 6 |
| Web end to end with axe-core (desktop and mobile) | `apps/web/e2e/app.spec.ts` | 22 |
| Android widget and client | `apps/android/test` | 7 |
| Android on an emulator against the API | `apps/android/integration_test/app_test.dart` | 1 journey (sign-up, capture, offline outbox, dashboard, journal) |
| iOS client against the API | `apps/ios/KeuanganCore/Sources/keuangan-check` | Money checks, live round trip, offline round trip |
| iOS UI on the simulator against the API | `apps/ios/Keuangan/UITests` | 1 journey (voice capture, offline, sync) |
| Spec scripts and skill kits | `scripts/*.test.mjs`, `.agents/skills/**/assets/*.test.mjs` | 54 script tests plus kit tests |

## Running tests

```sh
npm run verify                                                        # spec check, Biome, script tests
cd apps/api && TEST_DATABASE_URL=postgres://localhost:5433/postgres npm test
cd apps/web && npm test && npm run e2e
cd apps/android && flutter test
cd apps/android && flutter test integration_test --dart-define=API_BASE_URL=http://10.0.2.2:<port> -d emulator-5554
cd apps/ios/KeuanganCore && swift run keuangan-check ../../../packages/contract/fixtures/personal-sample.json http://127.0.0.1:<port>
cd apps/ios/Keuangan && TEST_RUNNER_UITEST_API_BASE_URL=http://127.0.0.1:<port> xcodebuild test -project Keuangan.xcodeproj -scheme Keuangan -destination 'id=<simulator>'
```

The mobile tests need an API on `<port>` with its own database (`createdb`, `npm run migrate`, `PORT=<port> node src/server.ts`).

## Test data and environments

Each API test run creates and drops its own database. `packages/contract/fixtures/personal-sample.json` is a 14-entry ledger whose expected totals were computed independently. Every end-to-end test registers a new user with a unique email. The capture corpus (`apps/api/eval/capture-cases.json`) has 60 dev and 60 held-out test sentences.

## Quality gates

CI (`.github/workflows/validate.yml`) runs, for every push: gitleaks, the authorship check, Biome, the spec validator, the script and kit tests, the API tests on PostgreSQL 18.6 (including the capture gates), and the web typecheck, unit tests, build and end-to-end tests with axe. The Android and iOS tests run on a developer machine only; adding them to CI is open ([ARCHITECTURE.md](ARCHITECTURE.md#known-limitations-and-technical-debt)).

## Writing tests

Write the failing test first for a bug ([systematic-debugging](../.agents/skills/systematic-debugging/SKILL.md)). Name tests by behaviour. Use role-based locators and an axe scan in web tests. For anything about money, assert exact decimal strings ("35000.00"), never floats. See [07-testing](../.agents/rules/07-testing.md).

## Flaky tests

None are known. A flaky test is fixed or quarantined with an issue, never retried silently. Known timing traps already handled: lazy lists on Android and iOS need scrolling before assertions, and the soft keyboard shrinks the viewport on the emulator.
