'use client'

import React from 'react'
import Link from 'next/link'
import NeonFeatureCard from '@/components/NeonFeatureCard'

export default function AboutPage() {
  return (
    <div className="after-hero">
      <div className="global-content">
        {/* About Content */}
        <main className="about-main">
          <div className="about-content-wrapper">
            {/* Back to Home Link */}
            <div className="about-back-link">
              <Link href="/" className="about-back-link-text">
                ← Back to Home
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
                text={"Andy — Co-Founder & Content Creator\nPaul — Co-Founder & Delivery Expert"}
                href="#team"
              />
            </div>
            <div className="about-contact">
              <p className="about-contact-text">
                Want to know more?{' '}
                <Link href="/contact-us" className="about-contact-link">
                  Get in touch
                </Link>{' '}
                with us!
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
