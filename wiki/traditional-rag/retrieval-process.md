# Traditional RAG — Retrieval Process

## The Multi-Stage Retrieval Pipeline

Traditional RAG's retrieval pipeline is designed for precision. Each stage filters and refines the candidate set, trading latency for accuracy. Here's the complete flow.

## Stage 1: HyDE — Hypothetical Document Embeddings

The user's query is often short and context-free: "What was revenue growth?" A short query embedded directly may not match well with document chunks that contain the answer but use different phrasing.

HyDE (Hypothetical Document Embeddings) solves this by using the LLM to generate a hypothetical answer to the query first, then embedding that answer instead of the original query.

**The HyDE process:**
1. Take the user's query: "What was revenue growth in Q3?"
2. Ask the LLM: "Generate a paragraph that would answer this question about a company's financial performance."
3. The LLM generates: "In Q3 2024, the company reported revenue growth of 15% year-over-year, reaching $450 million. This growth was driven by strong performance in the enterprise segment..."
4. Embed the generated paragraph, not the original query
5. Use this embedding for vector search

The generated paragraph contains rich language, specific terminology, and sentence structure similar to what would appear in an actual financial document. This bridges the "query-document gap" — the difference between how users ask questions and how documents present information.

**Cost consideration:** HyDE adds one LLM call per query. For GPT-4o-mini, this costs a fraction of a cent and adds ~500ms of latency. For most applications, quality improvement justifies the cost.

## Stage 2: Vector Search with Metadata Filtering

The HyDE embedding is used to search Chroma for the top-20 most similar chunks. If the user has specified context (a document section, a date range), metadata filtering is applied simultaneously:

```
Search(query_embedding, top_k=20, where={
    "heading_path": {"$contains": "Financial Results"},
    "page_number": {"$gte": 10, "$lte": 25}
})
```

Metadata filtering happens at the Chroma level, before vector similarity scoring. This ensures the candidate set is both semantically relevant and contextually appropriate.

## Stage 3: Cohere Reranking

Vector similarity is a "lightweight" relevance signal — it measures overall semantic similarity, but doesn't deeply understand the relationship between query and chunk. A chunk about "revenue decline in Europe" might score lower than one about "revenue increase in Asia" for a query about "revenue," even though the Asia chunk is more relevant.

Cohere's reranker is a cross-encoder model that takes the query and each chunk as a pair and produces a precise relevance score. Unlike the embedding model (which encodes query and chunk independently), the cross-encoder sees them together and can judge relationships like:

- "This chunk directly answers the question"
- "This chunk is about the same topic but a different aspect"
- "This chunk mentions the query terms but in an unrelated context"

The top-20 candidates are sent to Cohere, which returns relevance scores. The chunks are reordered by these scores, and only the top 5-8 are used for answer generation.

**Why not use Cohere for everything?** Cross-encoder reranking is too slow and expensive to run against all chunks. The two-stage approach (fast vector search → precise reranking) gives the best of both worlds.

## Stage 4: Context Assembly

The top-ranked chunks are assembled into a prompt:

```
You are answering questions about [document title].
Use the following excerpts to answer the user's question.
Cite sources using [Page N, Section Name].

[Excerpt 1 — Page 12, Financial Results > Revenue]
...
[Excerpt 2 — Page 15, Financial Results > Growth Analysis]
...

Question: [user's question]
Answer:
```

Chunks are ordered by relevance score (most relevant first). This matters because LLMs tend to pay more attention to earlier context.

## Stage 5: LLM Answer Generation

GPT-4o generates the answer, synthesizing information from multiple chunks and citing sources. The prompt instructs the model to:

- Use only information from the provided excerpts
- Cite sources inline
- Say "I don't know" if the excerpts don't contain the answer
- Be concise but complete

## Stage 6: Evaluation

After answer generation, GPT-4o evaluates the answer on four dimensions (same as Vectorless RAG):

- **Faithfulness:** Does the answer contradict any provided excerpt?
- **Groundedness:** Is every claim supported by an excerpt?
- **Relevance:** Does the answer address the user's question?
- **Citation Accuracy:** Do citations point to correct excerpts?

Scores are stored and displayed to the user. This creates accountability — the system measures its own performance honestly.

## Comparison with Vectorless RAG Retrieval

| Aspect | Vectorless RAG | Traditional RAG |
|--------|---------------|-----------------|
| Query processing | Direct keyword | HyDE → embedding |
| Search | PostgreSQL FTS + ILIKE | Chroma vector search |
| Reranking | BM25 score fusion | Cohere cross-encoder |
| Candidates | ~20 | ~20 |
| Final context | Top 5-8 after fusion | Top 5-8 after reranking |
| Latency | 50-200ms | 500-1500ms |
| Cost per query | Near-zero | ~$0.005 (HyDE + Cohere) |

The tradeoff is clear: Traditional RAG is slower and more expensive per query, but delivers more precise retrieval — especially for queries where the user's vocabulary differs from the document's.
