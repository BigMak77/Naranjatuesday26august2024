'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Completion {
  id: string
  completed_at: string
  module: { name: string } | null
  user: {
    first_name: string
    last_name: string
    department: { name: string } | null
    role: { title: string } | null
  } | null
}

export default function CompliancePage() {
  const [completions, setCompletions] = useState<Completion[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [modules, setModules] = useState<string[]>([])

  const [selectedDept, setSelectedDept] = useState('All')
  const [selectedRole, setSelectedRole] = useState('All')
  const [selectedModule, setSelectedModule] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchCompletions = async () => {
      const { data, error } = await supabase
        .from('module_completions')
        .select(`
          id,
          completed_at,
          modules ( name ),
          users (
            first_name,
            last_name,
            department:departments ( name ),
            role:roles ( title )
          )
        `)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error(error)
        setError('Failed to load completions.')
        setLoading(false)
        return
      }

      const normalized = (data || []).map((item: any) => ({
        id: item.id,
        completed_at: item.completed_at,
        module: item.modules || null,
        user: item.users
          ? {
              first_name: item.users.first_name,
              last_name: item.users.last_name,
              department: item.users.department || null,
              role: item.users.role || null,
            }
          : null,
      }))

      setCompletions(normalized)
      setDepartments([...new Set(normalized.map(c => c.user?.department?.name).filter(Boolean))])
      setRoles([...new Set(normalized.map(c => c.user?.role?.title).filter(Boolean))])
      setModules([...new Set(normalized.map(c => c.module?.name).filter(Boolean))])
      setLoading(false)
    }

    fetchCompletions()
  }, [])

  const getFiltered = () => {
    return completions
      .filter(c => selectedDept === 'All' || c.user?.department?.name === selectedDept)
      .filter(c => selectedRole === 'All' || c.user?.role?.title === selectedRole)
      .filter(c => selectedModule === 'All' || c.module?.name === selectedModule)
      .filter(c => !startDate || new Date(c.completed_at) >= new Date(startDate))
      .filter(c => !endDate || new Date(c.completed_at) <= new Date(endDate))
  }

  const filtered = getFiltered()
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize)
  const displayed = pageSize === 0 ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const exportCSV = () => {
    const rows = [
      ['User', 'Department', 'Role', 'Module', 'Completed At'],
      ...filtered.map(c => [
        `${c.user?.first_name ?? ''} ${c.user?.last_name ?? ''}`,
        c.user?.department?.name ?? '',
        c.user?.role?.title ?? '',
        c.module?.name ?? '',
        new Date(c.completed_at).toLocaleDateString(),
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'compliance_data.csv')
    document.body.appendChild(link)
    link.click()
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-orange-600 mb-6">📋 Compliance Dashboard</h1>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[{ label: 'Department', value: selectedDept, setter: setSelectedDept, options: departments },
          { label: 'Role', value: selectedRole, setter: setSelectedRole, options: roles },
          { label: 'Module', value: selectedModule, setter: setSelectedModule, options: modules }
        ].map(({ label, value, setter, options }) => (
          <div key={label}>
            <label className="block mb-1 text-sm font-medium text-teal-900">{label}</label>
            <select
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full text-teal-900"
            >
              <option value="All">All</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <label className="block mb-1 text-sm font-medium text-teal-900">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full text-teal-900"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-teal-900">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full text-teal-900"
          />
        </div>
      </div>

      {/* Export + Page Size */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={exportCSV}
          className="bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700 transition"
        >
          ⬇️ Export CSV
        </button>
        <div className="flex items-center gap-2 text-sm text-teal-900">
          <label>Show</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded px-2 py-1 text-teal-900"
          >
            {[25, 50, 100, 0].map(n => (
              <option key={n} value={n}>{n === 0 ? 'All' : n}</option>
            ))}
          </select>
          <label>entries</label>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-600">No completions found.</p>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="table-default">
            <thead>
              <tr>
                <th>User</th>
                <th>Department</th>
                <th>Role</th>
                <th>Module</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((comp) => (
                <tr key={comp.id}>
                  <td>{comp.user?.first_name} {comp.user?.last_name}</td>
                  <td>{comp.user?.department?.name ?? 'N/A'}</td>
                  <td>{comp.user?.role?.title ?? 'N/A'}</td>
                  <td>{comp.module?.name ?? 'Unknown'}</td>
                  <td>{new Date(comp.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pageSize !== 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 text-sm text-teal-900">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="px-3 py-1 bg-teal-700 text-white rounded disabled:opacity-50"
          >
            ← Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="px-3 py-1 bg-teal-700 text-white rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </>
  )
}
