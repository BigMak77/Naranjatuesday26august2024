"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUpload, FiFolder, FiUsers, FiClock, FiShield, FiSearch } from "react-icons/fi";

export default function TurkusPage() {
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

        <h1 className="main-header">Turkus Document Management</h1>
        <p className="main-subheader">
          Your central hub for managing controlled documents with version control, role-based access, and complete audit trails.
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Centralized Document Control</h2>
        <p className="main-subheader">
          Turkus provides a powerful, intuitive platform for managing all your controlled documents. Upload, organize, version, and assign documents to users and roles, ensuring everyone always has access to the latest, compliant information.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiUpload />
          </div>
          <h3 className="feature-title">Easy Document Upload</h3>
          <p className="feature-description">
            Drag and drop documents or upload in bulk. Support for all common file formats including PDFs, Word docs, Excel spreadsheets, and images.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiFolder />
          </div>
          <h3 className="feature-title">Smart Organization</h3>
          <p className="feature-description">
            Organize documents by category, department, or custom tags. Create folder structures that mirror your organizational hierarchy.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiUsers />
          </div>
          <h3 className="feature-title">Role-Based Access</h3>
          <p className="feature-description">
            Assign documents to specific users, roles, or departments with granular permission controls ensuring the right people have the right access.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiClock />
          </div>
          <h3 className="feature-title">Version Control</h3>
          <p className="feature-description">
            Automatic version tracking with complete history. Easily compare versions, restore previous editions, and see exactly what changed and when.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiShield />
          </div>
          <h3 className="feature-title">Audit Trails</h3>
          <p className="feature-description">
            Comprehensive audit logs track every document access, modification, and download for complete compliance and regulatory readiness.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiSearch />
          </div>
          <h3 className="feature-title">Powerful Search</h3>
          <p className="feature-description">
            Find documents instantly with advanced search and filtering. Search by title, content, tags, author, date, or custom metadata.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Why Choose Turkus</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">Complete Control</h3>
            <ul className="feature-list">
              <li>Centralized document repository</li>
              <li>Granular access permissions</li>
              <li>Automated version management</li>
              <li>Full audit and compliance tracking</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">Enhanced Productivity</h3>
            <ul className="feature-list">
              <li>Quick document retrieval</li>
              <li>Eliminate document confusion</li>
              <li>Always access latest versions</li>
              <li>Streamlined collaboration</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document Types */}
      <div className="neon-panel">
        <h2 className="neon-heading">Perfect for All Document Types</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>Quality Documents</h4>
            <p>Quality manuals, inspection procedures, non-conformance reports, and CAPA documentation.</p>
          </div>
          <div className="use-case-card">
            <h4>Safety & Compliance</h4>
            <p>Safety data sheets, risk assessments, HACCP plans, and regulatory compliance documents.</p>
          </div>
          <div className="use-case-card">
            <h4>Training Materials</h4>
            <p>Training guides, certification records, competency assessments, and learning resources.</p>
          </div>
          <div className="use-case-card">
            <h4>Operational Docs</h4>
            <p>Standard forms, checklists, maintenance schedules, and equipment manuals.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">Ready to Take Control of Your Documents?</h2>
        <p className="main-subheader">
          Transform document chaos into organized, compliant, and accessible information your team can trust.
        </p>
        <div className="cta-container">
          <Link href="/homepage/contact-us" className="cta-button primary">
            Schedule a Demo
          </Link>
          <Link href="/homepage/about" className="cta-button secondary">
            Learn More
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

        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .use-case-card {
          background: var(--training-accent-dark);
          border: 2px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s ease;
        }

        .use-case-card:hover {
          border-color: var(--neon);
        }

        .use-case-card h4 {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 0.75rem 0;
        }

        .use-case-card p {
          color: var(--text-white);
          margin: 0;
          line-height: 1.6;
          opacity: 0.9;
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
