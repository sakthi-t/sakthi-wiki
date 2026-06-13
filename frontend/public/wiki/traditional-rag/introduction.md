# Traditional RAG — Introduction

## A Production-Grade RAG Platform

Traditional RAG (called HybridRAG in the codebase) is a modern, production-grade retrieval-augmented generation platform. Unlike Vectorless RAG, this project fully embraces embeddings, semantic search, and the modern RAG stack — but with careful engineering for reliability, evaluation, and scalability.

## The Full RAG Stack

This project represents the "complete" RAG implementation — everything you'd want in a production system:

- **Semantic chunking** that adapts to document structure
- **Metadata extraction** that enriches chunks with document-level context
- **Vector embeddings** using `text-embedding-3-large` for semantic search
- **HyDE retrieval** (Hypothetical Document Embeddings) to bridge the query-document gap
- **Metadata-aware filtering** for precise, scoped searches
- **Cohere reranking** for cross-encoder scoring on top of vector results
- **LLM-as-Judge evaluation** on four quality dimensions
- **Async ingestion** with Celery workers for non-blocking document processing

## Why This Project Exists

While Vectorless RAG explores how far you can go without embeddings, Traditional RAG explores how good you can make retrieval when you use the full modern toolkit. It's the other side of the same coin.

The project serves as:

**A reference implementation.** If you're building a RAG system, this codebase demonstrates production patterns: async processing, structured error handling, comprehensive evaluation, and clean API design.

**An evaluation platform.** The LLM-as-Judge scoring gives objective quality metrics. You can A/B test different chunking strategies, embedding models, or reranking approaches and measure the impact.

**A foundation for research.** With clean abstractions for chunking, embedding, retrieval, and evaluation, the codebase is designed for experimentation. Swap out components and measure the difference.

## Key Differentiators From Vectorless RAG

| Aspect | Vectorless RAG | Traditional RAG |
|--------|---------------|-----------------|
| Search engine | PostgreSQL FTS + BM25 | Chroma Cloud (vector) |
| Embeddings | None | text-embedding-3-large |
| Query enhancement | None (direct keyword) | HyDE (hypothetical docs) |
| Reranking | Score-based fusion | Cohere cross-encoder |
| Evaluation | GPT-4o (same) | GPT-4o (same) |
| Complexity | Low (1 database) | Medium (vector DB + DB) |

## The Architecture Philosophy

Traditional RAG follows a principle of "progressive enhancement" in retrieval:

1. Start with fast vector search (Chroma) to get a broad candidate set
2. Apply metadata filtering to narrow by document structure
3. Use HyDE to reformulate the query for better semantic matching
4. Apply Cohere reranking for precise relevance scoring
5. Feed the best chunks to the LLM with clear citation instructions

Each step adds precision at the cost of latency. The pipeline is designed so you can add or remove steps based on your latency budget and quality requirements.

## When to Use This Approach

Traditional RAG is the right choice when:
- Semantic search quality is the top priority
- Documents use varied vocabulary (you need embeddings to bridge the gap)
- You want to experiment with different retrieval strategies
- You're willing to pay for embedding and reranking APIs
- Production reliability and evaluation matter more than minimizing costs
