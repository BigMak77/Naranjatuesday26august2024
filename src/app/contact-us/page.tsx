'use client'

import React, { useState } from 'react'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

export default function ContactUsPage() {
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const name = formData.get('name')
    const email = formData.get('email')
    const message = formData.get('message')

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('✅ Message sent successfully!')
        form.reset()
      } else {
        setStatus('❌ Failed to send. Please try again.')
      }

      console.log('Server response:', data)
    } catch (err) {
      console.error('Error sending message:', err)
      setStatus('❌ Something went wrong.')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      <section className="flex-grow max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Company Info */}
        <div className="bg-teal-800 p-6 rounded-lg shadow-md text-white">
          <h2 className="text-xl font-semibold mb-2">Company Contact Information</h2>
          <div className="text-sm space-y-1">
            <p>📞 <strong>Enquiries:</strong> 01234 567 890</p>
            <p>🛠️ <strong>Helpdesk:</strong> 09876 543 210</p>
            <p>✉️ <strong>Email:</strong> support@naranja.co.uk</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-teal-100 bg-opacity-90 p-6 rounded-xl shadow-md">
          <h1 className="text-2xl font-semibold text-teal-800 mb-4 text-center">Contact Us</h1>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-teal-800">Name</label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full p-2 border border-teal-400 bg-white text-black rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-medium text-teal-800">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 block w-full p-2 border border-teal-400 bg-white text-black rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-medium text-teal-800">Message</label>
              <textarea
                name="message"
                rows={3}
                required
                className="mt-1 block w-full p-2 border border-teal-400 bg-white text-black rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              ></textarea>
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="inline-block bg-teal-700 text-white px-6 py-2 rounded-md hover:bg-teal-800 transition"
              >
                Send Message
              </button>
              {status && <p className="text-teal-700 mt-3">{status}</p>}
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}
