---
name: ai-agent-systems
description: Design, build, secure and evaluate AI agents and multi-agent systems that plan and call tools - tool and MCP server design, connecting and vetting third-party MCP servers (including MCP Toolbox for Databases), permissions and human approval, sandboxing, memory and state, loop and cost limits, error recovery, tracing, and task-level evaluation - against the OWASP Top 10 for LLM Applications and for Agentic Applications. Use when building an agent, an MCP server or client, a tool-calling workflow, a coding or browsing agent, or an orchestrator of sub-agents, or when an agent misbehaves, loops, overspends or takes unsafe actions.
license: MIT
metadata:
  version: "1.0.0"
---

# AI Agent Systems

Builds on [llm-applications](../llm-applications/SKILL.md). Sources checked on 2026-10-15: the [Model Context Protocol specification](https://modelcontextprotocol.io/specification/latest) (version 2026-07-28), the [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/) and the [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) (published 9 December 2025).

## 1. Prefer the simplest design that works

1. A single LLM call with good context.
2. A fixed workflow: deterministic steps in code, with LLM calls at specific points.
3. An agent loop (the model chooses tools until done), only when the steps cannot be known in advance.
4. Multiple agents, only when one agent's context or permissions must be split; every extra agent adds failure modes and cost.

## 2. Tool design

- Few tools with clear names, precise descriptions, typed and validated parameters, and documented side effects. Tool descriptions are prompts: write and test them as carefully as code.
- Make tools idempotent where possible and return structured, concise results with explicit error messages the model can act on.
- Separate read-only tools from tools that change state; give each its own permission.
- Validate every tool argument in code; the model's arguments are untrusted input (OWASP LLM05:2025).
- For MCP servers and clients, follow the specification's [security best practices](https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices):
  - users consent to data access and to each tool invocation;
  - hosts treat tool descriptions and annotations from untrusted servers as untrusted;
  - servers must not accept tokens that were not explicitly issued for them (no token passthrough);
  - possession of a state handle is never authentication;
  - clients guard against SSRF when following URLs supplied by a server;
  - local servers run sandboxed, and only after the user approves the exact command.
- To connect existing MCP servers (from the [official registry](https://registry.modelcontextprotocol.io/), vendors, or community lists such as punkpeye/awesome-mcp-servers and wong2/awesome-mcp-servers), follow the [MCP servers reference](references/mcp-servers.md): a list entry is not a review, so vet, pin, contain and configure each one per client.
- Give agents database access through fixed, parameterized tools, never free-form SQL against production: [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) does this, and [assets/mcp-toolbox-sqlite](assets/mcp-toolbox-sqlite/) is a tested read-only example with an end-to-end MCP test.

## 3. Permissions and human control (excessive agency, OWASP LLM06:2025)

- Least privilege: the agent's credentials allow only what its task needs, scoped per user and per environment, short-lived.
- Require explicit human approval for irreversible, costly or outward-facing actions: payments, deletions, sending messages, deploying, changing permissions.
- Run code-executing agents in a sandbox (container or VM) with no secrets, restricted network egress, CPU, memory and time limits, and a disposable filesystem.
- Treat everything the agent reads (web pages, files, emails, tool results, other agents' messages) as untrusted data. Content that tries to redirect the agent's goal must not be followed.

## 4. Control loops and budgets

- Hard limits per task: maximum steps, maximum tool calls, wall-clock timeout, and a token and cost budget. Stop and report when a limit is hit.
- Detect loops (the same tool with the same arguments repeated) and failures that repeat; escalate to a human instead of retrying forever.
- Checkpoint state for long tasks so they can resume after a failure without redoing side effects.

## 5. Memory and state

- Keep authoritative state (task status, decisions, results) in structured storage, not only in the conversation.
- Long-term memory is a data store: validate what is written to it, scope it per user or tenant, allow inspection and deletion, and guard against poisoning by untrusted content.
- Summarize or trim context deliberately; keep the original goal and constraints pinned.

## 6. Multi-agent systems

- Give each sub-agent a self-contained task, the minimum context and tools, and an output schema.
- Authenticate and validate inter-agent messages; do not let one agent's output grant another agent new permissions.
- The orchestrator verifies sub-agent results before acting on them or reporting them as done.

## 7. Evaluation and observability

- Evaluate on realistic tasks with checkable end states (tests pass, record created correctly, answer matches), measuring success rate, steps, cost and time, plus safety cases (injection in tool results, attempts to exceed permissions).
- Run each task several times: agents are non-deterministic, so report rates, not single runs. `inspect-ai` supports agentic evaluations.
- Trace every step: model call, tool name, arguments (redacted), result summary, latency and cost. Keep an audit log of state-changing actions with the approving user.

## Done when

- [ ] The simplest workable design was chosen, with the reason recorded
- [ ] Every tool validates its arguments and has the minimum permission; destructive tools require approval
- [ ] Step, time and cost limits stop runaway behaviour, verified by a test
- [ ] Injection attempts through tool results are part of the evaluation and are resisted
- [ ] Full traces and an audit log exist for state-changing actions
