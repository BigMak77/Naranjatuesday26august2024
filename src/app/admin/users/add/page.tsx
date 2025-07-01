"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function AddUserPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [nationality, setNationality] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])

  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const nationalities = ['British', 'Polish', 'French', 'German', 'Other']

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: deptData, error: deptError } = await supabase.from('departments').select('id, name')
      const { data: roleData, error: roleError } = await supabase.from('roles').select('id, title, department_id')

      if (deptError || roleError) {
        setError('Failed to load departments or roles.')
        console.error(deptError || roleError)
        return
      }

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
      email: email.trim().toLowerCase(),
      nationality: nationality || null,
      department_id: departmentId,
      role_id: roleId,
      status: 'active',
    }

    const { error: insertError } = await supabase.from('users').insert([payload])

    if (insertError) {
      console.error('Insert error:', insertError.message)
      setError('Failed to add user.')
      setSubmitting(false)
      return
    }

    const { data: insertedUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', payload.email)
      .single()

    if (fetchError || !insertedUser) {
      setError('User created but behaviour link failed.')
      setSubmitting(false)
      return
    }

    const behaviourPayload = selectedBehaviours.map((b) => ({
      user_id: insertedUser.id,
      behaviour_id: b,
    }))

    if (behaviourPayload.length > 0) {
      const { error: behaviourInsertError } = await supabase
        .from('user_behaviours')
        .insert(behaviourPayload)

      if (behaviourInsertError) {
        console.error('Behaviour insert error:', behaviourInsertError.message)
        setError('User saved but failed to link behaviours.')
        setSubmitting(false)
        return
      }
    }

    setSuccess(true)
    setTimeout(() => {
      setSubmitting(false)
      router.push('/admin/users')
    }, 1000)
  }

  return (
    <>
      <LogoHeader />
      <main className="min-h-screen bg-teal-50 text-teal-900 px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white border border-teal-200 shadow-md rounded-xl p-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">➕ Add New User</h1>

          {success && <p className="text-green-600 text-center font-medium">✅ User created successfully!</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[{ label: 'First Name', value: firstName, setter: setFirstName, type: 'text' },
              { label: 'Last Name', value: lastName, setter: setLastName, type: 'text' },
              { label: 'Email', value: email, setter: setEmail, type: 'email' }
            ].map(({ label, value, setter, type }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                  required
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <select
                className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                <option value="">Select Nationality</option>
                {nationalities.map((nation) => (
                  <option key={nation} value={nation}>{nation}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value)
                  setRoleId('')
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
              <label className="block text-sm font-medium mb-1">Key Behaviours (max 5)</label>
              <BehaviourSelector selected={selectedBehaviours} onChange={setSelectedBehaviours} max={5} />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-700 text-white font-semibold py-3 px-6 rounded-md hover:bg-teal-800 transition"
              >
                {submitting ? 'Saving...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="text-gray-600 underline"
              >
                Cancel
              </button>
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}