import { useState } from 'react';
import './ContactForm.css';

/**
 * Contact form — submits to Cloudflare Pages Function.
 * Email is sent server-side; never exposed to the client.
 */
export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus({ type: 'error', message: data.error || 'Something went wrong. Please try again later.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form form-card" noValidate>
      {/* Honeypot — hidden from real users */}
      <div className="hidden-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex="-1" autoComplete="off" />
      </div>

      <div className="form-row">
        <div className={`form-group ${errors.name ? 'error' : ''}`}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            autoComplete="name"
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className={`form-group ${errors.email ? 'error' : ''}`}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
      </div>

      <div className={`form-group ${errors.message ? 'error' : ''}`}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="What would you like to say?"
          rows={5}
        />
        {errors.message && <span className="field-error">{errors.message}</span>}
      </div>

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send Message'}
      </button>

      {status === 'success' && (
        <div className="form-status form-success" role="alert">
          <span className="form-status-icon">✓</span>
          <span>Message sent successfully! I'll get back to you soon.</span>
        </div>
      )}

      {status?.type === 'error' && (
        <div className="form-status form-error" role="alert">
          <span className="form-status-icon">✗</span>
          <span>{status.message}</span>
        </div>
      )}
    </form>
  );
}
