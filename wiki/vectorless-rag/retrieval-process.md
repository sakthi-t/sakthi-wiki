# Vectorless RAG — Retrieval Process

## How Search Works Without Embeddings

When a user asks a question about their document, the system needs to find the most relevant chunks to include in the LLM's context. Here's the complete retrieval pipeline, step by step.

## Step 1: Relevance Guardrail

Before any search happens, a lightweight classifier (gpt-4o-mini) checks whether the question is actually about the document. "What's the quarterly revenue?" → relevant. "Write me a poem about cats" → off-topic.

This guardrail prevents the system from doing expensive searches for questions the document can't answer. If the question is off-topic, the user gets a polite message suggesting they ask about the document instead.

## Step 2: Cache Hit Detection

Many users ask the same question multiple times or rephrase slightly. Before searching, the system checks if a similar question was asked recently using Jaccard similarity on normalized tokens (threshold 0.6).

If a cached result exists, it's returned immediately — no search, no LLM call. This saves both latency and API costs for repeated queries.

## Step 3: Dual Parallel Search

This is the core innovation. Two search strategies run simultaneously, and their results are merged:

### PostgreSQL Full-Text Search (FTS)

Uses PostgreSQL's `websearch_to_tsquery` to convert the user's question into a search query, then matches against the tsvector index on chunks. This is fast (milliseconds) and handles stemming, stop words, and phrase matching.

The scoring uses a custom BM25 formula:
```
BM25 = IDF × (TF × (k1 + 1)) / (TF + k1 × (1 - b + b × doc_length / avg_doc_length))
```

IDF (inverse document frequency) is pre-computed and stored in `bm25_stats`. TF (term frequency) comes from the tsvector. The `k1` and `b` parameters control term frequency saturation and length normalization.

### ILIKE Fallback

PostgreSQL's full-text search sometimes misses matches due to stemming differences or compound words. The ILIKE fallback uses pattern matching with word-boundary awareness:

```sql
WHERE content ILIKE '% word %'
```

This catches exact substring matches that tsvector might miss. The fallback also applies a first-line boost — matches in the chunk's opening sentence get a 10× score multiplier (opening sentences typically contain the main topic).

## Step 4: Result Fusion

Results from both search strategies are merged:

1. **Deduplication** — Same chunk found by both strategies? Keep the higher-scoring version.
2. **Score normalization** — BM25 and ILIKE scores have different scales; they're normalized to a common range.
3. **Token coverage filtering** — Questions must match at least 50% of their tokens in a chunk to be included. This eliminates chunks that match on a single common word.
4. **Confidence threshold** — Chunks scoring below 0.5 are discarded. This separates "probably relevant" from "background noise."
5. **Final ranking** — Chunks are sorted by combined score.

## Step 5: LLM Answer Generation

The top-ranked chunks are formatted with citations and sent to the LLM along with the user's question, conversation history (sliding window of 10 messages), and instructions to cite sources using `[Page N]` notation with heading paths.

The LLM generates an answer that synthesizes information from multiple chunks, citing its sources inline. This creates a verifiable response — users can trace every claim back to a specific page in their document.

## Step 6: LLM-as-Judge Evaluation

After the answer is generated, it's scored by GPT-4o across four dimensions:

- **Faithfulness (0-100):** Does the answer contain any claims not supported by the retrieved chunks? (Hallucination detection)
- **Groundedness (0-100):** Is the answer factually anchored to the retrieved context?
- **Citation Accuracy (0-100):** Do the citations point to chunks that actually support the claims?
- **Relevance (0-100):** Does the answer address the user's question?

The system also checks for common refusal patterns (11 phrases like "I don't have enough information") — these are auto-scored at `{0,0,0,0}` without wasting an LLM call.

Scores are stored on the chat message and displayed in a collapsible side panel with color-coded bars. Users can see exactly how good each answer is.

## Why This Pipeline Works

The dual-search approach (FTS + ILIKE) compensates for the weaknesses of each individual method. FTS is fast and handles linguistic variations but can be too aggressive with stemming. ILIKE catches exact matches but struggles with synonyms. Together, they provide broader coverage than either alone.

The confidence threshold and token coverage filter reduce noise — a common problem with keyword-based search. The LLM reranking (implicit through the generation prompt) ensures the final answer uses the most relevant context. And the evaluation system provides objective quality metrics rather than relying on "it looks good to me."

## Conversation Memory

Each chat session maintains a sliding window of the last 10 messages. This keeps the LLM aware of conversation context without consuming too many tokens. The memory is simple — no summarization, no embeddings — just the raw messages. For document Q&A, this is usually sufficient. Users typically ask a series of related questions, and the last few exchanges provide enough context.
