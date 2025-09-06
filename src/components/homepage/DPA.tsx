import React from "react";

/** =============== Types =============== */
type Party = {
  legalName: string;
  address?: string;
  country?: string;
  contactEmail?: string;
  role: "Controller" | "Processor" | "Sub-processor";
};

type ProcessingItem = {
  categoryOfDataSubjects: string;       // e.g., "Customers, end users, staff"
  categoriesOfPersonalData: string;     // e.g., "Name, email, IP, device ID"
  specialCategories?: string;           // if any, or "None"
  purpose: string;                      // e.g., "Provide, secure, and improve the services"
  nature: string;                       // e.g., "Hosting, storage, analytics, support"
  retention: string;                    // e.g., "For the subscription term + 90 days"
};

type SecurityMeasure = {
  title: string;
  detail: string;
};

type SubProcessor = {
  name: string;
  service: string;
  location: string;                     // hosting/processing location
  safeguards?: string;                  // e.g., "SCCs Module 3; UK Addendum"
  website?: string;
};

type DPAProps = {
  lastUpdated?: string;                 // e.g., "6 September 2025"
  controller: Party;                    // typically your customer
  processor?: Party;                    // typically Naranja
  processorNameFallback?: string;       // used in text if processor.legalName missing
  governingLaw?: string;                // e.g., "England and Wales"
  supervisoryAuthority?: string;        // e.g., "ICO (UK)"
  includeSCCsNote?: boolean;            // mention EU SCCs Module 2/3
  includeUKAddendumNote?: boolean;      // mention UK IDTA/Addendum
  includeAuditClause?: boolean;         // toggles onsite audit language
  includeLiabilityCap?: boolean;        // toggles an optional cap line
  liabilityCapText?: string;            // e.g., "aggregate fees paid in the 12 months..."
  processing: ProcessingItem[];
  securityMeasures: SecurityMeasure[];
  subProcessors?: SubProcessor[];
  dataDeletionDays?: number;            // e.g., 30
  breachNotifyHours?: number;           // e.g., 72 or 48
};

/** =============== Component =============== */
const DPA: React.FC<DPAProps> = ({
  lastUpdated = "6 September 2025",
  controller,
  processor,
  processorNameFallback = "Naranja Ltd",
  governingLaw = "England and Wales",
  supervisoryAuthority = "the Information Commissioner's Office (ICO) in the UK",
  includeSCCsNote = true,
  includeUKAddendumNote = true,
  includeAuditClause = true,
  includeLiabilityCap = true,
  liabilityCapText = "the aggregate fees paid or payable to the Processor by the Controller in the twelve (12) months preceding the event giving rise to liability",
  processing,
  securityMeasures,
  subProcessors = [],
  dataDeletionDays = 30,
  breachNotifyHours = 72,
}) => {
  const processorName = processor?.legalName || processorNameFallback;

  return (
    <article className="dpa" aria-labelledby="dpa-title">
      <h1 id="dpa-title">Data Processing Agreement (DPA)</h1>
      <p className="meta">Last updated: {lastUpdated}</p>

      <p className="lead">
        This Data Processing Agreement (“<strong>DPA</strong>”) forms part of and is subject to the
        agreement between <strong>{controller.legalName}</strong> (the “<strong>Controller</strong>”)
        and <strong>{processorName}</strong> (the “<strong>Processor</strong>”) (together, the “<strong>Parties</strong>”).
        It reflects the Parties’ obligations under applicable data protection laws, including the UK GDPR and, where applicable, the EU GDPR.
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
          Upon termination or expiry of the services (or upon Controller’s written instruction), the Processor
          will delete or return all personal data (at the Controller’s choice) and delete existing copies within {dataDeletionDays} days,
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
              audit the Processor’s compliance (including via independent third-party assessors). Audits shall
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
            Subject to the foregoing, each Party’s aggregate liability under this DPA is limited to {liabilityCapText}.
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
            {processor?.address && <p>{processor.address}</p>}
            {processor?.country && <p>{processor.country}</p>}
            {processor?.contactEmail && <p>Email: <a href={`mailto:${processor.contactEmail}`}>{processor.contactEmail}</a></p>}
          </div>
        </div>
      </section>

      <p className="note">
        <em>
          This template is for general information only and is not legal advice. Tailor clauses to your
          product, data flows, and regulatory needs, and consult counsel where appropriate.
        </em>
      </p>
    </article>
  );
};

export default DPA;
