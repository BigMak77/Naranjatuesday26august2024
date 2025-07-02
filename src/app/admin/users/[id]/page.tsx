"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'
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

interface RoleProfile {
  id: string
  name: string
}

export default function EditUserPage() {
  const router = useRouter()
  const rawId = useParams().id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [nationality, setNationality] = useState('')
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])
  const [roleProfileId, setRoleProfileId] = useState<string>('')

  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([])

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase.from('departments').select('id, name')
      if (data) setDepartments(data)
    }

    const fetchRoleProfiles = async () => {
      const { data } = await supabase.from('role_profiles').select('id, name')
      if (data) setRoleProfiles(data)
    }

    fetchDepartments()
    fetchRoleProfiles()
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
        .select('first_name, last_name, email, department_id, role_id, nationality, role_profile_id')
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
      setRoleProfileId(data.role_profile_id || '')

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
    const { data } = await supabase
      .from('roles')
      .select('id, title, department_id')
      .eq('department_id', deptId)

    if (data) setFilteredRoles(data)
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
        role_profile_id: roleProfileId || null,
      })
      .eq('id', id)

    if (error) {
      setError('Failed to update user.')
      setSubmitting(false)
      return
    }

    await supabase.from('user_behaviours').delete().eq('user_id', id)

    const newLinks = selectedBehaviours.map((b) => ({ user_id: id, behaviour_id: b }))
    if (newLinks.length > 0) {
      await supabase.from('user_behaviours').insert(newLinks)
    }

    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => router.push('/admin/users'), 1200)
  }

  if (loading) return <p className="p-6">Loading user data...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      <div className="max-w-2xl mx-auto mt-6 px-4 flex-grow">
        <div className="bg-white border border-teal-200 shadow-md rounded-xl p-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">✏️ Edit User</h1>

          {success && (
            <p className="text-green-600 font-medium mb-4 text-center">
              ✅ User updated successfully!
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'First Name', value: firstName, setter: setFirstName, type: 'text' },
              { label: 'Last Name', value: lastName, setter: setLastName, type: 'text' },
              { label: 'Email', value: email, setter: setEmail, type: 'email' },
              { label: 'Nationality', value: nationality, setter: setNationality, type: 'text' }
            ].map(({ label, value, setter, type }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  required={label !== 'Nationality'}
                  className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value)
                  setRoleId('')
                  fetchRoles(e.target.value)
                }}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                {filteredRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role Profile</label>
              <select
                value={roleProfileId}
                onChange={(e) => setRoleProfileId(e.target.value)}
                className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
              >
                <option value="">— None —</option>
                {roleProfiles.map((rp) => (
                  <option key={rp.id} value={rp.id}>{rp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Key Behaviours (max 5)</label>
              <BehaviourSelector selected={selectedBehaviours} onChange={setSelectedBehaviours} max={5} />
            </div>

            <div className="flex items-center space-x-4 justify-between">
              <button
                type="submit"
                className="bg-teal-700 text-white font-semibold py-2 px-4 rounded hover:bg-teal-800 transition"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="text-gray-600 underline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
