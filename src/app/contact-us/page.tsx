'use client'

import Link from 'next/link'
import NeonForm from '@/components/NeonForm'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Neon Form Section (fixed height) */}
      <div className="flex items-center justify-center py-16">
        <NeonForm
          title="Send us a message"
          submitLabel="Send Message"
          onSubmit={(e) => {
            e.preventDefault()
            // handle form submit here
          }}
        >
          <div>
            <label className="block text-sm mb-1 text-[#b2f1ec]">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full bg-[#013b3b] border border-[#40E0D0] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#b2f1ec]">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full bg-[#013b3b] border border-[#40E0D0] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#b2f1ec]">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full bg-[#013b3b] border border-[#40E0D0] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
              required
            />
          </div>
        </NeonForm>
      </div>
      <div className="flex justify-center pb-10">
        <Link href="/" className="text-[#40E0D0] underline text-lg font-semibold hover:text-orange-400 transition">← Back to Home</Link>
      </div>
    </div>
  )
}
