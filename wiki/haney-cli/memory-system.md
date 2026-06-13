# Haney CLI — Memory System

## Two Files, Two Purposes

Haney's memory system uses two markdown files that serve different but complementary roles. Together, they give the LLM both persistent knowledge about your project and a compressed view of your current conversation state.

## memory.md — Long-Term Project Memory

This file stores knowledge that should survive across sessions — your preferred frameworks, coding conventions, architectural decisions, and project-specific notes. It's like a persistent sticky note that the LLM reads at the start of every interaction.

**How it's managed:** You add to it with `/remember`:

```bash
/remember Use FastAPI with async endpoints
/remember Prefer uv over pip for dependency management
/remember All API routes require JWT authentication
```

Each command appends a bullet point. Existing entries are never overwritten. If the file doesn't exist, it's created with a header. You can also edit it manually with any text editor — it's just markdown.

**What makes it safe:** `/compact` never modifies memory.md. `/remember` only appends — it can't delete or overwrite. And because it's a plain markdown file, you're never locked into Haney's format. Your knowledge is yours.

**Context priority:** memory.md is priority 2 in the project context hierarchy (after summary.md, before plan.md). Its full content is injected into every LLM request.

## summary.md — Compressed Conversation State

This file stores a compressed representation of your current conversation — completed work, important decisions, current architecture understanding, open tasks, and known issues. It's regenerated on demand via `/compact`.

**How it works:** When you run `/compact`, Haney gathers your conversation history (last 40 messages), current memory.md, and previous summary.md, and sends them to the LLM with a summarization prompt. The model generates a concise summary (targeting under 1000 words), which overwrites the previous summary.md. Then the in-memory conversation is truncated to the last 10 messages, and the new summary is injected as context for future interactions.

The result is typically a 70-85% reduction in token usage while preserving the essential context.

**Lifecycle:** Unlike memory.md, summary.md is ephemeral — it's overwritten on each `/compact`. But it persists to disk, so if you exit and return, your last summary is still there to provide continuity.

**Context priority:** summary.md is priority 1 — the highest. It's injected at the very top of the project context preamble because it represents the most current state of your work.

## How They Work Together

```
Session start
  │
  ├─ memory.md loaded (persistent knowledge)
  ├─ summary.md loaded (previous compact state)
  │
  ▼
Conversation proceeds
  │
  ├─ /remember "Use PostgreSQL" → memory.md updated
  │
  ├─ Context grows large → /compact
  │   ├─ LLM reads memory.md + conversation
  │   ├─ New summary.md generated
  │   ├─ Conversation truncated
  │   └─ Future context includes both memory + new summary
  │
  ▼
Session ends → memory.md persists, summary.md persists
```

## Why Two Files Instead of One?

Memory and summary serve fundamentally different purposes. Memory is user-curated, long-lived, and append-only. Summary is LLM-generated, ephemeral, and overwritten. If you combined them, you'd lose the ability to persist user decisions without polluting them with auto-generated state, or you'd have auto-generated content cluttering your carefully curated notes.

## Why `.haney/` Instead of the Project Root?

These files are Haney-internal. They shouldn't clutter your project root or be accidentally committed to git. Only user-owned files like plan.md belong at the root.

## Why Markdown and Not Vectors?

Haney is intentionally vector-free. Memory and summary are injected as raw text into the system prompt. This keeps the architecture simple, transparent, and cost-effective. No embedding models, no vector databases, no retrieval pipelines. Just text files that the LLM reads directly. For most projects, this is more than sufficient — and it's far simpler to reason about.
