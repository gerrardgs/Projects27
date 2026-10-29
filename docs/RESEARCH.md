# Research: facts behind the finance reporting system

Checked on 2026-10-28. Each statement links its source. "Primary" means the issuing body (regulator, standard setter, project maintainer); "secondary" means news, vendor or academic summaries, which must be confirmed against the primary text before code depends on them.

## 1. Regulation and accounting standards (Indonesia)

| Finding | Source | Type | Consequence for the product |
| :--- | :--- | :--- | :--- |
| VAT under PMK 131/2024, in force 2025-01-01: 12 percent rate; non-luxury goods and services use DPP nilai lain of 11/12 of the price (effective 11 percent); DJP example: price Rp12,000,000, DPP Rp11,000,000, PPN Rp1,320,000 | [JDIH Kemenkeu](https://jdih.kemenkeu.go.id/dok/pmk-131-tahun-2024/view), [DJP technical guidance](https://www.pajak.go.id/sites/default/files/lampiran/Petunjuk%20Teknis%20Pembuatan%20Faktur%20Pajak%20dan%20Dokumen%20Tertentu%20yang%20Kedudukannya%20Dipersamakan%20dengan%20Faktur%20Pajak%20serta%20Penerapan%20PMK%20131%20Tahun%202024.pdf) | Primary | Tax codes carry a base rule and effective dates; the worked example becomes a golden test |
| Books, records and source documents are kept 10 years in Indonesia (UU KUP article 28 paragraph 11) | [pajak.go.id](https://www.pajak.go.id/id/berita/lakukan-visit-kp2kp-enrekang-imbau-simpan-pembukuan-minimal-10-tahun), [DDTC News](https://news.ddtc.co.id/berita/nasional/1805429/alasan-dokumen-dasar-pembukuan-wajib-disimpan-selama-10-tahun) | Primary (DJP) and secondary | Retention policy, storage in an Indonesian region, no purge inside the period |
| PSAK numbering changed on 2024-01-01 (PSAK 1 is now PSAK 201) | [IAI publication](https://web.iaiglobal.or.id/assets/files/file_publikasi/Perubahan_Penomoran_PSAK_ISAK_dalam_SAK_Indonesia.pdf) | Primary | Report templates and documentation use the new numbers |
| PSAK 118 (refers to IFRS 18) approved 2025-05-28, effective 2027-01-01, replaces PSAK 201 | [DSAK Terkini vol. 7, 2025](https://web.iaiglobal.or.id/assets/files/file_sak/DSAK%20Terkini%20Volume%207%202025.pdf) | Primary | Profit or loss layouts for 2027 periods need the new subtotals; framework version is per period |
| SAK EP replaces SAK ETAP from 2025-01-01 | [DDTC News](https://news.ddtc.co.id/literasi/kamus/1803456/apa-itu-standar-akuntansi-keuangan-entitas-privat-sak-ep) | Secondary | Framework choice per entity includes SAK EP |
| UU 27/2022 (personal data protection): compliance deadline 2024-10-17; administrative fine up to 2 percent of annual revenue (article 57 paragraph 3) | [pasal.id](https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-57), [Perpustakaan DPR](https://perpustakaan.dpr.go.id/epaper/index/detail/id/18250) | Secondary (law text mirror) | Data inventory, minimisation in AI calls, breach runbook |
| Tax invoices through Coretax or a PJAP connected by API (PER-11/PJ/2025) | [Online-Pajak](https://www.online-pajak.com/tentang-efaktur-ppn/aplikasi-ppn/) | Secondary, vendor | Build an export adapter; confirm channels and formats in the DJP regulation before stage 5 |

## 2. AI

| Finding | Source | Type | Consequence |
| :--- | :--- | :--- | :--- |
| Current Claude models include `claude-opus-5-5` ($4 / $20 per million input / output tokens), `claude-sonnet-5-5` ($2 / $10) and `claude-haiku-5-5` ($0.10 / $0.50 up to 100K-token prompts); all have a 1M-token context | Anthropic model table in the Claude API documentation, cached 2026-10-06 | Primary | Default `claude-opus-5-5`; the model is configuration; cheaper models only after an evaluation and the owner's decision |
| Structured outputs (`output_config.format`, strict tools), prompt caching, Message Batches and refusal fallbacks are available on the Messages API | Claude API documentation | Primary | Extraction with schemas, cached prefixes, batched month-end narratives |
| On Opus 5.5, thinking cannot be disabled (effort controls depth, default `medium`) and forced `tool_choice` returns an error | Claude API documentation | Primary | Use `auto` tool choice with instructions, or structured outputs |

## 3. Speech recognition

| Finding | Source | Type | Consequence |
| :--- | :--- | :--- | :--- |
| Whisper code and model weights are MIT-licensed; `turbo` has 809 M parameters, about 6 GB VRAM, about 8 times the speed of `large` (OpenAI's English measurement), and is not trained for translation | [openai/whisper](https://github.com/openai/whisper) | Primary | Self-hosted speech service is legally and technically viable |
| `whisper.cpp` latest release v1.9.5 | [whisper.cpp releases](https://github.com/ggml-org/whisper.cpp/releases) | Primary | Pin the version in stage 4 |
| Web Speech API: with `processLocally` true, recognition must run on the device; with false (default), speech data might be sent to a remote server; it is a Community Group draft dated 2026-10-27 | [Web Speech API draft](https://webaudio.github.io/web-speech-api/) | Primary | On-device mode only by default; remote mode needs consent; feature-detect and fall back to the server |
| No reliable published Indonesian benchmark for the base turbo model was found; third-party figures mix datasets | Search on 2026-10-28 | Gap | Build our own consented evaluation set and measure field-level accuracy |

## 4. Platform versions

| Item | Version on 2026-10-28 | Source |
| :--- | :--- | :--- |
| Node.js 24 LTS | 24.22.1, end of life 2028-04-30 | [endoflife.date](https://endoflife.date/nodejs) |
| PostgreSQL 18 | 18.6, end of life 2030-11-14 | [endoflife.date](https://endoflife.date/postgresql) |
| React | 19.3.1 | [npm registry](https://www.npmjs.com/package/react) |
| Vite | 8.3.5 | [npm registry](https://www.npmjs.com/package/vite) |
| `@anthropic-ai/sdk` | 1.3.0, Apache-2.0 | [npm registry](https://www.npmjs.com/package/@anthropic-ai/sdk) |

The development machine used on 2026-10-28 runs Node.js 24.9.0, older than the current 24.22.1 patch release, and has no PostgreSQL server; stage 2 needs both (see [ROADMAP.md](ROADMAP.md)).

## 5. Owner answers

The owner answered the open questions on 2026-10-28; the decisions are in [PRD.md](PRD.md#owner-decisions-2026-10-28). Still open: hosting provider and region.

## 6. Facts checked for stage 2 (2026-10-28)

| Finding | Source | Consequence |
| :--- | :--- | :--- |
| IDR, currency number 360, has 2 minor units | [ISO 4217 list one, SIX, published 2026-09-17](https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml) | Amounts stored in sen (`bigint`), shown with two decimals |
| Argon2id minimum: 19 MiB memory, 2 iterations, parallelism 1 | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) | Password hashing parameters |
| `crypto.argon2` was added to Node.js in 24.7.0 | [Node.js 24 crypto documentation](https://nodejs.org/docs/latest-v24.x/api/crypto.html) | No password-hashing dependency; Node.js 24.7 or later required |
| PostgreSQL 18 provides `uuidv7()` | Verified on the installed PostgreSQL 18.6 (`select uuidv7()`) | Time-ordered primary keys without an extension |
| RFC 6238 TOTP test vectors (SHA-1) | [RFC 6238 appendix B](https://www.rfc-editor.org/rfc/rfc6238#appendix-B) | Unit test for the second factor |
| Problem details for HTTP APIs | [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) | Error format shared by all clients |
| `pg` 8.23.1 (MIT) and `@types/pg` 8.23.1 are the current releases | npm registry via `node scripts/tech-lookup.mjs` | Only runtime dependency of the API |
| postgres:18.6 image digest `sha256:edb0c08d…61ddb6` | Docker Hub registry API | CI service container pinned by digest |
