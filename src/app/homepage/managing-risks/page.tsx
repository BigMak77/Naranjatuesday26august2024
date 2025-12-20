"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/TranslationContext";
import { FiAlertTriangle, FiCheckSquare, FiActivity, FiPieChart, FiFileText, FiTrendingDown } from "react-icons/fi";

export default function ManagingRisksAboutPage() {
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

        <h1 className="main-header">{t('managingRisks.title')}</h1>
        <p className="main-subheader">
          {t('managingRisks.subtitle')}
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('managingRisks.overviewHeading')}</h2>
        <p className="main-subheader">
          {t('managingRisks.overviewText')}
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiAlertTriangle />
          </div>
          <h3 className="feature-title">{t('managingRisks.customAssessmentsTitle')}</h3>
          <p className="feature-description">
            {t('managingRisks.customAssessmentsDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiCheckSquare />
          </div>
          <h3 className="feature-title">{t('managingRisks.integratedTrainingTitle')}</h3>
          <p className="feature-description">
            {t('managingRisks.integratedTrainingDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiActivity />
          </div>
          <h3 className="feature-title">{t('managingRisks.realTimeTrackingTitle')}</h3>
          <p className="feature-description">
            {t('managingRisks.realTimeTrackingDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiPieChart />
          </div>
          <h3 className="feature-title">{t('managingRisks.managerDashboardsTitle')}</h3>
          <p className="feature-description">
            {t('managingRisks.managerDashboardsDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiFileText />
          </div>
          <h3 className="feature-title">{t('managingRisks.completeAuditTrailsTitle')}</h3>
          <p className="feature-description">
            {t('managingRisks.completeAuditTrailsDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiTrendingDown />
          </div>
          <h3 className="feature-title">{t('managingRisks.trendAnalysisTitle')}</h3>
          <p className="feature-description">
            {t('managingRisks.trendAnalysisDesc')}
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('managingRisks.benefitsHeading')}</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">{t('managingRisks.safetyFirstTitle')}</h3>
            <ul className="feature-list">
              <li>{t('managingRisks.safetyFirstItem1')}</li>
              <li>{t('managingRisks.safetyFirstItem2')}</li>
              <li>{t('managingRisks.safetyFirstItem3')}</li>
              <li>{t('managingRisks.safetyFirstItem4')}</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">{t('managingRisks.complianceReadyTitle')}</h3>
            <ul className="feature-list">
              <li>{t('managingRisks.complianceReadyItem1')}</li>
              <li>{t('managingRisks.complianceReadyItem2')}</li>
              <li>{t('managingRisks.complianceReadyItem3')}</li>
              <li>{t('managingRisks.complianceReadyItem4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Types */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('managingRisks.riskTypesHeading')}</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>{t('managingRisks.operationalHazardsTitle')}</h4>
            <p>{t('managingRisks.operationalHazardsDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('managingRisks.chemicalBiologicalTitle')}</h4>
            <p>{t('managingRisks.chemicalBiologicalDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('managingRisks.environmentalRisksTitle')}</h4>
            <p>{t('managingRisks.environmentalRisksDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('managingRisks.humanFactorsTitle')}</h4>
            <p>{t('managingRisks.humanFactorsDesc')}</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('managingRisks.ctaHeading')}</h2>
        <p className="main-subheader">
          {t('managingRisks.ctaText')}
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
