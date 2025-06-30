'use client'

import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

export default function InstructionalMediaPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      {/* Hero Header */}
      <section className="bg-teal-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Instructional Media & SOPs</h1>
          <p className="text-lg">
            Clear, visual, and role-specific instructions to support safety, quality, and consistency in your operations.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 bg-teal-50 flex-grow">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-teal-200 p-8">
          <h2 className="text-2xl font-semibold text-orange-600 mb-4">How We Help</h2>
          <p className="mb-6">
            At Naranja, we work directly with teams to create effective, easy-to-use work instructions and SOPs. These tools ensure consistency, reduce training time, and increase audit readiness.
          </p>

          <ul className="list-disc list-inside space-y-3 text-teal-800">
            <li><strong>📋 SOPs & Work Instructions</strong>: Step-by-step visual guides, tailored to specific roles.</li>
            <li><strong>🎬 Video Integration</strong>: Embed photos or videos to make processes clearer and more engaging.</li>
            <li><strong>🧠 Built-in Knowledge Checks</strong>: Track understanding with optional quizzes.</li>
            <li><strong>🔄 Version Control</strong>: Automatically archive and manage updates to documents.</li>
            <li><strong>📂 Easy Assignment</strong>: Assign by department, job role, or location.</li>
          </ul>

          <div className="mt-10 text-center">
            <Link
              href="/contact-us"
              className="inline-block bg-orange-600 text-white px-6 py-3 rounded-md font-semibold shadow hover:bg-orange-700 transition"
            >
              📬 Contact Us to Get Started
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
