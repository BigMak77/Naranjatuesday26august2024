"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/TranslationContext";
import { FiClipboard, FiVideo, FiCheckCircle, FiImage, FiLayers, FiBookOpen } from "react-icons/fi";

export default function InstructionalMediaPage() {
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

        <h1 className="main-header">{t('instructionalMedia.title')}</h1>
        <p className="main-subheader">
          {t('instructionalMedia.subtitle')}
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('instructionalMedia.overviewHeading')}</h2>
        <p className="main-subheader">
          {t('instructionalMedia.overviewText')}
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiClipboard />
          </div>
          <h3 className="feature-title">{t('instructionalMedia.visualWorkInstructionsTitle')}</h3>
          <p className="feature-description">
            {t('instructionalMedia.visualWorkInstructionsDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiVideo />
          </div>
          <h3 className="feature-title">{t('instructionalMedia.videoIntegrationTitle')}</h3>
          <p className="feature-description">
            {t('instructionalMedia.videoIntegrationDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiCheckCircle />
          </div>
          <h3 className="feature-title">{t('instructionalMedia.knowledgeChecksTitle')}</h3>
          <p className="feature-description">
            {t('instructionalMedia.knowledgeChecksDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiImage />
          </div>
          <h3 className="feature-title">{t('instructionalMedia.richMediaSupportTitle')}</h3>
          <p className="feature-description">
            {t('instructionalMedia.richMediaSupportDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiLayers />
          </div>
          <h3 className="feature-title">{t('instructionalMedia.versionControlTitle')}</h3>
          <p className="feature-description">
            {t('instructionalMedia.versionControlDesc')}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiBookOpen />
          </div>
          <h3 className="feature-title">{t('instructionalMedia.roleBasedAssignmentTitle')}</h3>
          <p className="feature-description">
            {t('instructionalMedia.roleBasedAssignmentDesc')}
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('instructionalMedia.benefitsHeading')}</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">{t('instructionalMedia.fasterLearningTitle')}</h3>
            <ul className="feature-list">
              <li>{t('instructionalMedia.fasterLearningItem1')}</li>
              <li>{t('instructionalMedia.fasterLearningItem2')}</li>
              <li>{t('instructionalMedia.fasterLearningItem3')}</li>
              <li>{t('instructionalMedia.fasterLearningItem4')}</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">{t('instructionalMedia.fewerErrorsTitle')}</h3>
            <ul className="feature-list">
              <li>{t('instructionalMedia.fewerErrorsItem1')}</li>
              <li>{t('instructionalMedia.fewerErrorsItem2')}</li>
              <li>{t('instructionalMedia.fewerErrorsItem3')}</li>
              <li>{t('instructionalMedia.fewerErrorsItem4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content Types */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('instructionalMedia.contentTypesHeading')}</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>{t('instructionalMedia.equipmentOperationTitle')}</h4>
            <p>{t('instructionalMedia.equipmentOperationDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('instructionalMedia.qualityProceduresTitle')}</h4>
            <p>{t('instructionalMedia.qualityProceduresDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('instructionalMedia.safetyTrainingTitle')}</h4>
            <p>{t('instructionalMedia.safetyTrainingDesc')}</p>
          </div>
          <div className="use-case-card">
            <h4>{t('instructionalMedia.processInstructionsTitle')}</h4>
            <p>{t('instructionalMedia.processInstructionsDesc')}</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">{t('instructionalMedia.ctaHeading')}</h2>
        <p className="main-subheader">
          {t('instructionalMedia.ctaText')}
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
