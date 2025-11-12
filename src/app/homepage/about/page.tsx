"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NeonFeatureCard from "@/components/NeonFeatureCard";

export default function AboutPage() {
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
        
        <h1 className="main-header">About Naranja</h1>
        <p className="main-subheader">
          Transforming food manufacturing through intelligent training and compliance solutions that keep your team audit-ready and your operations running smoothly.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="neon-panel">
        <h2 className="neon-heading">Our Mission</h2>
        <p className="main-subheader">
          We believe that effective training and compliance shouldn't be a burden. Our platform makes it beautifully simple for food manufacturing teams to stay trained, compliant, and audit-ready—so you can focus on what matters most: producing quality food safely.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="user-manager-grid">
        <NeonFeatureCard
          icon={<span>•</span>}
          title="Precision & Excellence"
          text="We deliver training solutions with the same precision you apply to your manufacturing processes. Every detail matters when it comes to food safety and compliance."
        />
        <NeonFeatureCard
          icon={<span>•</span>}
          title="Effortless Implementation"
          text="Complex compliance made simple. Our intuitive platform integrates seamlessly into your existing workflows without disrupting your operations."
        />
        <NeonFeatureCard
          icon={<span>•</span>}
          title="Audit-Ready Confidence"
          text="Sleep better knowing your training records, compliance documentation, and team certifications are always organized and inspection-ready."
        />
        <NeonFeatureCard
          icon={<span>•</span>}
          title="Continuous Improvement"
          text="Data-driven insights help you identify training gaps, track progress, and continuously improve your team's performance and compliance posture."
        />
      </div>

      {/* What Sets Us Apart */}
      <div className="neon-panel">
        <h2 className="neon-heading">What Sets Naranja Apart</h2>
        <div className="user-manager-grid">
          <NeonFeatureCard
            icon={<span>•</span>}
            title="Industry Expertise"
            text="Built specifically for food manufacturing, we understand your unique challenges—from HACCP protocols to allergen management and everything in between."
          />
          <NeonFeatureCard
            icon={<span>•</span>}
            title="Beautiful Simplicity"
            text="Training software doesn't have to be ugly or complicated. Our elegant interface makes compliance management actually enjoyable for your team."
          />
          <NeonFeatureCard
            icon={<span>•</span>}
            title="Real-Time Tracking"
            text="Monitor training progress, certification expiries, and compliance status in real-time with automated alerts and comprehensive reporting."
          />
          <NeonFeatureCard
            icon={<span>•</span>}
            title="Partnership Approach"
            text="We're not just a software provider—we're your compliance partners, committed to your long-term success in the food manufacturing industry."
          />
        </div>
      </div>

      {/* Leadership Team */}
      <div className="neon-panel">
        <h2 className="neon-heading">Our Leadership Team</h2>
        <div className="user-manager-grid">
          <NeonFeatureCard
            icon={<span>A</span>}
            title="Andy"
            text="Co-Founder & Content Creator • With deep expertise in food safety protocols and training methodologies, Andy ensures our content meets the highest industry standards while remaining accessible and engaging."
          />
          <NeonFeatureCard
            icon={<span>P</span>}
            title="Paul"
            text="Co-Founder & Delivery Expert • Paul brings years of operational excellence to Naranja, focusing on seamless platform delivery and ensuring our solutions integrate perfectly with your existing processes."
          />
        </div>
      </div>

      {/* Why Choose Naranja */}
      <div className="neon-panel">
        <h2 className="neon-heading">Why Food Manufacturers Choose Naranja</h2>
        <div className="user-manager-grid">
          <div>
            <h3 className="neon-heading">Proven Results</h3>
            <p className="main-subheader">Reduce audit preparation time by 75% and improve training completion rates across your organization.</p>
          </div>
          <div>
            <h3 className="neon-heading">Quick Implementation</h3>
            <p className="main-subheader">Get up and running in weeks, not months, with our streamlined onboarding process.</p>
          </div>
          <div>
            <h3 className="neon-heading">Dedicated Support</h3>
            <p className="main-subheader">Our team provides ongoing support to ensure your success every step of the way.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="neon-panel">
        <h2 className="neon-heading">Ready to Transform Your Training & Compliance?</h2>
        <p className="main-subheader">
          Join the growing number of food manufacturers who trust Naranja to keep their teams trained, compliant, and audit-ready.
        </p>
        <div>
          <Link href="/homepage/contact-us" className="neon-btn">
            Get Started Today
          </Link>
          <Link href="/homepage/contact-us" className="neon-muted">
            Schedule a Demo
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
      `}</style>
    </div>
  );
}
