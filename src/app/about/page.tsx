'use client'

import React from 'react'
import Link from 'next/link'
import NeonFeatureCard from '@/components/NeonFeatureCard'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#011f24] text-[#40E0D0]">
      {/* About Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 bg-[#011f24]">
        <div className="w-full max-w-2xl">
          {/* Back to Home Link */}
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-[#40E0D0] hover:text-orange-400 font-medium transition underline"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Content Card */}
          <div className="space-y-8">
            <NeonFeatureCard
              icon={<span className="text-orange-400 text-3xl">🍊</span>}
              title="Our Mission"
              text="We are dedicated to making training and compliance for food manufacturing beautifully simple and audit-ready. Our platform empowers teams to learn, grow, and stay compliant with ease."
              href="#mission"
              bgColor="#013b3b"
              borderColor="#40E0D0"
              textColor="#b2f1ec"
              linkColor="#40E0D0"
              glowColor="#40E0D0"
            />

            <NeonFeatureCard
              icon={<span className="text-orange-400 text-3xl">👥</span>}
              title="Our Team"
              text={"Andy — Co-Founder & Content Creator\nPaul — Co-Founder & Delivery Expert"}
              href="#team"
              bgColor="#013b3b"
              borderColor="#40E0D0"
              textColor="#b2f1ec"
              linkColor="#40E0D0"
              glowColor="#40E0D0"
            />
          </div>

          <div className="mt-6">
            <p className="text-md text-[#40E0D0]">
              Want to know more?{' '}
              <Link href="/contact-us" className="text-orange-400 underline hover:text-[#40E0D0]">
                Get in touch
              </Link>{' '}
              with us!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
