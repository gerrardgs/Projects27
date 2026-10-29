# Design system

## Principles

Tokens before values; semantic names (`--income`, not `--green`); the same meaning in every theme; state shown by text and shape as well as colour.

## Tokens

Defined as CSS custom properties in `apps/web/src/styles.css` (`:root`, and again for `prefers-color-scheme: dark`):

| Token | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--bg`, `--surface` | `#ffffff`, `#f5f7fa` | `#0f141a`, `#18202a` | Page and card backgrounds |
| `--text`, `--muted` | `#14181f`, `#4a5363` | `#e8edf3`, `#a9b4c2` | Body and secondary text |
| `--accent`, `--accent-text` | `#0b5cad`, `#ffffff` | `#6cb2ff`, `#0f141a` | Links, primary buttons |
| `--income`, `--expense`, `--danger` | `#1a7f37`, `#b4530a`, `#b42318` | `#4ac26b`, `#f0883e`, `#ff7b72` | Amount tone, errors, recording dot |
| `--border`, `--focus` | `#6b7587`, `#0b5cad` | `#5f6b7a`, `#6cb2ff` | Borders, focus outline |
| `--space-1` … `--space-8` | 0.25 rem to 2 rem | same | Spacing scale |
| `--radius`, `--measure`, `--font` | 0.5 rem, 72 rem, system UI stack | same | Corners, line length, type |

The Android app seeds Material 3 colour schemes from `#0B5CAD` (light and dark); the iOS app uses system colours.

## Components

Web (`apps/web/src/components`): `Status` (live region; `role="alert"` for errors), `Loading`, `Money` (formats decimal strings with explicit fraction digits), `TableWrap` (scrollable, keyboard-focusable table), `ReportTable`, `TrendChart` (SVG plus table), `CategoryBars`, `DeviceStatus` (offline notice and outbox). Inside `CapturePage`: `VoiceCapture`, `RecordingIndicator` and `CaptureQualityNote`. Android and iOS have counterparts: `DeviceBanner`, `_RecordingIndicator` / `RecordingIndicator`, `_QualityNote` / `QualityNote`.

## Themes

Light and dark follow the system setting on all three platforms. The axe-core checks run in both themes on the web. Reduced motion: the recording dot stops pulsing under `prefers-reduced-motion: reduce`.

## Accessibility

Colour pairs are checked by axe-core in the end-to-end tests (both themes). Focus is a 3-pixel outline in `--focus`. Touch targets follow the platform minimums. Charts always have a table or a VoiceOver/TalkBack value.

## Usage and contribution

Use an existing token or component; when one is missing, add the token to `:root` and its dark value, then use it. Do not write raw colours or spacing in components. A new component gets a test in `e2e/` that includes an axe scan. See [design-system-and-tokens](../.agents/skills/design-system-and-tokens/SKILL.md).
