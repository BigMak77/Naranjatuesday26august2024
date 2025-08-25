"use client";

import Link from "next/link";
import {
  FiClipboard,
  FiVideo,
  FiActivity,
  FiRefreshCw,
  FiFolder,
  FiMail,
} from "react-icons/fi";

export default function InstructionalMediaPage() {
  return (
    <div
      className="instructional-media-bg"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #013b3b 0%, #40E0D0 100%)",
      }}
    >
      <div className="after-hero">
        <div className="global-content">
          <section
            className="instructional-media-section"
            style={{
              background: "var(--panel)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-neon)",
              padding: "2.5rem 2rem",
              margin: "2rem auto",
              maxWidth: 700,
            }}
          >
            <div
              className="instructional-media-back-link-wrapper"
              style={{ marginBottom: "1.5rem" }}
            >
              <Link
                href="/"
                className="instructional-media-back-link"
                style={{
                  color: "var(--neon)",
                  textDecoration: "underline",
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                ← Back to Home
              </Link>
            </div>
            <h2
              className="instructional-media-title"
              style={{
                color: "var(--accent)",
                fontSize: "2rem",
                fontWeight: 800,
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              How We Help
            </h2>
            <p
              className="instructional-media-description"
              style={{
                color: "var(--neon)",
                marginBottom: "2rem",
                textAlign: "center",
                fontSize: "1.1rem",
              }}
            >
              At Naranja, we work directly with teams to create effective,
              easy-to-use work instructions and SOPs. These tools ensure
              consistency, reduce training time, and increase audit readiness.
            </p>
            <ul
              className="instructional-media-list"
              style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0" }}
            >
              <li
                style={{
                  marginBottom: "1rem",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              >
                <FiClipboard
                  className="instructional-media-list-icon"
                  style={{ color: "var(--neon)", marginRight: "0.5rem" }}
                  aria-label="SOPs & Work Instructions"
                />{" "}
                <strong>SOPs & Work Instructions</strong>: Step-by-step visual
                guides, tailored to specific roles.
              </li>
              <li
                style={{
                  marginBottom: "1rem",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              >
                <FiVideo
                  className="instructional-media-list-icon"
                  style={{ color: "var(--neon)", marginRight: "0.5rem" }}
                  aria-label="Video Integration"
                />{" "}
                <strong>Video Integration</strong>: Embed photos or videos to
                make processes clearer and more engaging.
              </li>
              <li
                style={{
                  marginBottom: "1rem",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              >
                <FiActivity
                  className="instructional-media-list-icon"
                  style={{ color: "var(--neon)", marginRight: "0.5rem" }}
                  aria-label="Built-in Knowledge Checks"
                />{" "}
                <strong>Built-in Knowledge Checks</strong>: Track understanding
                with optional quizzes.
              </li>
              <li
                style={{
                  marginBottom: "1rem",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              >
                <FiRefreshCw
                  className="instructional-media-list-icon"
                  style={{ color: "var(--neon)", marginRight: "0.5rem" }}
                  aria-label="Version Control"
                />{" "}
                <strong>Version Control</strong>: Automatically archive and
                manage updates to documents.
              </li>
              <li
                style={{
                  marginBottom: "1rem",
                  color: "#fff",
                  fontSize: "1rem",
                }}
              >
                <FiFolder
                  className="instructional-media-list-icon"
                  style={{ color: "var(--neon)", marginRight: "0.5rem" }}
                  aria-label="Easy Assignment"
                />{" "}
                <strong>Easy Assignment</strong>: Assign by department, job
                role, or location.
              </li>
            </ul>
            <div
              className="instructional-media-cta-wrapper"
              style={{ textAlign: "center", marginTop: "2rem" }}
            >
              <button
                className="instructional-media-cta"
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent) 0%, #ffb84d 100%)",
                  color: "#2d2d2d",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "var(--r-md)",
                  padding: "1rem 2rem",
                  fontSize: "1.08rem",
                  boxShadow: "0 2px 12px 0 #FA7A2099",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition:
                    "background .18s,color .18s, box-shadow .18s, transform .08s",
                }}
              >
                <FiMail
                  className="instructional-media-cta-icon"
                  style={{ color: "var(--neon)" }}
                  aria-label="Contact"
                />{" "}
                Contact Us to Get Started
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
