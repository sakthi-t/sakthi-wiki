import { useState, useCallback, useMemo } from 'react';
import { searchWiki, getMatchSnippets } from '../utils/search.js';

/**
 * Custom hook for wiki search functionality.
 * Manages query state, results, and loading state.
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return searchWiki(query);
  }, [query]);

  const enrichedResults = useMemo(() => {
    return results.map(r => ({
      ...r,
      snippets: getMatchSnippets(r),
    }));
  }, [results]);

  const handleSearch = useCallback((value) => {
    setIsSearching(true);
    setQuery(value);
    // Small delay for visual feedback
    const timer = setTimeout(() => setIsSearching(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setIsSearching(false);
  }, []);

  return {
    query,
    results: enrichedResults,
    isSearching,
    hasQuery: query.trim().length >= 2,
    resultCount: results.length,
    handleSearch,
    clearSearch,
  };
}
