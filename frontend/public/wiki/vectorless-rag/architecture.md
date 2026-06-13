# Vectorless RAG — Architecture

## System Overview

Vectorless RAG is a full-stack application with a React frontend, FastAPI backend, PostgreSQL database, Redis message broker, and Backblaze B2 object storage. Async document processing runs through Celery workers. Authentication is handled by Clerk.

```
React + Vite SPA ──→ FastAPI Backend ──→ PostgreSQL (NeonDB) + Redis + Backblaze B2
(Clerk Auth)         (JWT verification)      │
(React Query)        (RBAC + isolation)       │
                                             ▼
                                      Celery Workers
                                      (PDF extraction, chunking, indexing)
```

## Component Breakdown

### Frontend: React + Vite + TypeScript

The frontend is a single-page application built with React 19, Vite 8, and TypeScript 6. Clerk provides authentication UI and JWT management. React Query (TanStack Query) handles server state — caching, background refetching, optimistic updates. Tailwind CSS v4 provides styling with utility classes.

React Router manages navigation between pages: Dashboard, Documents, Chat, Admin, and Profile. The chat interface is the centerpiece — a streaming conversation view with cited answers and collapsible evaluation scores.

### Backend: FastAPI + Async SQLAlchemy

The backend is organized into clear domains:

- **api/** — Route handlers for documents, chat, admin, and auth
- **auth/** — Clerk JWT verification, tenant context extraction, RBAC enforcement
- **db/** — Database session management with async SQLAlchemy
- **ingestion/** — The 9-stage PDF processing pipeline
- **models/** — SQLAlchemy ORM models (7 tables)
- **retrieval/** — BM25 search, ranking, relevance classification, evaluation
- **services/** — Business logic orchestration
- **tasks/** — Celery configuration and async task definitions

Every API request goes through JWT verification. The Clerk token is decoded and validated against Clerk's JWKS endpoint — the token is never blindly trusted. The `sub` claim (Clerk user ID) becomes the tenant ID for all data access.

### Database: PostgreSQL with Full-Text Search

Seven tables form the complete data model:

- `users` — Clerk ID, email, role (admin/user), tenant identifier
- `documents` — Filename, storage key, processing status (pending → processing → ready → failed)
- `document_trees` — Hierarchical document structure (document → section → subsection → paragraph) with LLM-generated summaries
- `chunks` — Raw text with page numbers, heading paths, and `search_vector` (tsvector) columns
- `bm25_stats` — Term frequency, document frequency, and IDF scores per term
- `chat_sessions` — User sessions scoped to documents
- `chat_messages` — Messages with citations, retrieval metadata, and LLM evaluation scores

The `search_vector` column on chunks is a PostgreSQL `tsvector` — a pre-computed index of stemmed words with positional information. It's what makes full-text search fast and accurate.

### Async Processing: Celery + Redis

Document processing is a 9-stage pipeline that runs asynchronously:

1. Download PDF from storage
2. Extract text with PyMuPDF at block level
3. Build document tree (document → page → paragraph hierarchy)
4. Generate recursive LLM summaries (bottom-up, batched 5 per call)
5. Create chunks with heading paths and page numbers
6. Populate tsvector for full-text search
7. Compute BM25 term statistics (TF, DF, IDF)
8. Verify data integrity
9. Mark document as ready

Users get status updates via polling while processing happens in the background. This keeps the API responsive even for large documents.

## Design Principles

**Single database for everything.** No separate search engine, no vector store, no cache database. PostgreSQL handles structured data, full-text search, and BM25 statistics. Redis is used only as a Celery broker.

**Tenant isolation at the database level.** Every table has a `tenant_id` column. Every query is scoped. No cross-tenant access is possible, even with a bug in the application logic.

**Async-first.** The ingestion pipeline is fully asynchronous. The API is async (FastAPI + asyncpg + async SQLAlchemy). The frontend uses React Query for async state management.

**LLM-as-Judge for quality.** Instead of hoping the answers are good, the system measures them. Every answer gets a four-dimensional score, stored and displayed to the user. This creates a feedback loop for continuous improvement.
