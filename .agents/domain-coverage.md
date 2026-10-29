# Domain Coverage

Which parts of this specification to load for each role and technical domain. The always-on core (`AGENTS.md` and rules 01, 02, 03, 06 and 09) applies to every row. Skills are in `.agents/skills/`; rules are in `.agents/rules/`.

No written specification can contain every fact of every field. Any language, framework, library, platform or SaaS product, listed or not, is handled with the [technology-adoption](skills/technology-adoption/SKILL.md) skill, its [catalog of widely used tools](skills/technology-adoption/references/technology-catalog.md), and the live lookup script `scripts/tech-lookup.mjs`. What this one guarantees is a consistent way of working (verify, test, secure, review, ship) plus domain checklists where the risks are specific. For domains without a dedicated skill, the lifecycle skills and the always-on rules still apply, and section 4 lists verified starting points.

## 1. Roles

| Role | Primary skills | Also relevant |
| :--- | :--- | :--- |
| Software engineer, web or apps (full stack) | [web-frontend-engineering](skills/web-frontend-engineering/SKILL.md), [backend-engineering](skills/backend-engineering/SKILL.md) | [change-existing-code](skills/change-existing-code/SKILL.md), [test-engineering](skills/test-engineering/SKILL.md) |
| Backend developer | [backend-engineering](skills/backend-engineering/SKILL.md) | [security-hardening](skills/security-hardening/SKILL.md), [deploy-and-release](skills/deploy-and-release/SKILL.md) |
| Frontend developer | [web-frontend-engineering](skills/web-frontend-engineering/SKILL.md) | [quality-assurance](skills/quality-assurance/SKILL.md) (accessibility, cross-browser) |
| Mobile developer | [mobile-engineering](skills/mobile-engineering/SKILL.md) | [security-hardening](skills/security-hardening/SKILL.md) (MASVS) |
| Data engineer, big data | [data-engineering](skills/data-engineering/SKILL.md) | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md), [backend-engineering](skills/backend-engineering/SKILL.md) (data stores) |
| Data analyst, BI | [data-analysis](skills/data-analysis/SKILL.md) | [data-engineering](skills/data-engineering/SKILL.md) (metric sources) |
| Data scientist | [data-analysis](skills/data-analysis/SKILL.md), [machine-learning](skills/machine-learning/SKILL.md) | [ml-inference-serving](skills/ml-inference-serving/SKILL.md) |
| ML / deep learning engineer, MLOps | [machine-learning](skills/machine-learning/SKILL.md), [ml-inference-serving](skills/ml-inference-serving/SKILL.md) | [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md), [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) |
| LLM / generative AI engineer | [llm-applications](skills/llm-applications/SKILL.md) | [rag-systems](skills/rag-systems/SKILL.md), [ai-agent-systems](skills/ai-agent-systems/SKILL.md), [ml-inference-serving](skills/ml-inference-serving/SKILL.md) |
| RAG / search engineer | [rag-systems](skills/rag-systems/SKILL.md) | [llm-applications](skills/llm-applications/SKILL.md), [backend-engineering](skills/backend-engineering/SKILL.md) |
| AI agent engineer (including MCP) | [ai-agent-systems](skills/ai-agent-systems/SKILL.md) | [llm-applications](skills/llm-applications/SKILL.md), [security-hardening](skills/security-hardening/SKILL.md) |
| Computer vision engineer | [computer-vision](skills/computer-vision/SKILL.md) | [machine-learning](skills/machine-learning/SKILL.md), [ml-inference-serving](skills/ml-inference-serving/SKILL.md) |
| Real-time AI engineer | [ml-inference-serving](skills/ml-inference-serving/SKILL.md) | [computer-vision](skills/computer-vision/SKILL.md) (video), [data-engineering](skills/data-engineering/SKILL.md) (streaming) |
| Cloud engineer, DevOps, platform engineer | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md), [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) | [deploy-and-release](skills/deploy-and-release/SKILL.md) |
| Site reliability engineer, chaos engineer | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) (SRE section), [chaos-engineering](skills/chaos-engineering/SKILL.md), [deploy-and-release](skills/deploy-and-release/SKILL.md) | [systematic-debugging](skills/systematic-debugging/SKILL.md) (incidents), [software-architecture](skills/software-architecture/SKILL.md) (resilience patterns) |
| Software or solution architect | [software-architecture](skills/software-architecture/SKILL.md) | [feature-specification](skills/feature-specification/SKILL.md), [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md), [security-hardening](skills/security-hardening/SKILL.md) |
| Security engineer, AppSec | [security-hardening](skills/security-hardening/SKILL.md) and its [domain standards](skills/security-hardening/references/domain-standards.md) | [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md), [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) |
| QA engineer, SDET | [quality-assurance](skills/quality-assurance/SKILL.md), [test-engineering](skills/test-engineering/SKILL.md) | [web-frontend-engineering](skills/web-frontend-engineering/SKILL.md), [mobile-engineering](skills/mobile-engineering/SKILL.md) |
| Integration engineer, middleware or connector developer | [api-integration](skills/api-integration/SKILL.md) and its [sector standards](skills/api-integration/references/sector-standards.md) | [backend-engineering](skills/backend-engineering/SKILL.md), [security-hardening](skills/security-hardening/SKILL.md) |
| System administrator, IT operations, help desk, network and identity engineer | [it-operations](skills/it-operations/SKILL.md) | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md), [security-hardening](skills/security-hardening/SKILL.md) |
| Database administrator | [backend-engineering data stores](skills/backend-engineering/references/data-stores.md) | [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) (backup and DR), [deploy-and-release](skills/deploy-and-release/SKILL.md) (migrations) |
| Product owner, business analyst, technical writer | [feature-specification](skills/feature-specification/SKILL.md), [technical-documentation](skills/technical-documentation/SKILL.md) | [data-analysis](skills/data-analysis/SKILL.md) |
| Tech lead, reviewer | [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md) | Rule [08](rules/08-git-workflow.md), [change-existing-code](skills/change-existing-code/SKILL.md) |

