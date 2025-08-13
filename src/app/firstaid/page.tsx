"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

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
    <main className="first-aid-main">
      <div className="first-aid-container">
        <form onSubmit={handleSubmit} className="first-aid-form">
          <div>
            <label className="first-aid-label">Patient Name</label>
            <input
              name="patient"
              value={form.patient}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Treatment Given</label>
            <input
              name="treatment"
              value={form.treatment}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Administered By</label>
            <input
              name="administeredBy"
              value={form.administeredBy}
              onChange={handleChange}
              className="first-aid-input"
              required
            />
          </div>
          <div>
            <label className="first-aid-label">Notes (optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="first-aid-input"
              rows={3}
            />
          </div>
          {error && <p className="first-aid-error-msg">{error}</p>}
          {success && <p className="first-aid-success-msg">Treatment recorded successfully!</p>}
          <button
            type="submit"
            className="first-aid-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Recording...' : 'Record Treatment'}
          </button>
        </form>
      </div>
    </main>
  )
}
