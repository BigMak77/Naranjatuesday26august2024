'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  department: string
  job_level: string
  role_title: string
  nationality: string
  manager_id: string | null
}

const departments = ['Production', 'Quality', 'Maintenance', 'Sales', 'HR']
const jobLevels = ['Admin', 'Manager', 'User']

export default function EditUserPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState<User>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    job_level: '',
    role_title: '',
    nationality: '',
    manager_id: null,
  })

  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredManagers, setFilteredManagers] = useState<User[]>([])

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (userError || !userData) {
        setError('User not found')
        setLoading(false)
        return
      }

      if (usersError) {
        console.error('Error fetching users:', usersError)
        setAllUsers([])
      } else {
        setAllUsers(usersData || [])
      }

      setForm({
        id: userData.id ?? '',
        first_name: userData.first_name ?? '',
        last_name: userData.last_name ?? '',
        email: userData.email ?? '',
        department: userData.department ?? '',
        job_level: userData.job_level ?? '',
        role_title: userData.role_title ?? '',
        nationality: userData.nationality ?? '',
        manager_id: userData.manager_id ?? null,
      })

      setLoading(false)
    }

    fetchData()
  }, [id])

  useEffect(() => {
    const matches = allUsers.filter(
      (u) =>
        u.department === form.department &&
        u.job_level.toLowerCase() === 'manager' &&
        u.id !== form.id
    )
    setFilteredManagers(matches)
  }, [form.department, allUsers, form.id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'manager_id' ? (value === '' ? null : value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) {
      setError('Invalid user ID')
      return
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        department: form.department,
        job_level: form.job_level,
        role_title: form.role_title,
        nationality: form.nationality,
        manager_id: form.manager_id,
      })
      .eq('id', id)

    if (updateError) {
      setError('Failed to update user.')
      setSuccess(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/users')
      }, 1200)
    }
  }

  if (loading) return <p className="p-6">Loading user data...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />
      <div className="p-6 max-w-xl mx-auto mt-6 flex-grow">
        <h1 className="text-2xl font-bold text-orange-600 mb-4">✏️ Edit User</h1>

        {success && (
          <p className="text-green-600 font-medium mb-2">
            ✅ User updated successfully!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="email"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            name="job_level"
            value={form.job_level}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Job Level</option>
            {jobLevels.map((jl) => (
              <option key={jl} value={jl}>
                {jl}
              </option>
            ))}
          </select>

          <input
            name="role_title"
            placeholder="Role Title"
            value={form.role_title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            name="nationality"
            placeholder="Nationality"
            value={form.nationality}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <select
            name="manager_id"
            value={form.manager_id ?? ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">No Manager Assigned</option>
            {filteredManagers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.first_name} {mgr.last_name} ({mgr.email})
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-teal-700 text-white py-2 px-4 rounded hover:bg-teal-800"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="text-gray-600 underline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </main>
  )
}
