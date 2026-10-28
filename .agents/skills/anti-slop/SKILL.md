---
name: anti-slop
description: Keep generic AI-generated patterns ("slop") out of code comments, documentation, commit and pull request text, UI copy and user interfaces - decorative or restating comments, buzzwords and inflated claims, fabricated statistics, testimonials and data, template layouts, controls that do nothing, missing states, inaccessible contrast and touch targets - while preserving what carries meaning. Use when writing or reviewing comments, prose or interfaces, when output "looks AI-generated", or before delivering anything a person will read or use.
license: MIT
metadata:
  version: "1.0.0"
---

# Anti-Slop

Slop is output whose form signals "generated" instead of carrying information: the banner comment, the "seamless, cutting-edge" sentence, the invented "10,000+ teams", the dashboard of made-up numbers. This skill is a filter, not a style guide: it removes what should not be there and leaves direction (brand, voice, layout) to the project. Adapted from [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) (MIT, commit `69416cf`, read on 2026-10-23), with its accessibility figures checked against WCAG 2.2.

## 1. Hard gates (no exceptions)

1. **Nothing fabricated.** No invented statistics, testimonials, customer or team names, ratings, dates, quotes, security or compliance claims, or "realistic" sample data presented as real ([AGENTS.md](../../../AGENTS.md) non-negotiable 1). Use real data with its source, or an honest placeholder that says what it is (`[real figure needed]`, "Coming soon"). When a fact is unknown, say so or leave it out; never fill the gap with a plausible guess.
2. **Everything shown works.** Every link goes somewhere that exists, every button, form and toggle does what it says, every theme you ship works. Verify by running it, not by reading it ([15-clean-execution](../../rules/15-clean-execution.md)).
3. **People can use it.** WCAG 2.2 AA at least: contrast, keyboard access with a visible focus, empty, loading and error states, resizable text ([interfaces reference](references/interfaces.md)).

## 2. The purpose test

Every comment, sentence, badge, gradient, icon, animation and section answers one question: **what does this serve?** If the honest answer is "it looked finished" or "that is what these usually have", cut it. A technique is allowed when it has a stated reason (a gradient that marks hierarchy, an animation that shows a state change), not as a default.

## 3. Judge clusters, not single tells

One em dash, one "however", one bold phrase or one rounded button proves nothing; professionals write and design that way. Slop shows as a cluster: three-item lists everywhere plus inflated vocabulary plus a generic upbeat ending; or a sparkle icon plus a "Beta" capsule plus a fake terminal. Flag clusters, and leave alone the signs of real human work: specific, hard-to-invent detail, varied sentence length, mixed or unresolved opinions, deliberate style the owner chose.

## 4. Scope guardrail

- What you write in this task: apply this skill fully.
- What already exists (someone's comments, copy, UI): change it only when the request is about it. Otherwise list what you found and propose the fix ([AGENTS.md](../../../AGENTS.md) non-negotiable 9).
- Cleaning comments changes comments only: never executable code, identifiers, imports, formatting or logic in the same edit.
- A user's own writing sample or design direction is a direction, not slop to correct; point out the pattern and ask before changing their style.

## 5. Procedure: draft, audit, final

1. **Draft** with the domain references: [code comments](references/code-comments.md), [writing](references/writing.md), [interfaces](references/interfaces.md).
2. **Audit** by answering two questions in writing: "What makes this look generated?" and "Does it state any fact, name, number, date or quote that is not in a source?" A fabrication is a defect even when it sounds more human.
3. **Final**: fix both answers, then run the checklist below and report it with evidence (the command, screenshot or check that shows each item).

## Done when

- [ ] No fabricated facts, data, people or claims; every number has a source or an honest placeholder label
- [ ] Every comment adds information the code does not already show; none are decorative, restating or narrating
- [ ] Prose states things plainly: no stacked buzzwords, inflated significance, chatbot openers or closers, or generic upbeat endings
- [ ] Every interactive element was exercised and works; empty, loading and error states exist
- [ ] Contrast, keyboard access, focus, zoom and touch targets meet the [interfaces reference](references/interfaces.md)
- [ ] Nothing outside the requested scope was rewritten; existing slop was reported, not silently changed
