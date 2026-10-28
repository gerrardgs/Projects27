# Engineering Concepts

Where each software engineering concept is applied in this specification, with a primary source to read. It complements [domain-coverage.md](domain-coverage.md), which maps roles and technical domains. Every link below was checked on 2026-10-16.

No finite document can hold every concept ever named. This index is therefore anchored to the field's own reference, the IEEE Computer Society's [SWEBOK Guide V4.0a](https://www.computer.org/education/bodies-of-knowledge/software-engineering), whose "18 knowledge areas (KAs) summarize key concepts" (section 1), then lists the named concepts engineers use daily (section 2). For a concept that is not listed, follow section 4.

## 1. SWEBOK V4.0a knowledge areas

| Knowledge area | Where it is applied here |
| :--- | :--- |
| Software Requirements | [feature-specification](skills/feature-specification/SKILL.md) |
| Software Architecture | [software-architecture](skills/software-architecture/SKILL.md) |
| Software Design | [software-architecture](skills/software-architecture/SKILL.md), rule [02](rules/02-clean-code.md), [API design reference](skills/backend-engineering/references/api-design.md) |
| Software Construction | Rules [01](rules/01-core-principles.md), [02](rules/02-clean-code.md), [05](rules/05-error-handling.md); [native-from-scratch](skills/native-from-scratch/SKILL.md), [technology-adoption](skills/technology-adoption/SKILL.md) |
| Software Testing | Rule [07](rules/07-testing.md); [test-engineering](skills/test-engineering/SKILL.md), [quality-assurance](skills/quality-assurance/SKILL.md), [chaos-engineering](skills/chaos-engineering/SKILL.md) |
| Software Engineering Operations | [deploy-and-release](skills/deploy-and-release/SKILL.md), [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md), [it-operations](skills/it-operations/SKILL.md), [chaos-engineering](skills/chaos-engineering/SKILL.md) |
| Software Maintenance | [change-existing-code](skills/change-existing-code/SKILL.md), [systematic-debugging](skills/systematic-debugging/SKILL.md) |
| Software Configuration Management | Rules [04](rules/04-dependencies.md), [08](rules/08-git-workflow.md); [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) |
| Software Engineering Management | [feature-specification](skills/feature-specification/SKILL.md) (plans and tasks), [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) (DORA metrics) |
| Software Engineering Process | [AGENTS.md](../AGENTS.md) section 3 (workflow), rule [09](rules/15-clean-execution.md) |
| Software Engineering Models and Methods | [feature-specification](skills/feature-specification/SKILL.md), [software-architecture](skills/software-architecture/SKILL.md) (C4, domain-driven design), [test-engineering](skills/test-engineering/SKILL.md) |
| Software Quality | Rule [03](rules/03-verification.md); [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md), [quality-assurance](skills/quality-assurance/SKILL.md) |
| Software Security | Rule [06](rules/06-security.md); [security-hardening](skills/security-hardening/SKILL.md) and its references |
| Software Engineering Professional Practice | [AGENTS.md](../AGENTS.md) sections 1 and 2, rule [08](rules/08-git-workflow.md) (AI-assistance disclosure), [technical-documentation](skills/technical-documentation/SKILL.md), [security domain standards](skills/security-hardening/references/domain-standards.md) (law and regulation) |
| Software Engineering Economics | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) (FinOps), [software-architecture](skills/software-architecture/SKILL.md) section 6, [technology-adoption](skills/technology-adoption/SKILL.md) (licence, end of life) |
| Computing Foundations | [software-architecture](skills/software-architecture/SKILL.md) section 4, [language security reference](skills/security-hardening/references/language-security.md), [native-from-scratch](skills/native-from-scratch/SKILL.md) |
| Mathematical Foundations | [data-analysis](skills/data-analysis/SKILL.md) (statistics), [machine-learning](skills/machine-learning/SKILL.md), [software-architecture](skills/software-architecture/SKILL.md) section 6 (Little's and Amdahl's laws) |
| Engineering Foundations | Measurement and experiments: rule [01](rules/01-core-principles.md) section 6, [data-analysis](skills/data-analysis/SKILL.md), [chaos-engineering](skills/chaos-engineering/SKILL.md) |

## 2. Named concepts

### Code design

