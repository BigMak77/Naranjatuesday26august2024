import Link from "next/link";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { FiX } from "react-icons/fi";
// Removed CSS module import; using global styles only

export default function GlobalFooter() {
  return (
    <footer className="globalFooter" style={{
      position: "fixed",
      left: 0,
      bottom: 0,
      width: "100%",
      zIndex: 100,
      background: "var(--panel, #0d3c47)",
      color: "var(--text, #fff)",
      boxShadow: "0 -2px 16px rgba(0,0,0,0.10)",
      padding: "1rem 0",
    }}>
      <div className="inner" style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
      }}>
        <div className="links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <div className="linkGroup" style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/homepage/contact-us" className="link" style={{ color: "var(--neon)", textDecoration: "none", fontWeight: 600 }}>
              Contact Us
            </Link>
            <Link href="/homepage/about" className="link" style={{ color: "var(--neon)", textDecoration: "none", fontWeight: 600 }}>
              About Us
            </Link>
          </div>
          <div className="addressBlock" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="address" style={{ fontSize: "0.98rem", color: "var(--text)" }}>
              123 Orange Street, London, UK &bull; +44 20 1234 5678
            </span>
            <span className="copyright" style={{ fontSize: "0.92rem", color: "var(--muted, #b3b3b3)" }}>
              © {new Date().getFullYear()} Naranja Ltd.
            </span>
          </div>
        </div>
        <div className="socials" style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <a
            href="https://www.linkedin.com/company/naranja"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="social"
            style={{ color: "#0a66c2", fontSize: "1.5rem" }}
          >
            <FaLinkedin />
          </a>
          <a
            href="https://x.com/naranjateam"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="social"
            style={{ color: "#222", fontSize: "1.5rem" }}
          >
            <FiX />
          </a>
          <a
            href="mailto:support@naranja.co.uk"
            aria-label="Email"
            className="social"
            style={{ color: "#fa7a20", fontSize: "1.5rem" }}
          >
            <FaEnvelope />
          </a>
        </div>
      </div>
    </footer>
  );
}
