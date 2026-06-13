import './ContactCard.css';

/**
 * Contact card — simple horizontal card with email.
 * No form submission, no backend, no JavaScript — just a link.
 */
export default function ContactCard() {
  return (
    <div className="contact-card">
      <div className="contact-card-icon" aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <div className="contact-card-body">
        <h3 className="contact-card-heading">Contact Sakthivel T</h3>
        <p className="contact-card-text">
          If you'd really like to get in touch, drop a line at{' '}
          <a href="mailto:sakthi@sakthi.wiki" className="contact-card-email">
            sakthi@sakthi.wiki
          </a>
        </p>
      </div>
    </div>
  );
}
