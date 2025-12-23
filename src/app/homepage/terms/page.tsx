"use client";

import React from "react";
import { useRouter } from "next/navigation";

type CompanyContact = {
  email: string;
  address?: string;
};

type BillingSettings = {
  currency?: string;
  refunds?: "none" | "prorated" | "full_within_cooling_off";
  trialDays?: number;
  autoRenew?: boolean;
  noticeDaysBeforeRenewal?: number;
};

export default function TermsPage() {
  const router = useRouter();

  const companyName = "Naranja";
  const productName = "Naranja";
  const lastUpdated = "6 September 2025";
  const governingLaw = "England and Wales";
  const venue = "the courts of England and Wales";
  const contact: CompanyContact = {
    email: "legal@naranja.example",
    address: "123 Example Street, London, SW1A 1AA, United Kingdom",
  };
  const billing: BillingSettings = {
    currency: "GBP",
    refunds: "prorated",
    trialDays: 14,
    autoRenew: true,
    noticeDaysBeforeRenewal: 30,
  };
  const hasFreeTier = true;
  const includesBetaFeatures = true;

  const name = productName || companyName;
  const showTrial = typeof billing.trialDays === "number" && billing.trialDays > 0;

  return (
    <article aria-labelledby="tos-title" className="tos">
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

      <h1 id="tos-title">Terms of Service</h1>
      <p className="meta">Last updated: {lastUpdated}</p>

      <p className="lead">
        These Terms of Service ("Terms") govern your access to and use of {name}'s websites,
        applications, products, and services (collectively, the "Services"). By accessing or using the
        Services, you agree to be bound by these Terms.
      </p>

      <nav aria-label="Contents" className="toc">
        <h2>Contents</h2>
        <ol>
          <li><a href="#acceptance">Acceptance</a></li>
          <li><a href="#eligibility">Eligibility & accounts</a></li>
          <li><a href="#use">Permitted use & restrictions</a></li>
          <li><a href="#content">User content</a></li>
          <li><a href="#ip">Intellectual property</a></li>
          {includesBetaFeatures && <li><a href="#beta">Beta features</a></li>}
          <li><a href="#fees">Fees, billing & renewals</a></li>
          <li><a href="#termination">Suspension & termination</a></li>
          <li><a href="#disclaimers">Disclaimers</a></li>
          <li><a href="#liability">Limitation of liability</a></li>
          <li><a href="#indemnity">Indemnity</a></li>
          <li><a href="#law">Governing law & venue</a></li>
          <li><a href="#changes">Changes to the Service</a></li>
        </ol>
      </nav>

      <section id="acceptance">
        <h2>1) Acceptance</h2>
        <p>
          By accessing or using the Services, you confirm that you have read, understood, and agree to be
          bound by these Terms. If you do not agree, you must not use the Services.
        </p>
      </section>

      <section id="eligibility">
        <h2>2) Eligibility & accounts</h2>
        <ul>
          <li>You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Services.</li>
          <li>You are responsible for maintaining the security of your account credentials and for all activities under your account.</li>
          <li>You must provide accurate and complete information when creating an account.</li>
        </ul>
      </section>

      <section id="use">
        <h2>3) Permitted use & restrictions</h2>
        <p>You may use the Services for lawful purposes only. You must not:</p>
        <ul>
          <li>Violate any applicable laws or regulations.</li>
          <li>Infringe the intellectual property or privacy rights of others.</li>
          <li>Transmit malware, viruses, or harmful code.</li>
          <li>Attempt to gain unauthorized access to the Services or related systems.</li>
          <li>Use the Services to harass, abuse, or harm others.</li>
          <li>Scrape, mine, or otherwise extract data without permission.</li>
        </ul>
      </section>

      <section id="content">
        <h2>4) User content</h2>
        <ul>
          <li>You retain ownership of content you upload or create using the Services ("User Content").</li>
          <li>You grant us a non-exclusive, worldwide, royalty-free license to use, store, and process User Content to provide and improve the Services.</li>
          <li>You represent that you have all necessary rights to your User Content and that it does not violate third-party rights or applicable law.</li>
        </ul>
      </section>

      <section id="ip">
        <h2>5) Intellectual property</h2>
        <p>
          All rights, title, and interest in the Services (excluding User Content) are owned by {companyName}.
          These Terms do not grant you any ownership rights in the Services. You may not copy, modify, distribute,
          or reverse-engineer any part of the Services without our prior written consent.
        </p>
      </section>

      {includesBetaFeatures && (
        <section id="beta">
          <h2>6) Beta features</h2>
          <p>
            We may offer beta, preview, or experimental features ("Beta Features"). Beta Features are provided "as is"
            without warranty and may be modified or discontinued at any time. We may collect feedback and usage data
            to improve Beta Features.
          </p>
        </section>
      )}

      <section id="fees">
        <h2>{includesBetaFeatures ? "7" : "6"}) Fees, billing & renewals</h2>
        <ul>
          {hasFreeTier && <li>We may offer a free tier with limited functionality.</li>}
          {showTrial && (
            <li>
              Paid plans may include a {billing.trialDays}-day trial. You will not be charged until the trial ends.
              You may cancel at any time during the trial.
            </li>
          )}
          <li>
            Fees are stated in {billing.currency || "your selected currency"} and are payable in advance. All fees
            are non-refundable except as required by law
            {billing.refunds === "prorated" && ", or on a pro-rated basis upon early cancellation"}
            {billing.refunds === "full_within_cooling_off" && ", or in full within any applicable cooling-off period"}.
          </li>
          {billing.autoRenew && (
            <li>
              Subscriptions renew automatically unless cancelled at least {billing.noticeDaysBeforeRenewal || 0} days
              before the renewal date.
            </li>
          )}
          <li>We may change our fees with reasonable notice (typically 30 days).</li>
        </ul>
      </section>

      <section id="termination">
        <h2>{includesBetaFeatures ? "8" : "7"}) Suspension & termination</h2>
        <ul>
          <li>You may cancel your account at any time via account settings or by contacting us.</li>
          <li>
            We may suspend or terminate your access if you breach these Terms, engage in fraudulent activity,
            or if required by law.
          </li>
          <li>Upon termination, your right to use the Services ceases immediately. We may delete your data in accordance with our data retention policies.</li>
        </ul>
      </section>

      <section id="disclaimers">
        <h2>{includesBetaFeatures ? "9" : "8"}) Disclaimers</h2>
        <p>
          <strong>The Services are provided "as is" and "as available" without warranties of any kind, express or implied.</strong>
          {" "}We do not warrant that the Services will be uninterrupted, error-free, or secure. We disclaim all warranties,
          including merchantability, fitness for a particular purpose, and non-infringement, to the maximum extent permitted by law.
        </p>
      </section>

      <section id="liability">
        <h2>{includesBetaFeatures ? "10" : "9"}) Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {companyName} (and its officers, directors, employees, and affiliates)
          shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of
          profits, revenue, data, or goodwill, arising out of or related to your use of (or inability to use) the Services,
          even if we have been advised of the possibility of such damages.
        </p>
        <p>
          Our total liability to you for any claims arising from these Terms or the Services shall not exceed the amount
          you paid us in the 12 months preceding the event giving rise to liability.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud,
          or any liability that cannot be excluded or limited by law.
        </p>
      </section>

      <section id="indemnity">
        <h2>{includesBetaFeatures ? "11" : "10"}) Indemnity</h2>
        <p>
          You agree to indemnify, defend, and hold harmless {companyName} (and its officers, directors, employees,
          and affiliates) from and against any claims, liabilities, damages, losses, and expenses (including reasonable
          legal fees) arising out of or related to your use of the Services, your User Content, or your breach of these Terms.
        </p>
      </section>

      <section id="law">
        <h2>{includesBetaFeatures ? "12" : "11"}) Governing law & venue</h2>
        <p>
          These Terms are governed by the laws of {governingLaw}, without regard to conflict of law principles.
          Any disputes arising from these Terms or the Services shall be subject to the exclusive jurisdiction of {venue}.
        </p>
      </section>

      <section id="changes">
        <h2>{includesBetaFeatures ? "13" : "12"}) Changes to the Service</h2>
        <p>
          We reserve the right to modify, suspend, or discontinue the Services (or any part thereof) at any time,
          with or without notice. We may also update these Terms from time to time. Continued use of the Services
          after changes constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <address>
          <p>
            <strong>{companyName}</strong>
          </p>
          {contact.address && <p>{contact.address}</p>}
          <p>
            Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </address>
      </section>

      <style>{`
        .tos {
          max-width: 820px;
          margin: 0 auto;
          padding: 24px;
          line-height: 1.6;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05);
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
          outline: 2px solid var(--neon, #00fff7);
          outline-offset: 2px;
        }

        .meta { margin-top: -4px; font-size: 0.95rem; }
        .lead { margin-top: 16px; }
        h1 { margin: 0; font-size: 2rem; }
        h2 { margin-top: 28px; font-size: 1.25rem; }
        ul { padding-left: 1.2rem; }
        .toc { padding: 16px; border-radius: 10px; margin: 20px 0; }
        .toc h2 { margin-top: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: .04em; }
        .toc ol { margin: 0; padding-left: 1.1rem; }
        a { text-decoration: underline; text-underline-offset: 2px; }
        address { font-style: normal; }
        @media print {
          .tos { box-shadow: none; border: none; border-radius: 0; }
          a { color: black; text-decoration: none; }
        }
      `}</style>
    </article>
  );
}
