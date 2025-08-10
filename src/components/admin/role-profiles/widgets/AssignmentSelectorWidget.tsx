// components/role-profiles/widgets/AssignmentSelectorWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'

type Assignment = { type: 'user' | 'role' | 'department'; id: string; label: string }
type UserAssignment = Assignment & { role_id: string; department_id: string }

type Props = {
  selectedAssignments: Assignment[]
  onChange: (assignments: Assignment[]) => void
}

export default function AssignmentSelectorWidget({ selectedAssignments, onChange }: Props) {
  const [users, setUsers] = useState<UserAssignment[]>([])
  const [roles, setRoles] = useState<Assignment[]>([])
  const [departments, setDepartments] = useState<Assignment[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  const [showDepts, setShowDepts] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const [u, r, d] = await Promise.all([
        supabase.from('users').select('auth_id, first_name, last_name, role_id, department_id'),
        supabase.from('roles').select('id, title'),
        supabase.from('departments').select('id, name'),
      ])

      // ✅ Use auth_id for user assignment IDs
      setUsers(
        u.data?.map((u) => ({
          type: 'user',
          id: u.auth_id,
          label: `${u.first_name} ${u.last_name}`,
          role_id: u.role_id,
          department_id: u.department_id,
        })) || []
      )

      setRoles(
        r.data?.map((r) => ({
          type: 'role',
          id: r.id,
          label: r.title,
        })) || []
      )

      setDepartments(
        d.data?.map((d) => ({
          type: 'department',
          id: d.id,
          label: d.name,
        })) || []
      )
    }

    loadData()
  }, [])

  const isSelected = (a: Assignment) =>
    selectedAssignments.some((sa) => sa.id === a.id && sa.type === a.type)

  const toggle = (assignment: Assignment) => {
    if (isSelected(assignment)) {
      onChange(selectedAssignments.filter((a) => !(a.id === assignment.id && a.type === assignment.type)))
    } else {
      onChange([...selectedAssignments, assignment])
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.label.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || u.role_id === roleFilter
    const matchesDept = !deptFilter || u.department_id === deptFilter
    return matchesSearch && matchesRole && matchesDept
  })

  const filteredRoles = roles.filter((r) => r.label.toLowerCase().includes(search.toLowerCase()))
  const filteredDepts = departments.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <NeonPanel className="mt-6">
      <h3 className="neon-section-title">Assign To</h3>

      <input
        type="text"
        placeholder="Search users, roles, departments..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="neon-input"
      />

      <div className="flex gap-2">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="neon-input">
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="neon-input">
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Departments */}
      <div>
        <button
          type="button"
          className="btn-add neon-section-toggle"
          data-tooltip={showDepts ? 'Hide Departments' : 'Show Departments'}
          onClick={() => setShowDepts((v) => !v)}
        >
          {showDepts ? <span className="text-white">➖</span> : <span className="text-white">➕</span>}
        </button>
        {showDepts && (
          <div className="neon-grid">
            {filteredDepts.map((d) => (
              <label key={d.id} className="neon-checkbox-label">
                <input
                  type="checkbox"
                  checked={isSelected(d)}
                  onChange={() => toggle(d)}
                  className="neon-checkbox"
                />
                {d.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Roles */}
      <div>
        <button
          type="button"
          className="neon-btn neon-section-toggle"
          data-tooltip={showRoles ? 'Hide Roles' : 'Show Roles'}
          onClick={() => setShowRoles((v) => !v)}
        >
          {showRoles ? <span className="neon-btn-label">➖</span> : <span className="neon-btn-label">➕</span>}
        </button>
        {showRoles && (
          <div className="neon-grid">
            {filteredRoles.map((r) => (
              <label key={r.id} className="neon-checkbox-label">
                <input
                  type="checkbox"
                  checked={isSelected(r)}
                  onChange={() => toggle(r)}
                  className="neon-checkbox"
                />
                {r.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Users */}
      <div>
        <button
          type="button"
          className="btn-add neon-section-toggle"
          data-tooltip={showUsers ? 'Hide Users' : 'Show Users'}
          onClick={() => setShowUsers((v) => !v)}
        >
          {showUsers ? <span className="text-white">➖</span> : <span className="text-white">➕</span>}
        </button>
        {showUsers && (
          <div className="neon-grid">
            {filteredUsers.map((u) => (
              <label key={u.id} className="neon-checkbox-label">
                <input
                  type="checkbox"
                  checked={isSelected(u)}
                  onChange={() => toggle(u)}
                  className="neon-checkbox"
                />
                {u.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </NeonPanel>
  )
}
