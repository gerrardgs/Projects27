# Evidence ledger

Decompilers, heuristics and AI summaries produce plausible output that can be wrong. Every conclusion therefore carries its evidence and its limits. The method follows REA's evidence workflow ([evidence workflows](https://github.com/morluto/rea/blob/main/.agents/skills/reverse-engineer-anything/references/evidence-workflows.md), commit `d39b300`, read on 2026-10-29). It works with or without REA.

## 1. Three kinds of statement

| Kind | Meaning | Example |
| :--- | :--- | :--- |
| **Observed** | A tool read it from the bytes, or saw it at run time, and the record says which | "The debug APK's `assets/flutter_assets/kernel_blob.bin` contains the string `http://10.0.2.2:8080` (audit-artifact, 2026-10-29)" |
| **Inferred** | Reasoned from observations, with the reasoning stated | "That string is probably the default API address, because `main.dart` declares it as the default of `API_BASE_URL`" |
| **Unknown** | Not established, with the evidence or access still needed | "Whether the release build overrides it: no release artifact was inspected" |

- Static analysis never observes execution. Do not write "the app calls X" from a decompiled call graph. Write "the code contains a call to X".
- A search that found nothing proves absence only within its stated coverage: which files were read, which were skipped and why. Say "not found in the 159 files scanned; `kernel_blob.bin` was skipped" rather than "not present".
- A heuristic match (a function signature, a string pattern, a library fingerprint) is an inference until something independent confirms it.

## 2. Ledger format

Keep one ledger per investigation, next to the evidence and outside the repository:

```markdown
# Ledger: <target name, version, SHA-256>

Scope: <link to the scope record (legal-and-scope section 1)>

| # | Question | Statement | Kind | Evidence (tool, ID or file:line, date) | Limits and coverage |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | Does the build ship secrets? | No key patterns found | Observed | audit-artifact JSON, 2026-10-29 | 159 files, 0 skipped (limit 256 MiB); pattern list in the script |

## Open unknowns
- <question> — needs <evidence, access or authority>
```

## 3. Verifying before reporting

1. Re-read each conclusion against its evidence. A conclusion without an evidence entry is downgraded to "inferred", or removed.
2. Cross-check consequential findings with a second, independent method ([03-verification](../../../rules/03-verification.md) section 6). For example, confirm a decompiler's string with a byte search, confirm a signature claim with `apksigner verify`, and confirm a runtime claim by observing it.
3. Mark each question from the original checklist as answered, partly answered or open. Never call a broad investigation complete while required questions remain open.
