'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonTable from '@/components/NeonTable'
import { FiSearch, FiUsers, FiLayers, FiBookOpen } from 'react-icons/fi'

interface IncompleteRecord {
  auth_id: string
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
        auth_id: item.auth_id,
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

  const filteredData = filtered.map(rec => ({
    user: `${rec.first_name} ${rec.last_name}`,
    department: rec.department,
    role: rec.role,
    module: rec.module
  }))

  return (
    <div className="after-hero">
      <div className="page-content">
        <main className="page-main">
          <div className="neon-panel">
            <div className="neon-panel-content">
              <div className="neon-form-row">
                <div className="neon-form-group">
                  <FiSearch className="neon-form-icon" />
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="neon-input"
                  />
                </div>
                <div className="neon-form-group">
                  <FiUsers className="neon-form-icon" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="neon-form-group">
                  <FiLayers className="neon-form-icon" />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Roles</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="neon-form-group">
                  <FiBookOpen className="neon-form-icon" />
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Modules</option>
                    {modules.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="neon-table-wrapper">
                <NeonTable
                  columns={[
                    { header: 'User', accessor: 'user' },
                    { header: 'Department', accessor: 'department' },
                    { header: 'Role', accessor: 'role' },
                    { header: 'Module', accessor: 'module' }
                  ]}
                  data={filteredData}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
