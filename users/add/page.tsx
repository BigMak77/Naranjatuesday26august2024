'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import BehaviourSelector from '@/components/BehaviourSelector'

export default function AddUserPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; title: string; department_id: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [behaviours, setBehaviours] = useState<string[]>([])

  const [user, setUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    role_id: '',
    access_level: 'User',
  })

  useEffect(() => {
    const load = async () => {
      const [{ data: d }, { data: r }] = await Promise.all([
        supabase.from('departments').select('id, name'),
        supabase.from('roles').select('id, title, department_id'),
      ])
      setDepartments(d || [])
      setRoles(r || [])
    }
    load()
  }, [])

  const handleSave = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()

    if (error) {
      console.error('Error adding user:', error)
      setLoading(false)
      return
    }

    if (data && behaviours.length > 0) {
      const inserts = behaviours.map(b => ({ auth_id: data.id, behaviour_id: b }))
      await supabase.from('user_behaviours').insert(inserts)
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/admin/users')
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-orange-50 rounded shadow">
      <h1 className="text-2xl font-bold text-orange-700 mb-6">Add New User</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input className="w-full border p-2 rounded" value={user.first_name} onChange={(e) => setUser({ ...user, first_name: e.target.value })} placeholder="First Name" />
        <input className="w-full border p-2 rounded" value={user.last_name} onChange={(e) => setUser({ ...user, last_name: e.target.value })} placeholder="Last Name" />
        <input className="w-full border p-2 rounded" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} placeholder="Email" />
        <input className="w-full border p-2 rounded" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} placeholder="Phone" />
        <select className="w-full border p-2 rounded" value={user.department_id} onChange={(e) => setUser({ ...user, department_id: e.target.value, role_id: '' })}>
          <option value="">Select Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="w-full border p-2 rounded" value={user.role_id} onChange={(e) => setUser({ ...user, role_id: e.target.value })}>
          <option value="">Select Role</option>
          {roles.filter(r => r.department_id === user.department_id).map(r => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <select className="w-full border p-2 rounded" value={user.access_level} onChange={(e) => setUser({ ...user, access_level: e.target.value })}>
          <option value="User">User</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
        </select>

        <div className="md:col-span-2 lg:col-span-3">
          <BehaviourSelector selected={behaviours} onChange={setBehaviours} max={5} />
        </div>

        {success && (
          <p className="text-green-700 md:col-span-2 lg:col-span-3">✅ User added successfully!</p>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-800"
        >
          {loading ? 'Saving...' : 'Add User'}
        </button>
      </div>
    </div>
  )
}
