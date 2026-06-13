# Traditional RAG — Embedding Pipeline

## From Text to Vectors

The embedding pipeline is the bridge between human-readable documents and machine-searchable vector representations. Traditional RAG uses OpenAI's `text-embedding-3-large` model, which converts text into 3072-dimensional vectors that capture semantic meaning.

## Why text-embedding-3-large?

Choosing an embedding model involves tradeoffs between quality, cost, and dimensionality:

**Quality:** `text-embedding-3-large` is OpenAI's most capable embedding model, scoring highest on the MTEB (Massive Text Embedding Benchmark) across retrieval, clustering, and classification tasks. For a production system where search quality directly impacts user experience, this matters.

**Variable dimensions:** A unique feature of this model is support for variable output dimensions. While the native dimension is 3072, you can request shorter embeddings (e.g., 256 or 1024) by setting the `dimensions` parameter. Shorter embeddings use less storage and enable faster search, with a small quality tradeoff. This is valuable for scaling — you can start with 3072 dimensions for quality, then reduce to 1024 if storage or latency become concerns.

**Cost:** At $0.13 per million tokens, embedding a 100,000-token document costs about $0.013. For a system ingesting many documents, this cost is noticeable but usually acceptable for the quality improvement over free alternatives.

## The Embedding Process

When a document is processed:

1. **Chunking happens first** — text is split into semantically coherent segments (see Chunking Strategy)
2. **Each chunk is embedded independently** — the embedding model sees only the chunk text, enriched with metadata (document title, section heading, page number)
3. **Metadata is prepended** to the chunk text before embedding: `"Title: Annual Report 2024 | Section: Q3 Financial Results | Page 12 | Content: [chunk text]"`
4. **Vectors are stored in Chroma Cloud** alongside the chunk text and metadata
5. **Chunk metadata is also stored in PostgreSQL** for relational queries and audit trails

The metadata prepending is a simple but effective technique. It gives the embedding model context about where the chunk came from, improving the semantic representation. A chunk about "revenue growth" from the financial section gets different context than the same phrase from a marketing section.

## Async Processing with Celery

Embedding is part of the async ingestion pipeline:

```python
@celery_app.task
def process_document(document_id):
    # 1. Extract text
    # 2. Chunk with semantic splitting
    # 3. Extract metadata
    # 4. Generate embeddings (this step)
    # 5. Store in Chroma Cloud
    # 6. Store metadata in PostgreSQL
    # 7. Mark document as ready
```

The embedding step can be slow for large documents (API latency per chunk). Running it asynchronously through Celery means the API returns immediately after upload, and users poll for completion. The worker handles retries if the OpenAI API is temporarily unavailable.

## Batch Processing

Rather than embedding chunks one at a time (N API calls for N chunks), the pipeline batches chunks for efficiency. OpenAI's embedding API supports batches of up to 2048 inputs per request. Batching 50 chunks per call reduces API overhead significantly.

## Storage Strategy

Vectors are stored in Chroma Cloud with these considerations:

- **Collection per document or tenant?** Per-tenant collections provide natural isolation. Per-document collections enable document-level operations (delete all chunks from a deleted document).
- **Metadata filtering:** Chroma supports metadata-based filtering, enabling queries like "search only in section 3 of document X" without modifying the vector search algorithm.
- **Index type:** Chroma uses HNSW (Hierarchical Navigable Small World) indexing by default, providing fast approximate nearest neighbor search with configurable recall-precision tradeoffs.

## Cost and Latency Considerations

For a typical 100-page document (~50,000 tokens, ~100 chunks):

- Embedding cost: ~$0.0065 (50K tokens × $0.13/M)
- Processing time: ~2-3 seconds (batched API calls)
- Storage: ~1.2MB (100 chunks × 3072 dimensions × 4 bytes)

For high-throughput applications, these numbers matter. Embedding 1000 documents costs ~$6.50 and produces ~1.2GB of vectors. Plan your infrastructure and budget accordingly.
