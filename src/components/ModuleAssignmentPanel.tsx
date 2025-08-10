'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

interface Role {
  id: string
  title: string
  department_id: string
}

interface Department {
  id: string
  name: string
}

interface AssignmentCheckbox {
  role_id: string
  department_id: string
}

interface Props {
  moduleId: string
}

export default function ModuleAssignmentPanel({ moduleId }: Props) {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [assigned, setAssigned] = useState<AssignmentCheckbox[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: d, error: dErr }, { data: r, error: rErr }, { data: current, error: cErr }] =
        await Promise.all([
          supabase.from('departments').select('id, name'),
          supabase.from('roles').select('id, title, department_id'),
          supabase.from('module_roles')
            .select('role_id, department_id')
            .eq('module_id', moduleId),
        ])

      if (dErr || rErr || cErr) {
        console.error('Failed to load data:', dErr, rErr, cErr)
      }

      setDepartments(d || [])
      setRoles(r || [])
      setAssigned(current || [])
      setLoading(false)
    }

    if (moduleId) load()
  }, [moduleId])

  const isChecked = (role_id: string, department_id: string) =>
    assigned.some((a) => a.role_id === role_id && a.department_id === department_id)

  const toggle = (role_id: string, department_id: string) => {
    setAssigned((prev) => {
      const exists = prev.find(
        (a) => a.role_id === role_id && a.department_id === department_id
      )
      return exists
        ? prev.filter(
            (a) => !(a.role_id === role_id && a.department_id === department_id)
          )
        : [...prev, { role_id, department_id }]
    })
  }

  const handleSave = async () => {
    setSaving(true)

    const { error: deleteError } = await supabase
      .from('module_roles')
      .delete()
      .eq('module_id', moduleId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      setSaving(false)
      return
    }

    if (assigned.length > 0) {
      const { error: insertError } = await supabase.from('module_roles').insert(
        assigned.map((a) => ({
          module_id: moduleId,
          role_id: a.role_id,
          department_id: a.department_id,
        }))
      )

      if (insertError) {
        console.error('Insert error:', insertError)
      }
    }

    setSaving(false)
  }

  if (loading) return <p className="p-4">Loading assignments...</p>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-orange-700">
        🎯 Assign Roles & Departments
      </h3>

      {departments.map((dep) => (
        <div key={dep.id} className="border rounded-md p-3 bg-orange-50">
          <h4 className="font-medium text-teal-800 mb-2">{dep.name}</h4>
          <div className="space-y-1">
            {roles
              .filter((r) => r.department_id === dep.id)
              .map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 text-sm text-teal-900"
                >
                  <input
                    type="checkbox"
                    checked={isChecked(role.id, dep.id)}
                    onChange={() => toggle(role.id, dep.id)}
                  />
                  {role.title}
                </label>
              ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Assignments'}
        </button>
        <button
          type="button"
          className="text-sm text-blue-700 underline"
          onClick={() => router.push(`/admin/modules/edit/${moduleId}`)}
        >
          Edit Module
        </button>
        <button
          type="button"
          className="text-sm text-orange-700 underline"
          onClick={() => router.push(`/admin/modules/${moduleId}`)}
        >
          View Module
        </button>
      </div>
    </div>
  )
}
