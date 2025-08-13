'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

interface Department {
  id: string
  name: string
  parent_id: string | null
}

export default function AddDepartmentPage() {
  const [name, setName] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, parent_id')

      if (error) {
        console.error('Error fetching departments:', error.message)
      } else {
        setDepartments(data.sort((a, b) => a.name.localeCompare(b.name)))
      }
      setLoading(false)
    }

    fetchDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error } = await supabase.from('departments').insert([
      {
        name,
        parent_id: selectedParent || null,
      },
    ])

    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/org-chart')
    }
    setSubmitting(false)
  }

  return (
    <>
      <main className="after-hero">
        <div className="page-content">
          <h1 className="add-department-title">Add Department</h1>
          <form onSubmit={handleSubmit} className="add-department-form">
            <input
              type="text"
              placeholder="Department Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="add-department-input"
            />
            <div>
              <label className="add-department-label">
                Parent Department (optional)
              </label>
              <select
                className="add-department-select"
                value={selectedParent || ''}
                onChange={(e) => setSelectedParent(e.target.value || null)}
              >
                <option value="">None (Top-level)</option>
                {loading ? (
                  <option disabled>Loading...</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {error && <p className="add-department-error">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="add-department-submit-btn"
            >
              {submitting ? 'Saving...' : 'Save Department'}
            </button>
          </form>
        </div>
        <Footer />
      </main>
    </>
  )
}
