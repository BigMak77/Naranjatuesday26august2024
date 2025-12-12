"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiAlertTriangle, FiCheckSquare, FiActivity, FiPieChart, FiFileText, FiTrendingDown } from "react-icons/fi";

export default function ManagingRisksAboutPage() {
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

        <h1 className="main-header">Managing Risks</h1>
        <p className="main-subheader">
          Identify, assess, and control workplace hazards with comprehensive risk management tools that keep your team safe and operations compliant.
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Proactive Risk Management</h2>
        <p className="main-subheader">
          Effective risk management is essential for workplace safety and regulatory compliance. Naranja provides powerful tools for conducting risk assessments, tracking hazards in real-time, implementing corrective actions, and maintaining complete audit trails across your organization.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiAlertTriangle />
          </div>
          <h3 className="feature-title">Custom Risk Assessments</h3>
          <p className="feature-description">
            Create tailored risk assessments for specific roles, departments, equipment, and processes. Standardized templates ensure consistent evaluation across your organization.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiCheckSquare />
          </div>
          <h3 className="feature-title">Integrated Training</h3>
          <p className="feature-description">
            Link risk assessments directly to training modules ensuring employees understand hazards and control measures before starting work.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiActivity />
          </div>
          <h3 className="feature-title">Real-Time Hazard Tracking</h3>
          <p className="feature-description">
            Report and track hazards as they occur with instant notifications to managers. Monitor corrective actions from identification through resolution.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiPieChart />
          </div>
          <h3 className="feature-title">Manager Dashboards</h3>
          <p className="feature-description">
            Comprehensive dashboards provide real-time visibility into risk levels, outstanding actions, and compliance status across departments and sites.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiFileText />
          </div>
          <h3 className="feature-title">Complete Audit Trails</h3>
          <p className="feature-description">
            Maintain detailed records of all risk assessments, control measures, and corrective actions with timestamped audit trails ready for inspections.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiTrendingDown />
          </div>
          <h3 className="feature-title">Trend Analysis</h3>
          <p className="feature-description">
            Identify patterns and recurring risks with analytics and reporting tools. Make data-driven decisions to continuously improve safety.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Why Choose Naranja for Risk Management</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">Safety First</h3>
            <ul className="feature-list">
              <li>Reduce workplace incidents</li>
              <li>Systematic hazard identification</li>
              <li>Clear control measures</li>
              <li>Employee awareness and training</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">Compliance Ready</h3>
            <ul className="feature-list">
              <li>Meet regulatory requirements</li>
              <li>Documented risk assessments</li>
              <li>Inspection-ready audit trails</li>
              <li>Continuous improvement tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Types */}
      <div className="neon-panel">
        <h2 className="neon-heading">Manage All Types of Risks</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>Operational Hazards</h4>
            <p>Equipment operation, machinery safety, moving parts, noise, vibration, and manual handling risks.</p>
          </div>
          <div className="use-case-card">
            <h4>Chemical & Biological</h4>
            <p>Hazardous substances, cleaning chemicals, allergens, microbial contamination, and exposure controls.</p>
          </div>
          <div className="use-case-card">
            <h4>Environmental Risks</h4>
            <p>Temperature extremes, slips and trips, working at height, confined spaces, and emergency scenarios.</p>
          </div>
          <div className="use-case-card">
            <h4>Human Factors</h4>
            <p>Fatigue, stress, lone working, new starters, contractor safety, and behavioral risks.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">Ready to Strengthen Your Risk Management?</h2>
        <p className="main-subheader">
          Create a safer workplace with systematic risk assessment and proactive hazard control.
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
