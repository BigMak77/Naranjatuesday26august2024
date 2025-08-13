'use client'

import Link from 'next/link'
import { FiClipboard, FiVideo, FiActivity, FiRefreshCw, FiFolder, FiMail } from 'react-icons/fi';

export default function InstructionalMediaPage() {
  return (
    <div className="instructional-media-bg">
      <div className="after-hero">
        <div className="page-content">
          <section className="instructional-media-section">
            <div className="instructional-media-back-link-wrapper">
              <Link href="/" className="instructional-media-back-link">
                ← Back to Home
              </Link>
            </div>
            <h2 className="instructional-media-title">How We Help</h2>
            <p className="instructional-media-description">
              At Naranja, we work directly with teams to create effective, easy-to-use work instructions and SOPs. These tools ensure consistency, reduce training time, and increase audit readiness.
            </p>
            <ul className="instructional-media-list">
              <li><FiClipboard className="instructional-media-list-icon" aria-label="SOPs & Work Instructions" /> <strong>SOPs & Work Instructions</strong>: Step-by-step visual guides, tailored to specific roles.</li>
              <li><FiVideo className="instructional-media-list-icon" aria-label="Video Integration" /> <strong>Video Integration</strong>: Embed photos or videos to make processes clearer and more engaging.</li>
              <li><FiActivity className="instructional-media-list-icon" aria-label="Built-in Knowledge Checks" /> <strong>Built-in Knowledge Checks</strong>: Track understanding with optional quizzes.</li>
              <li><FiRefreshCw className="instructional-media-list-icon" aria-label="Version Control" /> <strong>Version Control</strong>: Automatically archive and manage updates to documents.</li>
              <li><FiFolder className="instructional-media-list-icon" aria-label="Easy Assignment" /> <strong>Easy Assignment</strong>: Assign by department, job role, or location.</li>
            </ul>
            <div className="instructional-media-cta-wrapper">
              <button className="instructional-media-cta">
                <FiMail className="instructional-media-cta-icon" aria-label="Contact" /> Contact Us to Get Started
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
