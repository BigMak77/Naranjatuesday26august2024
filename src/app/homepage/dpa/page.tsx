"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Party = {
  legalName: string;
  address?: string;
  country?: string;
  contactEmail?: string;
  role: "Controller" | "Processor" | "Sub-processor";
};

type ProcessingItem = {
  categoryOfDataSubjects: string;
  categoriesOfPersonalData: string;
  specialCategories?: string;
  purpose: string;
  nature: string;
  retention: string;
};

type SecurityMeasure = {
  title: string;
  detail: string;
};

type SubProcessor = {
  name: string;
  service: string;
  location: string;
  safeguards?: string;
  website?: string;
};

export default function DpaPage() {
  const router = useRouter();

  const lastUpdated = "6 September 2025";
  const controller: Party = {
    legalName: "Customer Ltd",
    address: "1 Example Road, London SW1A 1AA, UK",
    country: "United Kingdom",
    contactEmail: "privacy@customer.example",
    role: "Controller",
  };
  const processor: Party = {
    legalName: "Naranja Ltd",
    address: "123 Example Street, London SW1A 1AA, UK",
    country: "United Kingdom",
    contactEmail: "dpo@naranja.example",
    role: "Processor",
  };
  const governingLaw = "England and Wales";
  const supervisoryAuthority = "the ICO (UK)";
  const includeSCCsNote = true;
  const includeUKAddendumNote = true;
  const includeAuditClause = true;
  const includeLiabilityCap = true;
  const liabilityCapText = "the aggregate fees paid by Controller to Naranja under the main agreement in the 12 months preceding the event";
  const breachNotifyHours = 72;
  const dataDeletionDays = 30;
  const processing: ProcessingItem[] = [
    {
      categoryOfDataSubjects: "End users and customer personnel",
      categoriesOfPersonalData: "Name, email, IP address, device identifiers, usage logs, support communications",
      specialCategories: "None",
      purpose: "Provide, operate, secure, and improve the Naranja services; customer support",
      nature: "Hosting, storage, processing, analytics, support",
      retention: "For the subscription term and up to 90 days thereafter for backups/logs",
    },
  ];
  const securityMeasures: SecurityMeasure[] = [
    { title: "Access Control", detail: "Role-based access, least privilege, SSO/MFA for internal systems." },
    { title: "Encryption", detail: "TLS in transit; AES-256 at rest for databases and backups." },
    { title: "Network Security", detail: "Segmentation, firewalls, WAF, continuous monitoring." },
    { title: "Secure SDLC", detail: "Code reviews, dependency scanning, CI/CD with signed artifacts." },
    { title: "Vulnerability Management", detail: "Regular scanning, patching SLAs, penetration tests." },
    { title: "Backup & DR", detail: "Automated backups, tested restores, geo-redundancy." },
    { title: "Logging & Monitoring", detail: "Centralised logs, alerting, anomaly detection." },
    { title: "Incident Response", detail: "Documented runbooks, on-call rotation, breach handling procedures." },
    { title: "Personnel", detail: "Background checks where lawful, confidentiality agreements, annual training." },
    { title: "Physical Security", detail: "Data centres with 24/7 security, access logs, CCTV (via cloud providers)." },
  ];
  const subProcessors: SubProcessor[] = [
    { name: "CloudHost Co.", service: "Infrastructure hosting", location: "EU (Ireland)", safeguards: "In-EEA processing", website: "https://cloudhost.example" },
    { name: "MailBlaster", service: "Transactional email", location: "EEA/US", safeguards: "SCCs Module 3; UK Addendum", website: "https://mailblaster.example" },
    { name: "Metricsly", service: "Product analytics", location: "EU (Germany)", safeguards: "In-EEA processing", website: "https://metricsly.example" },
  ];

  const processorName = processor.legalName;

  return (
    <article className="dpa" aria-labelledby="dpa-title">
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

      <h1 id="dpa-title">Data Processing Agreement (DPA)</h1>
      <p className="meta">Last updated: {lastUpdated}</p>

      <p className="lead">
        This Data Processing Agreement ("<strong>DPA</strong>") forms part of and is subject to the
        agreement between <strong>{controller.legalName}</strong> (the "<strong>Controller</strong>")
        and <strong>{processorName}</strong> (the "<strong>Processor</strong>") (together, the "<strong>Parties</strong>").
        It reflects the Parties' obligations under applicable data protection laws, including the UK GDPR and, where applicable, the EU GDPR.
      </p>

      <nav aria-label="Contents" className="toc">
        <h2>Contents</h2>
        <ol>
          <li><a href="#definitions">Definitions</a></li>
          <li><a href="#scope">Subject matter & duration</a></li>
          <li><a href="#processing-instructions">Processing on documented instructions</a></li>
          <li><a href="#confidentiality">Confidentiality & personnel</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#subprocessors">Sub-processors</a></li>
          <li><a href="#transfers">International transfers</a></li>
          <li><a href="#assist">Assistance to Controller</a></li>
          <li><a href="#breach">Personal data breaches</a></li>
          <li><a href="#deletion">Return & deletion of data</a></li>
          <li><a href="#audit">Audit & compliance</a></li>
          <li><a href="#liability">Liability</a></li>
          <li><a href="#law">Governing law</a></li>
          <li><a href="#schedules">Schedules</a></li>
        </ol>
      </nav>

      <section id="definitions">
        <h2>1) Definitions</h2>
        <p>
          Terms such as <em>personal data</em>, <em>processing</em>, <em>data subject</em>, <em>controller</em>,
          <em>processor</em>, and <em>personal data breach</em> have the meanings set out in the UK GDPR/EU GDPR.
        </p>
      </section>

      <section id="scope">
        <h2>2) Subject matter & duration</h2>
        <p>
          The Processor will process personal data on behalf of the Controller for the purposes, nature,
          and duration described in <a href="#schedule-1">Schedule 1</a>. This DPA applies for as long as
          the Processor processes personal data for the Controller.
        </p>
      </section>

      <section id="processing-instructions">
        <h2>3) Processing on documented instructions</h2>
        <ul>
          <li>
            The Processor shall process personal data only on documented instructions from the Controller,
            including with respect to transfers, unless required by law.
          </li>
          <li>
            The Processor shall promptly inform the Controller if it believes an instruction infringes the UK/EU GDPR.
          </li>
        </ul>
      </section>

      <section id="confidentiality">
        <h2>4) Confidentiality & personnel</h2>
        <ul>
          <li>The Processor ensures persons authorised to process personal data are bound by confidentiality.</li>
          <li>The Processor will ensure personnel receive appropriate data protection and security training.</li>
        </ul>
      </section>

      <section id="security">
        <h2>5) Security</h2>
        <p>
          Taking into account the state of the art, costs, and the nature, scope, context and purposes
          of processing, as well as risks to individuals, the Processor implements appropriate technical
          and organisational measures as described in <a href="#schedule-2">Schedule 2</a>.
        </p>
      </section>

      <section id="subprocessors">
        <h2>6) Sub-processors</h2>
        <ul>
          <li>
            The Controller authorises the Processor to appoint sub-processors for the processing activities
            described in this DPA. The Processor will impose data protection terms on sub-processors that
            are no less protective than this DPA and remains responsible for their performance.
          </li>
          <li>
            The Processor will maintain a list of current sub-processors in <a href="#schedule-3">Schedule 3</a>
            and will provide advance notice of changes, allowing the Controller to object on reasonable grounds.
          </li>
        </ul>
      </section>

      <section id="transfers">
        <h2>7) International transfers</h2>
        <p>
          The Processor will not transfer personal data outside the UK/EU unless it has taken measures
          to ensure compliance with applicable transfer requirements.
        </p>
        {includeSCCsNote && (
          <p>
            Where required, the Parties agree that the EU Standard Contractual Clauses (SCCs) (Controller-to-Processor, Module 2; and/or Processor-to-Processor, Module 3)
            apply to such transfers, as incorporated by reference and completed by the information in this DPA and its Schedules.
          </p>
        )}
        {includeUKAddendumNote && (
          <p>
            For UK transfers, the UK International Data Transfer Addendum (or IDTA) will apply as an addendum to the SCCs or as otherwise agreed by the Parties.
          </p>
        )}
      </section>

      <section id="assist">
        <h2>8) Assistance to Controller</h2>
        <ul>
          <li>The Processor will assist the Controller in responding to data subject requests.</li>
          <li>The Processor will provide reasonable assistance with data protection impact assessments (DPIAs) and prior consultations with supervisory authorities.</li>
          <li>The Processor will make available information reasonably necessary to demonstrate compliance with Article 28 UK/EU GDPR.</li>
        </ul>
      </section>

      <section id="breach">
        <h2>9) Personal data breaches</h2>
        <p>
          The Processor will notify the Controller without undue delay (and in any event within {breachNotifyHours} hours)
          after becoming aware of a personal data breach affecting personal data processed for the Controller.
          The notification will include information reasonably available to the Processor at that time.
        </p>
      </section>

      <section id="deletion">
        <h2>10) Return & deletion of data</h2>
        <p>
          Upon termination or expiry of the services (or upon Controller's written instruction), the Processor
          will delete or return all personal data (at the Controller's choice) and delete existing copies within {dataDeletionDays} days,
          unless retention is required by law. Deletion shall be irreversible to a commercially reasonable standard.
        </p>
      </section>

      <section id="audit">
        <h2>11) Audit & compliance</h2>
        <ul>
          <li>
            The Processor will maintain appropriate certifications and third-party audit reports (e.g., ISO 27001,
            SOC 2) where applicable and make summaries available on request under NDA.
          </li>
          {includeAuditClause && (
            <li>
              Subject to reasonable notice, frequency, and confidentiality obligations, the Controller may
              audit the Processor's compliance (including via independent third-party assessors). Audits shall
              not unreasonably interfere with Processor operations; Parties will cooperate in good faith.
            </li>
          )}
        </ul>
      </section>

      <section id="liability">
        <h2>12) Liability</h2>
        <p>
          Each Party remains responsible for its own processing activities under applicable law. Nothing in this DPA
          excludes or limits liability to the extent it cannot be excluded by law (including for death or personal injury,
          fraud, or wilful misconduct).
        </p>
        {includeLiabilityCap && (
          <p>
            Subject to the foregoing, each Party's aggregate liability under this DPA is limited to {liabilityCapText}.
          </p>
        )}
      </section>

      <section id="law">
        <h2>13) Governing law</h2>
        <p>
          This DPA is governed by the laws of {governingLaw}, and the Parties submit to the jurisdiction of competent courts there.
          The Parties will in good faith interpret and apply this DPA to comply with the UK/EU GDPR.
        </p>
      </section>

      <section id="schedules">
        <h2>14) Schedules</h2>

        <h3 id="schedule-1">Schedule 1 — Details of Processing</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Data subjects</th>
              <th>Personal data</th>
              <th>Special categories</th>
              <th>Purpose</th>
              <th>Nature</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            {processing.map((p, i) => (
              <tr key={i}>
                <td>{p.categoryOfDataSubjects}</td>
                <td>{p.categoriesOfPersonalData}</td>
                <td>{p.specialCategories || "None"}</td>
                <td>{p.purpose}</td>
                <td>{p.nature}</td>
                <td>{p.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 id="schedule-2">Schedule 2 — Technical & Organisational Measures</h3>
        <ul className="measures">
          {securityMeasures.map((m, i) => (
            <li key={i}>
              <strong>{m.title}:</strong> {m.detail}
            </li>
          ))}
        </ul>

        <h3 id="schedule-3">Schedule 3 — Authorised Sub-processors</h3>
        {subProcessors.length === 0 ? (
          <p className="muted">None at this time.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sub-processor</th>
                <th>Service</th>
                <th>Location</th>
                <th>Safeguards</th>
              </tr>
            </thead>
            <tbody>
              {subProcessors.map((s, i) => (
                <tr key={i}>
                  <td>
                    {s.website ? <a href={s.website} rel="noopener noreferrer">{s.name}</a> : s.name}
                  </td>
                  <td>{s.service}</td>
                  <td>{s.location}</td>
                  <td>{s.safeguards || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section id="parties">
        <h2>Parties & Contacts</h2>
        <div className="grid">
          <div className="card">
            <h3>Controller</h3>
            <p><strong>{controller.legalName}</strong></p>
            {controller.address && <p>{controller.address}</p>}
            {controller.country && <p>{controller.country}</p>}
            {controller.contactEmail && <p>Email: <a href={`mailto:${controller.contactEmail}`}>{controller.contactEmail}</a></p>}
          </div>
          <div className="card">
            <h3>Processor</h3>
            <p><strong>{processorName}</strong></p>
            {processor.address && <p>{processor.address}</p>}
            {processor.country && <p>{processor.country}</p>}
            {processor.contactEmail && <p>Email: <a href={`mailto:${processor.contactEmail}`}>{processor.contactEmail}</a></p>}
          </div>
        </div>
      </section>

      <p className="note">
        <em>
          This template is for general information only and is not legal advice. Tailor clauses to your
          product, data flows, and regulatory needs, and consult counsel where appropriate.
        </em>
      </p>

      <style>{`
        .dpa {
          max-width: 820px;
          margin: 0 auto;
          padding: 24px;
          line-height: 1.6;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.05);
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
        h3 { margin-top: 20px; font-size: 1.1rem; }
        .toc { padding: 16px; border-radius: 10px; margin: 20px 0; }
        .toc h2 { margin-top: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .toc ol { margin: 0; padding-left: 1.1rem; }
        .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .table th, .table td { border: 1px solid #e6eef0; padding: 10px; text-align: left; vertical-align: top; }
        .table th { background: #f8fbfc; }
        .measures { margin-top: 8px; padding-left: 1.2rem; }
        .measures li { margin-bottom: 8px; }
        .muted { color: #46636a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .card { padding: 16px; border: 1px solid #e6eef0; border-radius: 8px; background: #f8fbfc; }
        .card h3 { margin-top: 0; font-size: 1rem; }
        .card p { margin: 4px 0; }
        .note { margin-top: 32px; padding: 16px; background: #f6fbfc; border-left: 4px solid #d4eef0; }
        @media print { .dpa { box-shadow: none; border-radius: 0; } }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </article>
  );
}
