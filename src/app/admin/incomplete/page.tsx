'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface IncompleteRecord {
  user_id: string
  first_name: string
  last_name: string
  department: string
  role: string
  module: string
}

export default function IncompleteTrainingPage() {
  const [data, setData] = useState<IncompleteRecord[]>([])
  const [filtered, setFiltered] = useState<IncompleteRecord[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [allRoles, setAllRoles] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('All')
  const [selectedRole, setSelectedRole] = useState('All')
  const [selectedModule, setSelectedModule] = useState('All')

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.rpc('get_incomplete_training')
      if (error) {
        console.error('Error fetching incomplete training:', error)
        return
      }

      const results = (data || []).map((item: any): IncompleteRecord => ({
        user_id: item.user_id,
        first_name: item.first_name,
        last_name: item.last_name,
        department: item.department,
        role: item.role,
        module: item.module,
      }))

      setData(results)
      setFiltered(results)

      setDepartments(Array.from(new Set(results.map((d: { department: any }) => d.department))))
      setAllRoles(Array.from(new Set(results.map((d: { role: any }) => d.role))))
      setRoles(Array.from(new Set(results.map((d: { role: any }) => d.role))))
      setModules(Array.from(new Set(results.map((d: { module: any }) => d.module))))
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filteredList = data

    if (selectedDept !== 'All') {
      filteredList = filteredList.filter((d) => d.department === selectedDept)
      const filteredRoles = Array.from(
        new Set(
          data
            .filter((d) => d.department === selectedDept)
            .map((d) => d.role)
        )
      )
      setRoles(filteredRoles)
    } else {
      setRoles(allRoles)
    }

    if (selectedRole !== 'All') {
      filteredList = filteredList.filter((d) => d.role === selectedRole)
    }

    if (selectedModule !== 'All') {
      filteredList = filteredList.filter((d) => d.module === selectedModule)
    }

    if (search.trim() !== '') {
      const s = search.toLowerCase()
      filteredList = filteredList.filter(
        (d) =>
          d.first_name.toLowerCase().includes(s) ||
          d.last_name.toLowerCase().includes(s)
      )
    }

    setFiltered(filteredList)
  }, [search, selectedDept, selectedRole, selectedModule, data, allRoles])

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <div className="p-6 max-w-6xl mx-auto flex-grow">
        <h1 className="text-3xl font-bold text-orange-600 mb-6">📋 Incomplete Training</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-teal-300 rounded px-3 py-2 col-span-1 md:col-span-2 text-teal-900"
          />

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="border border-teal-300 rounded px-3 py-2 text-teal-900"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-teal-300 rounded px-3 py-2 text-teal-900"
          >
            <option value="All">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="border border-teal-300 rounded px-3 py-2 text-teal-900"
          >
            <option value="All">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-lg min-h-[400px]">
          <table className="min-w-full table-default text-sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Department</th>
                <th>Role</th>
                <th>Module</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((rec) => (
                  <tr key={`${rec.user_id}-${rec.module}`} className="hover:bg-orange-100">
                    <td className="p-3 border-b">{rec.first_name} {rec.last_name}</td>
                    <td className="p-3 border-b">{rec.department}</td>
                    <td className="p-3 border-b">{rec.role}</td>
                    <td className="p-3 border-b">{rec.module}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border-b text-gray-500 text-center" colSpan={4}>
                    No incomplete training found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
