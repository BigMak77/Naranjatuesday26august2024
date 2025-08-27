"use client";

import Link from "next/link";
import { FiClipboard, FiVideo, FiActivity, FiRefreshCw, FiFolder, FiMail } from "react-icons/fi";

export default function InstructionalMediaPage() {
  return (
    <main className="neon-bg">
      <section className="neon-panel neon-panel-centered">
        <div className="neon-back-link-wrapper">
          <Link href="/homepage" className="neon-back-link" aria-label="Back to homepage">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </Link>
        </div>
        <h2 className="neon-title">How We Help</h2>
        <p className="neon-description">
          At Naranja, we work directly with teams to create effective, easy-to-use work instructions and SOPs. These tools ensure consistency, reduce training time, and increase audit readiness.
        </p>
        <ul className="neon-list">
          <li><FiClipboard className="neon-list-icon" aria-label="SOPs & Work Instructions" /> <strong>SOPs & Work Instructions</strong>: Step-by-step visual guides, tailored to specific roles.</li>
          <li><FiVideo className="neon-list-icon" aria-label="Video Integration" /> <strong>Video Integration</strong>: Embed photos or videos to make processes clearer and more engaging.</li>
          <li><FiActivity className="neon-list-icon" aria-label="Built-in Knowledge Checks" /> <strong>Built-in Knowledge Checks</strong>: Track understanding with optional quizzes.</li>
          <li><FiRefreshCw className="neon-list-icon" aria-label="Version Control" /> <strong>Version Control</strong>: Automatically archive and manage updates to documents.</li>
          <li><FiFolder className="neon-list-icon" aria-label="Easy Assignment" /> <strong>Easy Assignment</strong>: Assign by department, job role, or location.</li>
        </ul>
        <div className="neon-cta-wrapper" style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/homepage/contact-us" aria-label="Contact Us" className="neon-btn neon-btn-primary neon-btn-square">
            <FiMail className="neon-icon" />
          </Link>
        </div>
      </section>
    </main>
  );
}
