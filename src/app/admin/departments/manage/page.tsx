'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface Department {
  id: string
  name: string
  parent_id: string | null
}

interface Role {
  id: string
  title: string
  department_id: string
}

export default function ManageDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: deptData } = await supabase.from('departments').select('*')
    const { data: roleData } = await supabase.from('roles').select('*')
    if (deptData) setDepartments(deptData)
    if (roleData) setRoles(roleData)
  }

  const updateParent = async (deptId: string, newParentId: string) => {
    await supabase.from('departments').update({ parent_id: newParentId }).eq('id', deptId)
    fetchData()
  }

  const getRolesForDept = (deptId: string) => {
    return roles.filter(role => role.department_id === deptId)
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      <section className="py-16 px-6 bg-teal-50">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center text-teal-900">🛠 Manage Departments</h1>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead className="bg-teal-100 text-left">
                <tr>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Parent Department</th>
                  <th className="px-4 py-2">Associated Roles</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{dept.name}</td>
                    <td className="px-4 py-2">
                      {departments.find(d => d.id === dept.parent_id)?.name || '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {getRolesForDept(dept.id).map(role => role.title).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={dept.parent_id ?? ''}
                        onChange={(e) => updateParent(dept.id, e.target.value)}
                        className="border px-2 py-1 rounded text-sm"
                      >
                        <option value="">— No Parent —</option>
                        {departments.filter(d => d.id !== dept.id).map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
