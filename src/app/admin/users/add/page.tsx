'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface Department {
  id: string
  name: string
}

interface Role {
  id: string
  title: string
  department_id: string
}

export default function AddUserPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [nationality, setNationality] = useState('')

  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')

  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nationalities = ['British', 'Polish', 'French', 'German', 'Other']

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: deptData } = await supabase.from('departments').select('id, name')
      const { data: roleData } = await supabase.from('roles').select('id, title, department_id')
      if (deptData) setDepartments(deptData)
      if (roleData) setRoles(roleData)
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    setFilteredRoles(roles.filter((role) => role.department_id === departmentId))
  }, [departmentId, roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (!firstName || !lastName || !email || !departmentId || !roleId) {
      setError('Please fill in all required fields.')
      setSubmitting(false)
      return
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      nationality: nationality || null,
      department_id: departmentId,
      role_id: roleId,
      status: 'active',
    }

    const { error } = await supabase.from('users').insert([payload])
    setSubmitting(false)

    if (error) {
      console.error('Insert error:', error)
      setError('Failed to add user.')
    } else {
      router.push('/admin/users')
    }
  }

  return (
    <>
      <LogoHeader />
      <main className="min-h-screen bg-white text-teal-900 px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white border border-teal-200 shadow-md rounded-xl p-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">➕ Add New User</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-3 rounded-md"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-3 rounded-md"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 p-3 rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-md"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                required
              >
                <option value="">Select Nationality</option>
                {nationalities.map((nation) => (
                  <option key={nation} value={nation}>
                    {nation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-md"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value)
                  setRoleId('')
                }}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-md"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                {filteredRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-700 text-white font-semibold py-3 rounded-md hover:bg-teal-800 transition"
            >
              {submitting ? 'Saving...' : 'Create User'}
            </button>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
