# Integrations

## Inventory

| Service | Used for | Code | Required |
| :--- | :--- | :--- | :--- |
| Claude API (Anthropic) | Proposing form fields from a capture sentence | `apps/api/src/capture-ai.ts` (`@anthropic-ai/sdk` 1.3.0) | No; the rule parser works without it |
| Web Speech API (browser vendor) | Speech to text on the web | `apps/web/src/lib/speech.ts` | No; typing works |
| Android SpeechRecognizer | Speech to text on Android | `apps/android/lib/src/voice.dart` (`speech_to_text` 7.5.0) | No |
| Apple Speech framework | Speech to text on iOS | `apps/ios/Keuangan/App/SpeechInput.swift` | No |

## Authentication and credentials

Claude: `ANTHROPIC_API_KEY` from the environment, server side only; never in a client. Speech services use the platform's own permissions (microphone and, on iOS, speech recognition); the apps hold no credentials for them.

## Limits and costs

Capture calls are limited to 30 per user per minute by the API. Each Claude call uses `claude-opus-5-5` with low effort and up to 2,000 output tokens; the price per call depends on Anthropic's current pricing and has not been measured, because no key is configured yet. Browser and device speech services have no direct cost to the project.

## Webhooks received

None.

## Failure behaviour

| Failure | What the user sees |
| :--- | :--- |
| Claude unreachable, slow (30-second timeout, 1 retry) or refusing | The rule parser fills the form, with the note "Layanan AI tidak tersedia; formulir diisi dengan aturan bawaan." |
| Claude returns an invalid field | That field is replaced by the rule parser's value |
| Speech permission denied, no microphone, no speech, network error | A specific Indonesian message; typing the sentence still works |
| Browser without speech recognition (Firefox) | The Bicara button is disabled, with an explanation |
| The API itself is unreachable | Capture parsing is unavailable; the form can still be filled by hand and saved to the outbox |

## Environments and sandboxes

Tests never call Claude: `FakeExtractor` stands in (`apps/api/test/capture.test.ts`), fake recognisers stand in for speech on the web and Android, and `-UITestSpeech` scripts the sentence in the iOS UI test. The evaluation can call Claude on purpose with `node eval/run-capture.ts --ai` when a key is set.

## Contacts and status pages

Anthropic status: https://status.anthropic.com. Speech services have no public status page; failures surface as recogniser errors in the apps.