| Concept | Where | Source |
| :--- | :--- | :--- |
| KISS, YAGNI, duplication of knowledge (DRY) | Rule [01](rules/01-core-principles.md) section 2 | |
| Single responsibility, high cohesion, small public surface | Rule [02](rules/02-clean-code.md) section 3 | |
| Dependency inversion, ports and adapters, functional core with I/O at the edges | Rule [01](rules/01-core-principles.md) section 5, [software-architecture](skills/software-architecture/SKILL.md) section 2 | [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/) |
| Deep modules, seams, adapters, the deletion test, design it twice | [software-architecture](skills/software-architecture/SKILL.md) section 2 and [deep-modules reference](skills/software-architecture/references/deep-modules.md) | [codebase-design skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design) |
| Explicit dependencies, no hidden global state, immutability | Rule [02](rules/02-clean-code.md) section 5 | |
| Make invalid states unrepresentable, typed identifiers | Rule [02](rules/02-clean-code.md) section 4 | |
| Fail fast, validate at the boundary, fail closed | Rules [05](rules/05-error-handling.md), [06](rules/06-security.md) section 8 | |
| Complexity limits, code smells | Rule [02](rules/02-clean-code.md) sections 3 and 7 | [Code smell](https://martinfowler.com/bliki/CodeSmell.html) |
| Refactoring in small behaviour-preserving steps | [change-existing-code](skills/change-existing-code/SKILL.md) | [Refactoring catalog](https://refactoring.com/catalog/) |
| Existing code is preserved: never delete, overwrite or rewrite it on your own; propose, discuss and wait for the decision | [AGENTS.md](../AGENTS.md) non-negotiable 9, rule [09](rules/15-clean-execution.md) section 2, [change-existing-code](skills/change-existing-code/SKILL.md) | |
| Think before coding, surgical changes, goal-driven execution, correcting your own reasoning | Rule [01](rules/01-core-principles.md) sections 1, 2 and 8, rule [09](rules/15-clean-execution.md) section 1, [systematic-debugging](skills/systematic-debugging/SKILL.md) | [Karpathy-inspired guidelines](https://github.com/multica-ai/andrej-karpathy-skills) |
| Hyrum's law: "all observable behaviors of your system will be depended on by somebody" | [software-architecture](skills/software-architecture/SKILL.md) section 4 (contracts) | [hyrumslaw.com](https://www.hyrumslaw.com/) |

### Architecture and distributed systems

| Concept | Where | Source |
| :--- | :--- | :--- |
| Quality attributes | [software-architecture](skills/software-architecture/SKILL.md) section 1 | [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) |
| Architecture styles, modular monolith first | [software-architecture](skills/software-architecture/SKILL.md) section 2 | [Azure architecture styles](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/), [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) |
| Domain-driven design, bounded contexts, anti-corruption layer | [software-architecture](skills/software-architecture/SKILL.md) section 3 | [DDD reference](https://www.domainlanguage.com/ddd/reference/) |
| Ubiquitous language written down as `GLOSSARY.md` | [software-architecture](skills/software-architecture/SKILL.md) section 3, [glossary template](skills/project-bootstrap/assets/GLOSSARY.template.md) | [domain-modeling skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling) |
| Conway's law, team types | [software-architecture](skills/software-architecture/SKILL.md) section 1 | [Conway's law](https://martinfowler.com/bliki/ConwaysLaw.html), [Team Topologies](https://teamtopologies.com/key-concepts) |
| CAP, PACELC, consistency models, consensus | [software-architecture](skills/software-architecture/SKILL.md) section 4 | [PACELC](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf), [Jepsen](https://jepsen.io/consistency), [Raft](https://raft.github.io/) |
| Idempotency, delivery semantics, outbox, saga, CQRS, event sourcing | [software-architecture](skills/software-architecture/SKILL.md) section 4, [backend-engineering](skills/backend-engineering/SKILL.md) | [Outbox](https://microservices.io/patterns/data/transactional-outbox.html), [Azure patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) |
| Recurring distributed-systems solutions (leader election, write-ahead log, quorum) | Use proven implementations, [software-architecture](skills/software-architecture/SKILL.md) section 4 | [Patterns of Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/) |
| Decision records, C4 diagrams, arc42, fitness functions, strangler fig | [software-architecture](skills/software-architecture/SKILL.md) section 7 | [ADR](https://adr.github.io/), [C4](https://c4model.com/), [arc42](https://arc42.org/) |
| Little's law, Amdahl's law, capacity estimation | [software-architecture](skills/software-architecture/SKILL.md) section 6 | |

### Reliability, resilience and chaos engineering

| Concept | Where | Source |
| :--- | :--- | :--- |
| Timeouts, retries with backoff and jitter, circuit breaker, bulkhead | Rule [05](rules/05-error-handling.md), [software-architecture](skills/software-architecture/SKILL.md) section 5, [api-integration](skills/api-integration/SKILL.md) kit | [AWS Builders' Library](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter), [Circuit breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) |
| Load shedding, rate limiting, back-pressure, graceful degradation | [software-architecture](skills/software-architecture/SKILL.md) section 5 | [Handling overload](https://sre.google/sre-book/handling-overload/), [Cascading failures](https://sre.google/sre-book/addressing-cascading-failures/) |
| Static stability, cells, shuffle sharding, blast radius | [software-architecture](skills/software-architecture/SKILL.md) section 5 | [Cell-based architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html) |
| Chaos engineering: steady state, hypothesis, fault injection, stop conditions, game days | [chaos-engineering](skills/chaos-engineering/SKILL.md) and its runnable kit | [Principles of Chaos Engineering](https://principlesofchaos.org/), [AWS REL12-BP04](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_failure_injection_resiliency.html), [Azure RE:08](https://learn.microsoft.com/en-us/azure/well-architected/reliability/reliability-test) |
| Failure mode analysis (FMEA) | [chaos-engineering](skills/chaos-engineering/SKILL.md) section 3 | [Azure failure mode analysis](https://learn.microsoft.com/en-us/azure/well-architected/reliability/failure-mode-analysis) |
| Disaster recovery, RTO and RPO, restore tests | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) section 6 | [AWS reliability pillar](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) |

### Site reliability engineering and observability

| Concept | Where | Source |
| :--- | :--- | :--- |
| SLIs, SLOs, error budgets, burn-rate alerts | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) section 5 | [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) |
| Toil and its budget | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) section 5 | [Eliminating toil](https://sre.google/sre-book/eliminating-toil/) |
| Golden signals (latency, traffic, errors, saturation), RED, USE | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) section 5 | [Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/), [RED](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/), [USE](https://www.brendangregg.com/usemethod.html) |
| Logs, metrics, traces | [deploy-and-release](skills/deploy-and-release/SKILL.md) section 5 | [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) |
| Incident response, blameless post-incident review, runbooks | [systematic-debugging](skills/systematic-debugging/SKILL.md), [deploy-and-release](skills/deploy-and-release/SKILL.md) sections 6 and 7 | [Postmortem culture](https://sre.google/sre-book/postmortem-culture/), [PagerDuty incident response](https://response.pagerduty.com/) |

### Delivery and DevOps

| Concept | Where | Source |
| :--- | :--- | :--- |
| Continuous integration, trunk-based development | [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md), rule [08](rules/08-git-workflow.md) | [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/) |
| Continuous delivery, canary, blue-green, feature flags, expand and contract | [deploy-and-release](skills/deploy-and-release/SKILL.md) sections 3 and 4 | [continuousdelivery.com](https://continuousdelivery.com/), [Feature toggles](https://martinfowler.com/articles/feature-toggles.html), [Parallel change](https://martinfowler.com/bliki/ParallelChange.html) |
| DORA metrics | [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) section 5 | [dora.dev](https://dora.dev/guides/dora-metrics/) |
| Infrastructure as code, GitOps, images pinned by digest | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) | [OpenGitOps](https://opengitops.dev/) (declarative, versioned and immutable, pulled automatically, continuously reconciled) |
| Twelve-Factor App | [deploy-and-release](skills/deploy-and-release/SKILL.md) | [12factor.net](https://12factor.net/) |
| Platform engineering | [domain-coverage](domain-coverage.md) (platform engineer role), [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md), [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) | [CNCF platforms white paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/) |
| Semantic versioning, conventional commits, changelogs | Rule [08](rules/08-git-workflow.md) | [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html), [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) |
| Supply-chain integrity (SBOM, provenance, SLSA) | [security-hardening](skills/security-hardening/SKILL.md), [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) | [SLSA 1.2](https://slsa.dev/spec/v1.2/) |

### Quality and testing

| Concept | Where | Source |
| :--- | :--- | :--- |
| Test levels and the test pyramid | [test-engineering](skills/test-engineering/SKILL.md) section 2 | [The practical test pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) |
| Test-driven development (red, green, refactor) | [test-engineering](skills/test-engineering/SKILL.md), [systematic-debugging](skills/systematic-debugging/SKILL.md) (failing test first) | [Fowler on TDD](https://martinfowler.com/bliki/TestDrivenDevelopment.html) |
| Vertical slices, agreed seams, tautological and implementation-coupled tests | [test-engineering](skills/test-engineering/SKILL.md) section 3 | [tdd skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd) |
| Feedback loop first in debugging (red-capable, deterministic, fast), ranked falsifiable hypotheses | [systematic-debugging](skills/systematic-debugging/SKILL.md) | [diagnosing-bugs skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/diagnosing-bugs) |
| Behaviour-driven development, Given/When/Then | [feature-specification](skills/feature-specification/SKILL.md) | [Cucumber BDD](https://cucumber.io/docs/bdd/) |
| Property-based, mutation, fuzz and contract testing | [test-engineering](skills/test-engineering/SKILL.md), [quality-assurance](skills/quality-assurance/SKILL.md) | [Hypothesis](https://hypothesis.readthedocs.io/), [Stryker](https://stryker-mutator.io/), [OSS-Fuzz](https://google.github.io/oss-fuzz/), [Pact](https://docs.pact.io/) |
| Characterization tests for legacy code | [change-existing-code](skills/change-existing-code/SKILL.md) | |
| Code review standard | [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md) | [Google engineering practices](https://google.github.io/eng-practices/review/reviewer/standard.html) |
| Resilience, load, accessibility and security testing | [quality-assurance](skills/quality-assurance/SKILL.md), [chaos-engineering](skills/chaos-engineering/SKILL.md) | |

### Security and privacy engineering

| Concept | Where | Source |
| :--- | :--- | :--- |
| Secure by design and by default | Rule [06](rules/06-security.md) | [CISA Secure by Design](https://www.cisa.gov/securebydesign) |
| Threat modelling (STRIDE) | [security-hardening](skills/security-hardening/SKILL.md) | [OWASP threat modeling cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| Vulnerability auditing: attack classes, boundary-and-result evidence, independent validation, severity calibration, coverage | [security-hardening](skills/security-hardening/SKILL.md) section 9, [attack classes](skills/security-hardening/references/attack-classes.md), [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md) sections 4 and 5, rule [06](rules/06-security.md) section 10 | [Cloudflare security-audit skill](https://github.com/cloudflare/security-audit-skill) |
| Least privilege, deny by default, zero trust | Rule [06](rules/06-security.md) section 4, [it-operations](skills/it-operations/SKILL.md) | [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) |
| Secure development lifecycle | [security domain standards](skills/security-hardening/references/domain-standards.md) | [NIST SP 800-218 SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) |
| Privacy by design, data minimisation | [security domain standards](skills/security-hardening/references/domain-standards.md), rule [06](rules/06-security.md) section 8 | [GDPR Article 25](https://gdpr-info.eu/art-25-gdpr/) |

### Data, AI and machine learning engineering

| Concept | Where | Source |
| :--- | :--- | :--- |
| Idempotent pipelines, data contracts, lineage, data quality | [data-engineering](skills/data-engineering/SKILL.md) | [Data Contract](https://datacontract.com/), [OpenLineage](https://openlineage.io/) |
| Experiment design, statistical testing | [data-analysis](skills/data-analysis/SKILL.md) | |
| MLOps, reproducibility, drift monitoring, model cards | [machine-learning](skills/machine-learning/SKILL.md), [ml-inference-serving](skills/ml-inference-serving/SKILL.md) | [ml-ops.org](https://ml-ops.org/), [Model cards](https://modelcards.withgoogle.com/) |
| Model Context Protocol: building servers, and finding, vetting and configuring existing ones | [ai-agent-systems](skills/ai-agent-systems/SKILL.md) and its [MCP servers reference](skills/ai-agent-systems/references/mcp-servers.md), rules [04](rules/04-dependencies.md) and [06](rules/06-security.md) | [MCP security best practices](https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices), [MCP Registry](https://registry.modelcontextprotocol.io/) |
| LLM evaluation, retrieval grounding, agent guardrails, AI risk management | [llm-applications](skills/llm-applications/SKILL.md), [rag-systems](skills/rag-systems/SKILL.md), [ai-agent-systems](skills/ai-agent-systems/SKILL.md) | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) |

### People, process and sustainability

| Concept | Where | Source |
| :--- | :--- | :--- |
| Spec-driven development, acceptance criteria | [feature-specification](skills/feature-specification/SKILL.md) | |
| Grilling (resolving the design tree with the user), tracer-bullet tasks with blocking edges, throwaway prototypes | [feature-specification](skills/feature-specification/SKILL.md) | [grilling](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) and [to-tickets](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets) skills |
| Two-axis review (spec conformance apart from standards), one-way and two-way doors with blast radius in pull requests, handoff notes | [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md) section 3, rules [08](rules/08-git-workflow.md) section 4 and [09](rules/15-clean-execution.md) section 7 | [code-review](https://github.com/mattpocock/skills/tree/main/skills/engineering/code-review), [pr](https://github.com/mattpocock/skills/tree/main/skills/engineering/pr) and [handoff](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) skills |
| Agile values, Scrum, Kanban | Follow the team's process; [feature-specification](skills/feature-specification/SKILL.md) section 3 (small, ordered, verifiable tasks) | [Agile Manifesto](https://agilemanifesto.org/), [Scrum Guide](https://scrumguides.org/scrum-guide.html), [Kanban Guide](https://kanbanguides.org/) |
| Technical debt | [software-architecture](skills/software-architecture/SKILL.md) section 7 | [Technical debt quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html) |
| Documentation (Diátaxis), docs as code | [technical-documentation](skills/technical-documentation/SKILL.md) | [Diátaxis](https://diataxis.fr/) |
| The complete project documentation set (`docs/`) with a completeness check | [technical-documentation](skills/technical-documentation/SKILL.md) section 5 | |
| Anti-slop: purpose test, no fabricated content, working controls, plain comments and prose | [anti-slop](skills/anti-slop/SKILL.md) | [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) |
| Text hygiene: invisible Unicode stripping, stylometric rewrites, voice preservation | [clean-user-facing-text](skills/clean-user-facing-text/SKILL.md) | [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) |
| Provenance hygiene: multi-vendor AI watermarks, C2PA, container metadata removal | [remove-ai-marks](skills/remove-ai-marks/SKILL.md) | [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) |
| Inner source (open-source practices inside a company) | Rule [08](rules/08-git-workflow.md), the [contributing guide](https://github.com/gerrardgs/Projects23/blob/main/docs/CONTRIBUTING.md) | [InnerSource Commons](https://innersourcecommons.org/) |
| Accessibility, internationalization | [web-frontend-engineering](skills/web-frontend-engineering/SKILL.md), [mobile-engineering](skills/mobile-engineering/SKILL.md) | [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Unicode CLDR](https://www.unicode.org/cldr/) |
| Cost engineering (FinOps), software carbon intensity | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) section 7, [software-architecture](skills/software-architecture/SKILL.md) section 6 | [FinOps Framework](https://www.finops.org/framework/), [SCI (ISO/IEC 21031:2024)](https://greensoftware.foundation/standards/sci/) |

## 3. Neighbouring engineering disciplines

These have their own bodies of knowledge and, where lives or safety are at stake, their own regulation. This specification supplies the software practices; the discipline's standards decide what is required.

| Discipline | Starting point | What carries over from here |
| :--- | :--- | :--- |
| Systems engineering | [SEBoK](https://www.sebokwiki.org/wiki/Guide_to_the_Systems_Engineering_Body_of_Knowledge_%28SEBoK%29) | Requirements, interfaces, verification ([feature-specification](skills/feature-specification/SKILL.md), [software-architecture](skills/software-architecture/SKILL.md)) |
| Reliability and resilience engineering | FMEA, the [chaos-engineering](skills/chaos-engineering/SKILL.md) sources | Failure mode analysis, experiments, learning from incidents |
| Safety-critical software (medical, automotive, avionics, industrial control) | The sector's functional-safety standard, which the owner must name | Traceable requirements, independent review, full test evidence; never relax a mandated process to save time |
| Embedded, robotics, games, scientific computing | [domain-coverage.md](domain-coverage.md) section 4 | The lifecycle skills and always-on rules |

## 4. A concept that is not listed

1. Find the primary source: the standard body, the originator, or the official documentation, for the version or edition in use ([03-verification](rules/03-verification.md)). Secondary summaries are hints only.
2. Identify the knowledge area in section 1 and load the skill listed there.
3. Apply the concept in the smallest form that solves the problem ([01-core-principles](rules/01-core-principles.md)); record significant adoptions in an ADR.
4. Verify it with a test, a measurement or an experiment, and cite the source in the code comment, ADR or documentation that relies on it.
