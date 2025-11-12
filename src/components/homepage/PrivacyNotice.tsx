"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Contact = {
  email: string;
  address?: string;
  phone?: string;
  dpoEmail?: string; // Data Protection Officer or privacy contact (optional)
};

type LawfulBase = 
  | "consent" 
  | "contract" 
  | "legal_obligation" 
  | "legitimate_interests" 
  | "vital_interests";

type PrivacyNoticeProps = {
  companyName?: string;
  lastUpdated?: string; // e.g., "6 September 2025"
  contact: Contact;
  // Optional toggles/links:
  cookiePolicyUrl?: string;
  showChildrenSection?: boolean;
  showInternationalTransfers?: boolean;
  // Useful if you use sub-processors or vendors:
  processorsSummary?: string; // brief text (e.g., "cloud hosting, email, analytics")
  // Lawful bases you actually rely on:
  lawfulBases?: Array<LawfulBase>;
};

const defaultBases: Array<LawfulBase> = [
  "consent",
  "contract",
  "legal_obligation",
  "legitimate_interests",
];

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({
  companyName = "Naranja",
  lastUpdated = "6 September 2025",
  contact,
  cookiePolicyUrl,
  showChildrenSection = false,
  showInternationalTransfers = true,
  processorsSummary = "infrastructure hosting, analytics, communications, and payments (where applicable)",
  lawfulBases = defaultBases,
}) => {
  const router = useRouter();

  const baseLabel: Record<LawfulBase, string> = {
    consent: "Your consent",
    contract: "Performance of a contract",
    legal_obligation: "Compliance with legal obligations",
    legitimate_interests: "Our legitimate interests",
    vital_interests: "Protection of vital interests",
  };

  return (
    <article aria-labelledby="privacy-title" className="privacy">
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
      
      <h1 id="privacy-title">Privacy Notice</h1>
      <p className="meta">Last updated: {lastUpdated}</p>

      <p className="lead">
        This Privacy Notice explains how <strong>{companyName}</strong> ("we", "us", "our")
        collects, uses, and protects your personal information when you use our websites,
        applications, and services.
      </p>

      <nav aria-label="Contents" className="toc">
        <h2>Contents</h2>
        <ol>
          <li>
            <a href="#who-we-are">Who we are</a>
          </li>
          <li>
            <a href="#data-we-collect">Information we collect</a>
          </li>
          <li>
            <a href="#how-we-use">How we use your information</a>
          </li>
          <li>
            <a href="#legal-bases">Legal bases</a>
          </li>
          <li>
            <a href="#sharing">How we share information</a>
          </li>
          {showInternationalTransfers && (
            <li>
              <a href="#transfers">International transfers</a>
            </li>
          )}
          <li>
            <a href="#retention">Data retention</a>
          </li>
          <li>
            <a href="#rights">Your rights</a>
          </li>
          <li>
            <a href="#cookies">Cookies & tracking</a>
          </li>
          <li>
            <a href="#security">Data security</a>
          </li>
          {showChildrenSection && (
            <li>
              <a href="#children">Children's privacy</a>
            </li>
          )}
          <li>
            <a href="#contact">Contact us</a>
          </li>
        </ol>
      </nav>

      <section id="who-we-are">
        <h2>1) Who we are</h2>
        <p>
          {companyName} is committed to safeguarding your privacy and handling personal data in
          accordance with applicable data protection laws, including the UK GDPR and EU GDPR.
        </p>
      </section>

      <section id="data-we-collect">
        <h2>2) Information we collect</h2>
        <ul>
          <li>
            <strong>Identity & Contact Data</strong> — name, email address, phone number, account
            identifiers.
          </li>
          <li>
            <strong>Usage Data</strong> — how you interact with our websites, apps, and services.
          </li>
          <li>
            <strong>Technical Data</strong> — IP address, device and browser type, operating system,
            and diagnostics; may be collected via cookies and similar technologies.
          </li>
          <li>
            <strong>Transaction Data</strong> — payment details and purchase history (where applicable).
          </li>
          <li>
            <strong>Support & Communications</strong> — messages you send to us (e.g., support requests, feedback).
          </li>
        </ul>
        <p>
          We collect data you provide directly, data generated through your use of our services,
          and data from trusted partners acting on our behalf.
        </p>
      </section>

      <section id="how-we-use">
        <h2>3) How we use your information</h2>
        <ul>
          <li>To provide, operate, and improve our services and features.</li>
          <li>To create and manage accounts, authenticate users, and provide support.</li>
          <li>To process payments and fulfil orders (if applicable).</li>
          <li>To ensure security, prevent fraud, and enforce terms.</li>
          <li>
            To send service updates and, with your consent where required, marketing communications.
          </li>
          <li>To comply with legal and regulatory obligations.</li>
        </ul>
      </section>

      <section id="legal-bases">
        <h2>4) Legal bases</h2>
        <p>We rely on one or more of the following legal bases to process personal data:</p>
        <ul>
          {lawfulBases.map((base) => (
            <li key={base}>
              <strong>{baseLabel[base]}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section id="sharing">
        <h2>5) How we share information</h2>
        <p>We do not sell your personal data. We may share information with:</p>
        <ul>
          <li>
            <strong>Service providers (processors)</strong> who support our operations, such as {processorsSummary}.
            These providers are bound by contract to protect your data and act only on our instructions.
          </li>
          <li>
            <strong>Authorities or legal advisors</strong> where required to comply with law or
            to protect rights, safety, and security.
          </li>
          <li>
            <strong>Business transferees</strong> in connection with mergers, acquisitions, or restructuring.
          </li>
        </ul>
      </section>

      {showInternationalTransfers && (
        <section id="transfers">
          <h2>6) International transfers</h2>
          <p>
            Where we transfer personal data outside the UK/EU, we implement appropriate safeguards,
            such as adequacy decisions, Standard Contractual Clauses, and additional technical and
            organisational measures as needed.
          </p>
        </section>
      )}

      <section id="retention">
        <h2>{showInternationalTransfers ? "7" : "6"}) Data retention</h2>
        <p>
          We retain personal data only as long as necessary for the purposes described in this notice,
          or as required by law. Retention periods vary depending on the nature of the data and our
          legal obligations.
        </p>
      </section>

      <section id="rights">
        <h2>{showInternationalTransfers ? "8" : "7"}) Your rights</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction or deletion of your data.</li>
          <li>Restrict or object to our processing.</li>
          <li>Request data portability.</li>
          <li>Withdraw consent at any time (where processing is based on consent).</li>
        </ul>
        <p>
          To exercise your rights, please contact us (see <a href="#contact">Contact us</a>). If you are in
          the UK/EU, you may also lodge a complaint with your supervisory authority.
        </p>
      </section>

      <section id="cookies">
        <h2>{showInternationalTransfers ? "9" : "8"}) Cookies & tracking</h2>
        <p>
          We use cookies and similar technologies to operate the service, remember preferences, analyse
          traffic, and improve performance.{" "}
          {cookiePolicyUrl ? (
            <>
              For more details, see our{" "}
              <a href={cookiePolicyUrl} rel="noopener noreferrer">
                Cookie Policy
              </a>.
            </>
          ) : (
            "You can control cookies through your browser settings and, where applicable, in-product controls."
          )}
        </p>
      </section>

      <section id="security">
        <h2>{showInternationalTransfers ? "10" : "9"}) Data security</h2>
        <p>
          We apply appropriate technical and organisational measures to protect personal data from
          unauthorised access, alteration, disclosure, or loss. No method of transmission or storage is
          completely secure; if we become aware of a data breach affecting you, we will notify you and
          regulators where required.
        </p>
      </section>

      {showChildrenSection && (
        <section id="children">
          <h2>{showInternationalTransfers ? "11" : "10"}) Children's privacy</h2>
          <p>
            Our services are not directed to children under the age required by law in your jurisdiction.
            We do not knowingly collect personal data from children. If you believe a child has provided
            us with personal data, please contact us and we will take appropriate action.
          </p>
        </section>
      )}

      <section id="contact">
        <h2>
          {showInternationalTransfers
            ? showChildrenSection
              ? "12"
              : "11"
            : showChildrenSection
            ? "11"
            : "10"
          }) Contact us
        </h2>
        <address>
          <p>
            <strong>{companyName}</strong>
          </p>
          {contact.address && <p>{contact.address}</p>}
          {contact.phone && (
            <p>
              Phone: <a href={`tel:${contact.phone}`}>{contact.phone}</a>
            </p>
          )}
          <p>
            Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
          {contact.dpoEmail && (
            <p>
              Privacy/DPO: <a href={`mailto:${contact.dpoEmail}`}>{contact.dpoEmail}</a>
            </p>
          )}
        </address>
      </section>

      <style>{`
        .privacy {
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
        
        .meta { 
          margin-top: -4px; 
          font-size: 0.95rem; 
        }
        
        .lead { 
          margin-top: 16px; 
        }
        
        h1 { 
          margin: 0; 
          font-size: 2rem; 
        }
        
        h2 { 
          margin-top: 28px; 
          font-size: 1.25rem; 
        }
        
        ul { 
          padding-left: 1.2rem; 
        }
        
        .toc { 
          padding: 16px; 
          border-radius: 10px; 
          margin: 20px 0; 
        }
        
        .toc h2 { 
          margin-top: 0; 
          font-size: 1rem; 
          text-transform: uppercase; 
          letter-spacing: 0.04em; 
        }
        
        .toc ol { 
          margin: 0; 
          padding-left: 1.1rem; 
        }
        
        a { 
          text-decoration: underline; 
          text-underline-offset: 2px; 
        }
        
        address { 
          font-style: normal; 
        }
        
        @media print {
          .privacy { 
            box-shadow: none; 
            border: none; 
            border-radius: 0; 
          }
          
          a { 
            color: black; 
            text-decoration: none; 
          }
        }
      `}</style>
    </article>
  );
};

export default PrivacyNotice;
