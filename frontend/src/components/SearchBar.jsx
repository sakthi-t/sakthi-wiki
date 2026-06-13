import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchWiki, getMatchSnippets, getWikiPageUrl } from '../utils/search.js';
import './SearchBar.css';

/**
 * SearchBar with instant dropdown results.
 * Navigates to full search page on Enter or result click.
 */
export default function SearchBar({ placeholder = 'Search the wiki…', className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length >= 2) {
      const searchResults = searchWiki(query).slice(0, 8);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e) {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToResult(results[selectedIndex]);
      } else if (results.length > 0) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function navigateToResult(result) {
    setIsOpen(false);
    setQuery('');
    navigate(getWikiPageUrl(result.item));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  function highlightMatch(text, matchStart, matchEnd) {
    if (matchStart === undefined || matchEnd === undefined) return text;
    return (
      <>
        {text.substring(0, matchStart)}
        <mark>{text.substring(matchStart, matchEnd)}</mark>
        {text.substring(matchEnd)}
      </>
    );
  }

  return (
    <div className={`search-bar ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            placeholder={placeholder}
            aria-label="Search wiki"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => { setQuery(''); setIsOpen(false); inputRef.current?.focus(); }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown" ref={dropdownRef}>
          {results.map((result, i) => {
            const snippets = getMatchSnippets(result, 1);
            return (
              <button
                key={result.item.id}
                className={`search-result-item ${i === selectedIndex ? 'selected' : ''}`}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="result-title-row">
                  <span className="result-title">{result.item.title}</span>
                  <span className="result-project">{result.item.project}</span>
                </div>
                {snippets.length > 0 && (
                  <div className="result-snippet">
                    {highlightMatch(snippets[0].text, snippets[0].matchStart, snippets[0].matchEnd)}
                  </div>
                )}
              </button>
            );
          })}
          <button
            className="search-view-all"
            onClick={() => { setIsOpen(false); navigate(`/search?q=${encodeURIComponent(query)}`); }}
          >
            View all results for "{query}" →
          </button>
        </div>
      )}
    </div>
  );
}
