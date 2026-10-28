# Writing Without Slop

For documentation, READMEs, commit messages, pull requests, release notes, UI copy and messages to users. It complements the writing rules in [technical-documentation](../../technical-documentation/SKILL.md) section 3. Adapted from the antislop-copywriting skill of [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) (MIT).

## Patterns to cut

| Pattern | Example | Instead |
| :--- | :--- | :--- |
| Empty vocabulary | unlock, elevate, empower, delve, seamless, robust, cutting-edge, revolutionary, game-changer, next-level, journey, landscape | Say what it does: "Work with your team in one shared space." |
| Inflated significance | "a pivotal moment", "plays a crucial role" | State the concrete effect |
| Claims without evidence and weasel attribution | "trusted by thousands", "experts agree", "studies show" | The real figure with its source, or no claim |
| Chatbot openers and closers | "Great question!", "I hope this helps!", "Let me know if..." | Start with the answer; end on the last fact |
| Signposting | "Let's dive in", "In this section we will explore" | The content itself |
| Generic upbeat ending | "The future looks bright" | Cut it; end on the last concrete fact or real plan |
| Speculative gap-filling | "The company was likely founded in the 1990s" | "Not documented in our sources", or omit |
| Rule-of-three reflex | Every list has exactly three items | As many items as are true |
| Negative parallelism | "It's not just X, it's Y" | Say Y |
| Staccato drama | "Fast. Simple. Powerful." | One plain sentence |
| Synonym cycling | user, customer, client for one concept | One word per concept ([software-architecture](../../software-architecture/SKILL.md) section 3 glossary) |
| Formatting noise | Bold on every phrase, emoji in headings, ALL-CAPS emphasis, inline-header bullet lists | Bold only what the reader must not miss; plain headings |
| Filler and over-hedging | "It is important to note that", "may potentially" | Delete the filler; hedge once, where the uncertainty is real |
| Actorless passive | "Mistakes were made", "The file is deleted" (by whom?) | Name who does what |

## Not slop on its own

Perfect grammar, formal vocabulary, a single transition word, one em dash, curly quotes, one short emphatic sentence, or an unsourced but common-knowledge statement. These count only as part of a cluster. The source repository bans the em dash outright; this specification does not: follow the project's style guide, and change a writer's deliberate style only after asking.

## Before delivering

Ask "What makes this read as generated?" and "Does it state any fact, name, number, date or quote that is not in a source?" Fix both answers. A fabricated specific is worse than a vague claim, because it reads as honest.
