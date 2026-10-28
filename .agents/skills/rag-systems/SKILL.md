---
name: rag-systems
description: Build and improve retrieval-augmented generation (RAG) systems - document ingestion and parsing, chunking, embeddings, vector and hybrid search, reranking, access control, grounded generation with citations, freshness, and retrieval and answer evaluation - using vector databases such as pgvector, Qdrant, Milvus, Weaviate, Chroma, LanceDB or FAISS. Use when building a chatbot or assistant over documents, a semantic search feature, a knowledge base Q&A, or when a RAG system gives wrong, unsupported or outdated answers.
license: MIT
metadata:
  version: "1.0.0"
---

# Retrieval-Augmented Generation

Builds on [llm-applications](../llm-applications/SKILL.md). Library names checked on PyPI on 2026-10-15.

## 1. Start from the questions

Collect real questions with their correct answers and the documents that contain them (a "golden set"). Without it you cannot tell whether a change to chunking, embeddings or prompts helps. Include questions whose answer is not in the corpus, so the system learns to say "I don't know".

## 2. Ingestion

- Parse documents faithfully: keep headings, tables, lists and page numbers; handle PDFs, HTML, Office files and scanned images (OCR) with a tested parser.
- Keep metadata on every chunk: source ID, title, section path, URL, date, version, language, and **access-control attributes** (tenant, owner, groups).
- Make ingestion incremental and idempotent: stable chunk IDs (for example a hash of source ID plus position), updates and deletions propagated, re-embedding when the embedding model changes.
- Strip or neutralize instructions embedded in documents only as defence in depth; the main control is treating retrieved text as data (section 5).

## 3. Chunking and embeddings

- Chunk along the document's structure (sections, paragraphs) rather than fixed character counts alone; keep chunks self-contained, with the heading path prepended; overlap a little when splitting long sections.
- Pick chunk size by experiment on the golden set, not by default values.
- Choose the embedding model by retrieval quality on your own data and languages, licence, cost and latency. Store the model name and version with the vectors; never mix vectors from different models in one index.

## 4. Retrieval

- **Hybrid search** (keyword BM25 plus vector similarity, merged for example by reciprocal rank fusion) usually beats either alone, especially for names, codes and rare terms.
- **Rerank** the top candidates with a cross-encoder or reranking model before sending them to the LLM.
- **Filter by metadata before or during search**: tenant, permissions, date, language. Enforce access control at retrieval time, so the model never sees documents the user may not read (OWASP LLM08:2025, vector and embedding weaknesses).
- Retrieve enough to answer, not as much as fits: fewer, better chunks improve answers and reduce cost.
- Consider query rewriting or decomposition for multi-part questions, and evaluate whether it helps.

## 5. Grounded generation

- Instruct the model to answer only from the provided context, cite the source of each claim, and say when the context does not contain the answer.
- Mark retrieved content as untrusted data, separate from instructions (indirect prompt injection, OWASP LLM01:2025).
- Show citations to the user with links to the source; verify programmatically that cited sources were actually retrieved.

## 6. Evaluate retrieval and answers separately

| Stage | Metrics |
| :--- | :--- |
| Retrieval | Recall@k and precision@k against the golden documents, mean reciprocal rank (MRR), nDCG |
| Answer | Faithfulness (claims supported by the retrieved context), answer relevance, correctness against the reference, citation accuracy, correct refusal when the answer is absent |

Tools: `ragas`, `deepeval`, `inspect-ai`, or custom checks. Re-run the evaluation after any change to parsing, chunking, embeddings, retrieval parameters, prompts or models.

## 7. Operations

- Monitor retrieval latency, empty-result rate, refusal rate, user feedback and cost per query.
- Track corpus freshness; show document dates in answers where staleness matters.
- Plan re-indexing (new embedding model, new chunking) as a migration: build the new index alongside, evaluate, switch, then delete the old one.

## Vector store options (choose by scale, filtering needs and operations)

pgvector (PostgreSQL extension, simplest when PostgreSQL is already in use), Qdrant, Milvus, Weaviate, Chroma, LanceDB, OpenSearch or Elasticsearch vector search, FAISS (a library, not a database).

## Done when

- [ ] Golden question set exists, including unanswerable questions
- [ ] Retrieval and answer metrics measured, and the change does not regress them
- [ ] Access control enforced at retrieval time and tested with a user who lacks permission
- [ ] Answers cite retrieved sources; the system refuses when the context lacks the answer
- [ ] Ingestion is incremental and idempotent, and deletions propagate
