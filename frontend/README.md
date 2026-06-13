# Sakthi Wiki — Frontend

React + Vite website for a personal AI knowledge base.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + React Router 7 |
| Build | Vite |
| Search | Fuse.js (client-side fuzzy search) |
| Markdown | react-markdown + remark-gfm |
| Contact | Cloudflare Pages Functions |
| Deploy | Cloudflare Pages |

## Project Structure

```
src/
├── components/    # NavBar, Footer, SearchBar, SearchResults, ContactForm
├── pages/         # HomePage, SearchPage, WikiPage
├── data/          # Auto-generated search index
├── hooks/         # useSearch custom hook
├── utils/         # search.js (Fuse.js wrapper)
functions/         # Cloudflare Pages Functions (contact API)
public/wiki/       # Markdown wiki files (source of truth)
```