## 2. Industry sectors

API and data-exchange standards per sector (payments, banking and open finance, healthcare, government, accounting and ERP, retail and logistics, telecommunications, education, geospatial, IoT and industrial, email and messaging, travel and insurance, AI providers) are in [api-integration sector standards](skills/api-integration/references/sector-standards.md). Sector regulation pointers (GDPR, EU AI Act, PCI DSS, health data) are in the [security domain standards](skills/security-hardening/references/domain-standards.md).

## 3. Lifecycle phase by domain

Every domain moves through the same phases. Load the lifecycle skill for the phase and the domain skill for the specifics:

| Phase | Lifecycle skill |
| :--- | :--- |
| Specify a feature | [feature-specification](skills/feature-specification/SKILL.md) |
| Design the system | [software-architecture](skills/software-architecture/SKILL.md) |
| Set up a repository | [project-bootstrap](skills/project-bootstrap/SKILL.md) (toolchains for 14 language and tool families) |
| Build something new | [native-from-scratch](skills/native-from-scratch/SKILL.md) |
| Change existing code | [change-existing-code](skills/change-existing-code/SKILL.md) |
| Test | [test-engineering](skills/test-engineering/SKILL.md), [quality-assurance](skills/quality-assurance/SKILL.md) |
| Debug, profile, incidents | [systematic-debugging](skills/systematic-debugging/SKILL.md) |
| Review | [rigorous-code-audit](skills/rigorous-code-audit/SKILL.md) |
| Secret scanning, push protection and leaked-credential response | [secret-scanning](skills/secret-scanning/SKILL.md) |
| Reverse engineering, binary and release-artifact analysis, malware and crash triage | [reverse-engineering](skills/reverse-engineering/SKILL.md), [security-hardening](skills/security-hardening/SKILL.md) |
| AI code review with CodeRabbit | [coderabbit-review](skills/coderabbit-review/SKILL.md) |
| Multi-session, parallel or unattended agent work | [agent-delivery-loop](skills/agent-delivery-loop/SKILL.md), [git-worktrees](skills/git-worktrees/SKILL.md) |
| Secure | [security-hardening](skills/security-hardening/SKILL.md) |
| Automate | [ci-cd-pipeline](skills/ci-cd-pipeline/SKILL.md) |
| Document | [technical-documentation](skills/technical-documentation/SKILL.md) |
| Remove AI slop before delivery | [anti-slop](skills/anti-slop/SKILL.md) |
| Clean user-facing text & Unicode hygiene | [clean-user-facing-text](skills/clean-user-facing-text/SKILL.md) |
| Remove multi-vendor AI provenance & C2PA | [remove-ai-marks](skills/remove-ai-marks/SKILL.md) |
| Release and operate | [deploy-and-release](skills/deploy-and-release/SKILL.md), [cloud-infrastructure](skills/cloud-infrastructure/SKILL.md) |
| Prove resilience | [chaos-engineering](skills/chaos-engineering/SKILL.md) |

For engineering concepts and principles rather than roles or domains, see [engineering-concepts.md](engineering-concepts.md).

## 4. Domains without a dedicated skill

Apply the always-on rules and the lifecycle skills, read the platform's official documentation first ([03-verification](rules/03-verification.md)), and use these verified starting points (names checked on 2026-10-15):

| Domain | Starting points | Extra care |
| :--- | :--- | :--- |
| Embedded and IoT | Zephyr RTOS, PlatformIO (VS Code `platformio.platformio-ide`), vendor SDKs | Memory and timing limits, hardware-in-the-loop tests, secure firmware updates, no secrets in firmware |
| Game development | Godot (VS Code `geequlim.godot-tools`), Unity, Unreal Engine | Frame-time budgets, deterministic simulation where networking needs it, platform certification rules |
| Smart contracts | Foundry (testing and fuzzing), Slither (static analysis), OpenZeppelin Contracts | Deployed code is immutable or costly to upgrade: independent audits, extensive fuzz and invariant tests |
| Desktop apps | Electron (follow the official [security checklist](https://www.electronjs.org/docs/latest/tutorial/security)), Tauri, native toolkits | Code signing, auto-update integrity, least-privilege access to the operating system |
| Robotics | ROS 2 | Safety interlocks, simulation before hardware, real-time constraints |
| Scientific and high-performance computing | MPI (`mpi4py` for Python), NumPy and SciPy | Numerical stability, reproducibility (seeds, versions, hardware), validation against known results |

If a domain needs its own checklist, add a skill following the [contributing guide](https://github.com/gerrardgs/Projects23/blob/main/docs/CONTRIBUTING.md).
