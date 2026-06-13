# Traditional RAG — Vector Database Workflow

## Chroma Cloud as the Search Engine

Traditional RAG uses Chroma Cloud as its vector database — a managed service that handles storage, indexing, and similarity search for embedding vectors. This removes the operational burden of running a vector database while providing serverless scaling.

## Why Chroma Cloud?

Several vector databases were evaluated:

**Pinecone** — Mature, excellent performance, but expensive at scale and requires separate infrastructure management.

**Weaviate** — Feature-rich with hybrid search built in, but adds operational complexity with its own deployment requirements.

**pgvector (PostgreSQL extension)** — Would keep everything in one database (like Vectorless RAG), but HNSW index performance degrades with high-dimensional vectors and large collections. Chroma handles this better.

**Chroma Cloud** — Serverless, simple API, good metadata filtering, and no infrastructure to manage. The tradeoff is less control over index parameters, but for most use cases, the defaults work well.

## Collection Design

Documents are organized into Chroma collections by tenant:

```
Collection: tenant_{tenant_id}
├── doc_abc123_chunk_001  [vector_3072d] {metadata}
├── doc_abc123_chunk_002  [vector_3072d] {metadata}
├── doc_def456_chunk_001  [vector_3072d] {metadata}
└── ...
```

Each entry in a collection has:
- **ID** — Unique identifier combining document ID and chunk index
- **Vector** — 3072-dimensional embedding
- **Metadata** — Page number, heading path, section type, word count
- **Document** — The actual chunk text (for retrieval)

Tenant-level collections provide natural isolation. Deleting a tenant means deleting their collection — clean and simple. No risk of cross-tenant data leakage.

## Indexing Strategy

Chroma Cloud uses HNSW indexing with these characteristics:

- **Graph-based:** Each vector is connected to its nearest neighbors in a hierarchical graph structure
- **Approximate:** Search is O(log N) rather than O(N) for exact search, with ~95-99% recall
- **Configurable:** The `ef_search` parameter controls the tradeoff between speed and accuracy
- **Incremental:** New vectors can be added without rebuilding the index

For the typical scale of this application (thousands to tens of thousands of chunks per tenant), HNSW provides fast, accurate search with no tuning required.

## The Query Flow

When a user asks a question:

1. **Query embedding:** The question is embedded using the same `text-embedding-3-large` model
2. **Vector search:** Chroma finds the k-nearest neighbors (typically k=20) to the query vector
3. **Metadata filtering (optional):** If the user specifies a document section, results are filtered
4. **Candidate retrieval:** The top-k chunks and their metadata are retrieved
5. **Reranking:** Cohere reranks the candidates for precision
6. **Top-n selection:** The best n chunks (typically n=5-8) are sent to the LLM

The initial k=20 provides a broad candidate pool. Reranking narrows it to the most relevant chunks. This two-stage approach gives the best of both worlds: recall from vector search, precision from cross-encoder scoring.

## Performance Characteristics

For a collection with 10,000 chunks (approximately 100 documents):

- **Vector search latency:** 50-200ms (Chroma Cloud)
- **Embedding latency:** 100-500ms (OpenAI API, batched)
- **Total retrieval latency:** 150-700ms
- **Storage:** ~120MB (10,000 × 3072 × 4 bytes)

For larger collections (100,000+ chunks), latency increases modestly due to HNSW's logarithmic scaling. At extreme scale (millions of chunks), consider sharding across multiple collections.

## Maintenance Operations

**Document deletion:** When a document is deleted, all its chunks are removed from the Chroma collection by ID prefix. No reindexing needed.

**Re-embedding:** If the embedding model changes, all chunks must be re-embedded and the collection rebuilt. This is an expensive batch operation, which is one reason the choice of embedding model should be stable.

**Index health:** Chroma Cloud handles index maintenance automatically. There's no need for manual reindexing, vacuuming, or optimization.

## Integration with PostgreSQL

Chroma stores vectors and chunk metadata. PostgreSQL stores everything else — users, documents, chat sessions, messages, and evaluation scores. The two databases serve different purposes:

- **Chroma:** "What chunks are semantically similar to this query?"
- **PostgreSQL:** "What documents does this user own? What were the last 10 messages in this chat? What's the average faithfulness score across all answers?"

This separation of concerns keeps each database focused on what it does best. Chroma handles vector search. PostgreSQL handles relational data and application state.
