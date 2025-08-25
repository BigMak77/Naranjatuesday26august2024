import Link from "next/link";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { FiX } from "react-icons/fi";
// Removed CSS module import; using global styles only

export default function GlobalFooter() {
  return (
    <footer className="globalFooter">
      <div className="inner">
        <div className="links">
          <div className="linkGroup">
            <Link href="/homepage/contact-us" className="link">
              Contact Us
            </Link>
            <Link href="/homepage/about" className="link">
              About Us
            </Link>
          </div>
          <div className="addressBlock">
            <span className="address">
              123 Orange Street, London, UK &bull; +44 20 1234 5678
            </span>
            <span className="copyright">
              © {new Date().getFullYear()} Naranja Ltd.
            </span>
          </div>
        </div>
        <div className="socials">
          <a
            href="https://www.linkedin.com/company/naranja"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="social"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://x.com/naranjateam"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="social"
          >
            <FiX />
          </a>
          <a
            href="mailto:support@naranja.co.uk"
            aria-label="Email"
            className="social"
          >
            <FaEnvelope />
          </a>
        </div>
      </div>
    </footer>
  );
}
