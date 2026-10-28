---
trigger: model_decision
description: "Apply when writing interface copy (labels, buttons, errors, empty states, onboarding, notifications), designing forms and flows, localising, or making choices about consent, privacy, persuasion and dark patterns."
---

# R-14: UX Writing, Inclusive Content and Ethical Design

## 1. Interface copy

- Write for scanning: front-load the important words, one idea per sentence, plain language (aim for a reading level the audience can handle under stress), sentence case unless the project style differs.
- Buttons and links say what they do: a verb plus an object ("Download invoice", "Delete project"). Avoid "Click here", "Submit", "OK" when a specific label is possible.
- Error messages say what happened and how to fix it, in human terms, without blame or jargon, next to the problem: "Enter a date in the future", not "Invalid input" or "Error 422".
- Empty states explain what will appear and offer the next action. Confirmation dialogs name the consequence ("Delete 3 files? You can't undo this.") and label buttons with the action, not "Yes/No".
- Keep terminology consistent across the product, the help content and the marketing site. Follow the project's voice and tone guide and word list when it exists.
- Never invent product claims, prices, legal text, testimonials or statistics in copy. Use placeholders that are obviously placeholders, and flag them.
- Write like a person, not a generator: no buzzwords, empty vocabulary, signposting, chatbot closers or forced groups of three; specific calls to action instead of "Get started" by default ([writing patterns](../skills/anti-slop-filter/references/writing-patterns.md)).

## 2. Forms and flows

- Ask only for what is needed, and say why for sensitive data. Mark optional fields rather than required ones when most are required (or the other way round, consistently).
- One column; labels above fields; input types and `autocomplete` set correctly; input masks never block pasting; allow every valid format of names, addresses and phone numbers (people's names do not fit Western patterns).
- Show progress in multi-step flows, allow going back without losing data, and save drafts for long forms.
- Validate on submit or on blur, not on every keystroke; never clear the user's input on error.

## 3. Inclusive and localisable content

- Use inclusive, respectful language; avoid idioms, culture-specific references and humour that do not translate.
- Design for localisation: allow 30 to 40 percent text expansion (more for short labels), right-to-left layouts (use logical CSS properties), different date, number, currency, name and address formats (use `Intl` APIs), and plural rules (ICU MessageFormat or the framework's i18n library). Never concatenate translated fragments.
- Images and illustrations represent a diversity of people when they show people.

## 4. Ethical design: no deceptive patterns

Do not design or implement deceptive patterns ("dark patterns"), even if asked; explain the risk and offer an honest alternative. Examples: confirmshaming, pre-ticked consent or add-on boxes, hidden costs revealed late, fake urgency or scarcity, fake social proof, disguised ads, trick questions, nagging, obstruction (easy to sign up, hard to cancel), forced continuity, and visual interference that hides the option the business prefers users not to pick. Regulators act on these (for example the EU Digital Services Act, the GDPR, and US FTC enforcement on "negative option" and dark patterns).

## 5. Privacy and consent

- Privacy by default: collect the minimum, keep it the minimum time, and make privacy settings understandable.
- Consent for non-essential cookies and tracking is opt-in where the law requires it (for example GDPR and the ePrivacy rules in the EU/EEA and UK): "Accept" and "Reject" are equally easy and equally prominent; nothing non-essential loads before consent.
- Do not add analytics, session replay, pixels or third-party embeds without the project owner's decision; record what each one collects.
- Honour browser opt-out signals. [Global Privacy Control](https://globalprivacycontrol.org/) arrives as the `Sec-GPC: 1` request header and `navigator.globalPrivacyControl`; several US state laws, including California's and Colorado's, require businesses to treat it as an opt-out of selling or sharing personal data. Check which laws apply to the project, and never re-ask a user who sent the signal.

## 6. Wellbeing

Avoid designs that exploit attention (infinite feeds without stopping points, manipulative streaks, variable rewards aimed at compulsion), especially for children and vulnerable users. Give people control over notifications, time and data.
