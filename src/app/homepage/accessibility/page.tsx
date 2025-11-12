"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccessibilityPage() {
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
        
        <h1 className="main-header">Accessibility Statement</h1>
        <p className="main-subheader">
          We're committed to ensuring our platform is accessible to everyone, regardless of ability or technology used.
        </p>
      </div>

      {/* Our Commitment */}
      <div className="neon-panel">
        <h2 className="neon-heading">Our Accessibility Commitment</h2>
        <p className="main-subheader">
          Naranja is designed to be inclusive and accessible to all users. We strive to meet and exceed web accessibility standards, ensuring equal access to our training and compliance platform for everyone.
        </p>
      </div>

      {/* Standards and Guidelines */}
      <div className="neon-panel">
        <h2 className="neon-heading">Standards & Guidelines</h2>
        <div className="standards-grid">
          <div className="standard-card">
            <div className="standard-icon">♿</div>
            <h3 className="standard-title">WCAG 2.1 AA</h3>
            <p className="standard-description">
              Our platform conforms to Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
            </p>
          </div>

          <div className="standard-card">
            <div className="standard-icon">📱</div>
            <h3 className="standard-title">Section 508</h3>
            <p className="standard-description">
              Compliant with Section 508 of the Rehabilitation Act for federal accessibility requirements.
            </p>
          </div>

          <div className="standard-card">
            <div className="standard-icon">🌐</div>
            <h3 className="standard-title">EN 301 549</h3>
            <p className="standard-description">
              Adheres to European accessibility standard EN 301 549 for inclusive digital experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility Features */}
      <div className="neon-panel">
        <h2 className="neon-heading">Accessibility Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⌨️</div>
            <h3 className="feature-title">Keyboard Navigation</h3>
            <p className="feature-description">
              Complete keyboard accessibility with logical tab order and keyboard shortcuts for efficient navigation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3 className="feature-title">Screen Reader Support</h3>
            <p className="feature-description">
              Optimized for screen readers with proper semantic markup, ARIA labels, and descriptive content.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3 className="feature-title">High Contrast Mode</h3>
            <p className="feature-description">
              Built-in high contrast themes and customizable color options for users with visual impairments.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Alternative Text</h3>
            <p className="feature-description">
              All images, charts, and media include comprehensive alternative text descriptions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔤</div>
            <h3 className="feature-title">Resizable Text</h3>
            <p className="feature-description">
              Text can be enlarged up to 200% without loss of functionality or content overlap.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⏸️</div>
            <h3 className="feature-title">Media Controls</h3>
            <p className="feature-description">
              Video and audio content includes controls for pause, volume adjustment, and captions.
            </p>
          </div>
        </div>
      </div>

      {/* Assistive Technologies */}
      <div className="neon-panel">
        <h2 className="neon-heading">Supported Assistive Technologies</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <h4>Screen Readers</h4>
            <ul>
              <li>JAWS (Job Access With Speech)</li>
              <li>NVDA (NonVisual Desktop Access)</li>
              <li>VoiceOver (macOS/iOS)</li>
              <li>TalkBack (Android)</li>
            </ul>
          </div>
          
          <div className="tech-item">
            <h4>Voice Control</h4>
            <ul>
              <li>Dragon NaturallySpeaking</li>
              <li>Windows Speech Recognition</li>
              <li>Voice Control (macOS)</li>
              <li>Voice Access (Android)</li>
            </ul>
          </div>

          <div className="tech-item">
            <h4>Browser Tools</h4>
            <ul>
              <li>Browser zoom functionality</li>
              <li>High contrast extensions</li>
              <li>Reader mode support</li>
              <li>Custom CSS injection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testing and Validation */}
      <div className="neon-panel">
        <h2 className="neon-heading">Testing & Validation</h2>
        <div className="content-section">
          <p className="main-subheader">
            We employ multiple testing methods to ensure accessibility compliance:
          </p>
          <ul className="validation-list">
            <li>Automated accessibility scanning with axe-core and WAVE</li>
            <li>Manual testing with screen readers and keyboard navigation</li>
            <li>User testing with individuals who use assistive technologies</li>
            <li>Regular audits by accessibility experts</li>
            <li>Continuous monitoring and improvement processes</li>
          </ul>
        </div>
      </div>

      {/* Known Issues */}
      <div className="neon-panel">
        <h2 className="neon-heading">Known Issues & Improvements</h2>
        <div className="content-section">
          <p className="main-subheader">
            We're continuously working to improve accessibility. Current known areas for enhancement include:
          </p>
          <ul className="issues-list">
            <li>Enhanced mobile screen reader navigation (in progress)</li>
            <li>Additional keyboard shortcuts for power users (planned Q1 2025)</li>
            <li>Improved color customization options (planned Q2 2025)</li>
          </ul>
        </div>
      </div>

      {/* Feedback and Support */}
      <div className="neon-panel">
        <h2 className="neon-heading">Accessibility Support</h2>
        <p className="main-subheader">
          We value your feedback on accessibility. If you encounter any barriers or have suggestions for improvement, please contact us.
        </p>
        
        <div className="contact-options">
          <div className="contact-method">
            <h4>Email</h4>
            <a href="mailto:accessibility@naranja.co.uk" className="contact-link">
              accessibility@naranja.co.uk
            </a>
          </div>
          
          <div className="contact-method">
            <h4>Phone</h4>
            <a href="tel:+442012345678" className="contact-link">
              +44 20 1234 5678
            </a>
          </div>
          
          <div className="contact-method">
            <h4>Response Time</h4>
            <p className="response-info">
              We aim to respond to accessibility inquiries within 2 business days.
            </p>
          </div>
        </div>

        <div className="cta-container">
          <Link href="/homepage/contact-us" className="cta-button primary">
            Contact Support Team
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

        .standards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .standard-card {
          background: var(--training-accent-dark);
          border: 1px solid var(--neon);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .standard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .standard-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .standard-title {
          color: var(--neon);
          font-size: 1.3rem;
          font-weight: var(--font-weight-header);
          margin-bottom: 0.75rem;
        }

        .standard-description {
          color: var(--text-white);
          line-height: 1.6;
          opacity: 0.9;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .feature-card {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: var(--neon);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .feature-title {
          color: var(--text-white);
          font-size: 1.2rem;
          font-weight: var(--font-weight-header);
          margin-bottom: 0.75rem;
        }

        .feature-description {
          color: var(--text-white);
          line-height: 1.6;
          opacity: 0.9;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .tech-item {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .tech-item h4 {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 1rem 0;
        }

        .tech-item ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tech-item li {
          color: var(--text-white);
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--training-accent-medium);
          position: relative;
          padding-left: 1.5rem;
        }

        .tech-item li:last-child {
          border-bottom: none;
        }

        .tech-item li::before {
          content: "▶";
          color: var(--neon);
          position: absolute;
          left: 0;
          font-size: 0.8rem;
        }

        .validation-list, .issues-list {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
        }

        .validation-list li, .issues-list li {
          color: var(--text-white);
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--training-accent-medium);
          position: relative;
          padding-left: 2rem;
          line-height: 1.5;
        }

        .validation-list li:last-child, .issues-list li:last-child {
          border-bottom: none;
        }

        .validation-list li::before {
          content: "✓";
          color: var(--neon);
          position: absolute;
          left: 0;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .issues-list li::before {
          content: "🔄";
          position: absolute;
          left: 0;
          font-size: 1rem;
        }

        .contact-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .contact-method {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .contact-method h4 {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 0.75rem 0;
        }

        .contact-link {
          color: var(--text-white);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .contact-link:hover {
          color: var(--neon);
        }

        .response-info {
          color: var(--text-white);
          margin: 0;
          opacity: 0.9;
        }

        .cta-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 2rem;
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

        .content-section {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }
      `}</style>
    </div>
  );
}
