'use client'

import Link from 'next/link'
import NeonForm from '@/components/NeonForm'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Neon Form Section (fixed height) */}
      <div className="flex items-center justify-center py-16 flex-1">
        <NeonForm
          title="Send us a message"
          submitLabel="Send Message"
          onSubmit={(e) => {
            e.preventDefault()
            // handle form submit here
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="w-full"
                required
              />
            </div>
          </div>
        </NeonForm>
      </div>
      <div className="flex justify-center pb-10">
        <Link href="/" className="text-[#40E0D0] underline text-lg font-semibold hover:text-orange-400 transition">← Back to Home</Link>
      </div>
    </div>
  )
}
