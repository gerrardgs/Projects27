# {Context name}

{One or two sentences: what this part of the system is and why it exists.}

<!--
Copy to GLOSSARY.md at the repository root when the first domain term is settled, not before.
Rules: one or two sentences per term, saying what it IS; pick one word per concept and list the
rejected synonyms under "Avoid"; only terms specific to this project (no general programming
terms); no implementation details, specs or decisions (those go in ADRs). A repository with
several bounded contexts keeps one GLOSSARY.md per context and a GLOSSARY-MAP.md at the root
listing them and how they relate. Format adapted from Matt Pocock's domain-modeling skill
(https://github.com/mattpocock/skills, MIT).
-->

## Language

**Order**:
A customer's request to buy one or more products, from placement until delivery or cancellation.
_Avoid_: purchase, transaction

**Customer**:
A person or organisation that places orders.
_Avoid_: client, buyer, account
