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
        <div className="global-content">
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
              className="neon-btn neon-btn-save"
              data-variant="save"
            >
              {submitting ? (
                <>
                  <span style={{marginRight: '0.5em'}}>Saving...</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                </>
              ) : (
                <>
                  <span style={{marginRight: '0.5em'}}>Save Department</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                </>
              )}
            </button>
          </form>
        </div>
        <Footer />
      </main>
    </>
  )
}
