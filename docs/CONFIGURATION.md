# Configuration

## Environment variables

Read by `apps/api/src/config.ts` at start-up; `apps/api/.env.example` lists them with placeholders.

| Variable | Required | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | — | PostgreSQL 18 connection string |
| `PORT` | No | 8080 | Port the API listens on |
| `TOTP_KEY` | Yes | — | 32 random bytes, base64; encrypts TOTP seeds at rest (`openssl rand -base64 32`) |
| `WEB_ORIGINS` | Yes for the web app | — | Comma-separated exact origins allowed to call the API with cookies |
| `COOKIE_SECURE` | No | true | Only `false` turns off the `Secure` cookie flag and HSTS, for plain-HTTP local development |
| `AUTH_ATTEMPTS_PER_MINUTE` | No | 10 | Sign-in and registration attempts per client address per minute |
| `ANTHROPIC_API_KEY` | No | — | Turns on Claude for capture; without it the rule parser fills the form |
| `CAPTURE_AI_MODEL` | No | `claude-opus-5-5` | Model for capture |

The web dev server reads `API_TARGET` (default `http://127.0.0.1:8080`) and `WEB_PORT`; neither reaches the browser bundle.

## Configuration files

| File | Holds |
| :--- | :--- |
| `apps/api/.env` | Local values (mode 600, ignored by git); `npm run dev` loads it with `node --env-file=.env` |
| `apps/web/vite.config.ts` | Dev and preview server ports and the `/v1` proxy |
| `apps/android/pubspec.yaml`, `android/app/src/main/AndroidManifest.xml` | Dependencies; microphone permission and the speech-service query |
| `apps/ios/Keuangan/project.yml` | XcodeGen project: Info.plist keys (speech and microphone usage text, local networking), `API_BASE_URL`, Keychain group |
| `biome.json`, `apps/*/tsconfig.json`, `apps/android/analysis_options.yaml` | Formatting, linting and type checking |
| `apps/api/eval/gates.json` | Pass thresholds for the capture evaluation |

## Per-environment values

| Value | Local | Production (when hosted) |
| :--- | :--- | :--- |
| `COOKIE_SECURE` | `false` | `true` (default) |
| `WEB_ORIGINS` | `http://localhost:5173` | The web app's HTTPS origin |
| `DATABASE_URL` | `postgres://localhost:5433/projects27_dev` | Managed PostgreSQL 18 in an Indonesian region |
| Client API address | `http://10.0.2.2:8080` (Android emulator), `http://127.0.0.1:8080` (iOS simulator) | The API's HTTPS address, set at build time |

## Feature flags

There is no flag system. Two behaviours depend on configuration: AI capture runs only when `ANTHROPIC_API_KEY` is set, and the service worker registers only in production builds of the web app.

## Validation

The API refuses to start with a message naming the problem when a value is missing or malformed: `loadConfig` (`apps/api/src/config.ts`, tested in `apps/api/test/config.test.ts`) checks `DATABASE_URL`, `WEB_ORIGINS` (exact origins, no paths) and the numbers, and `parseKey` (`apps/api/src/secretbox.ts`) rejects a `TOTP_KEY` that is not 32 bytes. The API never starts with partial configuration.
