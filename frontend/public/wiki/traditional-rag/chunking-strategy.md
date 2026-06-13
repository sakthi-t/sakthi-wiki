# Traditional RAG — Chunking Strategy

## The Art of Splitting Text

Chunking is one of the most underrated aspects of RAG. Split too coarsely, and chunks contain irrelevant information that confuses retrieval. Split too finely, and chunks lack sufficient context for the LLM to generate good answers. The right chunking strategy can matter more than the choice of embedding model.

## Semantic Chunking

Traditional RAG uses semantic chunking — splitting text based on meaning rather than arbitrary character counts. Here's how it works:

**Step 1: Initial splitting.** The document is split on natural boundaries: paragraphs, section breaks, and page boundaries. These are the "obvious" split points — places where a human would naturally divide the text.

**Step 2: Embedding similarity.** Each candidate chunk is embedded, and the cosine similarity between adjacent chunks is computed. Two paragraphs about the same topic will have high similarity. A paragraph about revenue followed by one about employee benefits will have low similarity.

**Step 3: Merge or split based on similarity.** Adjacent chunks with similarity above a threshold (e.g., 0.7) are merged. Chunks that are too long (based on token count) are split at sentence boundaries. The result is chunks that are semantically coherent — each chunk covers one topic or concept.

The threshold is tunable. A higher threshold (0.8) produces smaller, more focused chunks. A lower threshold (0.6) produces larger, more comprehensive chunks. The optimal value depends on the document type and the kinds of questions users ask.

## Chunk Sizing

Each chunk targets 500-1500 characters with these constraints:

- **Minimum 200 chars:** Smaller chunks lack context. A single sentence rarely answers a question.
- **Maximum 1500 chars:** Larger chunks contain too much information. The LLM has to work harder to find the relevant part.
- **Prefer sentence boundaries:** Chunks always end at sentence boundaries, never mid-sentence.
- **Preserve heading context:** Each chunk includes its heading path (e.g., "Chapter 3 > Financial Results > Revenue").

The heading path is critical for citation accuracy. When the LLM cites `[Page 12, Chapter 3 > Financial Results > Revenue]`, the user can navigate directly to the source.

## Why Not Fixed-Size Chunking?

The simplest chunking strategy — split every N characters with M characters of overlap — is popular because it's easy to implement. But it has fundamental problems:

- **Mid-thought splits:** A chunk might end in the middle of a sentence, cutting off critical context.
- **Arbitrary boundaries:** The split point at character 1000 has no relationship to the content. Two related sentences might end up in different chunks.
- **Overlap waste:** Overlapping chunks (typically 10-20%) duplicate content, inflating storage and embedding costs.

Semantic chunking avoids these issues by respecting document structure. The overhead of computing embedding similarity is justified by the quality improvement.

## Metadata Extraction

Each chunk carries structured metadata:

```json
{
  "document_id": "doc_abc123",
  "document_title": "Annual Report 2024",
  "page_number": 12,
  "heading_path": ["Chapter 3", "Financial Results", "Revenue"],
  "section_type": "financial_data",
  "contains_tables": true,
  "word_count": 187,
  "chunk_index": 42
}
```

This metadata enables:

- **Scoped search:** "Find information about revenue in Chapter 3" → filter to chunks with `heading_path` containing "Chapter 3" and "Revenue"
- **Citation formatting:** `[Page 12, Chapter 3 > Financial Results > Revenue]`
- **Quality filtering:** Exclude chunks that are mostly tables (better handled separately) or too short
- **Analytics:** Which sections of documents are users asking about most?

Metadata extraction is done during ingestion using a combination of structural parsing (document tree) and LLM-based classification (section type identification).

## Handling Special Content

**Tables:** Tabular data is challenging because it loses structure when converted to plain text. Chunks containing tables are flagged in metadata. The LLM receives the raw table text plus a note that it was originally tabular.

**Lists and bullet points:** These are preserved as-is. The LLM handles list formatting naturally.

**Code blocks:** If the document contains code, it's chunked as a single unit (not split mid-function). Code chunks are flagged for potential syntax-highlighted display.

**Images:** Currently, image content is not processed (CLIP embeddings are on the roadmap). Image captions and surrounding text provide some context for image-heavy pages.

## The Impact of Chunking on Retrieval Quality

Good chunking improves retrieval in two ways:

1. **Better embeddings:** A semantically coherent chunk produces a more focused embedding vector. The embedding model doesn't have to "average out" unrelated concepts.
2. **Better context for the LLM:** Retrieved chunks that cover a single topic give the LLM clean context to work with, rather than forcing it to find the needle in a haystack of mixed information.

A common failure mode in RAG systems is retrieving "half-right" chunks — chunks that contain the answer but also contain so much unrelated text that the LLM gets confused. Semantic chunking directly addresses this.
