---
name: content-hygiene
description: Audit and strip invisible Unicode and Trojan Source bidirectional characters in source code, Markdown and documentation using Node.js without dependencies.
---

# Content Hygiene

Audit and remove unwanted Unicode characters (zero-width spaces, word joiners, hidden tag characters, and Trojan Source bidirectional controls) across code and prose files.

## Usage

Run the vendored tool with Node.js 22+:

```bash
node assets/unicode-hygiene.mjs <file or directory>...
node assets/unicode-hygiene.mjs --fix <file or directory>...
node assets/unicode-hygiene.mjs --json <file or directory>...
```
