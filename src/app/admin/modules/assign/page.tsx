'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Module {
  id: string
  name: string
}

interface Role {
  id: string
  title: string
}

export default function AssignModuleRolesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [assignedRoles, setAssignedRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: modData }, { data: roleData }] = await Promise.all([
        supabase.from('modules').select('id, name').order('name'),
        supabase.from('roles').select('id, title').order('title'),
      ])
      if (modData) setModules(modData)
      if (roleData) setRoles(roleData)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedModuleId) return
    const fetchAssignedRoles = async () => {
      const { data } = await supabase
        .from('module_roles')
        .select('role_id')
        .eq('module_id', selectedModuleId)
      if (data) setAssignedRoles(data.map((d) => d.role_id))
    }
    fetchAssignedRoles()
  }, [selectedModuleId])

  const toggleRole = (roleId: string) => {
    setAssignedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: delError } = await supabase
      .from('module_roles')
      .delete()
      .eq('module_id', selectedModuleId)

    if (delError) {
      setError('Failed to clear old assignments.')
      setSaving(false)
      return
    }

    const { error: insError } = await supabase
      .from('module_roles')
      .insert(assignedRoles.map((roleId) => ({ module_id: selectedModuleId, role_id: roleId })))

    if (insError) {
      setError('Failed to assign roles.')
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <section className="max-w-3xl mx-auto w-full p-6 mt-6">
        <div className="bg-white rounded-xl shadow border border-teal-200 p-6">
          <h1 className="text-3xl font-bold text-teal-800 mb-6">📌 Assign Roles to Module</h1>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Select Module</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  required
                  className="w-full border border-teal-300 rounded px-3 py-2 text-teal-900 bg-white"
                >
                  <option value="">-- Choose Module --</option>
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>

              {selectedModuleId && (
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Assign Roles</label>
                  <div className="grid grid-cols-2 gap-2 border border-teal-300 p-3 rounded bg-teal-50 max-h-60 overflow-y-auto">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center text-sm text-teal-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedRoles.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="mr-2"
                        />
                        {role.title}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">✅ Role assignments updated!</p>}

              <button
                type="submit"
                disabled={saving || !selectedModuleId}
                className={`w-full text-white font-semibold py-2 rounded transition ${
                  saving ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {saving ? 'Saving...' : 'Save Assignments'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
