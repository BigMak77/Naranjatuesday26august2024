"use client"

import HeroHeader from '@/components/HeroHeader'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiHeart } from 'react-icons/fi'

export default function FirstAidPage() {
  const [form, setForm] = useState({
    patient: '',
    date: '',
    treatment: '',
    administeredBy: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)
    // Save to supabase (replace 'first_aid_treatments' with your table name)
    const { error } = await supabase.from('first_aid_treatments').insert([
      {
        patient: form.patient,
        date: form.date,
        treatment: form.treatment,
        administered_by: form.administeredBy,
        notes: form.notes
      }
    ])
    setSubmitting(false)
    if (error) setError('Failed to record treatment.')
    else {
      setSuccess(true)
      setForm({ patient: '', date: '', treatment: '', administeredBy: '', notes: '' })
    }
  }

  return (
    <main className="min-h-screen bg-[#011f24] text-white">
      <HeroHeader
        title="First Aid Record"
        titleIcon={<FiHeart />}
        subtitle="Record first aid treatment administered on site."
      />
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-[#0c1f24] p-8 rounded-xl shadow border border-[#40E0D0] space-y-6">
          <div>
            <label className="block mb-1 font-semibold text-[#40E0D0]">Patient Name</label>
            <input
              name="patient"
              value={form.patient}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#011f24] border border-[#40E0D0] text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-[#40E0D0]">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#011f24] border border-[#40E0D0] text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-[#40E0D0]">Treatment Given</label>
            <input
              name="treatment"
              value={form.treatment}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#011f24] border border-[#40E0D0] text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-[#40E0D0]">Administered By</label>
            <input
              name="administeredBy"
              value={form.administeredBy}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#011f24] border border-[#40E0D0] text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-[#40E0D0]">Notes (optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#011f24] border border-[#40E0D0] text-white"
              rows={3}
            />
          </div>
          {error && <p className="text-orange-400 font-semibold">{error}</p>}
          {success && <p className="text-[#2ecc71] font-semibold">Treatment recorded successfully!</p>}
          <button
            type="submit"
            className="w-full py-2 rounded bg-[#40E0D0] text-black font-bold text-lg hover:bg-orange-400 transition"
            disabled={submitting}
          >
            {submitting ? 'Recording...' : 'Record Treatment'}
          </button>
        </form>
      </div>
    </main>
  )
}
