# Vectorless RAG — Introduction

## RAG Without Vector Embeddings

Vectorless RAG is a full-stack document chat application that lets you upload PDFs and chat with them using retrieval-augmented generation — without any vector embeddings. Instead of embedding models and vector databases, the entire search system runs on PostgreSQL's built-in full-text search engine with custom BM25 scoring.

## The Core Question: Do You Really Need Embeddings?

For the past few years, the standard RAG recipe has been: chunk your documents, embed them with a model like `text-embedding-3-large`, store in a vector database like Pinecone or Chroma, and retrieve with cosine similarity. This works — but it's expensive, complex, and often overkill.

Vectorless RAG asks a provocative question: what if PostgreSQL's built-in full-text search — which has been battle-tested for decades — is good enough for most document chat use cases?

The answer, it turns out, is yes. With careful BM25 scoring, smart fallback strategies, and LLM-powered reranking, PostgreSQL full-text search can deliver high-quality retrieval at a fraction of the cost and complexity.

## Why This Project Exists

Three motivations drove this project:

**Cost reduction:** Embedding APIs charge per token. For a multi-tenant application with many users uploading many documents, embedding costs add up quickly. PostgreSQL FTS is free — it's part of the database you're already running.

**Architectural simplicity:** A vector database is another service to manage, monitor, and pay for. Vectorless RAG keeps everything in PostgreSQL — chunks, search indices, BM25 statistics, chat history, everything. One database, one bill, one thing to monitor.

**Educational value:** Vector embeddings have become the default answer, but they shouldn't be the only answer. This project demonstrates that lexical search — keyword matching with statistical scoring — is still remarkably effective, especially when combined with LLM-powered reranking and relevance classification.

## What Can You Do With It?

1. **Sign in** through Clerk (email, Google, GitHub — your choice)
2. **Upload PDFs** — the system extracts text, builds a document tree, generates summaries, and computes search statistics
3. **Chat with documents** — ask questions in natural language, get answers with citations (page numbers, heading paths)
4. **Admin panel** — manage users, view analytics, monitor the system
5. **Quality scoring** — every answer is evaluated by an LLM across four dimensions

## The Multi-Tenant Design

Every document, chunk, chat, and search index is isolated per user through tenant IDs. Two users can upload the same PDF and get completely independent copies with separate UUIDs, chunks, and search indices. There's no data leakage possible — all queries filter by tenant.

This makes the system suitable for SaaS deployments where multiple customers share the same infrastructure but must never see each other's data. It's a design pattern worth studying even if you don't use the exact implementation.

## When to Use This Approach

Vectorless RAG works well when:
- Documents are primarily text-based (PDFs, reports, articles)
- Users ask specific questions that contain keywords from the documents
- You want to minimize infrastructure complexity and cost
- You need multi-tenant isolation
- PostgreSQL is already part of your stack

It's less suitable for:
- Semantic queries where the question and answer use different vocabulary
- Highly abstract or conceptual questions
- Very large document collections where keyword matching becomes noisy
