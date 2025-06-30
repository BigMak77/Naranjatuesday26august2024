'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'

interface Department {
  id: string
  name: string
}

interface Role {
  id: string
  title: string
  department_id: string
}

export default function EditUserPage() {
  const router = useRouter()
  const rawId = useParams().id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [nationality, setNationality] = useState('')

  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name')
      if (!error && data) setDepartments(data)
    }
    fetchDepartments()
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setError('Missing user ID.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, email, department_id, role_id, nationality')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('User not found.')
        setLoading(false)
        return
      }

      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setEmail(data.email || '')
      setDepartmentId(data.department_id || '')
      setRoleId(data.role_id || '')
      setNationality(data.nationality || '')
      setLoading(false)

      if (data.department_id) fetchRoles(data.department_id)
    }

    fetchUser()
  }, [id])

  const fetchRoles = async (deptId: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('id, title, department_id')
      .eq('department_id', deptId)

    if (!error && data) setFilteredRoles(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        department_id: departmentId || null,
        role_id: roleId || null,
        nationality,
      })
      .eq('id', id)

    setSubmitting(false)

    if (error) {
      setError('Failed to update user.')
    } else {
      router.push('/admin/users')
    }
  }

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value)
    setRoleId('')
    if (value) fetchRoles(value)
  }

  if (loading) return <p className="p-6">Loading user data...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <>
      <LogoHeader />

      <div className="p-6 max-w-xl mx-auto mt-4">
        <h1 className="text-2xl font-bold mb-4 text-orange-600">✏️ Edit User</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="First Name"
            className="w-full text-teal-900 border p-2 rounded"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="w-full border p-2 rounded"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <select
            className="w-full border p-2 rounded"
            value={departmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            required
          >
            <option value="">Select Department</option>
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>

          <select
            className="w-full border p-2 rounded"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
          >
            <option value="">Select Role</option>
            {filteredRoles.length === 0 && <option disabled>No roles available</option>}
            {filteredRoles.map((role) => (
              <option key={role.id} value={role.id}>{role.title}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nationality"
            className="w-full border p-2 rounded"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />

          <button
            type="submit"
            className="bg-teal-700 text-white font-medium py-2 px-4 rounded hover:bg-teal-800"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  )
}
