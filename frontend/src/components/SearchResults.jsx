import { useSearchParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { searchWiki, getMatchSnippets, getWikiPageUrl } from '../utils/search.js';
import './SearchResults.css';

/**
 * Full-page search results view.
 * Reads ?q= from URL params and displays all matching results.
 */
export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return searchWiki(query).map(r => ({
      ...r,
      snippets: getMatchSnippets(r, 3),
    }));
  }, [query]);

  function highlightMatches(text, matches) {
    if (!matches || matches.length === 0) return text;

    // Collect all match indices
    const allIndices = [];
    for (const match of matches) {
      if (match.indices) {
        allIndices.push(...match.indices);
      }
    }
    if (allIndices.length === 0) return text;

    // Sort and merge overlapping indices
    allIndices.sort((a, b) => a[0] - b[0]);
    const merged = [allIndices[0]];
    for (let i = 1; i < allIndices.length; i++) {
      const last = merged[merged.length - 1];
      if (allIndices[i][0] <= last[1]) {
        last[1] = Math.max(last[1], allIndices[i][1]);
      } else {
        merged.push(allIndices[i]);
      }
    }

    // Build highlighted text
    const parts = [];
    let lastEnd = 0;
    for (const [start, end] of merged) {
      if (start > lastEnd) parts.push(text.substring(lastEnd, start));
      parts.push(<mark key={`${start}-${end}`}>{text.substring(start, end + 1)}</mark>);
      lastEnd = end + 1;
    }
    if (lastEnd < text.length) parts.push(text.substring(lastEnd));

    return parts;
  }

  if (!query || query.trim().length < 2) {
    return (
      <div className="search-results-page">
        <div className="search-empty">
          <h2>Search the Wiki</h2>
          <p>Type a query to search across all wiki pages.</p>
          <p className="search-hint">
            Try searching for topics like "attention mechanism", "RAG", "tokenization", or "architecture".
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="search-results-page">
        <div className="search-empty">
          <h2>No results for "{query}"</h2>
          <p>Try different keywords or check spelling.</p>
        </div>
      </div>
    );
  }

  // Group results by project
  const grouped = {};
  for (const r of results) {
    const project = r.item.project || 'Wiki';
    if (!grouped[project]) grouped[project] = [];
    grouped[project].push(r);
  }

  return (
    <div className="search-results-page">
      <div className="search-results-header">
        <h2>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</h2>
      </div>

      {Object.entries(grouped).map(([project, items]) => (
        <div key={project} className="search-group">
          <h3 className="search-group-title">{project}</h3>
          {items.map(result => (
            <Link
              key={result.item.id}
              to={getWikiPageUrl(result.item)}
              className="search-result-card"
            >
              <h4 className="card-title">{result.item.title}</h4>
              {result.item.excerpt && (
                <p className="card-excerpt">
                  {highlightMatches(result.item.excerpt, result.matches)}
                </p>
              )}
              {result.snippets.length > 0 && (
                <div className="card-snippets">
                  {result.snippets.map((snippet, i) => (
                    <p key={i} className="card-snippet">
                      {highlightMatches(snippet.text, result.matches)}
                    </p>
                  ))}
                </div>
              )}
              <div className="card-score">
                Relevance: {Math.round((1 - result.score) * 100)}%
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
