# Contract shared by the API and its clients

- [openapi.json](openapi.json): OpenAPI 3.1 description of every `/v1` operation (30 operations in version 0.4.0, including imports, Excel exports, voice or text capture and its real-use quality report). The API's contract test fails if a route is missing from it, if it documents a route that does not exist, or if a real response does not validate against the documented schema. The web, iOS and Android clients generate or hand-write their models from it.
- [fixtures/personal-sample.json](fixtures/personal-sample.json): a personal ledger in IDR for September and October 2026 with the expected monthly recap, balance sheet and trial balance. The expected values were computed with Python `decimal` arithmetic, independently of the application code, so every client can test its own parsing and display against the same numbers.

Amounts are always decimal strings with two decimals (`"725350.50"`); clients parse them with `Decimal` (Swift) or a decimal type (Dart), never with binary floating point.
