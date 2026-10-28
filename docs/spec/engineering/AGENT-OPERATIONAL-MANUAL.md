# Agent Operational Manual

Which rules and skills to use for each kind of task, for AI agents and for the people directing them. The always-on core in [AGENTS.md](../../../AGENTS.md) applies to every scenario. Paths below are relative to the repository root.

## 1. Scenario router

| Scenario | Read first | Then |
| :--- | :--- | :--- |
| Large, vague or multi-component feature request | [feature-specification](../../../.agents/skills/feature-specification/SKILL.md) | then the skills for each task |
| Unclear plan or design that needs the user's decisions first | [feature-specification](../../../.agents/skills/feature-specification/SKILL.md) "Resolve the design tree with the user" | [software-architecture](../../../.agents/skills/software-architecture/SKILL.md) section 3 (glossary) |
| Design a system, choose an architecture, split or merge services | [software-architecture](../../../.agents/skills/software-architecture/SKILL.md) | [feature-specification](../../../.agents/skills/feature-specification/SKILL.md), [project-bootstrap ADR template](../../../.agents/skills/project-bootstrap/assets/adr-template.md) |
| New repository from an empty folder | [project-bootstrap](../../../.agents/skills/project-bootstrap/SKILL.md) | [native-from-scratch](../../../.agents/skills/native-from-scratch/SKILL.md), [ci-cd-pipeline](../../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| New feature in an existing project | [change-existing-code](../../../.agents/skills/change-existing-code/SKILL.md) | [test-engineering](../../../.agents/skills/test-engineering/SKILL.md), rule [05](../../../.agents/rules/05-error-handling.md) |
| Bug report or failing behaviour | [systematic-debugging](../../../.agents/skills/systematic-debugging/SKILL.md) | [test-engineering](../../../.agents/skills/test-engineering/SKILL.md) for the regression test |
| Flaky test | [test-engineering](../../../.agents/skills/test-engineering/SKILL.md) section 4 | [systematic-debugging](../../../.agents/skills/systematic-debugging/SKILL.md) |
| Refactoring | [change-existing-code](../../../.agents/skills/change-existing-code/SKILL.md) | rule [02](../../../.agents/rules/02-clean-code.md) |
| The task seems to need deleting, rewriting or replacing existing code | rule [09](../../../.agents/rules/15-clean-execution.md) section 2 | Stop, send the proposal, wait for the user's decision |
| Dependency or runtime upgrade | [change-existing-code](../../../.agents/skills/change-existing-code/SKILL.md) section 4 | rule [04](../../../.agents/rules/04-dependencies.md) |
| Code review or pull request review | [rigorous-code-audit](../../../.agents/skills/rigorous-code-audit/SKILL.md) | rule [06](../../../.agents/rules/06-security.md) |
| Security review, auth, payments, uploads, personal data | [security-hardening](../../../.agents/skills/security-hardening/SKILL.md) | [rigorous-code-audit](../../../.agents/skills/rigorous-code-audit/SKILL.md) |
| Security audit or vulnerability hunt of a codebase | [security-hardening](../../../.agents/skills/security-hardening/SKILL.md) section 9 and its [attack classes](../../../.agents/skills/security-hardening/references/attack-classes.md) | [rigorous-code-audit](../../../.agents/skills/rigorous-code-audit/SKILL.md) section 4 (boundary and result, independent validation), rule [06](../../../.agents/rules/06-security.md) section 10 |
| Slow code or high memory | [systematic-debugging](../../../.agents/skills/systematic-debugging/SKILL.md) "Performance problems" | its [tools reference](../../../.agents/skills/systematic-debugging/references/tools.md) |
| CI is failing | [systematic-debugging](../../../.agents/skills/systematic-debugging/SKILL.md) | [ci-cd-pipeline](../../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| Set up or harden CI/CD | [ci-cd-pipeline](../../../.agents/skills/ci-cd-pipeline/SKILL.md) | [security-hardening](../../../.agents/skills/security-hardening/SKILL.md) section 4 |
| Containerise or deploy | [deploy-and-release](../../../.agents/skills/deploy-and-release/SKILL.md) | [ci-cd-pipeline](../../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| Database schema change | [deploy-and-release](../../../.agents/skills/deploy-and-release/SKILL.md) section 4 | [change-existing-code](../../../.agents/skills/change-existing-code/SKILL.md) |
| Production incident | [systematic-debugging](../../../.agents/skills/systematic-debugging/SKILL.md) "Production incidents" | [deploy-and-release](../../../.agents/skills/deploy-and-release/SKILL.md) section 6 |
| Commit, pull request, release | rule [08](../../../.agents/rules/08-git-workflow.md) | |
| Hand work over to another session or agent | rule [09](../../../.agents/rules/15-clean-execution.md) section 7 (handoff note) | |
| Documentation only | [technical-documentation](../../../.agents/skills/technical-documentation/SKILL.md) | [project-bootstrap assets](../../../.agents/skills/project-bootstrap/assets/) (README, ADR and SECURITY templates) |
| Create or complete a project's `docs/` folder (PRD, architecture, API, database, schema, design, security, testing, deployment and the rest) | [technical-documentation](../../../.agents/skills/technical-documentation/SKILL.md) section 5 and its [templates](../../../.agents/skills/technical-documentation/assets/docs/) | `check-docs.mjs` until it passes, then review each fact at its source |
| Output looks AI-generated, or comments, docs, UI copy or a screen are about to be delivered | [anti-slop](../../../.agents/skills/anti-slop/SKILL.md) | [technical-documentation](../../../.agents/skills/technical-documentation/SKILL.md), [web-frontend-engineering](../../../.agents/skills/web-frontend-engineering/SKILL.md) |
| Question about the code, no change requested | rule [03](../../../.agents/rules/03-verification.md) | Answer from the code you read, with file and line references; change nothing |
| New or changed API endpoint, schema, query or job | [backend-engineering](../../../.agents/skills/backend-engineering/SKILL.md) | [test-engineering](../../../.agents/skills/test-engineering/SKILL.md), [security-hardening](../../../.agents/skills/security-hardening/SKILL.md) |
| Web page or component | [web-frontend-engineering](../../../.agents/skills/web-frontend-engineering/SKILL.md) | [quality-assurance](../../../.agents/skills/quality-assurance/SKILL.md) (accessibility, cross-browser) |
| Mobile app change or store release | [mobile-engineering](../../../.agents/skills/mobile-engineering/SKILL.md) | [deploy-and-release](../../../.agents/skills/deploy-and-release/SKILL.md) |
| Data pipeline, ETL/ELT, streaming job | [data-engineering](../../../.agents/skills/data-engineering/SKILL.md) | [test-engineering](../../../.agents/skills/test-engineering/SKILL.md) |
| Analysis, metric, experiment or chart | [data-analysis](../../../.agents/skills/data-analysis/SKILL.md) | |
| Train, evaluate or improve a model | [machine-learning](../../../.agents/skills/machine-learning/SKILL.md) | [computer-vision](../../../.agents/skills/computer-vision/SKILL.md) for images and video |
| LLM or generative AI feature | [llm-applications](../../../.agents/skills/llm-applications/SKILL.md) | [rag-systems](../../../.agents/skills/rag-systems/SKILL.md), [ai-agent-systems](../../../.agents/skills/ai-agent-systems/SKILL.md) |
| Chat over documents, semantic search | [rag-systems](../../../.agents/skills/rag-systems/SKILL.md) | [llm-applications](../../../.agents/skills/llm-applications/SKILL.md) |
| Agent, tool calling, MCP server | [ai-agent-systems](../../../.agents/skills/ai-agent-systems/SKILL.md) | rule [06](../../../.agents/rules/06-security.md) |
| Add or configure an MCP server for an assistant or agent (Claude Code, VS Code, Cursor, Gemini CLI, Codex, Antigravity) | [MCP servers reference](../../../.agents/skills/ai-agent-systems/references/mcp-servers.md) | rules [04](../../../.agents/rules/04-dependencies.md) and [06](../../../.agents/rules/06-security.md) |
| Fix a bug, a wrong result or a flawed line of reasoning | rule [01](../../../.agents/rules/01-core-principles.md) section 9, [systematic-debugging](../../../.agents/skills/systematic-debugging/SKILL.md) | rule [09](../../../.agents/rules/15-clean-execution.md) section 1 (checkable goals) |
| Deploy a model, cut inference latency, real-time AI | [ml-inference-serving](../../../.agents/skills/ml-inference-serving/SKILL.md) | [cloud-infrastructure](../../../.agents/skills/cloud-infrastructure/SKILL.md) |
| Infrastructure, Kubernetes, IAM, SLOs, cloud cost | [cloud-infrastructure](../../../.agents/skills/cloud-infrastructure/SKILL.md) | [ci-cd-pipeline](../../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| Resilience check, fault injection, chaos experiment, game day | [chaos-engineering](../../../.agents/skills/chaos-engineering/SKILL.md) | [cloud-infrastructure](../../../.agents/skills/cloud-infrastructure/SKILL.md) section 5, [quality-assurance](../../../.agents/skills/quality-assurance/SKILL.md) |
| Test plan, load test, release sign-off | [quality-assurance](../../../.agents/skills/quality-assurance/SKILL.md) | [test-engineering](../../../.agents/skills/test-engineering/SKILL.md) |
| Connect to a third-party API, receive webhooks, build a connector | [api-integration](../../../.agents/skills/api-integration/SKILL.md) | its [sector standards](../../../.agents/skills/api-integration/references/sector-standards.md) |
| Identity, SSO, endpoints, network, email, backup, help desk | [it-operations](../../../.agents/skills/it-operations/SKILL.md) | [security-hardening](../../../.agents/skills/security-hardening/SKILL.md) |
| Use, choose or upgrade any tool, framework, platform or SaaS | [technology-adoption](../../../.agents/skills/technology-adoption/SKILL.md) | its [technology catalog](../../../.agents/skills/technology-adoption/references/technology-catalog.md) |
| A domain not listed here | [domain coverage](../../../.agents/domain-coverage.md) section 4 | The lifecycle skill for the phase |
| An engineering concept, principle or pattern (SOLID, CAP, SLOs, TDD, ...) | [engineering concepts](../../../.agents/engineering-concepts.md) | The skill it points to |

## 2. Execution loop for any scenario

1. **Understand**: restate the goal and acceptance criteria; list assumptions.
2. **Ground**: read the relevant code, manifests and tests; run the baseline build and tests.
3. **Plan**: the smallest correct change; for multi-step work, a numbered plan with checkpoints.
4. **Do**: one step at a time, following the rules and the chosen skill.
5. **Verify**: run the formatter, linter, type checker and tests; read the actual output.
6. **Report**: the format in `AGENTS.md` section 7: changed, verified, not done, risks.

## 3. Using the spec where files are not loaded automatically

- **Chat models (ChatGPT, Claude.ai, Gemini, DeepSeek, Llama, Qwen and others)**: paste `AGENTS.md` first, then the rule or skill for the task. Tell the model it cannot run commands, so every result must be labelled unverified until you run it.
- **IDE or CLI agents that load only `AGENTS.md`**: the indexes in `AGENTS.md` direct the agent to open the right rule or skill file.
- **Sub-agents**: pass each one the task, the acceptance criteria, and the links to the relevant rule and skill files. Sub-agents start without the parent's context.

## 4. What humans should still do

- Approve anything irreversible or outward-facing: deletions, force pushes, migrations, deployments, publishing, messages to other people.
- Review diffs before merging; an agent's report is a summary, not proof.
- Keep the "Project profile" in `AGENTS.md` current, so agents run the right commands.
- Re-verify dated facts (runtime versions, tool locations, action SHAs) periodically; `node scripts/agents-sync.mjs` checks structure, not the outside world.
