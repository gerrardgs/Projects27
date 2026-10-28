# Engineering Concepts Map

Every engineering concept that matters for design and front-end work, what it means here, and where this specification puts it into practice. The backbone is the authoritative body of knowledge for the profession, the [SWEBOK Guide V4.0](https://www.computer.org/education/bodies-of-knowledge/software-engineering/topics) (IEEE Computer Society, 18 knowledge areas), complemented by quality, reliability, security, delivery and human-centred engineering sources. Sources were checked on 2026-10-16.

No single document can contain every idea in engineering. This map is complete for the scope of Projects 24 (design, front-end, mobile and the lifecycle around them). Back-end, data, machine learning and infrastructure engineering are covered in depth by the companion project [Projects 23](https://github.com/gerrardgs/Projects23). For a concept or tool not listed here, use [rule 04 section 9](../../.agents/rules/04-dependencies.md#9-adopting-any-tool-framework-service-or-platform).

Paths are relative to this file. **R-NN** means `.agents/rules/NN-*.md`.

## 1. SWEBOK V4.0 knowledge areas

| # | Knowledge area | In design and front-end work | Where in this spec |
| :- | :--- | :--- | :--- |
| 1 | Software Requirements Fundamentals | Briefs, users, jobs to be done, acceptance criteria, non-functional requirements (accessibility, performance, privacy) | [ux-research-and-strategy](../../.agents/skills/ux-research-and-strategy/SKILL.md), [AGENTS.md](../../AGENTS.md) section 3 |
| 2 | Software Architecture (new in V4) | Rendering strategy, component architecture, design-system architecture, micro-frontends, islands | [framework-frontend-engineering](../../.agents/skills/framework-frontend-engineering/SKILL.md), section 4 below |
| 3 | Software Design | Interface design, component APIs, design tokens, state models | [ui-design-and-prototyping](../../.agents/skills/ui-design-and-prototyping/SKILL.md), [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md), R-02 |
| 4 | Software Construction | Clean, typed, idiomatic HTML, CSS and TypeScript; standard library and platform first | R-01, R-02, R-11, [frontend-from-scratch](../../.agents/skills/frontend-from-scratch/SKILL.md) |
| 5 | Software Testing Fundamentals | Unit, component, end-to-end, visual, accessibility, performance and chaos tests | R-07, [test-engineering](../../.agents/skills/test-engineering/SKILL.md), [frontend-testing-and-visual-qa](../../.agents/skills/frontend-testing-and-visual-qa/SKILL.md) |
| 6 | Software Engineering Operations (new in V4) | Deployment, hosting, monitoring, incident response, reliability | [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md), [deploy-and-release](../../.agents/skills/deploy-and-release/SKILL.md), [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md) |
| 7 | Software Maintenance | Refactoring, upgrades, deprecations, technical debt | [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) |
| 8 | Software Configuration Management | Git, lockfiles, versioning, generated files, design-file versioning | R-08, R-15 |
| 9 | Software Engineering Management | Planning, estimation, measurement (DORA), risk | Section 5 below |
| 10 | Software Engineering Process | Workflow, definition of done, CI/CD, design process (Double Diamond) | [AGENTS.md](../../AGENTS.md) sections 3 and 7, [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| 11 | Software Engineering Models and Methods | Design systems as models, state machines, token models (DTCG), C4 diagrams | [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md), section 4 below |
| 12 | Software Quality | Quality model (section 2), reviews, audits, verification | R-03, [rigorous-code-audit](../../.agents/skills/rigorous-code-audit/SKILL.md), [design-critique-and-review](../../.agents/skills/design-critique-and-review/SKILL.md) |
| 13 | Software Security (new in V4) | Browser security, CSP and Trusted Types, supply chain, secrets, agent security | R-06, [security-hardening](../../.agents/skills/security-hardening/SKILL.md), [SECURITY.md](../../SECURITY.md) |
| 14 | Software Engineering Professional Practice | Ethics, accessibility law, licensing, honest reporting | R-13, R-14, [AGENTS.md](../../AGENTS.md) section 2 |
| 15 | Software Engineering Economics | Cost of dependencies, performance budgets, design debt, build versus buy | R-04 section 9, R-12 |
| 16 | Computing Foundations | Browsers, networking, HTTP, rendering, data structures and complexity | R-01 section 6, [browser debugging](../../.agents/skills/systematic-debugging/references/browser-debugging.md) |
| 17 | Mathematical Foundations | Colour science (contrast and luminance formulas), geometry of layout, statistics for research and A/B tests | [design-tokens template](../../.agents/skills/design-system-and-tokens/assets/design-tokens/tokens.ts), [ux-research-and-strategy](../../.agents/skills/ux-research-and-strategy/SKILL.md) |
| 18 | Engineering Foundations | Measurement, experiments, root-cause analysis, standards | R-03, [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md), [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md) |

## 2. Product quality model (ISO/IEC 25010:2023)

The [2023 edition](https://www.iso.org/standard/78176.html) defines nine product quality characteristics ([overview](https://quality.arc42.org/standards/iso-25010)). Interaction capability replaced "usability", and flexibility and safety became top-level characteristics.

| Characteristic | In design and front-end work | Where |
| :--- | :--- | :--- |
| Functional suitability | The design solves the stated problem; every state works | R-09, [AGENTS.md](../../AGENTS.md) section 7 |
| Performance efficiency | Core Web Vitals, page weight, budgets | R-12, [web-performance-optimization](../../.agents/skills/web-performance-optimization/SKILL.md) |
| Compatibility | Browser support target, Baseline, interoperability | R-11, [modern CSS reference](../../.agents/skills/css-architecture-and-responsive/references/modern-css.md) |
| Interaction capability | Usability, learnability, inclusivity, user error protection, self-descriptiveness | R-09, R-10, R-14 |
| Reliability | Fault tolerance, availability, recoverability | [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md), R-05 |
| Security | Confidentiality, integrity, authenticity, resistance | R-06, [SECURITY.md](../../SECURITY.md) |
| Maintainability | Modularity, reusability, analysability, modifiability | R-02, R-15, [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md) |
| Flexibility | Adaptability to screens, input methods, languages and platforms | [css-architecture-and-responsive](../../.agents/skills/css-architecture-and-responsive/SKILL.md), [mobile-engineering](../../.agents/skills/mobile-engineering/SKILL.md) |
| Safety | Fail-safe behaviour, hazard warnings, no harm from errors (forms, payments, health or finance data) | R-05 section 2, R-14, [web-integrations-and-platforms](../../.agents/skills/web-integrations-and-platforms/SKILL.md) |

## 3. Design principles

| Concept | Meaning here | Where |
| :--- | :--- | :--- |
| KISS, YAGNI | Simplest correct solution; nothing speculative | R-01 section 2 |
| DRY (of knowledge) | One source of truth: tokens, components, security headers | R-01, [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md) |
| SOLID | Single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion; in components: one job each, extension by composition, small props | R-02 section 3, R-11 section 3 |
| Separation of concerns | HTML for meaning, CSS for presentation, JavaScript for behaviour; presentational versus container components | R-11 sections 1 and 3 |
| Composition over inheritance | Children, slots and hooks instead of deep component hierarchies | R-11 section 3 |
| Make invalid states unrepresentable | Discriminated unions for UI state | R-02 section 4 |
| Functional core, imperative shell | Pure logic, effects at the edges (as in the templates) | R-01 section 5 |
| Principle of least astonishment | Familiar patterns, consistent behaviour (Jakob's law) | R-09 section 2 |
| Robustness principle, with care | Accept input leniently only where safe; [RFC 9413](https://www.rfc-editor.org/rfc/rfc9413) explains why tolerating malformed input harms long-term interoperability, so this spec validates strictly at boundaries | R-05 section 3 |
| Progressive enhancement, graceful degradation | Core task with HTML; enhancements on top | R-11 section 1, [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md) |
| Design principles (visual) | Hierarchy, Gestalt, consistency, every state | R-09 |

## 4. Architecture

| Concept | Meaning here | Source |
| :--- | :--- | :--- |
| Rendering architectures | SSG, SSR, streaming, islands, client rendering, per route | [framework-frontend-engineering](../../.agents/skills/framework-frontend-engineering/SKILL.md) section 2 |
| Micro-frontends | Independently deployed parts of one UI; costs in consistency and performance | [Martin Fowler: micro frontends](https://martinfowler.com/articles/micro-frontends.html) |
| Design-system architecture | Primitive, semantic and component tokens; headless primitives; resolver-based themes | [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md) |
| Backend for frontend (BFF) | A server layer shaped for one UI; keeps secrets and aggregation off the client | [Projects 23 backend-engineering](https://github.com/gerrardgs/Projects23/tree/main/.agents/skills/backend-engineering) |
| Hexagonal (ports and adapters), clean architecture | Domain logic independent of frameworks and I/O | [Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/) |
| Domain-driven design | Ubiquitous language shared by design, content and code | [Domain Language](https://www.domainlanguage.com/ddd/) |
| Monorepos | Shared packages for design system and apps | [TOOLKIT](TOOLKIT.md) section 4 |
| Architecture description | C4 diagrams, arc42, decision records | [C4 model](https://c4model.com/), [arc42](https://arc42.org/), [ADR](https://adr.github.io/), [ADR template](../../.agents/skills/project-bootstrap/assets/adr-template.md) |
| Twelve-factor app | Configuration in the environment, disposability, parity | [12factor.net](https://12factor.net/), [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) |

## 5. Process, delivery and management

| Concept | Meaning here | Source and where |
| :--- | :--- | :--- |
| Agile, Scrum, Kanban, Lean UX | Small increments, feedback, learning | [Agile Manifesto](https://agilemanifesto.org/), [ux-research-and-strategy](../../.agents/skills/ux-research-and-strategy/SKILL.md) |
| Extreme programming | Test-driven development, pair programming, continuous integration, refactoring | R-07, [test-engineering](../../.agents/skills/test-engineering/SKILL.md) |
| Trunk-based development | Short-lived branches, feature flags, frequent integration | [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/), R-08 |
| DevOps and DORA metrics | Five delivery metrics: change lead time, deployment frequency, failed deployment recovery time, change fail rate, deployment rework rate (added in 2024) | [DORA metrics guide](https://dora.dev/guides/dora-metrics/) |
| CI/CD, release engineering | Automated checks, pinned actions, reproducible builds, semantic versioning | [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md), R-08 |
| Platform engineering, team topologies | Paved roads (templates, design system) for stream-aligned teams | [Team Topologies](https://teamtopologies.com/), [project-bootstrap](../../.agents/skills/project-bootstrap/SKILL.md) |
| Design operations | Design-system governance, contribution, versioning | [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md) section 5 |
| Technical and design debt | Deliberate shortcuts recorded and repaid | [Martin Fowler: technical debt](https://martinfowler.com/bliki/TechnicalDebt.html), [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) |
| FinOps | Cost of hosting, CDN, SaaS and AI usage as an engineering metric | [FinOps Foundation](https://www.finops.org/introduction/what-is-finops/) |
| Clean execution | How an agent works: plan, preview, verify, leave no mess | R-15 |

## 6. Testing and quality assurance

| Concept | Where |
| :--- | :--- |
| Test pyramid or trophy; unit, integration, end-to-end ([Martin Fowler: test pyramid](https://martinfowler.com/bliki/TestPyramid.html)) | R-07, [test-engineering](../../.agents/skills/test-engineering/SKILL.md) |
| Test-driven and behaviour-driven development | [test-engineering](../../.agents/skills/test-engineering/SKILL.md) |
| Property-based, fuzz and mutation testing | [test-engineering](../../.agents/skills/test-engineering/SKILL.md) section 2 |
| Component, visual regression and cross-browser testing | [frontend-testing-and-visual-qa](../../.agents/skills/frontend-testing-and-visual-qa/SKILL.md) |
| Accessibility testing | [accessibility-audit](../../.agents/skills/accessibility-audit/SKILL.md) |
| Performance testing and budgets | [web-performance-optimization](../../.agents/skills/web-performance-optimization/SKILL.md), Lighthouse CI |
| Contract testing with APIs | [Projects 23 quality-assurance](https://github.com/gerrardgs/Projects23/tree/main/.agents/skills/quality-assurance) |
| Chaos experiments | [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md) |
| Static analysis and code review | R-02, [rigorous-code-audit](../../.agents/skills/rigorous-code-audit/SKILL.md) |

## 7. Reliability, resilience and operations

| Concept | Meaning here | Where |
| :--- | :--- | :--- |
| Site reliability engineering | SLIs, SLOs, error budgets, toil reduction, blameless postmortems ([Google SRE books](https://sre.google/books/)) | [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md) section 4 |
| Chaos engineering | Experiments that disprove a steady-state hypothesis ([Principles of Chaos Engineering](https://principlesofchaos.org/)) | Same skill, sections 1, 5 and 6; tested template |
| Resilience patterns | Timeouts, retries with backoff and jitter, circuit breakers, fallbacks, bulkheads, kill switches | Same skill, section 3; R-05 |
| Observability | Real-user monitoring, error tracking, browser traces with OpenTelemetry | [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) section 6 |
| Incident management | Detect, mitigate, communicate, learn | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md), [deploy-and-release](../../.agents/skills/deploy-and-release/SKILL.md) |
| Progressive delivery | Preview deployments, canaries, feature flags, instant rollback | [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md), [deploy-and-release](../../.agents/skills/deploy-and-release/SKILL.md) |

## 8. Security, privacy and safety engineering

| Concept | Source | Where |
| :--- | :--- | :--- |
| Secure by design and by default | [CISA Secure by Design](https://www.cisa.gov/securebydesign) | R-06 |
| Secure development frameworks | [NIST SSDF (SP 800-218)](https://csrc.nist.gov/pubs/sp/800/218/final), [OWASP SAMM](https://owasp.org/www-project-samm/) | [security-hardening](../../.agents/skills/security-hardening/SKILL.md) |
| Threat modelling (STRIDE: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege) | [Microsoft threat modelling](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats) | [security-hardening](../../.agents/skills/security-hardening/SKILL.md) |
| Supply-chain integrity | [SLSA](https://slsa.dev/), SBOMs, pinned actions and digests | R-06 section 6, [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| Browser security | CSP, Trusted Types, SRI, cookies | R-11 section 6, [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) section 3 |
| AI and agent security | OWASP Top 10 for LLM and for Agentic Applications 2026 | R-06 sections 1 and 7 |
| Vulnerability auditing (trust boundaries, adversarial validation, coverage ledgers, impact-based severity) | [Cloudflare security-audit skill](https://github.com/cloudflare/security-audit-skill), [CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document) | [security-vulnerability-audit](../../.agents/skills/security-vulnerability-audit/SKILL.md) |
| Privacy engineering | Privacy by design, consent, GPC, data minimisation | R-14 section 5 |

## 9. Human-centred engineering

| Concept | Where |
| :--- | :--- |
| Human-computer interaction and usability | R-09, [ux-research-and-strategy](../../.agents/skills/ux-research-and-strategy/SKILL.md) |
| Accessibility engineering | R-10, [accessibility-audit](../../.agents/skills/accessibility-audit/SKILL.md) |
| Design engineering (designers who code, engineers who design) | [design-to-code-handoff](../../.agents/skills/design-to-code-handoff/SKILL.md), [figma-integration](../../.agents/skills/figma-integration/SKILL.md) |
| Interaction and motion engineering | [motion-and-interaction](../../.agents/skills/motion-and-interaction/SKILL.md) |
| Internationalisation and localisation engineering | R-14 section 3, [framework-frontend-engineering](../../.agents/skills/framework-frontend-engineering/SKILL.md) section 5 |
| Content and documentation engineering (docs as code; [Diátaxis](https://diataxis.fr/): tutorials, how-to guides, reference, explanation) | R-14 section 1, [docs/CONTRIBUTING.md](CONTRIBUTING.md) |
| Ethics | R-14 section 4; [ACM Code of Ethics](https://www.acm.org/code-of-ethics) |

## 10. Performance and sustainability engineering

| Concept | Source | Where |
| :--- | :--- | :--- |
| Performance engineering | Core Web Vitals | R-12, [web-performance-optimization](../../.agents/skills/web-performance-optimization/SKILL.md) |
| Green software engineering | [Software Carbon Intensity](https://greensoftware.foundation/standards/sci/) (ISO/IEC 21031:2024; [specification](https://github.com/Green-Software-Foundation/sci)): carbon per functional unit, such as per page view | R-12 section 6 |
| Sustainable web design | [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/) (draft) | R-12 section 6 |

## 11. AI-assisted engineering

| Concept | Where |
| :--- | :--- |
| Context engineering for agents (always-on core, on-demand rules and skills) | [ARCHITECTURE](ARCHITECTURE.md) |
| Verification against hallucination | R-03, [ANTI-HALLUCINATION-PLAYBOOK](ANTI-HALLUCINATION-PLAYBOOK.md) |
| Prompt patterns per scenario | [PROMPT-LIBRARY](PROMPT-LIBRARY.md) |
| Tool use through MCP, with least privilege | [mcp-servers-and-integrations](../../.agents/skills/mcp-servers-and-integrations/SKILL.md), [figma-integration](../../.agents/skills/figma-integration/SKILL.md), R-06 section 7 |
| Agent behaviour: think before coding, simplicity first, surgical changes, goal-driven execution ([Karpathy guidelines](https://github.com/multica-ai/andrej-karpathy-skills)) | R-01 sections 1, 2 and 8, R-15 section 1, [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) section 7 |
| LLM features, retrieval and agent systems inside products | [Projects 23](https://github.com/gerrardgs/Projects23) (llm-applications, rag-systems, ai-agent-systems skills) |
