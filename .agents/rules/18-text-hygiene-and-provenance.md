---
trigger: model_decision
description: "Apply when writing or revising user-facing text, documentation, articles, marketing copy, or processing files and media with AI provenance marks, invisible Unicode, or C2PA metadata."
---

# R-18: Text Hygiene, Watermarks and AI Provenance Marks

Engineering and content hygiene for natural language, design copy, financial reports, and media: deterministic artifact cleaning, stylometric voice preservation, and respectful provenance handling.

## 1. Scope and ethical baseline

- **Apply only to authorized content**: operate exclusively on text, documentation, code comments, financial narratives, and media that the user owns or is explicitly authorized to process.
- **Preserve required disclosures**: never strip or tamper with mandatory academic, legal, regulatory, copyright, statutory audit, or platform-mandated disclosures and notices.
- **No fraudulent claims**: statistical reduction of AI watermarks or stylometric polishing must never be used to deceptively claim certified human authorship or commit academic, financial, or credential fraud. Treat statistical reduction as best-effort hygiene.
- **Scope discipline**: apply text hygiene only to natural-language prose intended for readers (documentation, guides, articles, reports, UI copy). Never modify code, commands, identifiers, URLs, APIs, configuration, financial ledgers, or formulas.

## 2. Invariants: what must never change

When performing text hygiene or rewriting prose:
- **Facts, numbers, and data**: preserve every claim, measurement, financial total, transaction amount, benchmark score, version number, date, and specification. Never invent or hallucinate facts to create syntactical variety.
- **Technical identifiers**: keep code spans, file paths, URLs, CLI commands, flags, schema keys, and API names completely unchanged.
- **Authorial voice and intent**: respect deliberate rough edges, specific terminology, and domain-specific tone. Enhance clarity and natural cadence without imposing a generic AI style.
- **Quotations and citations**: maintain verbatim quotations and bibliographic references without alteration.

## 3. The layered hygiene model

### Layer A: Deterministic Unicode hygiene
Invisible code points and anomalous characters often embed unwanted provenance tokens or break cross-platform layout. Strip them deterministically:
- Zero-width and invisible characters: `U+200B` (zero-width space), `U+200C` (ZWNJ), `U+200D` (ZWJ), `U+2060` (word joiner), and `U+FEFF` (zero-width no-break space / byte-order mark in text body).
- Bidirectional control characters: `U+200E` (LRM), `U+200F` (RLM), and embedding/override markers unless strictly required for bi-directional text.
- Reserved ignorable characters: `U+2065`, `U+FFF0`–`U+FFF8`, and tags plane code points.
- Formatting spaces: preserve layout spaces (such as NBSP, narrow no-break space, figure space, and CJK ideographic space) unless space normalization is explicitly requested.

### Layer B: Stylometric and statistical text hygiene
When natural-language text exhibits high-density AI generation patterns (uniform sentence structures, repetitive transitions, formulaic filler):
- Inspect and measure first with zero-LLM stylometry before modifying text.
- If the text has high AI pattern density, perform a single-pass rewrite that introduces authentic human rhythm: varied sentence lengths, diverse clause boundaries, and direct vocabulary.
- Cut formulaic transitions ("Furthermore", "Moreover", "In summary", "It is important to remember", "Delve into").
- Re-run the Layer A Unicode pass after any rewrite to guarantee no synthetic markers were reintroduced.

### Layer C: Media and container metadata provenance
When processing media files (PNG, JPEG, WebP, SVG, PDF, DOCX, ODT):
- Inspect metadata structures (C2PA Content Credentials manifests, EXIF, XMP, IPTC, and container headers) prior to modification.
- Strip extraneous AI provenance tags and tracking manifests while safeguarding the visual/audio integrity of the underlying asset.
- Never alter image pixels, audio samples, or video frames unless explicit media restoration or transformation is requested.

## 4. Skills and tool routing

- For local, self-contained, zero-dependency text inspection, Unicode cleaning, and stylometric scoring, use the [`clean-user-facing-text`](../skills/clean-user-facing-text/SKILL.md) skill.
- For comprehensive multi-vendor file metadata stripping (C2PA, EXIF, XMP, PDF/image/document containers) and service-backed operations, use the [`remove-ai-marks`](../skills/remove-ai-marks/SKILL.md) skill.
- For eliminating generic visual, structural, and UX anti-patterns, combine with [`anti-slop`](../skills/anti-slop/SKILL.md) and [`anti-slop-filter`](../skills/anti-slop-filter/SKILL.md).
