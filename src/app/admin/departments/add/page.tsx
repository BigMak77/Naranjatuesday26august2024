'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
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
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <div className="flex-grow px-6 py-12 max-w-xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-teal-800">Add Department</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border p-2 rounded shadow"
          />

          <div>
            <label className="block mb-1 text-sm text-gray-700">
              Parent Department (optional)
            </label>
            <select
              className="w-full border p-2 rounded shadow bg-white"
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

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Department'}
          </button>
        </form>
      </div>
      <Footer />
    </main>
  )
}
