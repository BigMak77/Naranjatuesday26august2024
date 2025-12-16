'use client';

import React from 'react';
import Image from 'next/image';
import { useUser } from '@/lib/useUser';

export default function LandingPage() {
  const { user, loading } = useUser();

  const userName = user?.first_name || 'User';

  return (
    <div className="landing-page-wrapper">
      {/* Logo Section */}
      <div className="landing-logo-section">
        <div className="landing-logo-wrapper">
          <div className="landing-logo-container">
            <div className="cube">
              <div className="cube-face front">
                <Image src="/landing page image.png" alt="Landing Page" width={180} height={180} priority unoptimized />
              </div>
              <div className="cube-face back">
                <Image src="/landing page image.png" alt="Landing Page" width={180} height={180} priority unoptimized />
              </div>
              <div className="cube-face right">
                <Image src="/landing page image.png" alt="Landing Page" width={180} height={180} priority unoptimized />
              </div>
              <div className="cube-face left">
                <Image src="/landing page image.png" alt="Landing Page" width={180} height={180} priority unoptimized />
              </div>
              <div className="cube-face top">
                <Image src="/landing page image.png" alt="Landing Page" width={180} height={180} priority unoptimized />
              </div>
              <div className="cube-face bottom">
                <Image src="/landing page image.png" alt="Landing Page" width={180} height={180} priority unoptimized />
              </div>
            </div>
          </div>
          <div className="landing-logo-glow" />
        </div>
      </div>

      {/* Content Section */}
      <div className="landing-content">
        {loading ? (
          <div className="landing-loading">Loading...</div>
        ) : (
          <>
            <h1 className="landing-title">Welcome {userName}</h1>
            <p className="landing-subtitle">
              This is your NARANJA dashboard. Please use the toolbar to access the different sections of the system.
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        .landing-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 4rem 2rem 2rem 2rem;
        }

        .landing-logo-section {
          position: relative;
          margin-bottom: 3rem;
          z-index: 2;
          display: flex;
          justify-content: center;
        }

        .landing-logo-wrapper {
          position: relative;
          display: inline-block;
          perspective: 1200px;
        }

        .landing-logo-container {
          position: relative;
          z-index: 2;
          width: 180px;
          height: 180px;
          filter: drop-shadow(0 10px 30px rgba(64, 224, 208, 0.4));
        }

        .cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: rotate4D 12s linear infinite;
        }

        .landing-logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(64, 224, 208, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: glow 4s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }

        .cube-face {
          position: absolute;
          width: 180px;
          height: 180px;
          opacity: 0.9;
          border: 0.5px solid #ff6600;
          overflow: hidden;
        }

        .cube-face img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .front {
          transform: rotateY(0deg) translateZ(90px);
        }

        .back {
          transform: rotateY(180deg) translateZ(90px);
        }

        .right {
          transform: rotateY(90deg) translateZ(90px);
        }

        .left {
          transform: rotateY(-90deg) translateZ(90px);
        }

        .top {
          transform: rotateX(90deg) translateZ(90px);
        }

        .bottom {
          transform: rotateX(-90deg) translateZ(90px);
        }

        @keyframes rotate4D {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg);
          }
        }

        .landing-content {
          max-width: 1200px;
          width: 100%;
          z-index: 2;
          text-align: center;
        }

        .landing-title {
          font-family: var(--font-family);
          font-size: 2.5rem;
          font-weight: var(--font-weight-header);
          color: var(--text-white);
          margin: 0 0 1rem 0;
          text-shadow: 0 2px 20px rgba(64, 224, 208, 0.3);
          animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .landing-subtitle {
          font-family: var(--font-family);
          font-size: var(--font-size-subheader);
          font-weight: var(--font-weight-normal);
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          animation: slideDown 0.6s ease-out 0.2s both;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .landing-loading {
          font-family: var(--font-family);
          font-size: var(--font-size-subheader);
          font-weight: var(--font-weight-normal);
          color: rgba(255, 255, 255, 0.6);
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .landing-title {
            font-size: 2rem;
          }

          .landing-subtitle {
            font-size: var(--font-size-base);
          }

          .landing-logo-container {
            width: 120px;
            height: 120px;
          }

          .cube-face {
            width: 120px;
            height: 120px;
          }

          .front {
            transform: rotateY(0deg) translateZ(60px);
          }

          .back {
            transform: rotateY(180deg) translateZ(60px);
          }

          .right {
            transform: rotateY(90deg) translateZ(60px);
          }

          .left {
            transform: rotateY(-90deg) translateZ(60px);
          }

          .top {
            transform: rotateX(90deg) translateZ(60px);
          }

          .bottom {
            transform: rotateX(-90deg) translateZ(60px);
          }
        }
      `}</style>
    </div>
  );
}
