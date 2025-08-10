'use client'

import Image from 'next/image'

export default function InstructionalMediaPage() {
  return (
    <div className="bg-[#011f24] min-h-screen pb-12">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4">
          <a
            href="/"
            className="text-sm text-[#40E0D0] hover:text-orange-400 font-medium transition"
          >
            ← Back to Home
          </a>
        </div>
        <h2 className="text-2xl font-semibold text-orange-600 mb-4">How We Help</h2>
        <p className="mb-6 text-orange-400">
          At Naranja, we work directly with teams to create effective, easy-to-use work instructions and SOPs. These tools ensure consistency, reduce training time, and increase audit readiness.
        </p>
        <ul className="list-disc list-inside space-y-3 text-orange-400">
          <li><strong>📋 SOPs & Work Instructions</strong>: Step-by-step visual guides, tailored to specific roles.</li>
          <li><strong>🎬 Video Integration</strong>: Embed photos or videos to make processes clearer and more engaging.</li>
          <li><strong>🧠 Built-in Knowledge Checks</strong>: Track understanding with optional quizzes.</li>
          <li><strong>🔄 Version Control</strong>: Automatically archive and manage updates to documents.</li>
          <li><strong>📂 Easy Assignment</strong>: Assign by department, job role, or location.</li>
        </ul>
        <div className="mt-10 text-center">
          <a
            href="/contact-us"
            className="inline-block bg-orange-600 text-white px-6 py-3 rounded-md font-semibold shadow hover:bg-orange-700 transition"
          >
            📬 Contact Us to Get Started
          </a>
        </div>
      </section>
    </div>
  )
}
