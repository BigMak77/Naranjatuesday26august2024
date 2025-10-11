"use client";

import Link from "next/link";
import { FaLinkedin, FaEnvelope, FaXTwitter } from "react-icons/fa6";
import { SiLinkedin, SiX, SiYoutube, SiFacebook, SiInstagram } from "react-icons/si";

const NAV = [
  { title: "Product", items: [
    { label: "SOPs & Policies", href: "/homepage/about/sops-policies" },
    { label: "Risk Assessments", href: "/homepage/about/managing-risks" },
    { label: "Instructional Media", href: "/homepage/about/instructional-media" },
    { label: "Turkus (Source of Truth)", href: "/homepage/about/turkus" },
  ]},
  { title: "Resources", items: [
    { label: "About", href: "/homepage/about" },
    { label: "Contact", href: "/homepage/contact-us" },
    
    
  ]},
  { title: "Company", items: [
    { label: "Security", href: "#" },
    { label: "Accessibility", href: "#" },
    { label: "Careers", href: "/homepage/careers" },
    { label: "Press", href: "#" },
  ]},
];

const LEGAL = [
  { label: "Privacy", href: "/homepage/privacynotice" },
  { label: "Terms", href: "/homepage/terms" },
  { label: "DPA", href: "/homepage/dpa" },
  { label: "Cookies", href: "/homepage/cookies" },
];

