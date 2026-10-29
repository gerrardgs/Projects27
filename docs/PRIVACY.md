# Privacy

## Personal data inventory

| Data | Where | Why |
| :--- | :--- | :--- |
| Email, display name | `users` | Sign-in and greeting |
| Password hash, TOTP seed (encrypted) | `users` | Authentication |
| Session token hashes, client type, IP address (rate limiting, audit events) | `sessions`, memory, `audit_events` | Security |
| Financial records: amounts, descriptions, counterparties | `journal_entries`, `journal_lines`, snapshots | The service itself |
| Spoken or typed capture sentence | Device speech service, API memory during the request, Claude API if configured | Filling the form; never stored by the API |
| Capture metadata (method, fields filled, fields changed) | `capture_drafts` | Measuring quality |
| Device copy of the above | Browser IndexedDB, app SQLite | Working offline |

## Legal basis and consent

UU 27/2022 (Personal Data Protection). The basis is the contract with the user: the data is needed to keep their books. Microphone use needs the user's permission on every platform, asked when the user first presses Bicara. Sending sentences to Claude is allowed by the owner's decision of 2026-10-28, provided the data is never disseminated ([PRD.md](PRD.md#owner-decisions-2026-10-28)).

## Recipients and transfers

| Recipient | Data | Condition |
| :--- | :--- | :--- |
| Google (Chrome, Edge, Android speech) or Apple (Safari, iOS speech) | Audio of the spoken sentence | Only when the user presses Bicara; iOS recognises on the device when the model supports it |
| Anthropic (Claude API) | The sentence and the entity's account list | Only when `ANTHROPIC_API_KEY` is set; no names, emails or balances are sent |
| Hosting provider | Everything in the database | Not chosen yet; must keep data in Indonesia |

These are transfers outside Indonesia (speech services, Claude), which the user must be told about in the privacy notice before launch.

## Retention and deletion

Books and source records: 10 years (tax law), so posted data cannot be deleted. Sessions: until expiry or sign-out. Capture sentences: not retained by the API. Device copy: until sign-out. Audit events: as long as the books.

## Data subject requests

Access: all of a user's data can be read through the API and exported to Excel. Correction: by reversing and re-posting entries; profile changes are not built yet. Deletion of an account outside the retention duty, and a full export of personal data in one file, are not built yet and are needed before launch.

## Privacy by design and impact assessments

Data minimisation is built in: the capture sentence is never stored, capture metrics carry no content, the AI receives no identity data, and the device copy is cleared at sign-out. A data protection impact assessment is required before launch (financial data, AI, transfers abroad) and has not been done.

## Breach response

Follow [SECURITY.md](SECURITY.md#incident-response) to contain the breach. UU 27/2022 Article 46 requires written notice to the data subjects and to the supervisory institution within 3 × 24 hours, stating at least what personal data was exposed, when and how, and the steps taken to handle and recover; in some cases the public must be told as well ([Article 46 text](https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-46), checked 2026-10-29 against a secondary source; confirm with the official gazette before relying on it). The article does not say when the 3 × 24 hours start; commentators suggest counting from the incident, as Permenkominfo 20/2016 does ([Hukumonline](https://www.hukumonline.com/berita/a/lima-langkah-penanganan-data-pribadi-sesuai-regulasi-atas-dugaan-kebocoran-data-bsi-lt6463960943a71/?page=2)), so the safe practice is to start the clock when the breach is discovered. Keep a record of every breach, including those not reported.
