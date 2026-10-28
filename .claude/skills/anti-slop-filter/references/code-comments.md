# Code Comment Slop

Comments that read as machine-written: decorative, restating the code, narrating, stiff or loud. Adapted from the [antislop code skill](https://github.com/miqdadbadjuber/anti-slop/tree/main/skills/antislop-code) (MIT, v3.2.21); the base rule is [02-clean-code](../../../rules/02-clean-code.md) section 6.

**Scope**: this check changes comments only, never executable code, names, imports, formatting or logic. In code you are writing, avoid these patterns. In existing code, list them as findings and change them only with the user's approval ([01-core-principles](../../../rules/01-core-principles.md) section 8).

## Patterns

| Pattern | Example | Fix |
| :--- | :--- | :--- |
| Decorative separators | `// ======== AUTH ========` | One plain line, or nothing |
| Restating the code | `let count = 0; // Initialize count` | Remove |
| Workflow narration | `// Step 1: validate`, `// Step 2: process` | Remove; if the flow is hard to follow, restructure the code |
| Empty labels | `// Main logic`, `// Helper function`, `// Important!` | Remove unless the label states a fact |
| Vague to-dos | `// TODO: improve this` | Name the task and its reason, or track it in the issue tracker |
| Signature echo | `@param price The price. @returns The total.` | Keep only what the signature does not say: rules, edge cases, side effects, errors |
| Decorative emoji | `// ✅ Validation` | Plain words |
| End markers | `} // end if` | Remove |
| One comment per line | A comment on every trivial statement | At most one comment per logical block |
| Over-explained | Four lines of history around a one-line constraint | The constraint in one line, two when there are two facts |
| Stiff or loud | `// THIS FUNCTION IS RESPONSIBLE FOR VALIDATING...` | Short, sentence case: `// Validate credentials before issuing a token.` |

## Always keep

Comments that explain intent and business rules, architectural decisions, security considerations, performance trade-offs, concurrency behaviour, protocol details, API contracts, workarounds, edge cases and assumptions, and licence or legal notices. Value does not justify length: keep them short.

```js
// Stripe may retry webhook deliveries for up to three days.
// Ignore duplicate events using the event ID.
```
