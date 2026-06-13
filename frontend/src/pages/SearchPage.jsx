import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import SearchResults from '../components/SearchResults.jsx';
import './SearchPage.css';

/**
 * Dedicated search page with large search input + full results.
 */
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);

  function handleSubmit(e) {
    e.preventDefault();
    if (inputValue.trim().length >= 2) {
      setSearchParams({ q: inputValue.trim() });
    }
  }

  return (
    <div className="search-page">
      <div className="search-page-hero">
        <h1>Search the Wiki</h1>
        <p>Find answers across all projects — Haney CLI, Haney GPT, RAG systems, and more.</p>
        <form onSubmit={handleSubmit} className="search-page-form" role="search">
          <div className="search-page-input-wrapper">
            <svg className="search-page-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search for anything — attention mechanism, RAG, tokenization…"
              aria-label="Search wiki"
              autoComplete="off"
              autoFocus
            />
            <button type="submit" className="search-page-submit">
              Search
            </button>
          </div>
        </form>
      </div>

      <SearchResults />
    </div>
  );
}
