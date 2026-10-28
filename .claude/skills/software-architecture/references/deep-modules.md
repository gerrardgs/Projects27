# Deep Modules: Vocabulary and Discipline

How to shape modules so callers get a lot of behaviour through a small interface, maintainers find change in one place, and tests cross the same seam as callers. Adapted from Matt Pocock's [codebase-design skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design) (MIT, commit `5beb35b`), which builds on John Ousterhout's *A Philosophy of Software Design* and Michael Feathers' seams.

## Terms

Use these words consistently in designs, reviews and tickets.

| Term | Meaning |
| :--- | :--- |
| Module | Anything with an interface and an implementation, at any scale: function, class, package, service |
| Interface | Everything a caller must know to use the module correctly: types, plus invariants, ordering, error modes, required configuration and performance characteristics |
| Depth | Leverage at the interface: how much behaviour a caller or test reaches per unit of interface learned. Deep: much behaviour, small interface. Shallow: the interface is nearly as complex as the implementation |
| Seam | A place where behaviour can be changed without editing that place; where a module's interface lives (Feathers) |
| Adapter | A concrete implementation that satisfies an interface at a seam (a PostgreSQL repository, an in-memory fake) |
| Leverage | What callers gain from depth: more capability per thing they must learn |
| Locality | What maintainers gain from depth: change, bugs and verification concentrate in one place |

## Principles

- **Depth is a property of the interface.** A deep module may be built from small internal parts; they are simply not part of what callers see.
- **The deletion test.** Imagine deleting the module. If complexity disappears, it was a pass-through; if complexity reappears in every caller, it was earning its place.
- **The interface is the test surface.** Callers and tests cross the same seam. Needing to test past the interface means the module has the wrong shape.
- **One adapter is a hypothetical seam; two adapters make a real one.** Introduce a port only when something actually varies across it, typically production and test.
- **Design for testability**: accept dependencies instead of creating them, return results instead of producing hidden side effects, keep the surface small ([01-core-principles](../../../rules/01-core-principles.md) section 5).

## Dependencies decide how a deepened module is tested

| Category | Example | Approach |
| :--- | :--- | :--- |
| In-process | Pure computation, in-memory state | Merge the shallow pieces and test through the new interface directly |
| Local substitute exists | PostgreSQL with a local test instance, an in-memory filesystem | Keep the seam internal; run the substitute in the test suite |
| Remote but owned | Your own services across the network | Define a port at the seam; production uses an HTTP, gRPC or queue adapter, tests an in-memory adapter |
| True external | Payment, email or SMS providers | Inject the provider as a port; tests use a fake or mock adapter |

When a cluster of shallow modules becomes one deep module, write the new tests at its interface. The old tests of the shallow pieces usually become redundant: propose removing them and wait for agreement ([15-clean-execution](../../../rules/15-clean-execution.md) section 2).

## Design it twice

Your first interface is rarely the best. For an important module, sketch two or three radically different interfaces before choosing, for example one that minimises entry points, one that makes the most common call trivial, and one built around ports and adapters. Compare them on depth, locality and seam placement, recommend one (or a hybrid), and record the choice in an ADR when it is hard to reverse ([software-architecture](../SKILL.md) section 7).
