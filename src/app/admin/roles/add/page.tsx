'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import HeroHeader from '@/components/HeroHeader'

interface Department {
  id: string
  name: string
}

export default function AddRolePage() {
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name')
      if (data) setDepartments(data)
      if (error) console.error('Failed to load departments:', error.message)
    }

    loadDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.from('roles').insert([
      {
        title,
        department_id: departmentId,
      },
    ])

    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/org-chart')
    }

    setLoading(false)
  }

  return (
    <>
      <HeroHeader title="Add Role" subtitle="Create a new role and assign it to a department." />
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-teal-900 px-4">
        <form onSubmit={handleSubmit} className="bg-teal-50 p-6 rounded-lg shadow max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Add Role</h1>

          <label className="block mb-4">
            <span className="text-sm">Role Title</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full border border-teal-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm">Assign to Department</span>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="mt-1 block w-full border border-teal-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            >
              <option value="" disabled>Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </label>

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition"
          >
            {loading ? 'Saving...' : 'Add Role'}
          </button>
        </form>
      </div>
    </>
  )
}
