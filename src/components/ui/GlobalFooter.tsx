"use client";

import Link from "next/link";
import {
  Linkedin,
  Twitter,
  Youtube,
  Facebook,
  Instagram,
  Mail,
} from "react-feather";

const NAV = [
  {
    title: "Product",
    items: [
      { label: "SOPs & Policies", href: "/homepage/about/sops-policies" },
      { label: "Risk Assessments", href: "/homepage/about/managing-risks" },
      {
        label: "Instructional Media",
        href: "/homepage/about/instructional-media",
      },
      { label: "Turkus (Source of Truth)", href: "/homepage/about/turkus" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "About", href: "/homepage/about" },
      { label: "Contact", href: "/homepage/contact-us" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Security", href: "/homepage/security" },
      { label: "Accessibility", href: "/homepage/accessibility" },
      { label: "Careers", href: "/homepage/careers" },
      { label: "Press", href: "/homepage/press" },
    ],
  },
];

const LEGAL = [
  { label: "Privacy", href: "/homepage/privacynotice" },
  { label: "Terms", href: "/homepage/terms" },
  { label: "DPA", href: "/homepage/dpa" },
  { label: "Cookies", href: "/homepage/cookies" },
];

export default function GlobalFooter() {
  return (
    <footer
      className="globalFooter"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="footer__inner">
        <section className="footer__brand" aria-label="Company information">
          <div className="footer__logo">
            <div className="footer__brandName">Naranja</div>
            <div className="footer__tagline">
              Professional Workplace Solutions
            </div>
          </div>

          <address className="footer__address">
            <div className="footer__addressLine">
              123 Orange Street
              <br />
              London, United Kingdom
            </div>
            <div className="footer__contact">
              <a href="tel:+442012345678" className="footer__contactLink">
                +44 20 1234 5678
              </a>
              <a
                href="mailto:support@naranja.co.uk"
                className="footer__contactLink"
              >
                support@naranja.co.uk
              </a>
            </div>
          </address>

          <p className="footer__registration">
            Naranja Ltd · Registered in England &amp; Wales 12345678 · VAT
            GB123456789
          </p>

          <div
            className="footer__social"
            aria-label="Follow us on social media"
          >
            <span className="footer__socialLabel">Follow us:</span>
            <div className="footer__socialIcons">
              <a
                href="https://www.linkedin.com/company/naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="footer__icon footer__icon--linkedin"
                title="Follow us on LinkedIn"
              >
                <Linkedin aria-hidden size={20} />
              </a>
              <a
                href="https://x.com/naranjateam"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="footer__icon footer__icon--x"
                title="Follow us on X"
              >
                <Twitter aria-hidden size={20} />
              </a>
              <a
                href="https://www.youtube.com/@naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="footer__icon footer__icon--youtube"
                title="Subscribe to our YouTube channel"
              >
                <Youtube aria-hidden size={20} />
              </a>
              <a
                href="https://www.facebook.com/naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="footer__icon footer__icon--facebook"
                title="Like us on Facebook"
              >
                <Facebook aria-hidden size={20} />
              </a>
              <a
                href="https://www.instagram.com/naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer__icon footer__icon--instagram"
                title="Follow us on Instagram"
              >
                <Instagram aria-hidden size={20} />
              </a>
              <a
                href="mailto:support@naranja.co.uk"
                aria-label="Email"
                className="footer__icon footer__icon--email"
                title="Send us an email"
              >
                <Mail aria-hidden size={20} />
              </a>
            </div>
          </div>
        </section>

        <nav className="footer__nav" aria-label="Footer sitemap">
          {NAV.map((group) => (
            <div key={group.title} className="footer__group">
              <h3 className="footer__groupTitle">{group.title}</h3>
              <ul className="footer__list">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="footer__link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="footer__divider" />

      <div className="footer__legal">
        <ul className="footer__legalLinks" aria-label="Legal links">
          {LEGAL.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="footer__link">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="footer__copy">
          © {new Date().getFullYear()} Naranja Ltd. All rights reserved.
        </div>
      </div>

      <style jsx global>{`
        .globalFooter {
          background: var(--training-bg);
          color: var(--text-white);
          border-top: 3px solid var(--neon);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .globalFooter::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--training-accent-medium),
            transparent
          );
        }

        .footer__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: clamp(16px, 2vw, 24px) clamp(20px, 2.5vw, 28px);
          display: grid;
          gap: clamp(16px, 2vw, 24px);
          grid-template-columns: 1fr;
        }

        @media (min-width: 980px) {
          .footer__inner {
            grid-template-columns: minmax(300px, 360px) 1fr;
            align-items: start;
            gap: clamp(20px, 2.5vw, 28px);
          }
        }

        .footer__logo {
          margin-bottom: 0.75rem;
        }

        .footer__brandName {
          font-weight: var(--font-weight-header);
          letter-spacing: 0.025em;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          color: var(--text-white);
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }

        .footer__tagline {
          font-size: 0.9rem;
          color: var(--text-white);
          font-weight: var(--font-weight-normal);
          letter-spacing: 0.01em;
        }

        .footer__address {
          font-style: normal;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .footer__addressLine {
          color: var(--text-white);
          margin-bottom: 0.375rem;
          font-size: 0.9rem;
        }

        .footer__contact {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .footer__contactLink {
          color: var(--text-white) !important;
          text-decoration: none !important;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          font-size: 0.9rem;
        }

        .footer__contactLink:hover {
          color: var(--neon) !important;
          transform: translateX(2px);
        }

        .footer__registration {
          margin: 0.75rem 0 0;
          font-size: 0.8rem;
          color: var(--text-white);
          line-height: 1.4;
        }

        .footer__social {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .footer__socialLabel {
          font-size: 0.85rem;
          font-weight: var(--font-weight-header);
          color: var(--text-white);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer__socialIcons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .footer__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: var(--training-accent-medium);
          backdrop-filter: blur(10px);
          border: 1px solid var(--training-accent-medium);
        }

        .footer__icon:hover {
          transform: translateY(-2px);
          background: var(--training-accent-light);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .footer__icon:focus-visible {
          outline: 2px solid var(--neon);
          outline-offset: 2px;
        }

        .footer__nav {
          display: grid;
          gap: clamp(0.75rem, 2vw, 1.25rem) clamp(0.75rem, 1.5vw, 1rem);
          grid-template-columns: repeat(3, 1fr);
          align-items: start;
        }

        @media (max-width: 740px) {
          .footer__nav {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .footer__nav {
            grid-template-columns: 1fr;
          }
        }

        .footer__group {
          display: grid;
          gap: 0.5rem;
          align-content: start;
        }

        .footer__groupTitle {
          margin: 0;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-white);
          font-weight: var(--font-weight-header);
          padding-bottom: 0.25rem;
          border-bottom: 2px solid var(--training-accent);
        }

        .footer__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.375rem;
        }

        .footer__link {
          color: var(--text-white) !important;
          text-decoration: none !important;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          position: relative;
          display: inline-block;
        }

        .footer__link::after {
          content: "";
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: var(--neon);
          transition: width 0.2s ease;
        }

        .footer__link:hover {
          color: var(--neon) !important;
          transform: translateX(4px);
        }

        .footer__link:hover::after {
          width: 100%;
        }

        .footer__link:focus-visible {
          outline: 2px solid var(--neon);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .footer__divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--training-accent-medium),
            transparent
          );
          margin: clamp(12px, 1.5vw, 18px) 0;
        }

        .footer__legal {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(20px, 2.5vw, 28px) clamp(12px, 1.5vw, 16px);
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.25rem;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-white);
        }

        .footer__legalLinks {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .footer__copy {
          font-weight: 500;
        }

        /* Social media icons - all white */
        .footer__icon svg {
          color: var(--text-white);
          fill: var(--text-white);
        }

        .footer__icon:hover svg {
          color: var(--neon);
          fill: var(--neon);
        }

        @media (max-width: 640px) {
          .footer__legal {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .footer__legalLinks {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
