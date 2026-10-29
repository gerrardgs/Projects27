# Debugging

## Run locally

```sh
brew services run postgresql@18                       # PostgreSQL 18 on port 5433
cd apps/api && npm run migrate:dev && npm run dev      # API on http://localhost:8080 (reads .env)
cd apps/web && npm run dev                             # web on http://localhost:5173, /v1 proxied to the API
cd apps/android && flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080
cd apps/ios/Keuangan && xcodegen generate && open Keuangan.xcodeproj   # then run on a simulator
```

## Logs, metrics and traces

The API writes one JSON line per event to standard output and standard error (`level`, `message`, `requestId`, method, path); every error response carries the same request ID. No metrics or tracing system is set up yet. On iOS, `os.Logger` writes under the subsystem `id.projects27.keuangan` (view with Console.app). Capture quality and latency are available from `GET .../capture/quality`.

## Common problems

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| Web page shows "Server API tidak dapat dihubungi" or HTTP 502 | The API is not running | `cd apps/api && npm run dev` |
| "Tidak ada kalimat yang terdengar" although words appeared | Older build before the Safari fix | Reload; the latest transcript is now used even when not final |
| Bicara disabled | Browser without Web Speech API (Firefox) | Use Chrome, Edge or Safari, or type the sentence |
| Android emulator cannot reach the API | Wrong host | Use `10.0.2.2`, not `localhost` |
| iOS sign-in fails with a Keychain error in the simulator | Unsigned build | The project signs simulator builds; regenerate with `xcodegen generate` |
| iOS UI test uses the wrong API | xcodebuild passes only `TEST_RUNNER_`-prefixed variables | Set `TEST_RUNNER_UITEST_API_BASE_URL` |
| `npm run dev` restarted, but old behaviour remains | The old process still holds the port | `lsof -iTCP:8080 -sTCP:LISTEN`, stop that PID |
| Report shows a failed check | Data or code bug | Read the check's `detail`; `GET .../audit/verify` |

## Debugging tools

`psql -h localhost -p 5433 projects27_dev`; the browser's developer tools (Application tab for IndexedDB and the service worker); `flutter logs`; Xcode's debugger and Console.app; `node --inspect src/server.ts`; Playwright traces in `apps/web/test-results` after a failed test.

## Feature flags and configuration

AI capture turns on with `ANTHROPIC_API_KEY`; remove it to test the rule parser alone. The service worker runs only in production builds (`npm run build && npx vite preview`). The full list is in [CONFIGURATION.md](CONFIGURATION.md).

## Escalation

Today the owner maintains everything. A suspected data integrity problem (an unbalanced report, a broken audit chain) stops further posting until it is explained: run `GET .../audit/verify`, then follow [SECURITY.md](SECURITY.md#incident-response).
