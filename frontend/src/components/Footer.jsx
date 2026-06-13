import './Footer.css';

/**
 * Footer with social links and favicon attribution.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-brand">Sakthivel T</p>
        <p className="footer-text">AI Engineer & AI Application Developer</p>

        <ul className="footer-links">
          <li><a href="https://gh.sakthi.wiki" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a href="https://in.sakthi.wiki" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href="https://ig.sakthi.wiki" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        </ul>

        <p className="footer-attribution">
          <a href="https://www.flaticon.com/free-icons/kitty" title="kitty icons" target="_blank" rel="noopener noreferrer">
            Kitty icons created by Mihimihi — Flaticon
          </a>
        </p>
      </div>
    </footer>
  );
}
