# Sakthi Wiki

> A personal AI knowledge base built with LLM-driven wiki generation and a React frontend — inspired by Andrej Karpathy's LLM Wiki pattern.

**sakthi-wiki** is the living documentation of five real-world AI projects, transformed from raw source code and READMEs into a structured, interlinked, conversational knowledge base. An LLM agent reads the sources, extracts key insights, and maintains the wiki — cross-referencing concepts, flagging contradictions, and keeping everything current as new knowledge arrives. The result is a **compounding artifact** that grows richer with every source ingested and every question asked.

A React website sits on top of the wiki, rendering markdown pages dynamically, providing instant client-side search, and serving as a professional portfolio.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Wiki Contents](#wiki-contents)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
- [Phases](#phases)
- [Technology Stack](#technology-stack)
- [License](#license)

---

## How It Works

The project follows a three-layer architecture inspired by the LLM Wiki pattern:

```
┌──────────────────────────────────────────────┐
│  Raw Sources (immutable)                     │
│  GitHub repositories, READMEs, source code   │
├──────────────────────────────────────────────┤
│  Wiki (LLM-maintained)                       │
│  36 markdown files — summaries, architecture,│
│  lessons learned, cross-references           │
├──────────────────────────────────────────────┤
│  React Frontend                              │
│  Dynamic markdown rendering, fuzzy search,   │
│  professional portfolio, contact form        │
└──────────────────────────────────────────────┘
```

1. **Raw sources** — Six GitHub repositories serve as the immutable source of truth. The LLM reads them but never modifies them.
2. **Wiki** — An LLM agent extracts key information from each source and synthesizes it into self-contained, educational markdown pages. Every page follows a consistent standard: Introduction → Why This Exists → Architecture → Implementation → Lessons Learned → Future Improvements.
3. **React Frontend** — A Vite-powered website renders the wiki dynamically, provides instant fuzzy search via Fuse.js, and presents Sakthivel T's professional portfolio.

**The key insight:** instead of retrieving raw documents at query time (like traditional RAG), the knowledge is compiled once and kept current. Cross-references exist before you ask. Contradictions are already flagged. The synthesis reflects everything that's been ingested.

---

## Project Structure

```
sakthi-wiki/
│
├── wiki/                          # LLM-generated knowledge base (source of truth)
│   ├── index.md                   # Catalog of all wiki pages with links
│   ├── log.md                     # Chronological activity log
│   ├── haney-cli/                 # 10 pages — Terminal AI coding assistant
│   ├── haney-gpt/                 # 6 pages — GPT model from scratch
│   ├── vectorless-rag/            # 5 pages — PostgreSQL FTS RAG
│   ├── traditional-rag/           # 7 pages — Modern embedding-based RAG
│   └── ai-ecommerce/              # 6 pages — AI voice ecommerce platform
│
├── frontend/                      # React + Vite website
│   ├── public/
│   │   ├── wiki/                  # Wiki markdown (served at runtime)
│   │   ├── sakthi.jpg             # Profile photo
│   │   └── favicon.png            # Site favicon
│   ├── src/
│   │   ├── components/            # NavBar, Footer, SearchBar, SearchResults, ContactForm
│   │   ├── pages/                 # HomePage, SearchPage, WikiPage
│   │   ├── data/                  # Auto-generated search index
│   │   ├── hooks/                 # useSearch custom hook
│   │   └── utils/                 # Fuse.js search wrapper
│   ├── scripts/
│   │   └── build-search-index.js  # Regenerates search index from wiki/
│   └── functions/
│       └── api/
│           └── contact.js         # Cloudflare Pages Function for contact form
│
├── sakthi.JPG                     # Profile image source
├── favicon.png                    # Site favicon
├── attribute.txt                  # Favicon attribution
├── .gitignore                     # Git ignore rules
├── LICENSE                        # MIT License
└── README.md                      # This file
```

---

## Wiki Contents

### Haney CLI (10 pages)
A transparent, configuration-driven terminal AI coding assistant with MCP protocol support, five-layer safety pipeline, and rich tool-calling architecture. Built from scratch.

**Pages:** Introduction, Architecture, Commands, Configuration, MCP Integration, Tool System, Memory System, Project Awareness, Design Decisions, Lessons Learned

### Haney GPT (6 pages)
A 537M-parameter GPT-style language model trained from scratch on a custom 517M-token corpus. Covers the complete journey from tokenizer design through training to GGUF deployment.

**Pages:** Project Overview, Model Architecture, Tokenization Pipeline, Training Process, Challenges Faced, Future Improvements

*Code from `model.py` and `train.py` is explained conversationally — not dumped as raw code. Every concept from attention heads to mixed-precision training is broken down for a beginner-to-intermediate audience.*

### Vectorless RAG (5 pages)
Full-stack document chat using PostgreSQL full-text search instead of vector embeddings. Proves that vector databases are optional for many RAG use cases.

**Pages:** Introduction, Architecture, Retrieval Process, Advantages, Limitations

### Traditional RAG (7 pages)
Modern production-grade RAG platform with semantic chunking, Chroma Cloud vector storage, HyDE query expansion, and Cohere reranking. A complete reference implementation.

**Pages:** Introduction, Embedding Pipeline, Chunking Strategy, Vector Database Workflow, Retrieval Process, Advantages, Limitations

### AI Ecommerce (6 pages)
Full-stack Django ecommerce platform integrated with an AI voice support agent named Haney. Features Clerk authentication, Razorpay payments, and Vapi voice AI.

**Pages:** Project Overview, Architecture, AI Features, Product Recommendation Flow, Technical Decisions, Future Roadmap

---

## Frontend

The React website transforms the markdown wiki into a professional portfolio and knowledge browser.

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Hero section, profile card, project grid, contact form |
| `/search` | SearchPage | Full-page search with highlighted results |
| `/search?q=...` | SearchPage | Search results for a specific query |
| `/wiki/:project/:slug` | WikiPage | Dynamic markdown rendering with sidebar navigation |

### Features

- **Dynamic Markdown Rendering** — Wiki pages are rendered at request time using `react-markdown` + `remark-gfm`. Adding a new markdown file to `wiki/` makes it immediately available on the website.
- **Client-Side Search** — Fuse.js powers instant fuzzy search across all 36 wiki pages. Searches title, headings, content, and project name. Results appear in a dropdown as you type, with matched terms highlighted.
- **Professional Portfolio** — Homepage features Sakthivel T's profile card with photo, a hero section explaining the work, and project cards with "Read more →" links.
- **Contact Form** — Name, Email, and Message fields with client-side validation. Submissions are processed by a Cloudflare Pages Function. The email address is never exposed to the client.
- **Responsive Design** — Fully responsive from 320px phones to wide desktops. Hamburger menu on mobile, adaptive search bar, and fluid layouts throughout.
- **Beige Color Scheme** — Warm, paper-like aesthetic inspired by codehaney.dev.

### NavBar

The navigation bar includes:
- **Home** — Landing page
- **Works** dropdown — Direct links to Haney CLI, Haney GPT, Vectorless RAG, Traditional RAG, AI Ecommerce
- **Search bar** — Fuzzy search with real-time dropdown results

### Footer

Social links are present on every page:
- **GitHub** → gh.sakthi.wiki
- **LinkedIn** → in.sakthi.wiki
- **Instagram** → ig.sakthi.wiki
- **Favicon attribution** — Kitty icons created by Mihimihi — Flaticon

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/sakthi-t/sakthi-wiki.git
cd sakthi-wiki

# Install frontend dependencies
cd frontend
npm install
```

### Development

```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

### Rebuild Search Index

If you add or modify wiki pages, regenerate the search index:

```bash
cd frontend
node scripts/build-search-index.js
```

### Production Build

```bash
cd frontend
npm run build     # Output in dist/
npm run preview   # Preview production build locally
```

### Deployment

The project is designed for **Cloudflare Pages**:

1. Push to GitHub
2. Connect the repository to Cloudflare Pages
3. Set build command: `cd frontend && npm install && npm run build`
4. Set output directory: `frontend/dist`
5. Cloudflare automatically deploys on every push

The contact form function at `frontend/functions/api/contact.js` is automatically detected and deployed by Cloudflare Pages.

---

## Phases

This project was built incrementally across six phases:

| Phase | Description | Deliverables |
|-------|-------------|-------------|
| **1 — Wiki Generation** | LLM ingests 6 source repositories and generates structured wiki pages | 36 markdown files, ~170 KB |
| **2 — Wiki Search** | Client-side fuzzy search without vectors or external APIs | Fuse.js engine, SearchBar, SearchPage |
| **3 — React Website** | Dynamic markdown rendering, routing, beige color scheme | React + Vite + React Router 7 |
| **4 — Homepage Design** | Professional landing page with profile and project cards | Hero, profile card, project grid |
| **5 — Contact Form** | Secure contact form with serverless backend | Form UI + Cloudflare Pages Function |
| **6 — Footer & Branding** | Social links, favicon, attribution | Footer component, favicon.png |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Knowledge Base | Markdown (36 pages, LLM-generated) |
| Frontend Framework | React 19 + React Router 7 |
| Build Tool | Vite |
| Markdown Rendering | react-markdown + remark-gfm |
| Search | Fuse.js (client-side fuzzy search, zero dependencies) |
| Contact Backend | Cloudflare Pages Functions |
| Deployment | Cloudflare Pages |
| Styling | CSS (beige color scheme, mobile-responsive) |
| Favicon | Flaticon (Kitty icons by Mihimihi) |

**No vector databases. No embedding APIs. No external search services.** The entire search engine runs in the user's browser.

---

## License

MIT © 2026 Sakthivel T

See [LICENSE](./LICENSE) for full details.

---

Built with curiosity, cat-themed tools, and the belief that the best way to understand AI is to build it from scratch.
