"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiClipboard, FiVideo, FiCheckCircle, FiImage, FiLayers, FiBookOpen } from "react-icons/fi";

export default function InstructionalMediaPage() {
  const router = useRouter();

  return (
    <div className="neon-panel">
      {/* Hero Section */}
      <div className="main-header-container with-subtitle">
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

        <h1 className="main-header">Instructional Media & Training</h1>
        <p className="main-subheader">
          Create engaging, visual work instructions and training materials that ensure consistency, reduce errors, and accelerate learning.
        </p>
      </div>

      {/* Overview Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Visual Learning That Works</h2>
        <p className="main-subheader">
          Transform complex processes into clear, step-by-step visual instructions that employees actually understand and follow. Naranja makes it easy to create, manage, and deliver engaging training content with photos, videos, and interactive elements.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <FiClipboard />
          </div>
          <h3 className="feature-title">Visual Work Instructions</h3>
          <p className="feature-description">
            Create step-by-step visual guides tailored to specific roles and tasks. Break down complex processes into clear, easy-to-follow instructions.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiVideo />
          </div>
          <h3 className="feature-title">Video Integration</h3>
          <p className="feature-description">
            Embed photos and videos directly into instructions. Show, don't just tell—make processes clearer and more engaging for your team.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiCheckCircle />
          </div>
          <h3 className="feature-title">Knowledge Checks</h3>
          <p className="feature-description">
            Build in optional quizzes and knowledge checks to verify understanding. Track completion and ensure competency before employees begin work.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiImage />
          </div>
          <h3 className="feature-title">Rich Media Support</h3>
          <p className="feature-description">
            Support for images, videos, diagrams, and documents. Create multimedia training experiences that cater to different learning styles.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiLayers />
          </div>
          <h3 className="feature-title">Version Control</h3>
          <p className="feature-description">
            Automatically archive and manage updates to training materials. Ensure everyone always has access to the latest version of instructions.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <FiBookOpen />
          </div>
          <h3 className="feature-title">Role-Based Assignment</h3>
          <p className="feature-description">
            Assign training and work instructions by department, job role, or location. Ensure the right people get the right information at the right time.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="neon-panel">
        <h2 className="neon-heading">Why Visual Instructions Work Better</h2>
        <div className="content-grid">
          <div className="content-section">
            <h3 className="section-title">Faster Learning</h3>
            <ul className="feature-list">
              <li>Reduce training time by up to 60%</li>
              <li>Visual learning increases retention</li>
              <li>Self-paced learning at point of need</li>
              <li>Consistent training across all locations</li>
            </ul>
          </div>

          <div className="content-section">
            <h3 className="section-title">Fewer Errors</h3>
            <ul className="feature-list">
              <li>Clear visual guidance reduces mistakes</li>
              <li>Easy reference during tasks</li>
              <li>Standardized procedures across teams</li>
              <li>Quick onboarding for new employees</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content Types */}
      <div className="neon-panel">
        <h2 className="neon-heading">Perfect for All Training Needs</h2>
        <div className="use-case-grid">
          <div className="use-case-card">
            <h4>Equipment Operation</h4>
            <p>Step-by-step guides for operating machinery, equipment startup/shutdown procedures, and troubleshooting.</p>
          </div>
          <div className="use-case-card">
            <h4>Quality Procedures</h4>
            <p>Visual inspection guides, testing procedures, sampling protocols, and quality control checklists.</p>
          </div>
          <div className="use-case-card">
            <h4>Safety Training</h4>
            <p>PPE requirements, emergency procedures, hazard identification, and safe work practices.</p>
          </div>
          <div className="use-case-card">
            <h4>Process Instructions</h4>
            <p>Manufacturing procedures, cleaning protocols, changeover processes, and product handling.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">Ready to Transform Your Training?</h2>
        <p className="main-subheader">
          Create visual work instructions that your team will actually use and understand.
        </p>
        <div className="cta-container">
          <Link href="/homepage/contact-us" className="cta-button primary">
            Schedule a Demo
          </Link>
          <Link href="/homepage/about" className="cta-button secondary">
            Learn More
          </Link>
        </div>
      </div>

      <style jsx>{`
        .main-header-container {
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
          outline: 2px solid var(--neon);
          outline-offset: 2px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .feature-card {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: var(--neon);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .feature-title {
          color: var(--text-white);
          font-size: 1.2rem;
          font-weight: var(--font-weight-header);
          margin-bottom: 0.75rem;
        }

        .feature-description {
          color: var(--text-white);
          line-height: 1.6;
          opacity: 0.9;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin: 1.5rem 0;
        }

        .content-section {
          background: var(--training-accent-dark);
          border: 1px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .section-title {
          color: var(--text-white);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin-bottom: 1rem;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-list li {
          color: var(--text-white);
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--training-accent-medium);
          position: relative;
          padding-left: 1.5rem;
        }

        .feature-list li:last-child {
          border-bottom: none;
        }

        .feature-list li::before {
          content: "✓";
          color: var(--neon);
          position: absolute;
          left: 0;
          font-weight: bold;
        }

        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .use-case-card {
          background: var(--training-accent-dark);
          border: 2px solid var(--training-accent-medium);
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s ease;
        }

        .use-case-card:hover {
          border-color: var(--neon);
        }

        .use-case-card h4 {
          color: var(--neon);
          font-size: 1.1rem;
          font-weight: var(--font-weight-header);
          margin: 0 0 0.75rem 0;
        }

        .use-case-card p {
          color: var(--text-white);
          margin: 0;
          line-height: 1.6;
          opacity: 0.9;
        }

        .cta-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }

        .cta-button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: var(--font-weight-header);
          transition: all 0.2s ease;
          display: inline-block;
        }

        .cta-button.primary {
          background: var(--neon);
          color: var(--training-bg);
        }

        .cta-button.primary:hover {
          background: var(--text-white);
          transform: translateY(-2px);
        }

        .cta-button.secondary {
          background: transparent;
          color: var(--text-white);
          border: 1px solid var(--training-accent-medium);
        }

        .cta-button.secondary:hover {
          border-color: var(--neon);
          color: var(--neon);
        }
      `}</style>
    </div>
  );
}
