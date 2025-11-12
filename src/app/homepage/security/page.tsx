"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
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
        
        <h1 className="main-header">Security & Data Protection</h1>
        <p className="main-subheader">
          Your data security is our top priority. Learn about our comprehensive security measures and compliance standards.
        </p>
      </div>

      {/* Security Overview */}
      <div className="neon-panel">
        <h2 className="neon-heading">Our Security Commitment</h2>
        <p className="main-subheader">
          At Naranja, we implement enterprise-grade security measures to protect your sensitive business data and ensure compliance with industry standards.
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3 className="feature-title">End-to-End Encryption</h3>
          <p className="feature-description">
            All data is encrypted in transit and at rest using AES-256 encryption standards, ensuring your information remains secure.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3 className="feature-title">ISO 27001 Compliance</h3>
          <p className="feature-description">
            Our information security management system meets international ISO 27001 standards for comprehensive security controls.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3 className="feature-title">Regular Security Audits</h3>
          <p className="feature-description">
            We conduct quarterly security assessments and penetration testing to identify and address potential vulnerabilities.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3 className="feature-title">Access Controls</h3>
          <p className="feature-description">
            Multi-factor authentication and role-based access controls ensure only authorized personnel can access sensitive data.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">GDPR Compliant</h3>
          <p className="feature-description">
            Full compliance with General Data Protection Regulation requirements for data processing and user privacy rights.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">24/7 Monitoring</h3>
          <p className="feature-description">
            Continuous monitoring and automated threat detection systems provide real-time security oversight and incident response.
          </p>
        </div>
      </div>

      {/* Data Protection Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Data Protection Standards</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">Data Processing</h3>
            <ul className="feature-list">
              <li>Minimal data collection principles</li>
              <li>Purpose limitation and data minimization</li>
              <li>Automated data retention policies</li>
              <li>Secure data deletion procedures</li>
            </ul>
          </div>
          
          <div className="content-section">
            <h3 className="section-title">Infrastructure Security</h3>
            <ul className="feature-list">
              <li>Cloud infrastructure with SOC 2 certification</li>
              <li>Redundant backup systems</li>
              <li>Network segmentation and firewalls</li>
              <li>Intrusion detection and prevention</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance Certifications */}
      <div className="neon-panel">
        <h2 className="neon-heading">Certifications & Compliance</h2>
        <div className="certification-grid">
          <div className="certification-card">
            <h4>ISO 27001</h4>
            <p>Information Security Management</p>
          </div>
          <div className="certification-card">
            <h4>SOC 2 Type II</h4>
            <p>Service Organization Controls</p>
          </div>
          <div className="certification-card">
            <h4>GDPR</h4>
            <p>General Data Protection Regulation</p>
          </div>
          <div className="certification-card">
            <h4>Cyber Essentials</h4>
            <p>UK Government Security Scheme</p>
          </div>
        </div>
      </div>

      {/* Contact Security Team */}
      <div className="neon-panel">
        <h2 className="neon-heading">Security Inquiries</h2>
        <p className="main-subheader">
          Have questions about our security practices or need to report a security concern?
        </p>
        <div className="cta-container">
          <Link href="/homepage/contact-us" className="cta-button primary">
            Contact Security Team
          </Link>
          <a href="mailto:security@naranja.co.uk" className="cta-button secondary">
            security@naranja.co.uk
          </a>
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

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin: 1.5rem 0;
        }

        .content-section {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .section-title {
          color: var(--text-white);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin-bottom: 1rem;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-list li {
          color: var(--text-white);
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--training-accent-medium);
          position: relative;
          padding-left: 1.5rem;
        }

        .feature-list li:last-child {
          border-bottom: none;
        }

        .feature-list li::before {
          content: "✓";
          color: var(--neon);
          position: absolute;
          left: 0;
          font-weight: bold;
        }

        .certification-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .certification-card {
          background: var(--training-accent-dark);
          border: 2px solid var(--neon);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        }

        .certification-card h4 {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 0.5rem 0;
        }

        .certification-card p {
          color: var(--text-white);
          margin: 0;
          font-size: 0.9rem;
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

        .cta-button.secondary {
          background: transparent;
          color: var(--text-white);
          border: 1px solid var(--training-accent-medium);
        }

        .cta-button.secondary:hover {
          border-color: var(--neon);
          color: var(--neon);
        }
      `}</style>
    </div>
  );
}
