import { Link } from 'react-router-dom';
import { getProjects } from '../utils/search.js';
import ContactForm from '../components/ContactForm.jsx';
import './HomePage.css';

/**
 * Home page — profile card, project overview, and contact form.
 */
export default function HomePage() {
  const projects = getProjects();

  const projectDescriptions = {
    'haney-cli': 'A terminal-based AI coding assistant that lives in your command line. Transparent, configurable, and cat-themed.',
    'haney-gpt': 'A 537M-parameter GPT-style language model built from scratch with PyTorch. Educational deep dive into Transformers.',
    'vectorless-rag': 'Document chat using PostgreSQL full-text search instead of vector embeddings. Simpler, cheaper, surprisingly effective.',
    'traditional-rag': 'Production-grade RAG with semantic chunking, HyDE, Cohere reranking, and LLM-as-Judge evaluation.',
    'ai-ecommerce': 'Full-stack online bookstore with an AI voice support agent powered by Vapi, ElevenLabs, and GPT-4.1.',
  };

  const projectStartPages = {
    'haney-cli': 'introduction',
    'haney-gpt': 'project-overview',
    'vectorless-rag': 'introduction',
    'traditional-rag': 'introduction',
    'ai-ecommerce': 'project-overview',
  };

  return (
    <div className="home-page">
      {/* Hero / Profile Section */}
      <section className="home-hero">
        <div className="profile-card">
          <div className="profile-image-wrapper">
            <img
              src="/sakthi.jpg"
              alt="Sakthivel T"
              className="profile-image"
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">Sakthivel T</h1>
            <p className="profile-title">AI Engineer & AI Application Developer</p>
            <p className="profile-bio">
              Developer of Haney CLI and multiple AI applications. Inspired by Andrej Karpathy's
              educational approach to AI, built language models and AI systems from scratch to
              understand modern AI end-to-end.
            </p>
            <div className="profile-tags">
              <span>LLMs</span>
              <span>RAG Systems</span>
              <span>CLI Tools</span>
              <span>PyTorch</span>
              <span>Full-Stack AI</span>
            </div>
          </div>
        </div>

        <div className="home-hero-actions">
          <Link to="/search" className="btn-primary">
            Search the Wiki
          </Link>
          <a href="#projects" className="btn-secondary">
            Browse Projects ↓
          </a>
        </div>
      </section>

      {/* Project Overview Section */}
      <section id="projects" className="home-projects">
        <h2>Projects</h2>
        <p className="section-description">
          A growing knowledge base of AI projects — from CLI tools to RAG systems,
          each documented with architecture, implementation details, and lessons learned.
        </p>
        <div className="project-grid">
          {projects.map(project => (
            <Link
              key={project.slug}
              to={`/wiki/${project.slug}/${projectStartPages[project.slug] || 'introduction'}`}
              className="project-card"
            >
              <h3>{project.name}</h3>
              <p>{projectDescriptions[project.slug] || ''}</p>
              <span className="project-card-link">Read more →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="home-contact">
        <h2>Get in Touch</h2>
        <p className="section-description">
          Have a question, want to collaborate, or just want to say hi?
          Fill out the form below and I'll get back to you.
        </p>
        <ContactForm />
      </section>
    </div>
  );
}
