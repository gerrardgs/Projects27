---
name: ux-research-and-strategy
description: Plan and run user experience research and product discovery - research questions, interviews, surveys, usability tests, card sorting, analytics review, personas, jobs to be done, journey maps, information architecture, and turning findings into design decisions. Use when starting a product or feature, when asked who the users are or what they need, when planning or synthesising research, defining information architecture or navigation, writing a design brief, or choosing what to design next.
license: MIT
metadata:
  version: "1.0.0"
---

# UX Research and Strategy

Research reduces the risk of building the wrong thing. Follow [09-design-principles](../../rules/09-design-principles.md): never invent findings, quotes or numbers. Methods, sample sizes and templates are in [references/methods.md](references/methods.md).

## 1. Frame the problem

1. Write the **design brief**: business goal, target users, the problem or opportunity, constraints (time, budget, technology, legal, brand), and how success is measured (task success, time on task, conversion, retention, support tickets, satisfaction such as SUS or CSAT).
2. List **what you already know** (analytics, support tickets, sales and support conversations, previous research, competitor products, reviews) and **what you need to learn**. Turn unknowns into 3 to 5 research questions.
3. Label every assumption. Rank assumptions by risk (how bad if wrong) and uncertainty; research the risky, uncertain ones first.

## 2. Choose the method

| Question | Method | Typical size |
| :--- | :--- | :--- |
| Who are the users, what are their goals and pains? | Interviews, contextual inquiry, diary studies | 5 to 12 per segment |
| How many users do X, how much do they care? | Survey, analytics, A/B data | Statistically sized |
| Can people use this design? | Moderated or unmoderated usability test | About 5 per round, iterate |
| How should content be grouped and named? | Open/closed card sort, tree test | 15 to 30+ |
| Which design performs better? | A/B or multivariate test | Calculated from baseline and effect size |
| How does our product compare? | Heuristic evaluation, competitive analysis, benchmark study | 3 to 5 evaluators |

Combine **qualitative** (why) and **quantitative** (how many) methods. Recruit participants who match the target users, including disabled users and users of assistive technology.

## 3. Run it ethically

- Get informed consent; explain the purpose, recording, data storage and the right to stop. Pay participants fairly.
- Collect the minimum personal data, store it securely, anonymise quotes, and follow the organisation's privacy policy and applicable law (for example the GDPR).
- In interviews, ask about past behaviour ("Tell me about the last time you..."), not hypothetical preferences; avoid leading questions; let silences run.
- In usability tests, give realistic tasks without hints in the wording, ask participants to think aloud, and observe what they do rather than what they say they would do.

## 4. Synthesise

1. Capture observations as atomic notes (one fact, source, participant).
2. Cluster them (affinity mapping) into patterns; count how many participants show each pattern.
3. Write **insights**: an observed pattern plus why it matters ("6 of 8 participants could not find X because...").
4. Produce only the artefacts that will be used: personas (based on data, not demographics alone), jobs-to-be-done statements, journey or experience maps, service blueprints, problem statements, "How might we" questions.
5. Prioritise opportunities by user impact, business value and effort; agree on them with stakeholders.

## 5. Information architecture

- Inventory existing content; group it from the user's mental model (card sort), not the org chart.
- Draft the navigation and labels; validate with a tree test before visual design.
- Produce a sitemap and key user flows (happy path plus the main error and edge paths).

## 6. Deliverables and done when

- [ ] Research questions answered or explicitly still open
- [ ] Findings traceable to sessions or data; no invented quotes or numbers
- [ ] Insights prioritised, with recommended next design steps and how to measure them
- [ ] Participants' personal data handled per consent and policy
- [ ] Assumptions that remain untested are listed as risks
