"use client";

import React from "react";
import Link from "next/link";
import NeonFeatureCard from "@/components/NeonFeatureCard";

export default function AboutPage() {
  return (
    <div className="after-hero">
      <div className="global-content">
        {/* About Content */}
        <main className="about-main">
          <div className="about-content-wrapper">
            {/* Back to Home Link */}
            <div className="about-back-link">
              <Link href="/" className="neon-btn neon-btn-orange" aria-label="Back to homepage" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: "1.08rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Home
              </Link>
            </div>
            {/* Content Card */}
            <div className="about-feature-cards">
              <NeonFeatureCard
                icon={<span className="about-feature-icon">🍊</span>}
                title="Our Mission"
                text="We are dedicated to making training and compliance for food manufacturing beautifully simple and audit-ready. Our platform empowers teams to learn, grow, and stay compliant with ease."
                href="#mission"
              />
              <NeonFeatureCard
                icon={<span className="about-feature-icon">👥</span>}
                title="Our Team"
                text={
                  "Andy — Co-Founder & Content Creator\nPaul — Co-Founder & Delivery Expert"
                }
                href="#team"
              />
            </div>
            <div className="about-contact">
              <p className="about-contact-text">
                Want to know more?{" "}
                <Link href="/homepage/contact-us" className="about-contact-link">
                  Get in touch
                </Link>{" "}
                with us!
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
