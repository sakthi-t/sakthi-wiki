# Vectorless RAG — Limitations

Being honest about limitations is as important as celebrating advantages. Here's where Vectorless RAG falls short compared to embedding-based approaches.

## Limitation 1: Semantic Gap

Lexical search matches words, not meanings. If a document says "The CEO announced workforce optimization initiatives" and the user asks "Were there layoffs?", lexical search might miss the connection. The words "layoff" and "workforce optimization" don't match, even though they refer to the same concept.

Embedding-based search handles this naturally — the vectors for "layoff" and "workforce optimization" are close in embedding space. Vectorless RAG compensates with the ILIKE fallback and LLM reranking, but the fundamental semantic gap remains.

## Limitation 2: Vocabulary Mismatch

When the user's vocabulary differs significantly from the document's vocabulary, recall suffers. This is common with:
- Technical documents queried by non-experts
- Documents in specialized domains (legal, medical)
- Multilingual content where the user searches in a different language
- Documents with inconsistent terminology

The LLM-based answer generation helps — the model can bridge some vocabulary gaps during synthesis — but the initial retrieval still depends on keyword overlap. If relevant chunks aren't retrieved, the LLM can't use them.

## Limitation 3: Query Expansion Burden

Embedding-based search naturally handles query expansion — a short query maps to a rich vector that captures semantic intent. Lexical search with short queries (1-3 words) often returns noisy results because too many chunks match on common words.

Vectorless RAG mitigates this with the token coverage threshold (must match ≥50% of query tokens) and confidence scoring, but very short queries remain challenging. The system works best when users ask complete questions rather than typing keywords.

## Limitation 4: Scaling to Very Large Collections

BM25 scoring with PostgreSQL full-text search works well for collections with thousands to tens of thousands of chunks. For collections with millions of chunks, performance degrades:

- The GIN index grows large and cache-unfriendly
- BM25 IDF computation becomes less meaningful (everything is "rare" at scale)
- Post-processing (deduplication, fusion, threshold filtering) takes longer
- The tsvector format doesn't compress as well as vector indices

For very large document collections, vector databases with approximate nearest neighbor search (ANN) will outperform PostgreSQL FTS in both latency and relevance.

## Limitation 5: No Cross-Lingual Search

PostgreSQL full-text search is language-specific. An English tsvector index won't match a Spanish query, even if the document and query discuss the same topic. Some vector embedding models (like multilingual-e5) support cross-lingual search, mapping different languages into a shared embedding space.

For English-only applications, this isn't a concern. For multilingual applications, it's a hard limitation that can only be addressed by running separate indexes per language — or by adopting embeddings.

## Limitation 6: Maintenance of BM25 Statistics

The BM25 scoring system requires maintaining pre-computed statistics (term frequencies, document frequencies, IDF scores). When documents are added or removed, these statistics need updating. The current implementation handles this during ingestion, but it's an extra processing step and an extra table that vector-based systems don't need.

Over time, as documents accumulate, the bm25_stats table grows large. Regular maintenance (VACUUM, reindexing) is needed to maintain performance.

## Limitation 7: No Multimodal Search

Vectorless RAG is text-only. It can't search images, diagrams, or tables within PDFs — only the extracted text. A vector-based system could potentially use CLIP embeddings to search images based on textual descriptions, or use table-aware chunking to handle structured data.

For documents where visual content carries significant information (presentations, technical diagrams, forms), this is a meaningful limitation.

## When Should You Use Vector Embeddings Instead?

Vectorless RAG is the right choice when your documents are text-heavy, your queries are specific, and you value simplicity and cost control. Consider switching to embeddings when:

- Semantic understanding outweighs keyword matching
- Your document collection exceeds 100,000 chunks
- You need cross-lingual search
- Visual content is important
- Users consistently search with vocabulary different from your documents

The key insight: Vectorless RAG isn't saying "embeddings are bad." It's saying "embeddings aren't always necessary." For many document chat applications, PostgreSQL full-text search with careful BM25 scoring is not just adequate — it's excellent.
