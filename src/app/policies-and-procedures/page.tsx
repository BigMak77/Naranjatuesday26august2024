'use client'

import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

export default function PoliciesAndProceduresPage() {
  return (
    <>
      <LogoHeader />

      <main className="bg-white text-teal-900 min-h-screen flex flex-col">
        {/* Header */}
        <section className="bg-teal-900 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Policies & Procedures Management</h1>
            <p className="text-lg">
              Upload, manage, and connect your critical documents with training modules for full traceability and compliance.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 px-6 bg-teal-50 flex-grow">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-teal-200 p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">
              Smart Documentation, Built for Food Manufacturing
            </h2>
            <p className="mb-6">
              Naranja helps you turn static documents into active training assets. From SOPs and policies to technical instructions,
              every document is version-controlled, role-assigned, and directly integrated into your training system.
            </p>

            <ul className="list-disc list-inside space-y-3 text-teal-800">
              <li>
                <strong>📄 Central Document Hub</strong>: Upload and manage policies, SOPs, and instructions in one secure location.
              </li>
              <li>
                <strong>🔢 Version Control</strong>: Automatically track changes and retain historical versions for audits and reviews.
              </li>
              <li>
                <strong>🧩 Training Integration</strong>: Link documents directly to relevant training modules and track user engagement.
              </li>
              <li>
                <strong>📂 Role-Based Assignment</strong>: Ensure each user sees only what’s relevant to their job or department.
              </li>
              <li>
                <strong>🔍 Search & Filter</strong>: Quickly locate documents by type, version, department, or tag.
              </li>
              <li>
                <strong>🕒 Review Reminders</strong>: Set review intervals and expiration dates to keep documents current and compliant.
              </li>
            </ul>

            {/* CTA Button */}
            <div className="mt-10 text-center">
              <Link
                href="/contact-us"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-md font-semibold shadow hover:bg-orange-700 transition"
              >
                📬 Contact Us to Learn More
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
