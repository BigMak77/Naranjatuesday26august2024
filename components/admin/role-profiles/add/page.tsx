"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface Role {
  id: string
  title: string
}

interface Module {
  id: string
  title: string
}

export default function AddRoleProfilePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [roleId, setRoleId] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: rolesData } = await supabase.from('roles').select('id, title')
      const { data: modulesData } = await supabase.from('modules').select('id, title')
      if (rolesData) setRoles(rolesData)
      if (modulesData) setModules(modulesData)
    }
    fetchData()
  }, [])

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { data: profile, error: profileError } = await supabase
      .from('role_profiles')
      .insert({ title, description, role_id: roleId })
      .select()
      .single()

    if (profileError || !profile) {
      setError('Failed to create role profile.')
      setSubmitting(false)
      return
    }

    const moduleLinks = selectedModules.map((m) => ({
      profile_id: profile.id,
      module_id: m,
    }))

    if (moduleLinks.length > 0) {
      await supabase.from('role_profile_modules').insert(moduleLinks)
    }

    setSubmitting(false)
    router.push('/admin/role-profiles')
  }

  return (
    <main className="min-h-screen bg-white text-teal-900">
      <LogoHeader />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">
          ➕ Add Role Profile
        </h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="w-full border border-teal-300 p-2 rounded bg-white"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-teal-300 p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-teal-300 p-2 rounded"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assign Modules</label>
            <div className="grid grid-cols-2 gap-2">
              {modules.map((mod) => (
                <label key={mod.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(mod.id)}
                    onChange={() => toggleModule(mod.id)}
                  />
                  <span>{mod.title}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-700 text-white py-2 rounded hover:bg-teal-800"
          >
            {submitting ? 'Saving...' : 'Create Role Profile'}
          </button>
        </form>
      </div>
      <Footer />
    </main>
  )
}