export default function GlobalFooter() {
  return (
    <footer className="globalFooter" role="contentinfo" aria-label="Site footer">
      <div className="footer__inner">
        <section className="footer__brand" aria-label="Company info">
          <div className="footer__brandName">Naranja</div>
          <address className="footer__address">
            123 Orange Street, London, UK
            <br />
            <a href="tel:+442012345678">+44 20 1234 5678</a>
            <br />
            <a href="mailto:support@naranja.co.uk">support@naranja.co.uk</a>
          </address>
          <p className="footer__reg">
            Naranja Ltd · Registered in England &amp; Wales 12345678 · VAT GB123456789
          </p>

          <div className="footer__social" aria-label="Social media">
            <a
              href="https://www.linkedin.com/company/naranja"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="footer__icon footer__icon--linkedin"
              title="LinkedIn"
            >
              <SiLinkedin aria-hidden />
            </a>
            <a
              href="https://x.com/naranjateam"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="footer__icon footer__icon--x"
              title="X (Twitter)"
            >
              <SiX aria-hidden />
            </a>
            <a
              href="https://www.youtube.com/@naranja"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="footer__icon footer__icon--youtube"
              title="YouTube"
            >
              <SiYoutube aria-hidden />
            </a>
            <a
              href="https://www.facebook.com/naranja"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="footer__icon footer__icon--facebook"
              title="Facebook"
            >
              <SiFacebook aria-hidden />
            </a>
            <a
              href="https://www.instagram.com/naranja"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer__icon footer__icon--instagram"
              title="Instagram"
            >
              <SiInstagram aria-hidden />
            </a>
            <a
              href="mailto:support@naranja.co.uk"
              aria-label="Email"
              className="footer__icon footer__icon--email"
              title="Email"
            >
              <FaEnvelope aria-hidden />
            </a>
          </div>
        </section>

        <nav className="footer__nav" aria-label="Footer sitemap">
          {NAV.map((group) => (
            <div key={group.title} className="footer__group">
              <h3 className="footer__groupTitle">{group.title}</h3>
              <ul className="footer__list">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="footer__link">{item.label}</Link>
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
            <li key={l.label}><Link href={l.href} className="footer__link">{l.label}</Link></li>
          ))}
        </ul>
        <div className="footer__copy">© {new Date().getFullYear()} Naranja Ltd. All rights reserved.</div>
      </div>

      <style jsx>{`
        .globalFooter {
          background: var(--panel, #0d3c47);
          color: var(--text, #fff);
          border-top: 4px solid #fa7a20;
          box-shadow: 0 -2px 8px rgba(0,0,0,.1);
        }
        .footer__inner {
          width: min(1200px, 100% - clamp(24px, 6vw, 64px));
          margin-inline: auto;
          padding: clamp(16px, 2.6vw, 28px) 0;
          display: grid;
          gap: clamp(18px, 3vw, 28px);
          grid-template-columns: 1fr;
        }
        @media (min-width: 980px) {
          .footer__inner { grid-template-columns: minmax(260px, 360px) 1fr; align-items: start; }
        }
        .footer__brandName { font-weight: 800; letter-spacing: .02em; font-size: 1.15rem; margin-bottom: .25rem; }
        .footer__address { font-style: normal; line-height: 1.55; }
        .footer__address a { color: inherit; text-decoration: underline; text-decoration-color: transparent; transition: text-decoration-color .2s; }
        .footer__address a:hover { text-decoration-color: currentColor; }
        .footer__reg { margin: .5rem 0 0; font-size: .92rem; color: #fff; }

        .footer__social { display: flex; gap: .75rem; margin-top: .75rem; }
        .footer__icon { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border-radius: 999px; transition: transform .12s ease-out; }
        .footer__icon:hover { transform: translateY(-1px); }
        .footer__icon:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 999px; }

        .footer__nav { display: grid; gap: 1rem 1.5rem; grid-template-columns: repeat(2, minmax(180px,1fr)); }
        @media (min-width: 740px) { .footer__nav { grid-template-columns: repeat(3, minmax(180px,1fr)); } }
        .footer__group { display: grid; gap: .5rem; }
        .footer__groupTitle { margin: 0; font-size: .86rem; text-transform: uppercase; letter-spacing: .12em; color: #fff; }
        .footer__list { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }
        .footer__link { color: var(--text,#fff); text-decoration: underline; text-decoration-color: transparent; opacity: .95; transition: opacity .2s, text-decoration-color .2s; }
        .footer__link:hover { opacity: 1; text-decoration-color: currentColor; }
        .footer__link:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 4px; }

        .footer__divider { height: 1px; background: rgba(255,255,255,.08); width: 100%; }
        .footer__legal {
          width: min(1200px, 100% - clamp(24px, 6vw, 64px));
          margin-inline: auto;
          padding: .8rem 0 clamp(16px, 2.6vw, 24px);
          display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; align-items: center; justify-content: space-between;
          font-size: .92rem; color: #fff;
        }
        .footer__legalLinks { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
        
        /* Brand colors for social media icons */
        .footer__icon--linkedin, .footer__icon--linkedin svg, .footer__icon--linkedin * {
          color: #0A66C2 !important;
          stroke: none !important;
          fill: #0A66C2 !important;
        }
        .footer__icon--linkedin:hover, .footer__icon--linkedin:hover svg, .footer__icon--linkedin:hover * {
          color: #004182 !important;
          fill: #004182 !important;
        }
        
        .footer__icon--x, .footer__icon--x svg, .footer__icon--x * {
          color: #000000 !important;
          stroke: none !important;
          fill: #000000 !important;
        }
        .footer__icon--x:hover, .footer__icon--x:hover svg, .footer__icon--x:hover * {
          color: #333333 !important;
          fill: #333333 !important;
        }
        
        .footer__icon--youtube, .footer__icon--youtube svg, .footer__icon--youtube * {
          color: #FF0000 !important;
          stroke: none !important;
          fill: #FF0000 !important;
        }
        .footer__icon--youtube:hover, .footer__icon--youtube:hover svg, .footer__icon--youtube:hover * {
          color: #CC0000 !important;
          fill: #CC0000 !important;
        }
        
        .footer__icon--facebook, .footer__icon--facebook svg, .footer__icon--facebook * {
          color: #1877F2 !important;
          stroke: none !important;
          fill: #1877F2 !important;
        }
        .footer__icon--facebook:hover, .footer__icon--facebook:hover svg, .footer__icon--facebook:hover * {
          color: #166FE5 !important;
          fill: #166FE5 !important;
        }
        
        .footer__icon--instagram, .footer__icon--instagram svg, .footer__icon--instagram * {
          color: #E4405F !important;
          stroke: none !important;
          fill: #E4405F !important;
        }
        .footer__icon--instagram:hover, .footer__icon--instagram:hover svg, .footer__icon--instagram:hover * {
          color: #C13584 !important;
          fill: #C13584 !important;
        }
        
        .footer__icon--email, .footer__icon--email svg, .footer__icon--email * {
          color: #EA4335 !important;
          stroke: none !important;
          fill: #EA4335 !important;
        }
        .footer__icon--email:hover, .footer__icon--email:hover svg, .footer__icon--email:hover * {
          color: #C5221F !important;
          fill: #C5221F !important;
        }
      `}</style>
    </footer>
  );
}
