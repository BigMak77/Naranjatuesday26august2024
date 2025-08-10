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
    <main className="min-h-screen bg-[#011f24] text-white">
      <div className="max-w-6xl mx-auto py-10 px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <FiBarChart2 className="text-[#40E0D0] text-2xl drop-shadow-[0_0_6px_#40E0D0]" />
          <h1 className="text-3xl font-bold text-white">Compliance Dashboard</h1>
        </div>
        <p className="text-[#40E0D0] mb-6 text-sm drop-shadow-[0_0_3px_#40E0D0]">
          Completion Rate: <strong>{completionRate}%</strong>
        </p>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0c1f24] p-6 rounded-xl shadow border border-[#40E0D0] mb-6">
          <div>
            <label className="text-sm font-semibold block mb-1">Department</label>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full bg-[#011f24] text-white border border-[#40E0D0] rounded p-2">
              <option value="All">All</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Role</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-full bg-[#011f24] text-white border border-[#40E0D0] rounded p-2">
              <option value="All">All</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Module</label>
            <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} className="w-full bg-[#011f24] text-white border border-[#40E0D0] rounded p-2">
              <option value="All">All</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Search User</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Enter name..."
              className="w-full bg-[#011f24] text-white border border-[#40E0D0] rounded p-2"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[#0c1f24] p-6 rounded-xl shadow border border-[#40E0D0]">
          <table className="min-w-full text-sm">
            <thead className="text-[#40E0D0] border-b border-[#40E0D0]">
              <tr>
                <th className="text-left px-4 py-2">User</th>
                <th className="text-left px-4 py-2">Department</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Module</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className="border-b border-[#024747] hover:bg-[#013c3c] transition">
                  <td className="px-4 py-2">{a.user?.first_name} {a.user?.last_name}</td>
                  <td className="px-4 py-2">{a.user?.department?.name || '—'}</td>
                  <td className="px-4 py-2">{a.user?.role?.title || '—'}</td>
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2">
                    {a.completed_at ? (
                      <span className="text-[#2ecc71] drop-shadow-[0_0_2px_#2ecc71] font-semibold">
                        {new Date(a.completed_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[#e74c3c] drop-shadow-[0_0_2px_#e74c3c] font-semibold">
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
