// File: src/app/admin/modules/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface Role {
  id: string
  title: string
  department_id: string
}

interface ModuleGroup {
  id: string
  name: string
}

export default function EditModulePage() {
  const { id } = useParams()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupId, setGroupId] = useState('')

  const [roles, setRoles] = useState<Role[]>([])
  const [groups, setGroups] = useState<ModuleGroup[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      const [{ data: module, error: moduleError }, { data: roleData }, { data: groupData }] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).single(),
        supabase.from('roles').select('id, title, department_id'),
        supabase.from('modules_groups').select('id, name'),
      ])

      if (moduleError || !module) {
        setError('Failed to load module')
        setLoading(false)
        return
      }

      const { data: assignedRoles } = await supabase
        .from('module_roles')
        .select('role_id')
        .eq('module_id', id)

      setName(module.name)
      setDescription(module.description)
      setGroupId(module.group_id || '')
      setRoles(roleData || [])
      setGroups(groupData || [])
      setSelectedRoles((assignedRoles || []).map((r) => r.role_id))
      setLoading(false)
    }

    loadInitialData()
  }, [id])

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('modules')
      .update({ name, description, group_id: groupId })
      .eq('id', id)

    if (updateError) {
      setError('Failed to update module')
      setSaving(false)
      return
    }

    await supabase.from('module_roles').delete().eq('module_id', id)

    const { error: insertError } = await supabase
      .from('module_roles')
      .insert(selectedRoles.map((roleId) => ({ module_id: id, role_id: roleId })))

    if (insertError) {
      setError('Failed to update role assignments')
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    router.push('/admin/modules')
  }

  if (loading) return <p className="p-6">Loading module...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />
      <div className="max-w-2xl mx-auto p-6 w-full">
        <div className="bg-white rounded-xl shadow border border-teal-200 p-6">
          <button
            type="button"
            onClick={() => router.push('/admin/modules')}
            className="text-sm text-teal-700 hover:underline mb-4"
          >
            ← Back to Modules
          </button>

          <h1 className="text-3xl font-bold mb-6 text-teal-800">✏️ Edit Training Module</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Module Group */}
            <div>
              <label className="block font-semibold mb-1">
                Module Group <span className="text-red-500">*</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                className="w-full border border-teal-300 p-2 rounded"
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {groups.length === 0 && (
                <p className="text-sm text-red-500 mt-1">⚠️ No module groups available.</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block font-semibold mb-1">Module Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-teal-300 p-2 rounded"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full border border-teal-300 p-2 rounded"
              />
            </div>

            {/* Role Assignment */}
            <div>
              <label className="block font-semibold mb-2">Assign to Roles</label>
              {roles.length === 0 ? (
                <p className="text-sm text-red-500">⚠️ No roles available to assign.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-3 rounded bg-teal-50">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-center text-sm text-teal-800">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(r.id)}
                        onChange={() => handleRoleToggle(r.id)}
                        className="mr-2"
                      />
                      {r.title} <span className="text-gray-500 ml-1 text-xs">({r.department_id})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full text-white font-semibold py-2 rounded ${saving ? 'bg-teal-400' : 'bg-teal-700 hover:bg-teal-800'}`}
            >
              {saving ? 'Saving...' : 'Update Module'}
            </button>

            {success && <p className="text-green-600">✅ Module updated successfully!</p>}
            {error && <p className="text-red-600">❌ {error}</p>}
          </form>
        </div>
      </div>
      <Footer />
    </main>
  )
}
