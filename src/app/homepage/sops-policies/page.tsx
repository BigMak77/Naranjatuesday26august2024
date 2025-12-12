"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiClipboard, FiCheckCircle, FiRefreshCw, FiBarChart2, FiTarget, FiBell } from "react-icons/fi";

export default function SopsPoliciesPage() {
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

        <h1 className="main-header">SOPs & Policies</h1>
        <p className="main-subheader">
          Create, assign, and manage Standard Operating Procedures and Policies that ensure compliance and clarity across your organization.
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Streamline Your Documentation Management</h2>
        <p className="main-subheader">
          Standard Operating Procedures (SOPs) and Policies are the backbone of consistent operations and regulatory compliance. Naranja makes it effortless to create, distribute, and track these critical documents across every role in your organization.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiClipboard />
          </div>
          <h3 className="feature-title">Role-Based Assignment</h3>
          <p className="feature-description">
            Automatically assign SOPs and policies to specific roles, departments, or locations ensuring everyone has access to the documentation they need.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiCheckCircle />
          </div>
          <h3 className="feature-title">Completion Tracking</h3>
          <p className="feature-description">
            Monitor who has read and acknowledged each document with real-time compliance tracking and automated reminders for overdue reviews.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiRefreshCw />
          </div>
          <h3 className="feature-title">Version Control</h3>
          <p className="feature-description">
            Maintain complete audit history with automatic versioning. Every change is tracked, timestamped, and archived for regulatory compliance.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiBarChart2 />
          </div>
          <h3 className="feature-title">Compliance Reporting</h3>
          <p className="feature-description">
            Generate comprehensive reports showing completion rates, outstanding acknowledgments, and audit-ready documentation at any time.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiTarget />
          </div>
          <h3 className="feature-title">Visual Workflows</h3>
          <p className="feature-description">
            Create step-by-step visual guides with embedded photos and videos to make procedures clearer and easier to follow.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiBell />
          </div>
          <h3 className="feature-title">Automated Notifications</h3>
          <p className="feature-description">
            Keep your team informed with automatic alerts for new documents, policy updates, and upcoming review deadlines.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Why Choose Naranja for SOPs & Policies</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">Audit-Ready Compliance</h3>
            <ul className="feature-list">
              <li>Complete documentation trails</li>
              <li>Timestamped acknowledgments</li>
              <li>Version history archiving</li>
              <li>Instant compliance reports</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">Operational Excellence</h3>
            <ul className="feature-list">
              <li>Consistent procedures across sites</li>
              <li>Reduced training time</li>
              <li>Improved quality control</li>
              <li>Enhanced team performance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="neon-panel">
        <h2 className="neon-heading">Perfect for Every Department</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>Production Floor</h4>
            <p>Manufacturing procedures, equipment operation guides, safety protocols, and quality control checklists.</p>
          </div>
          <div className="use-case-card">
            <h4>Food Safety</h4>
            <p>HACCP procedures, allergen management, cleaning schedules, and hygiene protocols.</p>
          </div>
          <div className="use-case-card">
            <h4>Quality Assurance</h4>
            <p>Testing procedures, inspection protocols, non-conformance handling, and corrective actions.</p>
          </div>
          <div className="use-case-card">
            <h4>HR & Admin</h4>
            <p>Employee handbooks, onboarding procedures, leave policies, and workplace conduct guidelines.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">Ready to Simplify Your Documentation?</h2>
        <p className="main-subheader">
          Transform how your organization manages SOPs and policies. Get audit-ready in minutes, not hours.
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
