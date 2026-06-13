import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getProjects } from '../utils/search.js';
import './WikiPage.css';

/**
 * Renders a wiki markdown page fetched from /wiki/:project/:slug.
 * This is Phase 3's domain, but we make it functional now for search navigation.
 */
export default function WikiPage() {
  const { project, slug } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pagePath = project ? `${project}/${slug}` : slug;

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/wiki/${pagePath}.md`)
      .then(res => {
        if (!res.ok) throw new Error('Page not found');
        return res.text();
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [pagePath]);

  const projects = getProjects();
  const currentProject = projects.find(p => p.slug === project);

  if (loading) {
    return (
      <div className="wiki-page">
        <div className="wiki-loading">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wiki-page">
        <div className="wiki-error">
          <h2>Page not found</h2>
          <p>The wiki page you're looking for doesn't exist.</p>
          <Link to="/" className="wiki-back-link">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wiki-page">
      <div className="wiki-sidebar">
        <h4 className="sidebar-title">Wiki Pages</h4>
        <nav className="sidebar-nav">
          {projects.map(p => (
            <div key={p.slug} className="sidebar-group">
              <Link
                to={`/wiki/${p.slug}/${p.slug === 'haney-cli' ? 'introduction' : p.slug === 'haney-gpt' ? 'project-overview' : p.slug === 'vectorless-rag' ? 'introduction' : p.slug === 'traditional-rag' ? 'introduction' : 'project-overview'}`}
                className={`sidebar-project ${p.slug === project ? 'active' : ''}`}
              >
                {p.name}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      <article className="wiki-content">
        {currentProject && (
          <div className="wiki-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>{currentProject.name}</span>
          </div>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="wiki-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="wiki-h2" id={slugify(children)}>{children}</h2>,
            h3: ({ children }) => <h3 className="wiki-h3" id={slugify(children)}>{children}</h3>,
            p: ({ children }) => <p className="wiki-p">{children}</p>,
            code: ({ className, children }) => {
              const isInline = !className;
              if (isInline) return <code className="wiki-code-inline">{children}</code>;
              return <pre className="wiki-code-block"><code className={className}>{children}</code></pre>;
            },
            table: ({ children }) => (
              <div className="wiki-table-wrapper">
                <table className="wiki-table">{children}</table>
              </div>
            ),
            ul: ({ children }) => <ul className="wiki-ul">{children}</ul>,
            ol: ({ children }) => <ol className="wiki-ol">{children}</ol>,
            blockquote: ({ children }) => <blockquote className="wiki-blockquote">{children}</blockquote>,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}

function slugify(children) {
  const text = Array.isArray(children) ? children.join('') : String(children ?? '');
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
