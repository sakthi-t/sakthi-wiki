# Traditional RAG — Limitations

## The Costs of the Full Stack

Traditional RAG delivers excellent retrieval quality, but it comes with real costs. Being honest about these limitations helps you decide when the tradeoff is worth it.

## Limitation 1: API Costs Per Query

Every user query triggers multiple API calls:

- HyDE generation (GPT-4o-mini): ~$0.0002
- Query embedding (text-embedding-3-large): ~$0.00001
- Cohere reranking (20 candidates): ~$0.002
- Answer generation (GPT-4o): ~$0.003
- Evaluation (GPT-4o): ~$0.002

**Total per query: ~$0.007-0.01**

At 1000 queries per day, that's $7-10 daily or $210-300 monthly — just for LLM API costs. Add infrastructure (Chroma, PostgreSQL, Redis, compute) and the total cost of ownership can be significant for high-traffic applications.

Vectorless RAG, by comparison, costs ~$0.003-0.005 per query (answer generation + evaluation only — no HyDE, no embeddings, no reranking).

## Limitation 2: Latency Accumulation

Each pipeline stage adds latency:

- HyDE generation: 500-1000ms
- Query embedding: 100-300ms
- Chroma vector search: 50-200ms
- Cohere reranking: 200-500ms
- GPT-4o generation: 2000-5000ms (streaming starts sooner)
- Evaluation: 1000-2000ms (can run async)

**Total end-to-end: 3-8 seconds**

For a chat interface, 3-5 seconds is acceptable (users are used to waiting for thoughtful responses). But 8 seconds starts to feel slow. Streaming answer generation helps — users see tokens appearing after 2-3 seconds — but the full answer takes longer.

## Limitation 3: Infrastructure Complexity

Traditional RAG's stack includes:

- PostgreSQL (relational data)
- Chroma Cloud (vector search)
- Redis (Celery broker)
- Celery workers (async processing)
- OpenAI API (embeddings + generation + evaluation)
- Cohere API (reranking)
- Backblaze B2 (document storage)
- Clerk (authentication)
- Flower (worker monitoring, optional)

Each service is a potential point of failure. Each has its own pricing, its own dashboard, its own configuration. For a solo developer or small team, this operational surface area is significant.

Compare with Vectorless RAG: PostgreSQL, Redis, Backblaze B2, Clerk, OpenAI. Three fewer services.

## Limitation 4: Embedding Model Lock-In

Once documents are embedded with `text-embedding-3-large`, switching to a different embedding model requires re-embedding everything. This is an expensive batch operation — both in API costs and processing time.

If OpenAI changes the model (deprecation, pricing change, quality regression), you face a migration. If a better model becomes available, upgrading means re-processing your entire document corpus.

The embedding model choice is a long-term commitment. Choose carefully and budget for occasional migrations.

## Limitation 5: Embedding Costs at Scale

At $0.13 per million tokens, embedding costs for large document collections add up:

- 1,000 documents × 50,000 tokens each = $6.50
- 10,000 documents × 50,000 tokens = $65.00
- 100,000 documents × 50,000 tokens = $650.00

These are one-time ingestion costs, but they're real. For applications that ingest large volumes of documents, the embedding cost can be a significant line item.

Additionally, if you need to re-embed (model change, bug fix), you pay these costs again.

## Limitation 6: HyDE Can Generate Misleading Hypotheticals

HyDE generates a hypothetical answer to improve retrieval. But if the LLM generates a wrong hypothetical, it can steer retrieval toward irrelevant chunks.

Example: User asks "Why did revenue decline in Q3?" HyDE generates: "Revenue declined due to supply chain disruptions and increased competition..." But in reality, the document might show revenue *increased* in Q3, and the reason is a successful product launch. The HyDE embedding pulls chunks about supply chains and competition — wrong context entirely.

This failure mode is rare but impactful when it occurs. The reranking stage partially mitigates it (irrelevant chunks get low reranking scores), but the initial candidate set is already skewed.

## Limitation 7: Reranking Doesn't Handle All Cases

Cohere's reranker improves precision but can't rescue fundamentally bad retrieval. If the vector search fails to find any relevant chunks in the top-20, reranking can only rearrange the best of a bad set.

This matters most for:
- Documents with unusual structure or specialized vocabulary
- Queries that require synthesizing information from many chunks
- Adversarial cases where documents are deliberately misleading
- Very long documents where the answer is spread across many sections

The quality floor is set by vector search recall. Reranking raises the ceiling on precision. But if recall is poor, precision improvements can't compensate.

## When Simplicity Wins

Traditional RAG is the right choice when retrieval quality is the top priority and you have the budget and team to manage the infrastructure. It's the wrong choice when:

- Cost sensitivity is high (many queries, tight budget)
- Latency requirements are strict (sub-2-second responses)
- Operational simplicity matters (small team, limited DevOps)
- Documents are keyword-rich and users ask specific questions
- You're building an MVP and want to validate before investing in infrastructure

The two RAG projects (Vectorless and Traditional) are complementary. Start with Vectorless for simplicity and low cost. Graduate to Traditional when quality demands justify the investment.
