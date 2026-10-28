# Code Comments Without Slop

A comment earns its place by telling the reader something the code does not show: the reason, the constraint, the non-obvious behaviour ([02-clean-code](../../../rules/02-clean-code.md) section 6). Adapted from the antislop-code skill of [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) (MIT).

## Remove or never write

| Tell | Example | Instead |
| :--- | :--- | :--- |
| Decorative separators and ALL-CAPS banners | `// ====== AUTHENTICATION ======` | One plain line, or nothing |
| Restating the obvious | `// Initialize the variable` above `let count = 0` | Nothing |
| Workflow narration | `// Step 1: validate`, `// Step 2: process` | Nothing; if the flow is hard to follow, fix the structure |
| Empty labels | `// Main logic`, `// Helper function`, `// Note: this is important` | Nothing, or the specific fact ("retries happen only on 5xx") |
| Vague TODOs | `// TODO: improve this` | A TODO that names the task and its context, or nothing ([01-core-principles](../../../rules/01-core-principles.md) section 3) |
| Signature echo | `@param price The price.` `@returns The total.` | Documentation of rules, edge cases, side effects, errors and security implications only |
| Decorative emoji | `// ✅ Validation`, `// 🚀 Fast path` | Plain words, or nothing |
| End markers | `} // end if` | Nothing |
| Line-by-line commentary | A comment on every statement | At most one comment per logical block |
| Over-explaining | Four lines of history around a one-line constraint | The constraint in one line, two at most |
| Stiff or loud wording | "This function is responsible for validating whether..." | Short, sentence-case, natural: `// Validate credentials before issuing a token.` |

## Always keep

Comments that explain business rules and intent, architectural decisions, security considerations, performance trade-offs, concurrency behaviour, protocol details, API contracts, workarounds (with the issue link when one exists), edge cases and assumptions, and licence or legal notices. Value does not justify length: keep them short.

```js
// Stripe may retry webhook deliveries for up to three days.
// Ignore duplicate events using the event ID.
```

## Scope

When asked to clean comments, change comments only: never code, identifiers, imports, formatting or logic in the same edit. Existing comments outside the request are reported, not removed ([AGENTS.md](../../../../AGENTS.md) non-negotiable 9).
