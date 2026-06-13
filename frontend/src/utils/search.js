import Fuse from 'fuse.js';
import searchIndex from '../data/searchIndex.js';

const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'headings', weight: 0.3 },
    { name: 'excerpt', weight: 0.15 },
    { name: 'content', weight: 0.1 },
    { name: 'project', weight: 0.05 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.5,
  distance: 100,
  minMatchCharLength: 2,
  useExtendedSearch: true,
  ignoreLocation: true,
  findAllMatches: true,
};

const fuse = new Fuse(searchIndex, fuseOptions);

/**
 * Search the wiki index.
 * @param {string} query - User's search query
 * @returns {Array} Array of { item, score, matches } results
 */
export function searchWiki(query) {
  if (!query || query.trim().length < 2) return [];
  return fuse.search(query.trim());
}

/**
 * Get highlighted text snippets showing where the match occurred.
 * @param {object} result - Fuse.js result object
 * @param {number} maxSnippets - Max number of snippets to return
 * @returns {Array} Array of { key, text, indices } snippets
 */
export function getMatchSnippets(result, maxSnippets = 3) {
  if (!result.matches) return [];

  const snippets = [];
  for (const match of result.matches) {
    if (match.key === 'content' && match.indices.length > 0) {
      for (const [start, end] of match.indices.slice(0, maxSnippets)) {
        const contextStart = Math.max(0, start - 60);
        const contextEnd = Math.min(match.value.length, end + 60);
        let snippet = match.value.substring(contextStart, contextEnd);

        const prefix = contextStart > 0 ? '…' : '';
        const suffix = contextEnd < match.value.length ? '…' : '';

        snippet = prefix + snippet + suffix;
        snippets.push({
          key: match.key,
          text: snippet,
          matchStart: start - contextStart + prefix.length,
          matchEnd: end - contextStart + prefix.length,
        });
      }
    }
  }
  return snippets.slice(0, maxSnippets);
}

/**
 * Build a URL for navigating to a wiki page.
 * @param {object} item - Search index item
 * @returns {string} URL path
 */
export function getWikiPageUrl(item) {
  if (item.projectSlug) {
    return `/wiki/${item.projectSlug}/${item.slug}`;
  }
  return `/wiki/${item.slug}`;
}

/**
 * Get all distinct projects from the index.
 * @returns {Array} Array of { slug, name } project objects
 */
export function getProjects() {
  const projectMap = new Map();
  for (const entry of searchIndex) {
    if (entry.projectSlug && !projectMap.has(entry.projectSlug)) {
      projectMap.set(entry.projectSlug, entry.project);
    }
  }
  return Array.from(projectMap, ([slug, name]) => ({ slug, name }));
}
