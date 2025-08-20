'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiBarChart2 } from 'react-icons/fi'

interface Assignment {
  auth_id: string
  name: string
  type: 'module' | 'document' | 'behaviour'
  completed_at?: string
  user?: {
    first_name: string
    last_name: string
    department?: { name: string }
    role?: { title: string }
  }
}

export default function CompliancePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const [selectedDept, setSelectedDept] = useState('All')
  const [selectedRole, setSelectedRole] = useState('All')
  const [selectedModule, setSelectedModule] = useState('All')

  useEffect(() => {
    const fetchData = async () => {
      const [assignmentsRaw, completionsRaw, usersRaw] = await Promise.all([
        supabase.from('user_training_assignments').select('*'),
        supabase.from('module_completions').select('auth_id, module_id, completed_at'),
        supabase.from('users').select('auth_id, first_name, last_name, department:departments(name), role:roles(title)')
      ])

      const moduleMap: Record<string, string> = {}
      const { data: modulesList } = await supabase.from('modules').select('id, name')
      modulesList?.forEach(m => { moduleMap[m.id] = m.name })

      const userMap = Object.fromEntries((usersRaw.data || []).map(u => [u.auth_id, u]))
      const completionMap = Object.fromEntries((completionsRaw.data || []).map(c => [`${c.auth_id}_${c.module_id}`, c.completed_at]))

      const result: Assignment[] = (assignmentsRaw.data || [])
        .filter(a => a.type === 'module')
        .map(a => {
          const completed_at = completionMap[`${a.auth_id}_${a.module_id}`]
          return {
            auth_id: a.auth_id,
            name: moduleMap[a.module_id] || 'Unknown Module',
            type: 'module',
            completed_at,
            user: userMap[a.auth_id] || undefined
          }
        })

      setAssignments(result)
      setDepartments([...new Set(result.map(r => r.user?.department?.name).filter((x): x is string => !!x))])
      setRoles([...new Set(result.map(r => r.user?.role?.title).filter((x): x is string => !!x))])
      setModules([...new Set(result.map(r => r.name).filter((x): x is string => !!x))])
    }
    fetchData()
  }, [])

  const filtered = assignments
    .filter(a => selectedDept === 'All' || a.user?.department?.name === selectedDept)
    .filter(a => selectedRole === 'All' || a.user?.role?.title === selectedRole)
    .filter(a => selectedModule === 'All' || a.name === selectedModule)
    .filter(a => {
      const name = `${a.user?.first_name ?? ''} ${a.user?.last_name ?? ''}`.toLowerCase()
      return name.includes(search.toLowerCase())
    })

  const completionRate = assignments.length > 0
    ? Math.round((assignments.filter(a => !!a.completed_at).length / assignments.length) * 100)
    : 0

  return (
    <main className="after-hero">
      <div className="global-content">
        <div className="compliance-header">
          <FiBarChart2 className="compliance-header-icon" />
          <h1 className="compliance-title">Compliance Dashboard</h1>
        </div>
        <p className="compliance-completion-rate">
          Completion Rate: <strong>{completionRate}%</strong>
        </p>
        <div className="compliance-filters">
          <div>
            <label className="compliance-filter-label">Department</label>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="compliance-filter-input">
              <option value="All">All</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="compliance-filter-label">Role</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="compliance-filter-input">
              <option value="All">All</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="compliance-filter-label">Module</label>
            <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} className="compliance-filter-input">
              <option value="All">All</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="compliance-filter-label">Search User</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Enter name..."
              className="compliance-filter-input"
            />
          </div>
        </div>
        <div className="compliance-table-wrapper">
          <table className="compliance-table">
            <thead className="compliance-table-head">
              <tr>
                <th className="compliance-table-th">User</th>
                <th className="compliance-table-th">Department</th>
                <th className="compliance-table-th">Role</th>
                <th className="compliance-table-th">Module</th>
                <th className="compliance-table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className="compliance-table-row">
                  <td className="compliance-table-td">{a.user?.first_name} {a.user?.last_name}</td>
                  <td className="compliance-table-td">{a.user?.department?.name || '—'}</td>
                  <td className="compliance-table-td">{a.user?.role?.title || '—'}</td>
                  <td className="compliance-table-td">{a.name}</td>
                  <td className="compliance-table-td">
                    {a.completed_at ? (
                      <span className="compliance-status-complete">
                        {new Date(a.completed_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="compliance-status-incomplete">
                        Incomplete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
