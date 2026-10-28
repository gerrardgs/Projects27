---
name: design-critique-and-review
description: Give structured, evidence-based feedback on a design, prototype, live page, brand piece or front-end pull request - usability heuristics, visual hierarchy, consistency with the design system, accessibility, content, responsiveness, performance and ethics - with findings ranked by severity and concrete recommendations. Use when asked to review, critique or give feedback on a design, mockup, screenshot, Figma file, landing page, app screen, logo or UI change, or to run a heuristic evaluation.
license: MIT
metadata:
  version: "1.0.0"
---

# Design Critique and Review

A useful critique is tied to goals, specific, evidence-based, ranked, and actionable. It is not a list of personal taste. This is the design counterpart of [rigorous-code-audit](../rigorous-code-audit/SKILL.md); for front-end pull requests, run both.

## 1. Set up the critique

1. Ask or infer: the goal of the design, the users and their task, the stage (concept, wireframe, high fidelity, shipped), and what kind of feedback is wanted. Feedback on spacing is useless at the concept stage; feedback on the concept is expensive at the shipped stage.
2. Gather the context: brief, research, design system, brand guide, platform guidelines, constraints.
3. Look at the real thing at real size: open the prototype or page on the target device, not only a scaled screenshot.

## 2. Review passes

Do the passes in order; each has its own reference.

| Pass | Questions | Reference |
| :--- | :--- | :--- |
| Goal fit | Does it solve the stated problem for the stated users? Is the primary action obvious? | Brief, [09-design-principles](../../rules/09-design-principles.md) |
| Usability heuristics | Visibility of status, match with the real world, user control, consistency, error prevention, recognition over recall, flexibility, minimalist design, error recovery, help | [Nielsen's 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) |
| Visual hierarchy and craft | Focal point, grouping, alignment, spacing rhythm, type scale, colour use, imagery quality | [ui-foundations](../ui-design-and-prototyping/references/ui-foundations.md) |
| System consistency | Tokens and components used; no detached styles; platform conventions | [design-system-and-tokens](../design-system-and-tokens/SKILL.md) |
| States and edge cases | All states, long and translated content, empty and error cases | Rule 09 section 4 |
| Accessibility | Contrast, target size, focus order, headings, labels, colour-only meaning, motion | [10-accessibility](../../rules/10-accessibility.md) |
| Content | Clear, specific labels and messages; consistent terms; tone | [14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md) |
| Generic AI output | Techniques without a written purpose, fabricated content, template layouts, AI writing tells, slop comments | [anti-slop-filter](../anti-slop-filter/SKILL.md) |
| Responsive | Smallest and largest layouts, behaviour in between, zoom | [css-architecture-and-responsive](../css-architecture-and-responsive/SKILL.md) |
| Performance (built work) | Image weight, fonts, layout shift, interaction speed | [12-web-performance](../../rules/12-web-performance.md) |
| Ethics and trust | No deceptive patterns; privacy and consent honest | Rule 14 sections 4 and 5 |

## 3. Verify each finding

- Point to the exact place (frame name, URL and selector, screenshot region).
- Back it with evidence: a measured contrast ratio, a heuristic or guideline, a research finding, a platform rule, or a reproducible behaviour. Mark opinions as opinions.
- Remove findings you cannot support. Do not invent user reactions or data.

## 4. Rank and recommend

| Severity | Meaning |
| :--- | :--- |
| Blocker | Users cannot complete the task, or a legal or accessibility failure on a key path |
| Major | Significant friction, confusion or inconsistency on a key path |
| Minor | Polish or consistency issue with low user impact |
| Suggestion | An idea or alternative worth considering |

For each: what you observed, why it matters (impact on users or goals), and a concrete recommendation, with an example if useful. Also say what works well and should be kept, so it is not lost in revisions.

## 5. Report format

```text
Context:     <goal, users, stage, what was reviewed, on which device>
Summary:     <two or three sentences: overall assessment and the top issues>
Findings:    <ranked: severity, location, observation, evidence, recommendation>
Keep:        <strengths to preserve>
Questions:   <open questions for the designer or product owner>
Not checked: <what was outside scope or could not be tested>
```
