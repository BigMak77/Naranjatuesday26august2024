"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PressPage() {
  const router = useRouter();

  return (
    <div className="neon-panel">
      {/* Hero Section */}
      <div className="main-header-container with-subtitle">
        {/* Close Button */}
        <div className="page-close-button">
          <button
            onClick={() => router.push('/')}
            aria-label="Close and return to homepage"
            className="overlay-close-button"
            title="Return to Homepage"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        
        <h1 className="main-header">Press & Media</h1>
        <p className="main-subheader">
          Latest news, press releases, and media resources about Naranja's innovative training and compliance solutions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">50,000+</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">1,200+</div>
          <div className="stat-label">Companies Served</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">98%</div>
          <div className="stat-label">Audit Success Rate</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">2019</div>
          <div className="stat-label">Founded</div>
        </div>
      </div>

      {/* Latest News */}
      <div className="neon-panel">
        <h2 className="neon-heading">Latest News</h2>
        <div className="news-grid">
          <article className="news-item featured">
            <div className="news-date">November 2024</div>
            <h3 className="news-title">Naranja Achieves ISO 27001 Certification</h3>
            <p className="news-excerpt">
              We're proud to announce our ISO 27001 certification, reinforcing our commitment to information security and data protection for our clients.
            </p>
            <div className="news-meta">Press Release</div>
          </article>

          <article className="news-item">
            <div className="news-date">October 2024</div>
            <h3 className="news-title">Partnership with Leading Food Safety Consultants</h3>
            <p className="news-excerpt">
              Strategic partnership announced to enhance our compliance training offerings with industry-leading expertise.
            </p>
            <div className="news-meta">Company News</div>
          </article>

          <article className="news-item">
            <div className="news-date">September 2024</div>
            <h3 className="news-title">Naranja Named 'Innovation Leader' in Food Safety Tech</h3>
            <p className="news-excerpt">
              Recognition from the Food Safety Tech Awards for our innovative approach to digital compliance training.
            </p>
            <div className="news-meta">Award</div>
          </article>
        </div>
      </div>

      {/* Press Releases Archive */}
      <div className="neon-panel">
        <h2 className="neon-heading">Press Releases</h2>
        <div className="press-releases">
          <div className="release-item">
            <div className="release-header">
              <div className="release-date">Q3 2024</div>
              <div className="release-type">Funding News</div>
            </div>
            <h4 className="release-title">Series A Funding Round Completed</h4>
            <p className="release-summary">
              Successfully closed Series A funding to accelerate platform development and expand market reach.
            </p>
          </div>

          <div className="release-item">
            <div className="release-header">
              <div className="release-date">Q2 2024</div>
              <div className="release-type">Product Launch</div>
            </div>
            <h4 className="release-title">AI-Powered Risk Assessment Tool Launched</h4>
            <p className="release-summary">
              Introducing intelligent risk assessment capabilities powered by machine learning algorithms.
            </p>
          </div>

          <div className="release-item">
            <div className="release-header">
              <div className="release-date">Q1 2024</div>
              <div className="release-type">Partnership</div>
            </div>
            <h4 className="release-title">Integration with Leading ERP Systems</h4>
            <p className="release-summary">
              New integrations with major ERP platforms to streamline compliance workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Media Coverage */}
      <div className="neon-panel">
        <h2 className="neon-heading">Media Coverage</h2>
        <div className="media-grid">
          <div className="media-item">
            <div className="media-outlet">Food Safety Magazine</div>
            <h4 className="media-headline">"Digital Transformation in Food Safety Training"</h4>
            <div className="media-date">October 2024</div>
          </div>

          <div className="media-item">
            <div className="media-outlet">Manufacturing Today</div>
            <h4 className="media-headline">"The Future of Compliance Management"</h4>
            <div className="media-date">September 2024</div>
          </div>

          <div className="media-item">
            <div className="media-outlet">Tech Innovation Weekly</div>
            <h4 className="media-headline">"AI Meets Food Safety: A Success Story"</h4>
            <div className="media-date">August 2024</div>
          </div>
        </div>
      </div>

      {/* Media Kit */}
      <div className="neon-panel">
        <h2 className="neon-heading">Media Resources</h2>
        <div className="media-kit">
          <div className="kit-section">
            <h3 className="kit-title">Brand Assets</h3>
            <ul className="kit-list">
              <li>High-resolution logos</li>
              <li>Brand guidelines</li>
              <li>Color palette specifications</li>
              <li>Typography guidelines</li>
            </ul>
            <a href="#" className="kit-download">Download Brand Kit</a>
          </div>

          <div className="kit-section">
            <h3 className="kit-title">Product Screenshots</h3>
            <ul className="kit-list">
              <li>Platform interface examples</li>
              <li>Training module screenshots</li>
              <li>Dashboard and analytics views</li>
              <li>Mobile application screens</li>
            </ul>
            <a href="#" className="kit-download">Download Screenshots</a>
          </div>

          <div className="kit-section">
            <h3 className="kit-title">Executive Team</h3>
            <ul className="kit-list">
              <li>High-resolution headshots</li>
              <li>Executive biographies</li>
              <li>Background information</li>
              <li>Contact details for interviews</li>
            </ul>
            <a href="#" className="kit-download">Download Profiles</a>
          </div>
        </div>
      </div>

      {/* Press Contacts */}
      <div className="neon-panel">
        <h2 className="neon-heading">Press Contacts</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <h4>Media Inquiries</h4>
            <div className="contact-info">
              <p><strong>Sarah Mitchell</strong></p>
              <p>Head of Communications</p>
              <a href="mailto:press@naranja.co.uk" className="contact-link">press@naranja.co.uk</a>
              <a href="tel:+442012345679" className="contact-link">+44 20 1234 5679</a>
            </div>
          </div>

          <div className="contact-card">
            <h4>Partnership Inquiries</h4>
            <div className="contact-info">
              <p><strong>James Rodriguez</strong></p>
              <p>Head of Partnerships</p>
              <a href="mailto:partnerships@naranja.co.uk" className="contact-link">partnerships@naranja.co.uk</a>
              <a href="tel:+442012345680" className="contact-link">+44 20 1234 5680</a>
            </div>
          </div>

          <div className="contact-card">
            <h4>Investor Relations</h4>
            <div className="contact-info">
              <p><strong>Emma Thompson</strong></p>
              <p>Chief Financial Officer</p>
              <a href="mailto:investors@naranja.co.uk" className="contact-link">investors@naranja.co.uk</a>
              <a href="tel:+442012345681" className="contact-link">+44 20 1234 5681</a>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="neon-panel">
        <h2 className="neon-heading">Stay Updated</h2>
        <p className="main-subheader">
          Subscribe to our press newsletter for the latest company news and announcements.
        </p>
        <div className="cta-container">
          <Link href="/homepage/contact-us" className="cta-button primary">
            Subscribe to Updates
          </Link>
        </div>
      </div>

      <style jsx>{`
        .main-header-container {
          position: relative;
        }

        .page-close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 1000;
        }

        .overlay-close-button {
          position: relative;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid white;
          background-color: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          z-index: 1;
          transition: background-color 0.2s ease;
        }

        .overlay-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .overlay-close-button:focus-visible {
          outline: 2px solid var(--neon);
          outline-offset: 2px;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .stat-item {
          background: var(--training-accent-dark);
          border: 2px solid var(--neon);
          border-radius: 12px;
          padding: 2rem 1.5rem;
          text-align: center;
          transition: transform 0.2s ease;
        }

        .stat-item:hover {
          transform: translateY(-4px);
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: var(--font-weight-header);
          color: var(--neon);
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: var(--text-white);
          font-size: 1rem;
          font-weight: 500;
        }

        .news-grid {
          display: grid;
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .news-item {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .news-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: var(--neon);
        }

        .news-item.featured {
          border: 2px solid var(--neon);
          background: linear-gradient(135deg, var(--training-accent-dark), var(--training-accent-medium));
        }

        .news-date {
          color: var(--neon);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .news-title {
          color: var(--text-white);
          font-size: 1.3rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 1rem 0;
          line-height: 1.3;
        }

        .news-excerpt {
          color: var(--text-white);
          line-height: 1.6;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .news-meta {
          color: var(--neon);
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .press-releases {
          display: grid;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .release-item {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s ease;
        }

        .release-item:hover {
          border-color: var(--neon);
        }

        .release-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .release-date {
          color: var(--neon);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .release-type {
          background: var(--training-accent-medium);
          color: var(--text-white);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .release-title {
          color: var(--text-white);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 0.5rem 0;
        }

        .release-summary {
          color: var(--text-white);
          line-height: 1.5;
          opacity: 0.9;
          margin: 0;
        }

        .media-grid {
          display: grid;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .media-item {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s ease;
        }

        .media-item:hover {
          border-color: var(--neon);
        }

        .media-outlet {
          color: var(--neon);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .media-headline {
          color: var(--text-white);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 0.5rem 0;
          line-height: 1.3;
        }

        .media-date {
          color: var(--text-white);
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .media-kit {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .kit-section {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .kit-title {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 1rem 0;
        }

        .kit-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }

        .kit-list li {
          color: var(--text-white);
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--training-accent-medium);
          position: relative;
          padding-left: 1.5rem;
        }

        .kit-list li:last-child {
          border-bottom: none;
        }

        .kit-list li::before {
          content: "📁";
          position: absolute;
          left: 0;
        }

        .kit-download {
          color: var(--neon);
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border: 1px solid var(--neon);
          border-radius: 4px;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .kit-download:hover {
          background: var(--neon);
          color: var(--training-bg);
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .contact-card {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .contact-card h4 {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 1rem 0;
        }

        .contact-info p {
          color: var(--text-white);
          margin: 0.25rem 0;
        }

        .contact-link {
          color: var(--text-white);
          text-decoration: none;
          display: block;
          margin: 0.25rem 0;
          transition: color 0.2s ease;
        }

        .contact-link:hover {
          color: var(--neon);
        }

        .cta-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }

        .cta-button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: var(--font-weight-header);
          transition: all 0.2s ease;
          display: inline-block;
        }

        .cta-button.primary {
          background: var(--neon);
          color: var(--training-bg);
        }

        .cta-button.primary:hover {
          background: var(--text-white);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
