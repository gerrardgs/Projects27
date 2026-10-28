# Indonesian regulations and standards for finance reporting software

Checked on 2026-10-28 against the sources linked in each row. Laws and tax rules change; read the official text again before implementing or changing a rule, and record the article and the date you checked next to the rule in code or configuration. Items marked "secondary source" were not confirmed against the official text and need that check first.

## Accounting standards

| Topic | What applies | Source |
| :--- | :--- | :--- |
| Renumbered SAK Indonesia | Since 2024-01-01, IFRS-based standards are numbered 1xx (IFRS) and 2xx (IAS); for example PSAK 1 became PSAK 201 (presentation of financial statements, IAS 1) | [IAI: Perubahan Penomoran PSAK dan ISAK](https://web.iaiglobal.or.id/assets/files/file_publikasi/Perubahan_Penomoran_PSAK_ISAK_dalam_SAK_Indonesia.pdf) |
| New presentation standard | PSAK 118 (presentation and disclosure, referring to IFRS 18), approved by DSAK IAI on 2025-05-28, effective 2027-01-01, replaces PSAK 201; it requires defined subtotals such as operating profit | [DSAK Terkini volume 7, 2025](https://web.iaiglobal.or.id/assets/files/file_sak/DSAK%20Terkini%20Volume%207%202025.pdf); [Binus Accounting, 2026-08-31](https://accounting.binus.ac.id/2026/08/31/new-financial-statements-changes-from-ifrs-18-towards-psak-118-2-of-3/) |
| Private entities | SAK EP (entitas privat), based on the IFRS for SMEs, effective 2025-01-01, replaces SAK ETAP | [DDTC News: apa itu SAK EP](https://news.ddtc.co.id/literasi/kamus/1803456/apa-itu-standar-akuntansi-keuangan-entitas-privat-sak-ep) (secondary source) |

Design consequence: the reporting framework and its version are per-entity, effective-dated settings. The statement layouts for periods from 2027-01-01 must support the PSAK 118 subtotals for entities that apply SAK Indonesia.

## Tax

| Topic | What applies | Source |
| :--- | :--- | :--- |
| VAT (PPN) | PMK 131 of 2024, in force since 2025-01-01: the rate is 12 percent; for goods and services that are not luxury goods the tax base (DPP) is "nilai lain" of 11/12 of the price, giving an effective 11 percent. DJP's worked example: price Rp12,000,000, DPP Rp11,000,000, PPN Rp1,320,000 | [PMK 131/2024 on JDIH Kemenkeu](https://jdih.kemenkeu.go.id/dok/pmk-131-tahun-2024/view); [DJP technical guidance](https://www.pajak.go.id/sites/default/files/lampiran/Petunjuk%20Teknis%20Pembuatan%20Faktur%20Pajak%20dan%20Dokumen%20Tertentu%20yang%20Kedudukannya%20Dipersamakan%20dengan%20Faktur%20Pajak%20serta%20Penerapan%20PMK%20131%20Tahun%202024.pdf); [pajak.go.id article](https://www.pajak.go.id/en/node/113453) |
| Bookkeeping retention | Books, records and source documents, including electronically processed data, are kept for 10 years in Indonesia (UU KUP article 28 paragraph 11); deliberately not keeping them is a criminal offence under article 39 | [pajak.go.id: simpan pembukuan minimal 10 tahun](https://www.pajak.go.id/id/berita/lakukan-visit-kp2kp-enrekang-imbau-simpan-pembukuan-minimal-10-tahun); [DDTC News](https://news.ddtc.co.id/berita/nasional/1805429/alasan-dokumen-dasar-pembukuan-wajib-disimpan-selama-10-tahun) |
| Coretax and e-Faktur | Tax invoices are created through the Coretax portal or through a licensed tax application provider (PJAP) connected by API; VAT returns are filed through Coretax. Details of the channels and formats change often | [Online-Pajak on PER-11/PJ/2025](https://www.online-pajak.com/tentang-efaktur-ppn/aplikasi-ppn/) (secondary source; confirm in the DJP regulation before building an integration) |

Design consequence: tax codes carry rate, base rule (for example "DPP nilai lain 11/12"), effective dates and the regulation reference. The product exports tax data for a PJAP or Coretax import; it does not file returns itself unless the organisation licenses a PJAP integration.

## Personal data

| Topic | What applies | Source |
| :--- | :--- | :--- |
| Personal data protection | UU 27 of 2022 (UU PDP); controllers and processors had to comply by 2024-10-17 (two years after enactment, article 74) | [Perpustakaan DPR](https://perpustakaan.dpr.go.id/epaper/index/detail/id/18250) |
| Administrative fines | Up to 2 percent of annual revenue or receipts per violation variable (article 57 paragraph 3); a 2026 government regulation sets how the fine is calculated | [pasal.id: UU 27/2022 article 57](https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-57); [Bisnis.com, 2026-09-01](https://teknologi.bisnis.com/read/20260901/84/2000533/uu-pdp-perusahaan-pelanggar-bisa-didenda-2-dari-pendapatan-ini-mekanismenya) (secondary source for the regulation) |

Design consequence: personal data fields are listed in a data inventory with purpose and lawful basis; access is role-based and logged; exports and AI calls minimise personal data; a breach-response runbook exists before go-live.

## Other jurisdictions

When an entity reports under another jurisdiction, add its rows here with primary sources before enabling it: accounting framework, tax rules, retention period and place, and data protection law.
