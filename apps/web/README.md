# Projects 27 web app

React 19 and Vite 8, in Indonesian, on the core API ([apps/api](../api/README.md)). No UI or chart library: the charts are SVG with a legend, a text title and the full data table, and every amount is formatted from the API's decimal string, never from a float.

| Page | What it does |
| :--- | :--- |
| Dasbor | Income, expenses, net and savings rate for a month; 12-month trend chart; spending per category; balances at month end |
| Catat | Record an income, expense or transfer; **Bicara**: speak in Indonesian (Web Speech API, `id-ID`, stops when you pause) or type a sentence, and the form is filled for review; amounts typed the Indonesian way (`1.250.000,50`); one idempotency key per submission; saving always needs Simpan |
| Jurnal | Entries of a month; reverse an entry with a reason (posted entries are never edited) |
| Laporan | Monthly recap, income statement, balance sheet, trial balance and 12-month trend, with their self-checks; download as Excel; close the month and download frozen reports with their SHA-256 hash |
| Impor | Upload CSV or Excel (`.xlsx`); column mapping guessed from the header; preview with per-row errors and duplicates; commit; re-importing a file posts nothing twice |
| Keamanan | Turn on two-factor sign-in (authenticator app) |

## Run locally

Start the API first ([apps/api/README.md](../api/README.md)) with `WEB_ORIGINS=http://localhost:5173`, then:

```sh
cd apps/web
npm ci
npm run dev        # http://localhost:5173, /v1 is proxied to API_TARGET (default http://127.0.0.1:8080)
```

The browser only talks to the web origin, so the session cookie stays first-party and `HttpOnly`.

## Check

```sh
npm run typecheck
npm test                                  # money formatting, input parsing, dates, column guessing
npx playwright install chromium           # once
E2E_DATABASE_URL=postgres://localhost:5433/p27_e2e npm run e2e
```

The end-to-end tests start the real API on a fresh `p27_e2e` database (dropped and recreated) and the Vite dev server, then run on a desktop and a mobile (Pixel 7) profile: sign-up, keyboard capture, the dashboard figures, CSV import twice, Excel export with the same totals as the screen, a reversal, the skip link, 320-pixel reflow, and axe-core (WCAG 2.2 A and AA tags) on every page in light and dark themes.

## Voice and offline

- **Bicara** on Catat uses the browser's speech recogniser (Chrome, Edge and Safari; Chrome and Edge send audio to Google, Safari to Apple). A red dot, "Merekam" and a timer show while the microphone records. The latest transcript is used even when the browser never marks it final (Safari does this), and recognition stops after 2.5 seconds without new words.
- **Offline**: every GET answer is kept in IndexedDB (`src/lib/offline.ts`). When the API is down, pages show that copy with the time it was saved; transactions saved meanwhile wait in an outbox and are sent when the server is back (on start, every 30 seconds, on the browser's `online` event, or with "Kirim sekarang"), once each thanks to their idempotency key. Production builds register `public/sw.js`, which keeps the app shell so it opens even when the hosting is down (`npm run build && npx vite preview` to try it). Signing out clears the device copy.

## Accessibility notes

- Colours were measured: text at least 4.5:1, borders and chart marks at least 3:1 in both themes. Income and expense bars have almost the same luminance, so expense bars are also striped and described in the legend, and every chart has its data table.
- Wide tables scroll inside a labelled, focusable region (`TableWrap`), so keyboard users can scroll them; Biome's `noNoninteractiveTabindex` is turned off for that one file only, approved by the owner on 2026-10-28.
