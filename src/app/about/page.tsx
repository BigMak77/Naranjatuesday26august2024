'use client'

import React from 'react'
import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

const teamMembers = [
  {
    name: 'Andy',
    role: 'Co-Founder & Content Creator',
    description:
      'Andy has over 25 years of experience in learning and development within food safety and compliance, working with global manufacturers to build robust training systems.',
    image: '/andyorange.jpg',
  },
  {
    name: 'Roksana',
    role: 'Co-Founder & Delivery Expert',
    description:
      'Roksana specialises in the delivery of our products in an operational environment.',
    image: '/roxyorange.jpg',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-teal-50 text-teal-900 flex flex-col">
      <LogoHeader />

      {/* Header nav link */}
      <div className="bg-white shadow py-3 px-6 text-sm">
        <Link href="/" className="text-teal-700 hover:underline">
          ← Return to Home
        </Link>
      </div>

      {/* About Section */}
      <section className="bg-teal-800 text-white py-12 px-4 flex-grow">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-left">About Us</h1>

          <div className="grid gap-10">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row items-stretch bg-white rounded-lg shadow-lg overflow-hidden text-teal-900"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full md:w-1/3 h-60 object-cover"
                />
                <div className="p-6 md:w-2/3">
                  <h2 className="text-2xl font-semibold mb-1">{member.name}</h2>
                  <p className="text-teal-700 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-700 text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
