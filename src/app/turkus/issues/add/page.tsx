"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { FiAlertCircle } from 'react-icons/fi'
import NeonForm from '@/components/NeonForm'

export default function RaiseIssuePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [category] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name')
      if (error) {
        console.error('Error fetching departments:', error)
      } else {
        setDepartments(data || [])
      }
    }

    fetchDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Authentication error. Please log in again.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('issues').insert([
      {
        title,
        description,
        priority,
        category,
        department_id: departmentId,
        reported_by: user.id,
      },
    ])

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push('/turkus/issues')
    }
  }

  return (
    <form
      style={{
        display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '3rem auto', padding: '2.5rem 2rem', background: 'var(--panel)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-neon)', border: '2px solid var(--accent)'
      }}
      onSubmit={handleSubmit}
    >
      <h1 style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>New Issue</h1>
      <input
        className="neon-input"
        placeholder="Issue Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="neon-input"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        required
      />
      <select
        className="neon-input"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select
        className="neon-input"
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        required
      >
        <option value="">Select Department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="neon-error" style={{ color: '#ff4d4f', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <FiAlertCircle /> {error}
        </p>
      )}
      <button type="submit" className="neon-btn neon-btn-submit" style={{ marginTop: '1.5rem', width: '100%', padding: '.85rem 0', borderRadius: 'var(--r-md)', background: 'linear-gradient(90deg, var(--accent) 0%, #ffb84d 100%)', color: '#2d2d2d', fontWeight: 700, fontSize: '1.08rem', boxShadow: '0 2px 12px 0 #ffa50099', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .18s,color .18s, box-shadow .18s, transform .08s' }} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Issue'}
      </button>
    </form>
  )
}
