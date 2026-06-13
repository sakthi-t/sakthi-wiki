import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';
import './NavBar.css';

/**
 * Site-wide navigation bar with dropdown Works menu + search.
 */
export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    {
      label: 'Works',
      children: [
        { to: '/wiki/haney-cli/introduction', label: 'Haney CLI' },
        { to: '/wiki/haney-gpt/project-overview', label: 'Haney GPT' },
        { to: '/wiki/vectorless-rag/introduction', label: 'Vectorless RAG' },
        { to: '/wiki/traditional-rag/introduction', label: 'Traditional RAG' },
        { to: '/wiki/ai-ecommerce/project-overview', label: 'AI Ecommerce' },
      ],
    },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Sakthi Wiki
        </Link>

        <div className="navbar-search nav-search-desktop">
          <SearchBar placeholder="Search wiki…" />
        </div>

        <button
          className={`navbar-toggle ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {/* Mobile search inside expanded menu */}
          <div className="navbar-search nav-search-mobile">
            <SearchBar placeholder="Search wiki…" />
          </div>

          {navLinks.map(link => {
            if (link.children) {
              return (
                <div key={link.label} className="nav-dropdown">
                  <button className="nav-item nav-dropdown-toggle">
                    {link.label} ▾
                  </button>
                  <div className="nav-dropdown-menu">
                    {link.children.map(child => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`nav-item nav-dropdown-item ${isActive(child.to) ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-item ${isActive(link.to) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
