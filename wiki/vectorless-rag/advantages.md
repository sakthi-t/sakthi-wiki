# Vectorless RAG — Advantages

Every architectural choice involves tradeoffs. Here's what Vectorless RAG gains by avoiding vector embeddings.

## Advantage 1: Zero Embedding Costs

Embedding APIs charge per token — both for the input text being embedded and often for storage. For a multi-tenant application with many documents, these costs accumulate silently. A 200-page PDF might contain 100,000 tokens, which at OpenAI's embedding rates costs roughly $0.013 to embed. Upload 100 documents, embed them all, and you've spent $1.30 before a single user question.

Vectorless RAG eliminates this entirely. PostgreSQL full-text search is part of the database you're already paying for. The tsvector index is built once during ingestion and costs nothing to query. For applications processing many documents, this is significant.

## Advantage 2: Simplified Infrastructure

A vector-based RAG system typically requires:
- A database for application data
- A vector database for embeddings (Pinecone, Weaviate, Chroma, etc.)
- A message queue for async processing
- Object storage for documents

Vectorless RAG needs:
- PostgreSQL (data + search + BM25 stats)
- Redis (Celery broker only)
- Object storage for documents

That's two fewer services to provision, monitor, scale, and pay for. For a small team or solo developer, every eliminated service is hours saved on DevOps.

## Advantage 3: Deterministic and Debuggable Search

When a vector search returns unexpected results, debugging is frustrating. "Why did the model think chunk #47 was relevant?" The answer is: the cosine similarity between two 3072-dimensional vectors was 0.83. That's not actionable.

With lexical search, every result has a clear explanation: "Chunk #47 matched because it contains the words 'quarterly,' 'revenue,' and 'growth' with BM25 scores of 3.2, 2.1, and 1.8." You can read the chunk, see the matching words, and understand exactly why it was retrieved. This transparency is invaluable for both development and user trust.

## Advantage 4: No Embedding Model Dependency

Embedding models change. A newer model produces different vectors for the same text. Migrating between embedding models means re-embedding all documents — an expensive batch operation. And if the embedding API changes pricing or deprecates a model, you have a migration on your hands.

PostgreSQL full-text search uses linguistic algorithms (stemming, stop words, ranking) that are stable and well-documented. The search behavior won't change unless you explicitly change the PostgreSQL configuration. Your indexing pipeline is stable for years, not months.

## Advantage 5: Native Multi-Tenant Isolation

Vector databases often struggle with multi-tenancy. Some don't support it at all. Others support it through namespaces or metadata filtering, which adds complexity and can degrade performance. And accidentally leaking embeddings between tenants is a serious security concern.

PostgreSQL has robust support for row-level security, schema-based isolation, and indexed tenant_id filtering. Multi-tenancy is a first-class feature, not an afterthought. Every query includes `WHERE tenant_id = $1` — it's impossible to forget and difficult to bypass.

## Advantage 6: Excellent for Keyword-Rich Queries

Users searching documents often use specific terminology — product names, technical terms, dates, figures. These are exactly the kinds of queries where lexical search excels. If a user asks "What was the Q3 2024 revenue from the Enterprise segment?", the words "Q3," "2024," "revenue," and "Enterprise" are going to appear verbatim in the relevant document sections.

Embedding-based search can sometimes be too "smart" for these queries — it finds semantically related content that doesn't contain the specific information the user needs. Lexical search, with its focus on exact term matching, is often more precise for document Q&A.

## Advantage 7: Predictable Performance

Vector search performance depends on the index type (HNSW, IVF, etc.), the number of vectors, and the dimensionality. Query latency can vary significantly based on these factors. PostgreSQL full-text search with a GIN index on tsvector has predictable, sub-millisecond performance for typical document collections (thousands to tens of thousands of chunks).

There's no index tuning, no approximation parameters, no recall-precision tradeoffs to manage. The GIN index either covers the query or it doesn't, and if it does, performance is fast and consistent.
