---
name: software-architecture
description: Design and review software architecture and system design - quality attributes (ISO/IEC 25010), architecture styles (layered, modular monolith, hexagonal, microservices, event-driven, serverless), domain-driven design and bounded contexts, distributed-systems trade-offs (CAP, PACELC, consistency, idempotency, sagas, outbox), resilience patterns (timeouts, retries, circuit breaker, bulkhead, load shedding, static stability, cells), scalability and capacity, architecture decision records, C4 diagrams, fitness functions and evolutionary change. Use when designing a new system or major feature, choosing between architectures, splitting or merging services, reviewing a design, or recording an architectural decision.
license: MIT
metadata:
  version: "1.0.0"
---

# Software Architecture and System Design

Architecture is the set of decisions that are expensive to change. Make them explicit, base them on measurable quality goals, record why, and keep them testable. Sources checked on 2026-10-16.

## 1. Start from quality attributes, not from a style

- List the business drivers and turn them into **quality attributes** with measurable scenarios. [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) defines a product quality model with nine top-level characteristics, including functional suitability, performance efficiency, compatibility, interaction capability, reliability, security and maintainability; use it as a checklist so none is forgotten.
- Write each attribute as a scenario: *source, stimulus, environment, response, measure*. For example "when a zone fails during peak load, checkout keeps 99.9% success and p99 under 800 ms".
- Rank them. Every architecture trades attributes against each other (consistency against latency, flexibility against simplicity, cost against redundancy); a ranking decides the trade-offs.
- Capture constraints: team size and skills, budget, deadlines, regulation, existing platforms. The design must fit the organization that will run it; Conway's law says systems mirror the communication structure of the organization that builds them ([Fowler on Conway's law](https://martinfowler.com/bliki/ConwaysLaw.html)), so align service boundaries with team boundaries ([Team Topologies](https://teamtopologies.com/key-concepts): stream-aligned, enabling, complicated-subsystem and platform teams).

## 2. Choose the simplest style that meets the attributes

Microsoft's Azure Architecture Center: "Each architecture style has its own trade-offs" and "Focus more on why you're selecting a specific style than on how to implement it" ([architecture styles](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/)).

| Style | Fits | Costs |
| :--- | :--- | :--- |
| Layered (N-tier) | Traditional business applications, low change frequency | Changes cut across layers |
| Modular monolith | Most new products: one deployable unit, strict internal module boundaries | Needs discipline (enforced module rules) to stay modular |
| Hexagonal (ports and adapters) | Core logic that must be testable without its databases and devices ([Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)) | An extra interface per external dependency |
| Web-queue-worker | Simple domains with some heavy or slow background work | Front end and worker can each grow into monoliths |
| Microservices | Complicated domains, many teams, independent deployment and scaling | Distributed-systems complexity, data consistency, operations maturity |
| Event-driven | Near-real-time reactions, many independent consumers, IoT, streaming | Delivery guarantees, ordering, eventual consistency |
| Serverless functions | Spiky or event-triggered workloads, small teams | Cold starts, execution limits, vendor coupling, harder local testing |
| Big data and big compute | Large datasets or compute-heavy jobs ([data-engineering](../data-engineering/SKILL.md)) | Specialist infrastructure and cost |

- Default to a **modular monolith** for a new product: Martin Fowler advises that you "shouldn't start a new project with microservices" ([MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)). Extract a service when a module has a clear reason: separate scaling, separate release cadence, separate team, or isolation of a risky dependency.
- Keep the core free of framework and infrastructure details (dependency inversion, functional core and imperative shell, [01-core-principles](../../rules/01-core-principles.md) section 5).
- Make modules **deep**: much behaviour behind a small interface, at a seam where tests cross the same interface as callers. Apply the deletion test before adding a layer, and add a port only when two adapters (usually production and test) need it. Vocabulary, dependency categories and "design it twice": [references/deep-modules.md](references/deep-modules.md).

## 3. Model the domain

[Domain-driven design](https://www.domainlanguage.com/ddd/reference/) gives the vocabulary for boundaries:

- **Ubiquitous language**: the same terms in conversations, code and data. Write them down in a `GLOSSARY.md` at the repository root ([template](../project-bootstrap/assets/GLOSSARY.template.md)) once the first term is settled: one or two sentences per term, one word per concept with rejected synonyms listed under "Avoid", project-specific terms only, no implementation details. Agents and people then name files, functions and tickets consistently. While designing, challenge any term that conflicts with the glossary, propose a precise word for a vague one, test definitions against concrete edge-case scenarios, and check that the code agrees with what people say it does (practice adapted from Matt Pocock's [domain-modeling skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling), MIT).
- **Bounded context**: a boundary within which a model and its terms are consistent ([Fowler](https://martinfowler.com/bliki/BoundedContext.html)); service and module boundaries follow bounded contexts, not database tables. Microsoft's [domain analysis guide](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis) walks through it.
- **Aggregates** protect invariants inside one transaction; reference other aggregates by ID.
- **Context mapping**: decide how contexts integrate (shared contract, customer and supplier, published language); put an [anti-corruption layer](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) in front of legacy or third-party models.

## 4. Distributed-systems trade-offs

Once data or calls cross a network, these become design decisions, not details:

- **CAP and PACELC**: during a network partition a system chooses between availability and consistency; PACELC adds that *else*, in normal operation, it chooses between latency and consistency (Abadi, [IEEE Computer, February 2012](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf)). State the choice per data set.
- **Consistency models**: know which one each store and API offers (linearizable, serializable, causal, read-your-writes, eventual); [Jepsen's map of consistency models](https://jepsen.io/consistency) defines them. Do not assume stronger guarantees than documented.
- **Consensus**: use proven implementations (Raft in etcd, Consul, many databases; [raft.github.io](https://raft.github.io/)), never a home-made protocol.
- **Delivery semantics**: networks give at-most-once or at-least-once; "exactly once" is at-least-once plus idempotent processing. Make every handler and every retried write **idempotent** (idempotency keys, deduplication, upserts).
- **Cross-service consistency**: no distributed transactions across services. Use the [transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) to publish events atomically with a state change, and a [saga](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) with compensating actions for multi-step business processes.
- **Read and write models**: [CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs) and [event sourcing](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) fit audit-heavy or read-heavy domains; both add complexity, so use them for a bounded context that needs them, not system-wide.
- **Time and order**: clocks on different machines disagree; order events with sequence numbers or versions from one source, not wall-clock timestamps.
- **Protocols and contracts**: version APIs and events, evolve them compatibly (add, never repurpose fields), and validate input strictly; [RFC 9413](https://www.rfc-editor.org/rfc/rfc9413) explains why tolerating malformed input harms long-term interoperability. Expect [Hyrum's law](https://www.hyrumslaw.com/): with enough users, "all observable behaviors of your system will be depended on by somebody", so treat behaviour changes as contract changes.

## 5. Design for failure

Every remote call can be slow, fail, or succeed without a reply. Patterns, with Microsoft's [cloud design pattern catalog](https://learn.microsoft.com/en-us/azure/architecture/patterns/) as reference:

| Pattern | Purpose |
| :--- | :--- |
| Timeouts on every call | Bound waiting; budgets shrink along the call chain |
| [Retry](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) with exponential backoff and jitter | Recover from transient faults; idempotent operations only; retry at one layer only ([AWS Builders' Library](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)) |
| [Circuit breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) | Stop calling a dependency that keeps failing; fail fast while it recovers |
| [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) | Separate pools so one slow dependency cannot exhaust all threads or connections |
| [Rate limiting](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern) and [load shedding](https://builder.aws.com/content/3Eun1EEyX6p2e3VYNyRLSJzLuMV/using-load-shedding-to-avoid-overload) | Reject excess work early and cheaply instead of collapsing under overload |
| [Queue-based load leveling](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) | Absorb bursts; consumers work at a sustainable rate with back-pressure |
| [Health endpoints](https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring) | Liveness and readiness that reflect real health ([AWS on health checks](https://builder.aws.com/content/3Ev53O39izHCtWLzp4XU6t8PC1O/implementing-health-checks)) |
| [Static stability](https://builder.aws.com/content/3K9SiqiJ369TGkkGzqPM95BuYWI/static-stability-using-availability-zones) | "the overall system keeps working even when a dependency becomes impaired": pre-provisioned capacity, no control-plane calls on the data path |
| [Cell-based architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html) and [shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding) | Limit the blast radius of a failure or a bad tenant to one cell or shard |
| Graceful degradation | Keep the core journey working with reduced features |

- Be careful with **fallbacks**. AWS: "we avoid fallback in our systems because it's difficult to prove and its effectiveness is hard to test", and prefers code paths "exercised in production continuously rather than rarely" ([Avoiding fallback](https://builder.aws.com/content/3EuS9Sakq7L3VLQIF3qzfMfke1Y/avoiding-fallback-in-distributed-systems)). If you keep one, exercise it regularly.
- Prove the patterns work with failure injection ([chaos-engineering](../chaos-engineering/SKILL.md)), and set reliability targets as SLOs with recovery objectives (RTO, RPO) per system ([cloud-infrastructure](../cloud-infrastructure/SKILL.md)).

## 6. Scalability, performance and cost

- Estimate before building: requests per second at peak, data volume and growth, read/write ratio, payload sizes, latency budget per hop.
- **Little's law** (L = λW): concurrent requests in the system equal arrival rate times time in the system; use it to size pools, queues and instances. **Amdahl's law**: the serial part of a workload limits the speed-up from parallelism.
- Scale stateless components horizontally; keep state in services built for it; partition data by a key that spreads load evenly and keeps related data together.
- Cache with an explicit invalidation and expiry strategy, and measure the hit rate; caches add consistency questions.
- Measure, then optimize ([01-core-principles](../../rules/01-core-principles.md) section 6); load-test the design ([quality-assurance](../quality-assurance/SKILL.md)).
- Include cost and carbon as attributes: estimate cost per transaction ([FinOps](https://www.finops.org/framework/)); the Green Software Foundation's [Software Carbon Intensity](https://greensoftware.foundation/standards/sci/) (ISO/IEC 21031:2024) is "(E × I + M) per R", a rate per functional unit such as per request.

## 7. Decide, document, and keep it true

- **Decision records**: one [ADR](https://adr.github.io/) per architecturally significant decision ("a justified design choice that addresses a functional or non-functional requirement"), with context, options considered, decision and consequences ([ADR template](../project-bootstrap/assets/adr-template.md)). Separate reversible decisions (decide fast) from irreversible ones (prototype, spike or review first). Write an ADR when all three hold: the decision is hard to reverse, a future reader would be surprised by it without context, and it resulted from a real trade-off between alternatives.
- **Diagrams as code**: the [C4 model](https://c4model.com/) gives four levels (system context, container, component, code); most teams need only the first two. Draw them in Mermaid or Structurizr so they are reviewed with the code. [arc42](https://arc42.org/) is a ready template for a full architecture document ([technical-documentation](../technical-documentation/SKILL.md)).
- **Fitness functions**: automate checks of architectural rules so the design does not erode: dependency rules between modules (ArchUnit 1.5.1 for Java, dependency-cruiser 18.6.0 for JavaScript and TypeScript, import-linter 2.15 for Python; versions checked on 2026-10-16), performance budgets in CI, SLO alerts in production.
- **Evolve incrementally**: migrate large systems with the [strangler fig](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) pattern ([change-existing-code](../change-existing-code/SKILL.md)); track deliberate technical debt and its pay-back plan ([Fowler's technical debt quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)).

### Survey an existing codebase for deepening opportunities

Adapted from Matt Pocock's [improve-codebase-architecture skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture) (MIT). Run it every so often; it finds candidates, it does not untangle a legacy system on its own.

1. **Scope first.** Take the area the user names; otherwise find the hot spots in recent history (`git log --name-only` over a good stretch) and look there, because deepening pays off where code keeps changing. Read `GLOSSARY.md` and the ADRs for the area.
2. **Note friction**: one concept spread over many small modules, shallow interfaces, logic extracted for testability while the bugs sit in how it is called, coupling that leaks across seams, code that is hard to test through its interface. Apply the deletion test to each suspect.
3. **Present candidates**, each with the files involved, the problem, the proposed change, the benefit in locality, leverage and testability, a before and after sketch, and a strength (strong, worth exploring, speculative). Flag any that contradict an ADR and say why it is worth reopening. Propose no interfaces yet; let the user pick.
4. **Resolve the chosen one** with the user (the design-tree interview in [feature-specification](../feature-specification/SKILL.md) section 1), update the glossary as terms settle, design the interface twice ([deep modules](references/deep-modules.md)), and record a rejection with a lasting reason as an ADR so later surveys do not suggest it again. Changing the code follows [change-existing-code](../change-existing-code/SKILL.md) and needs the user's go-ahead ([AGENTS.md](../../../AGENTS.md) non-negotiable 9).

## 8. Review a design

Check, in order: requirements and ranked quality attributes; the simplest style that meets them; boundaries along the domain and the teams; data ownership and consistency per data set; failure modes of every dependency and the pattern that handles each; security (trust boundaries, threat model, [security-hardening](../security-hardening/SKILL.md)); observability; capacity estimate and cost; migration and rollback path; decisions recorded. The cloud providers' well-architected frameworks ([AWS](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html), [Azure](https://learn.microsoft.com/en-us/azure/well-architected/), [Google Cloud](https://cloud.google.com/architecture/framework/reliability)) provide pillar-by-pillar checklists.

## Done when

- [ ] Quality attributes are ranked and written as measurable scenarios
- [ ] The chosen style is justified against at least one simpler alternative in an ADR
- [ ] Boundaries, data ownership and the consistency choice for each data set are explicit
- [ ] Every remote dependency has a timeout and a documented failure behaviour, verified by a test or a chaos experiment
- [ ] Context and container diagrams exist as code; architectural rules are checked automatically where tooling exists
