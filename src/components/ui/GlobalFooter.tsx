"use client";

import Link from "next/link";
import { FaLinkedin, FaEnvelope, FaXTwitter } from "react-icons/fa6";
import {
  SiLinkedin,
  SiX,
  SiYoutube,
  SiFacebook,
  SiInstagram,
} from "react-icons/si";

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
      { label: "Security", href: "#" },
      { label: "Accessibility", href: "#" },
      { label: "Careers", href: "/homepage/careers" },
      { label: "Press", href: "#" },
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
                <SiLinkedin aria-hidden />
              </a>
              <a
                href="https://x.com/naranjateam"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="footer__icon footer__icon--x"
                title="Follow us on X"
              >
                <SiX aria-hidden />
              </a>
              <a
                href="https://www.youtube.com/@naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="footer__icon footer__icon--youtube"
                title="Subscribe to our YouTube channel"
              >
                <SiYoutube aria-hidden />
              </a>
              <a
                href="https://www.facebook.com/naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="footer__icon footer__icon--facebook"
                title="Like us on Facebook"
              >
                <SiFacebook aria-hidden />
              </a>
              <a
                href="https://www.instagram.com/naranja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer__icon footer__icon--instagram"
                title="Follow us on Instagram"
              >
                <SiInstagram aria-hidden />
              </a>
              <a
                href="mailto:support@naranja.co.uk"
                aria-label="Email"
                className="footer__icon footer__icon--email"
                title="Send us an email"
              >
                <FaEnvelope aria-hidden />
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

      <style jsx>{`
        .globalFooter {
          background: linear-gradient(135deg, #0d3c47 0%, #1a5866 100%);
          color: #ffffff;
          border-top: 3px solid #fa7a20;
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
            rgba(255, 255, 255, 0.1),
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
          font-weight: 700;
          letter-spacing: 0.025em;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          color: #ffffff;
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }

        .footer__tagline {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 400;
          letter-spacing: 0.01em;
        }

        .footer__address {
          font-style: normal;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .footer__addressLine {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.375rem;
          font-size: 0.9rem;
        }

        .footer__contact {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .footer__contactLink {
          color: #ffffff;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          font-size: 0.9rem;
        }

        .footer__contactLink:hover {
          color: #fa7a20;
          transform: translateX(2px);
        }

        .footer__registration {
          margin: 0.75rem 0 0;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
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
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
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
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer__icon:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .footer__icon:focus-visible {
          outline: 2px solid #fa7a20;
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
          color: #ffffff;
          font-weight: 600;
          padding-bottom: 0.25rem;
          border-bottom: 2px solid rgba(250, 122, 32, 0.3);
        }

        .footer__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.375rem;
        }

        .footer__link {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
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
          background-color: #fa7a20;
          transition: width 0.2s ease;
        }

        .footer__link:hover {
          color: #ffffff;
          transform: translateX(4px);
        }

        .footer__link:hover::after {
          width: 100%;
        }

        .footer__link:focus-visible {
          outline: 2px solid #fa7a20;
          outline-offset: 2px;
          border-radius: 4px;
        }

        .footer__divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
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
          color: rgba(255, 255, 255, 0.8);
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

        /* Enhanced brand colors for social media icons */
        .footer__icon--linkedin,
        .footer__icon--linkedin svg,
        .footer__icon--linkedin * {
          color: #0a66c2 !important;
          stroke: none !important;
          fill: #0a66c2 !important;
        }
        .footer__icon--linkedin:hover {
          background: rgba(10, 102, 194, 0.1) !important;
        }
        .footer__icon--linkedin:hover,
        .footer__icon--linkedin:hover svg,
        .footer__icon--linkedin:hover * {
          color: #004182 !important;
          fill: #004182 !important;
        }

        .footer__icon--x,
        .footer__icon--x svg,
        .footer__icon--x * {
          color: #000000 !important;
          stroke: none !important;
          fill: #000000 !important;
        }
        .footer__icon--x:hover {
          background: rgba(0, 0, 0, 0.1) !important;
        }
        .footer__icon--x:hover,
        .footer__icon--x:hover svg,
        .footer__icon--x:hover * {
          color: #333333 !important;
          fill: #333333 !important;
        }

        .footer__icon--youtube,
        .footer__icon--youtube svg,
        .footer__icon--youtube * {
          color: #ff0000 !important;
          stroke: none !important;
          fill: #ff0000 !important;
        }
        .footer__icon--youtube:hover {
          background: rgba(255, 0, 0, 0.1) !important;
        }
        .footer__icon--youtube:hover,
        .footer__icon--youtube:hover svg,
        .footer__icon--youtube:hover * {
          color: #cc0000 !important;
          fill: #cc0000 !important;
        }

        .footer__icon--facebook,
        .footer__icon--facebook svg,
        .footer__icon--facebook * {
          color: #1877f2 !important;
          stroke: none !important;
          fill: #1877f2 !important;
        }
        .footer__icon--facebook:hover {
          background: rgba(24, 119, 242, 0.1) !important;
        }
        .footer__icon--facebook:hover,
        .footer__icon--facebook:hover svg,
        .footer__icon--facebook:hover * {
          color: #166fe5 !important;
          fill: #166fe5 !important;
        }

        .footer__icon--instagram,
        .footer__icon--instagram svg,
        .footer__icon--instagram * {
          color: #e4405f !important;
          stroke: none !important;
          fill: #e4405f !important;
        }
        .footer__icon--instagram:hover {
          background: rgba(228, 64, 95, 0.1) !important;
        }
        .footer__icon--instagram:hover,
        .footer__icon--instagram:hover svg,
        .footer__icon--instagram:hover * {
          color: #c13584 !important;
          fill: #c13584 !important;
        }

        .footer__icon--email,
        .footer__icon--email svg,
        .footer__icon--email * {
          color: #ea4335 !important;
          stroke: none !important;
          fill: #ea4335 !important;
        }
        .footer__icon--email:hover {
          background: rgba(234, 67, 53, 0.1) !important;
        }
        .footer__icon--email:hover,
        .footer__icon--email:hover svg,
        .footer__icon--email:hover * {
          color: #c5221f !important;
          fill: #c5221f !important;
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
