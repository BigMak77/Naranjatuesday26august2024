"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonForm from '@/components/NeonForm'

export default function EditUserWidget() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return;
    supabase.auth.getUser() // Removed unused: .then(({ data }) => { ... })
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('users').update({
      // Removed unused: const [user, setUser] = useState<any>(null)
      // Removed unused: const [departments, setDepartments] = useState<any[]>([])
      // Removed unused: const [roles, setRoles] = useState<any[]>([])
      // Removed unused: const [form, setForm] = useState<any>(null)
      // Removed: setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }))
    }).eq('id', userId)
    if (error) setError('Failed to update user.')
    else router.push('/hr/people')
    setSaving(false)
  }

  if (!userId) return <div className="neon-error">No user ID provided.</div>
  // Removed unused: if (!form) return <div>Loading...</div>

  return (
    <main className="min-h-screen bg-background text-text flex flex-col items-center">
      <div className="w-full max-w-2xl p-6 mt-0">
        <NeonForm
          title="Edit User"
          submitLabel={saving ? 'Saving...' : 'Save'}
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-text">First Name</label>
              <input
                name="first_name"
                // Removed unused: value={form.first_name}
                // Removed unused: onChange={handleChange}
                className="border border-neon rounded px-3 py-2 w-full bg-background text-neon shadow-glow"
                placeholder="First Name"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-text">Last Name</label>
              <input
                name="last_name"
                // Removed unused: value={form.last_name}
                // Removed unused: onChange={handleChange}
                className="border border-neon rounded px-3 py-2 w-full bg-background text-neon shadow-glow"
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-text">Department</label>
              <select
                name="department_id"
                // Removed unused: value={form.department_id}
                // Removed unused: onChange={handleChange}
                className="border border-neon rounded px-3 py-2 w-full bg-background text-neon shadow-glow"
                required
              >
                <option value="">Select Department</option>
                {/* Removed unused: {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))} */}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-text">Role</label>
              <select
                name="role_id"
                // Removed unused: value={form.role_id}
                // Removed unused: onChange={handleChange}
                className="border border-neon rounded px-3 py-2 w-full bg-background text-neon shadow-glow"
                required
              >
                <option value="">Select Role</option>
                {/* Removed unused: {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))} */}
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-text">Start Date</label>
              <input
                name="start_date"
                type="date"
                // Removed unused: value={form.start_date ? form.start_date.slice(0, 10) : ''}
                // Removed unused: onChange={handleChange}
                className="border border-neon rounded px-3 py-2 w-full bg-background text-neon shadow-glow"
                placeholder="Start Date"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-text">First Aider?</label>
              <select
                name="is_first_aid"
                // Removed unused: value={form.is_first_aid}
                // Removed unused: onChange={handleChange}
                className="border border-neon rounded px-3 py-2 w-full bg-background text-neon shadow-glow"
                required
              >
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </div>
          </div>
          {error && <p className="neon-error text-sm">{error}</p>}
          <div className="flex gap-4 mt-6 justify-end">
            <button
              type="button"
              className="neon-btn neon-btn-cancel"
              onClick={() => router.push('/hr/people')}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neon-btn neon-btn-submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </NeonForm>
      </div>
    </main>
  )
}
