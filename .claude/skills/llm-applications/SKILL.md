---
name: llm-applications
description: Build production features on large language models and generative AI - prompt and context design, structured outputs, tool calling, streaming, evaluation suites, guardrails against prompt injection and data leakage, cost and latency control, caching, observability, model versioning and fine-tuning decisions - with any model provider or open-weight model. Use when integrating an LLM API or local model, writing or changing prompts, adding a chatbot, summarizer, classifier, extractor or generator, or evaluating and hardening an existing GenAI feature.
license: MIT
metadata:
  version: "1.0.0"
---

# LLM and Generative AI Applications

Retrieval is covered in [rag-systems](../rag-systems/SKILL.md), autonomous tool-using agents in [ai-agent-systems](../ai-agent-systems/SKILL.md), and self-hosted model serving in [ml-inference-serving](../ml-inference-serving/SKILL.md). Standards checked on 2026-10-15.

## 1. Before you build

- Define the task, inputs, outputs and the quality bar in measurable terms, with 20 to 100 real or realistic examples, including hard and adversarial cases. This becomes the evaluation set.
- Check whether a deterministic solution (rules, search, a classical model) is enough. Use an LLM where its flexibility pays for its cost, latency and variability.
- Verify the provider's current model names, context limits, prices, rate limits and data-retention terms in its official documentation; never write them from memory ([03-verification](../../rules/03-verification.md)).

## 2. Prompt and context design

- Keep prompts in version-controlled files or constants, not scattered string concatenation. Treat a prompt change like a code change: review and evaluate it.
- Structure the prompt: role and task, rules, the context (clearly delimited, for example in tagged sections), examples, then the output format.
- Separate trusted instructions from untrusted data. Never let user input or retrieved documents be interpreted as instructions; label them as data.
- Give the model only the context it needs; more context costs money and can reduce accuracy ("lost in the middle").
- Ask for structured output with a JSON Schema or the provider's structured-output or tool-calling feature, then **validate** the result in code (for example Pydantic, Zod, `jsonschema`) and handle validation failures with a bounded retry or a fallback.

## 3. Evaluation (the core engineering discipline for LLM features)

- Build an automated evaluation suite from the example set: exact-match or programmatic checks wherever possible (schema validity, extracted fields, classification labels), reference-based metrics where useful, and model-graded checks only with a rubric that is itself validated against human judgements.
- Run the suite on every prompt, model or parameter change, and track scores over time; a change that improves one case often breaks another.
- Include safety cases: prompt injection attempts, requests for disallowed content, attempts to extract the system prompt or other users' data.
- Tools (checked on PyPI or npm on 2026-10-15): `inspect-ai`, `promptfoo`, `deepeval`, `ragas` (retrieval-specific); or plain pytest with fixtures.

## 4. Security and safety (OWASP Top 10 for LLM Applications 2025)

Check each risk from the [OWASP list](https://genai.owasp.org/llm-top-10/):

| Risk | Engineering control |
| :--- | :--- |
| LLM01 Prompt Injection | Untrusted content marked as data; least-privilege tools; human approval for high-impact actions; output validation |
| LLM02 Sensitive Information Disclosure | Do not put secrets or other users' data in prompts; redact personal data (for example with Presidio); access control before retrieval |
| LLM03 Supply Chain | Verify model and dataset sources and licences; pin model versions; scan dependencies |
| LLM04 Data and Model Poisoning | Control and audit fine-tuning and retrieval data sources |
| LLM05 Improper Output Handling | Treat model output as untrusted input: escape HTML, never execute it as code, SQL or shell without validation and sandboxing |
| LLM06 Excessive Agency | Minimal tools and permissions; confirmations; see [ai-agent-systems](../ai-agent-systems/SKILL.md) |
| LLM07 System Prompt Leakage | Assume the system prompt can be revealed; put no secrets or authorization logic in it |
| LLM08 Vector and Embedding Weaknesses | Per-tenant access control in the vector store; see [rag-systems](../rag-systems/SKILL.md) |
| LLM09 Misinformation | Ground answers in sources, show citations, state uncertainty, keep a human in the loop for consequential outputs |
| LLM10 Unbounded Consumption | Rate limits, token and cost budgets per user and per request, timeouts, maximum output length |

Red-team regularly with tools such as `garak` or PyRIT, and with manual adversarial testing.

## 5. Reliability, cost and latency

- Set timeouts, bounded retries with backoff for rate limits and transient errors, and a fallback (another model, a cached answer, or a graceful error).
- Stream responses for interactive use; cap output tokens.
- Cache deterministic or repeated requests (and use the provider's prompt caching where available) keyed on the full prompt and model version.
- Route by difficulty: smaller, cheaper models for easy cases, larger ones only where the evaluation shows they are needed.
- Log token usage and cost per feature; set alerts on spend.

## 6. Observability and versioning

- Trace each call: model and version, prompt version, parameters, latency, token counts, tool calls, and evaluation or feedback signals. OpenTelemetry has generative-AI semantic conventions (check their current stability status before relying on attribute names).
- Do not log full prompts and outputs that contain personal data unless policy allows it; redact or sample.
- Pin model versions where the provider allows; re-run the evaluation suite before switching versions.

## 7. Fine-tuning decision

Try in this order: better prompts and examples, retrieval of the right context, a different model, then fine-tuning (for example parameter-efficient fine-tuning with `peft`) when you have enough high-quality labelled examples and a stable task. Evaluate the fine-tuned model on the same suite, including safety cases.

## 8. Governance

Follow the organization's AI policy, the NIST AI RMF Generative AI Profile (NIST AI 600-1) where adopted, and applicable law such as the EU AI Act (Regulation (EU) 2024/1689). Tell users when they are interacting with AI where required.

## Done when

- [ ] Evaluation suite exists, runs in CI or on demand, and the change does not regress it
- [ ] Outputs are schema-validated and treated as untrusted
- [ ] OWASP LLM risks relevant to the feature are mitigated and tested with adversarial cases
- [ ] Timeouts, retries, budgets and rate limits are in place; cost per request is known
- [ ] Prompts, model versions and parameters are versioned and traced
