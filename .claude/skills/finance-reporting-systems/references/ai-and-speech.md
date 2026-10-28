# AI and speech in finance reporting

Facts checked on 2026-10-28. Model names, prices and API features change; confirm them in the provider's documentation before implementing ([03-verification](../../../rules/03-verification.md)).

## 1. Where AI helps, and where it must not decide

| Use | AI role | Control |
| :--- | :--- | :--- |
| Dictated or typed transaction ("bayar listrik kantor 2,4 juta kemarin") | Extract date, amount, currency, counterparty, suggested account and dimensions into a schema | Server validates the schema and the account list; the user confirms in a form before a draft entry exists |
| Receipt and invoice capture | Extract fields from an image or PDF | Same as above; the stored document hash links the entry to its source |
| Categorisation of bank lines | Suggest an account with a confidence and the reason (similar past entries) | Below a threshold, or for new counterparties, a person decides |
| Anomaly detection | Statistical rules first (duplicates, round amounts, unusual counterparty, outliers per account) with an explanation | Flags only; never blocks or posts |
| Monthly narrative recap | Write the commentary around figures the application computed | Every number in the text must match a computed value; a reviewer approves before release |
| Questions over the ledger ("why did travel costs rise in September?") | Call read-only tools (report queries) and explain the results | Tools enforce the user's permissions; answers cite the report rows they used |
| Questions over policies | Retrieval over approved policy documents ([rag-systems](../../rag-systems/SKILL.md)) | Answers cite the document section |

The model never writes to the ledger, never sends messages and never changes permissions. Those actions exist only as application functions behind user approval.

## 2. Model choice (Claude API)

The default model for all three workloads (extraction, narrative, ledger questions) is `claude-opus-5-5`: 1M-token context, $4 per million input tokens and $20 per million output tokens on the first-party API as listed in Anthropic's model table cached on 2026-10-06. Cheaper models (`claude-sonnet-5-5`, `claude-haiku-5-5`) are a business decision for the owner after an evaluation shows the quality holds; keep the model identifier in configuration so it can change without code changes.

Features to use, from the Claude API documentation:

- **Structured outputs** (`output_config.format`, or `strict: true` on tool definitions) for extraction, so the response always matches the schema. Validate again on the server anyway.
- **Tool use** for questions over the ledger; tools are read-only and run with the asking user's permissions.
- **Prompt caching** for the stable prefix (instructions, chart of accounts, tool definitions); keep volatile content after the cache breakpoint.
- **Message Batches** for non-urgent work such as month-end narratives and bulk categorisation (asynchronous, at a lower price than interactive calls).
- **Refusal handling**: check `stop_reason` before reading content; Opus 5.5 supports server-side fallbacks.
- On Opus 5.5, thinking cannot be disabled; control depth with `output_config.effort` (default `medium`), and forced `tool_choice` (`any` or `tool`) is rejected, so use `auto` with an explicit instruction or structured outputs.

Data handling: send only the fields a task needs (mask account numbers and personal tax IDs unless the task requires them), keep the provider's data-retention terms in the vendor record, and log prompt version, model identifier, inputs (redacted), outputs and the human decision in the audit trail.

## 3. Speech recognition

Three options, chosen per organisation policy:

| Option | Where audio goes | Notes |
| :--- | :--- | :--- |
| Self-hosted Whisper (`whisper.cpp` or the reference implementation) | Servers the organisation controls | OpenAI Whisper code and weights are MIT-licensed; the `turbo` model has 809 M parameters, needs about 6 GB VRAM and is about 8 times faster than `large` (measured by OpenAI on English speech), but is not trained for translation. `whisper.cpp` v1.9.5 was the latest release on the check date. Sources: [openai/whisper](https://github.com/openai/whisper), [whisper.cpp releases](https://github.com/ggml-org/whisper.cpp/releases) |
| Browser Web Speech API with `processLocally = true` | Stays on the device | The specification is a W3C Community Group draft (27 October 2026); with `processLocally` true, recognition must run on the device; language packs are installed with `SpeechRecognition.install()`; support varies by browser. Source: [Web Speech API draft](https://webaudio.github.io/web-speech-api/) |
| Browser Web Speech API with `processLocally = false` (the default) | May go to a remote server chosen by the browser vendor | Allowed only with explicit user consent, because the specification says speech data might be sent to a remote server |

The default is self-hosted Whisper, with the on-device browser path as a fast option where available. Always show a visible recording indicator, let the user review and edit the transcript before extraction, and keep the transcript (not the audio, unless policy requires it) with the draft entry.

Accuracy: published word error rates for Indonesian vary by dataset and model and do not measure what matters here. Build an evaluation set of real, consented recordings of finance dictation (amounts, dates, vendor names, mixed Indonesian and English) and measure field-level accuracy of the extracted amount, date and account, not only word error rate.
