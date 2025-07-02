'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BehaviourSelector from '@/components/BehaviourSelector'

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
  const [success, setSuccess] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [nationality, setNationality] = useState('')
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])

  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])

  // Pagination state for roles dropdown
  const [rolesPage, setRolesPage] = useState(1)
  const rolesPerPage = 10

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

      if (data.department_id) fetchRoles(data.department_id)

      const { data: behaviourLinks } = await supabase
        .from('user_behaviours')
        .select('behaviour_id')
        .eq('user_id', id)

      if (behaviourLinks) {
        setSelectedBehaviours(behaviourLinks.map((b) => b.behaviour_id))
      }

      setLoading(false)
    }

    fetchUser()
  }, [id])

  const fetchRoles = async (deptId: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('id, title, department_id')
      .eq('department_id', deptId)
      .order('title')

    if (!error && data) setFilteredRoles(data)
    setRolesPage(1) // reset page on new roles load
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

    if (error) {
      setError('Failed to update user.')
      setSubmitting(false)
      return
    }

    await supabase.from('user_behaviours').delete().eq('user_id', id)

    const newBehaviourLinks = selectedBehaviours.map((b) => ({
      user_id: id,
      behaviour_id: b,
    }))

    if (newBehaviourLinks.length > 0) {
      await supabase.from('user_behaviours').insert(newBehaviourLinks)
    }

    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => router.push('/admin/users'), 1200)
  }

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value)
    setRoleId('')
    if (value) fetchRoles(value)
  }

  // Pagination logic for roles dropdown
  const startIdx = (rolesPage - 1) * rolesPerPage
  const endIdx = startIdx + rolesPerPage
  const pagedRoles = filteredRoles.slice(startIdx, endIdx)
  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage)

  if (loading) return <p className="p-6">Loading user data...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <>
    

      <div className="p-6 max-w-xl mx-auto mt-4 flex-grow">
        <h1 className="text-2xl font-bold mb-4 text-orange-600">✏️ Edit User</h1>

        {success && (
          <p className="text-green-600 font-medium mb-4">✅ User updated successfully!</p>
        )}

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
            className="w-full text-teal-900 border p-2 rounded"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white text-teal-900 border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <select
            className="w-full bg-white text-teal-900 border p-2 rounded"
            value={departmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            required
          >
            <option value="">Select Department</option>
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>

          <div>
            <label className="block mb-1 bg-white font-semibold text-teal-900">Select Role</label>
            <select
              className="w-full bg-white text-teal-900 border p-2 rounded"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              {pagedRoles.length === 0 && <option disabled>No roles available</option>}
              {pagedRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>

            {/* Pagination Controls for Roles */}
            {totalPages > 1 && (
              <div className="mt-2 flex justify-center space-x-2 text-sm text-teal-700">
                <button
                  type="button"
                  onClick={() => setRolesPage((p) => Math.max(p - 1, 1))}
                  disabled={rolesPage === 1}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="px-2 py-1 border rounded bg-teal-100">{rolesPage}</span>
                <button
                  type="button"
                  onClick={() => setRolesPage((p) => Math.min(p + 1, totalPages))}
                  disabled={rolesPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Nationality"
            className="w-full border p-2 rounded"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium mb-1">Key Behaviours (max 5)</label>
            <BehaviourSelector selected={selectedBehaviours} onChange={setSelectedBehaviours} max={5} />
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-teal-700 text-white font-medium py-2 px-4 rounded hover:bg-teal-800"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
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
    </>
  )
}
