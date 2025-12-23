"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/TranslationContext";

export default function AboutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <article aria-labelledby="about-title" className="about-page">
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

      {/* Hero Section */}
      <header>
        <h1 id="about-title">{t('aboutPage.title')}</h1>
        <p className="lead">
          {t('aboutPage.subtitle')}
        </p>
      </header>

      {/* Mission Statement */}
      <section>
        <h2>{t('aboutPage.missionHeading')}</h2>
        <p>
          {t('aboutPage.missionText')}
        </p>
      </section>

      {/* Core Values Grid */}
      <section>
        <h2>{t('aboutPage.coreValuesHeading')}</h2>
        <div className="grid">
          <div className="card">
            <h3>{t('aboutPage.precisionTitle')}</h3>
            <p>{t('aboutPage.precisionDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.effortlessTitle')}</h3>
            <p>{t('aboutPage.effortlessDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.auditReadyTitle')}</h3>
            <p>{t('aboutPage.auditReadyDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.continuousTitle')}</h3>
            <p>{t('aboutPage.continuousDesc')}</p>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section>
        <h2>{t('aboutPage.whatSetsUsApartHeading')}</h2>
        <div className="grid">
          <div className="card">
            <h3>{t('aboutPage.industryExpertiseTitle')}</h3>
            <p>{t('aboutPage.industryExpertiseDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.beautifulSimplicityTitle')}</h3>
            <p>{t('aboutPage.beautifulSimplicityDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.realTimeTrackingTitle')}</h3>
            <p>{t('aboutPage.realTimeTrackingDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.partnershipTitle')}</h3>
            <p>{t('aboutPage.partnershipDesc')}</p>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section>
        <h2>{t('aboutPage.leadershipHeading')}</h2>
        <div className="grid">
          <div className="card leader">
            <div className="leader-initial">A</div>
            <h3>Andy</h3>
            <p className="leader-role">{t('aboutPage.andyRole')}</p>
            <p>{t('aboutPage.andyDesc')}</p>
          </div>
          <div className="card leader">
            <div className="leader-initial">P</div>
            <h3>Paul</h3>
            <p className="leader-role">{t('aboutPage.paulRole')}</p>
            <p>{t('aboutPage.paulDesc')}</p>
          </div>
        </div>
      </section>

      {/* Why Choose Naranja */}
      <section>
        <h2>{t('aboutPage.whyChooseHeading')}</h2>
        <div className="grid">
          <div className="card">
            <h3>{t('aboutPage.provenResultsTitle')}</h3>
            <p>{t('aboutPage.provenResultsDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.quickImplementationTitle')}</h3>
            <p>{t('aboutPage.quickImplementationDesc')}</p>
          </div>
          <div className="card">
            <h3>{t('aboutPage.dedicatedSupportTitle')}</h3>
            <p>{t('aboutPage.dedicatedSupportDesc')}</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>{t('aboutPage.ctaHeading')}</h2>
        <p>
          {t('aboutPage.ctaText')}
        </p>
        <div className="cta-buttons">
          <Link href="/homepage/contact-us" className="btn-primary">
            {t('aboutPage.getStartedButton')}
          </Link>
          <Link href="/homepage/contact-us" className="btn-secondary">
            {t('aboutPage.scheduleDemoButton')}
          </Link>
        </div>
      </section>

      <style>{`
        .about-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          line-height: 1.6;
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
          outline: 2px solid var(--neon, #40e0d0);
          outline-offset: 2px;
        }

        /* Typography */
        h1 {
          margin: 0 0 16px 0;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-white);
        }

        h2 {
          margin: 48px 0 24px 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-white);
        }

        h3 {
          margin: 0 0 12px 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-white);
        }

        .lead {
          font-size: 1.125rem;
          margin: 0 0 32px 0;
          color: rgba(255, 255, 255, 0.9);
          max-width: 800px;
        }

        p {
          margin: 0 0 16px 0;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
        }

        section {
          margin-bottom: 48px;
        }

        /* Grid Layout */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        /* Card Styling */
        .card {
          padding: 24px;
          background: rgba(5, 54, 57, 0.5);
          border: 1px solid rgba(64, 224, 208, 0.2);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .card:hover {
          border-color: rgba(64, 224, 208, 0.4);
          background: rgba(5, 54, 57, 0.7);
          transform: translateY(-2px);
        }

        .card h3 {
          margin-top: 0;
        }

        .card p {
          margin-bottom: 0;
        }

        /* Leader Cards */
        .card.leader {
          text-align: center;
        }

        .leader-initial {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(64, 224, 208, 0.2), rgba(64, 224, 208, 0.1));
          border: 2px solid rgba(64, 224, 208, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-white);
        }

        .leader-role {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neon);
          margin-bottom: 12px;
        }

        /* Call to Action Section */
        .cta {
          text-align: center;
          padding: 48px 24px;
          background: rgba(5, 54, 57, 0.5);
          border: 1px solid rgba(64, 224, 208, 0.2);
          border-radius: 12px;
          margin-top: 64px;
        }

        .cta h2 {
          margin-top: 0;
        }

        .cta p {
          max-width: 600px;
          margin: 0 auto 32px;
          font-size: 1rem;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Button Styles */
        .btn-primary,
        .btn-secondary {
          display: inline-block;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--neon);
          color: var(--panel);
          border: 2px solid var(--neon);
        }

        .btn-primary:hover {
          background: transparent;
          color: var(--neon);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
        }

        .btn-secondary {
          background: transparent;
          color: var(--text-white);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn-secondary:hover {
          border-color: var(--neon);
          color: var(--neon);
          transform: translateY(-2px);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .about-page {
            padding: 16px;
          }

          h1 {
            font-size: 2rem;
          }

          h2 {
            font-size: 1.5rem;
            margin: 32px 0 16px 0;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            text-align: center;
          }
        }

        @media print {
          .about-page {
            box-shadow: none;
            border: none;
            border-radius: 0;
          }

          .page-close-button {
            display: none;
          }

          .card {
            break-inside: avoid;
          }
        }
      `}</style>
    </article>
  );
}
