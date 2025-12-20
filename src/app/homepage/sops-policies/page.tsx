"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/TranslationContext";
import { FiClipboard, FiCheckCircle, FiRefreshCw, FiBarChart2, FiTarget, FiBell } from "react-icons/fi";

export default function SopsPoliciesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="neon-panel">
      {/* Hero Section */}
      <div className="main-header-container with-subtitle">
        {/* Close Button */}
        <div className="page-close-button">
          <button
            onClick={() => router.push('/')}
            aria-label={t('featurePages.closeButton')}
            className="overlay-close-button"
            title={t('featurePages.closeButton')}
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

        <h1 className="main-header">{t('sopsPolicies.title')}</h1>
        <p className="main-subheader">
          {t('sopsPolicies.subtitle')}
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('sopsPolicies.overviewHeading')}</h2>
        <p className="main-subheader">
          {t('sopsPolicies.overviewText')}
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiClipboard />
          </div>
          <h3 className="feature-title">{t('sopsPolicies.roleBasedTitle')}</h3>
          <p className="feature-description">
            {t('sopsPolicies.roleBasedDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiCheckCircle />
          </div>
          <h3 className="feature-title">{t('sopsPolicies.completionTrackingTitle')}</h3>
          <p className="feature-description">
            {t('sopsPolicies.completionTrackingDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiRefreshCw />
          </div>
          <h3 className="feature-title">{t('sopsPolicies.versionControlTitle')}</h3>
          <p className="feature-description">
            {t('sopsPolicies.versionControlDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiBarChart2 />
          </div>
          <h3 className="feature-title">{t('sopsPolicies.complianceReportingTitle')}</h3>
          <p className="feature-description">
            {t('sopsPolicies.complianceReportingDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiTarget />
          </div>
          <h3 className="feature-title">{t('sopsPolicies.visualWorkflowsTitle')}</h3>
          <p className="feature-description">
            {t('sopsPolicies.visualWorkflowsDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiBell />
          </div>
          <h3 className="feature-title">{t('sopsPolicies.automatedNotificationsTitle')}</h3>
          <p className="feature-description">
            {t('sopsPolicies.automatedNotificationsDesc')}
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('sopsPolicies.benefitsHeading')}</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">{t('sopsPolicies.auditReadyTitle')}</h3>
            <ul className="feature-list">
              <li>{t('sopsPolicies.auditReadyItem1')}</li>
              <li>{t('sopsPolicies.auditReadyItem2')}</li>
              <li>{t('sopsPolicies.auditReadyItem3')}</li>
              <li>{t('sopsPolicies.auditReadyItem4')}</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">{t('sopsPolicies.operationalExcellenceTitle')}</h3>
            <ul className="feature-list">
              <li>{t('sopsPolicies.operationalExcellenceItem1')}</li>
              <li>{t('sopsPolicies.operationalExcellenceItem2')}</li>
              <li>{t('sopsPolicies.operationalExcellenceItem3')}</li>
              <li>{t('sopsPolicies.operationalExcellenceItem4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('sopsPolicies.useCasesHeading')}</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>{t('sopsPolicies.productionFloorTitle')}</h4>
            <p>{t('sopsPolicies.productionFloorDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('sopsPolicies.foodSafetyTitle')}</h4>
            <p>{t('sopsPolicies.foodSafetyDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('sopsPolicies.qualityAssuranceTitle')}</h4>
            <p>{t('sopsPolicies.qualityAssuranceDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('sopsPolicies.hrAdminTitle')}</h4>
            <p>{t('sopsPolicies.hrAdminDesc')}</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('sopsPolicies.ctaHeading')}</h2>
        <p className="main-subheader">
          {t('sopsPolicies.ctaText')}
        </p>
        <div className="cta-container">
          <Link href="/homepage/contact-us" className="cta-button primary">
            {t('featurePages.scheduleDemo')}
          </Link>
          <Link href="/homepage/about" className="cta-button secondary">
            {t('featurePages.learnMore')}
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
