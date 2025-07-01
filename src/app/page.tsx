'use client'

import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import LogoHeader from '@/components/LogoHeader'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      {/* Hero Section */}
      <section className="relative text-white py-20 px-6">
        {/* Background Image + Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background1.jpg"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white opacity-80" />
        </div>


        {/* Hero Content */}
        <div className="relative z-20 max-w-6xl mx-auto grid md:grid-cols-1 gap-10 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-4 text-orange-600">
              Welcome to NARANJA
            </h1>
            <p className="text-lg mb-6 text-teal-900">
              Training & compliance for food manufacturing — beautifully simple and audit-ready.
            </p>
          </div>
        </div>
      </section>

      {/* Dark Teal Divider Section */}
      <section className="bg-teal-900 h-2 w-full" />

      {/* Features Section */}
      <section className="py-16 px-6 bg-teal-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              title: '📋 SOPs & Policies',
              text: 'Create, assign, and manage essential operational documents for every role.',
              href: '/instructional-media',
            },
            {
              title: '📋 SmartDoc',
              text: 'SmartDoc is your central hub for controlled documents — upload, version, and assign SOPs, policies, and procedures directly to the training modules they support.',
              href: '/policies-and-procedures',
            },
            {
              title: '⚠️ Risk Assessments',
              text: 'Assign, track and complete risk documents to ensure safety and compliance.',
              href: '/managing-risks',
            },
          ].map(({ title, text, href }) => (
            <div
              key={title}
              className="bg-white p-6 rounded-xl shadow border border-teal-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-orange-600 mb-2">{title}</h3>
                <p className="mb-4">{text}</p>
              </div>
              <Link
                href={href}
                className="inline-block text-sm font-medium bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition self-start"
              >
                Learn More →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-teal-900">Ready to transform your compliance process?</h2>
          <p className="text-lg mb-6">
            Bring your team together with clear, role-specific training that actually gets used.
          </p>
          <Link
            href="/contact-us"
            className="bg-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-orange-700 transition border-2 border-teal-900"
          >
            📮 Get in Touch
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
