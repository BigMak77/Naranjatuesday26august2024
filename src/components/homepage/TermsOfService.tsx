import React from "react";

type CompanyContact = {
  email: string;
  address?: string;
};

type BillingSettings = {
  currency?: string; // e.g., "GBP"
  refunds?: "none" | "prorated" | "full_within_cooling_off";
  trialDays?: number;
  autoRenew?: boolean;
  noticeDaysBeforeRenewal?: number; // e.g., 30
};

type TermsProps = {
  companyName?: string;
  productName?: string; // if different from companyName
  lastUpdated?: string; // e.g., "6 September 2025"
  governingLaw?: string; // e.g., "England and Wales"
  venue?: string; // e.g., "the courts of England and Wales"
  contact: CompanyContact;
  billing?: BillingSettings;
  hasFreeTier?: boolean;
  includesBetaFeatures?: boolean;
};

const TermsOfService: React.FC<TermsProps> = ({
  companyName = "Naranja",
  productName,
  lastUpdated = "6 September 2025",
  governingLaw = "England and Wales",
  venue = "the courts of England and Wales",
  contact,
  billing = { currency: "GBP", refunds: "prorated", trialDays: 14, autoRenew: true, noticeDaysBeforeRenewal: 30 },
  hasFreeTier = true,
  includesBetaFeatures = true,
}) => {
  const name = productName || companyName;
  const showTrial = typeof billing.trialDays === "number" && billing.trialDays > 0;

  return (
    <article aria-labelledby="tos-title" className="tos">
      <h1 id="tos-title">Terms of Service</h1>
      <p className="meta">Last updated: {lastUpdated}</p>

      <p className="lead">
        These Terms of Service (“Terms”) govern your access to and use of {name}’s websites,
        applications, products, and services (collectively, the “Services”). By accessing or using the
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

      <style>{`
        .tos {
          max-width: 820px;
          margin: 0 auto;
          padding: 24px;
          line-height: 1.6;
          /* color: #0b1f24; */
          /* background: #ffffff; */
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05);
        }
        .meta { margin-top: -4px; /* color: #46636a; */ font-size: 0.95rem; }
        .lead { margin-top: 16px; }
        h1 { margin: 0; font-size: 2rem; }
        h2 { margin-top: 28px; font-size: 1.25rem; }
        ul { padding-left: 1.2rem; }
        .toc { /* background: #f6fbfc; border: 1px solid #d4eef0; */ padding: 16px; border-radius: 10px; margin: 20px 0; }
        .toc h2 { margin-top: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: .04em; /* color: #2a5b62; */ }
        .toc ol { margin: 0; padding-left: 1.1rem; }
        a { /* color: #0b7285; */ text-decoration: underline; text-underline-offset: 2px; }
        address { font-style: normal; }
        @media print {
          .tos { box-shadow: none; border: none; border-radius: 0; }
          a { color: black; text-decoration: none; }
        }
      `}</style>
    </article>
  );
};

export default TermsOfService;
