'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import DepartmentTree from '@/components/DepartmentTree'

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
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: deptData, error: deptErr } = await supabase.from('departments').select('*')
    const { data: roleData, error: roleErr } = await supabase.from('roles').select('*')

    if (deptErr || roleErr) {
      console.error(deptErr || roleErr)
    } else {
      setDepartments(deptData || [])
      setRoles(roleData || [])
    }

    setLoading(false)
  }

  const updateParent = async (deptId: string, newParentId: string) => {
    setUpdatingId(deptId)
    await supabase.from('departments').update({ parent_id: newParentId || null }).eq('id', deptId)
    await fetchData()
    setUpdatingId(null)
  }

  const getRolesForDept = (deptId: string) => {
    return roles.filter(role => role.department_id === deptId)
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <section className="py-16 px-6 bg-teal-50 flex-grow">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center text-teal-900">🛠 Manage Departments</h1>

          {loading ? (
            <div className="text-center text-gray-600">Loading departments...</div>
          ) : (
            <>
              <div className="overflow-x-auto mb-12">
                <table className="min-w-full bg-white border rounded shadow">
                  <thead className="bg-teal-100 text-left">
                    <tr>
                      <th className="px-4 py-2">Department</th>
                      <th className="px-4 py-2">Parent Department</th>
                      <th className="px-4 py-2">Associated Roles</th>
                      <th className="px-4 py-2">Change Parent</th>
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
                            value={dept.parent_id || ''}
                            onChange={(e) => updateParent(dept.id, e.target.value)}
                            className="border px-2 py-1 rounded text-sm"
                            disabled={updatingId === dept.id}
                          >
                            <option value="">— No Parent —</option>
                            {departments
                              .filter(d => d.id !== dept.id)
                              .map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                          </select>
                          {updatingId === dept.id && (
                            <p className="text-xs text-teal-700 mt-1">Updating...</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="text-2xl font-bold mb-4">📂 Department Hierarchy</h2>
              <div className="bg-white p-4 rounded shadow border">
                <DepartmentTree departments={departments} roles={roles} />
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
