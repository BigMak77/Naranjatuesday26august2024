'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

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

const ROOT_DEPT_ID = '00000000-0000-0000-0000-000000000000'

type RolesByDept = Record<string, Role[]>
type ExpandedMap = Record<string, boolean>

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [rolesByDept, setRolesByDept] = useState<RolesByDept>({})
  const [expanded, setExpanded] = useState<ExpandedMap>({})
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
  const [newParentId, setNewParentId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: deptData }, { data: roleData }] = await Promise.all([
        supabase.from('departments').select('id, name, parent_id'),
        supabase.from('roles').select('id, title, department_id')
      ])

      if (deptData) setDepartments(deptData)

      const grouped: RolesByDept = {}
      for (const role of roleData || []) {
        if (!grouped[role.department_id]) grouped[role.department_id] = []
        grouped[role.department_id].push(role)
      }
      setRolesByDept(grouped)
    }

    fetchData()
  }, [])

  const toggleExpand = (deptId: string) => {
    setExpanded(prev => ({ ...prev, [deptId]: !prev[deptId] }))
  }

  const buildTree = (items: Department[]) => {
    const tree: Record<string, Department[]> = {}
    for (const dept of items) {
      const parentKey = dept.parent_id ?? ROOT_DEPT_ID
      if (!tree[parentKey]) tree[parentKey] = []
      tree[parentKey].push(dept)
    }
    return tree
  }

  const getDescendants = (deptId: string, tree: Record<string, Department[]>, visited = new Set<string>()): Set<string> => {
    const children = tree[deptId] || []
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id)
        getDescendants(child.id, tree, visited)
      }
    }
    return visited
  }

  const handleParentChange = async (deptId: string) => {
    const { error } = await supabase
      .from('departments')
      .update({ parent_id: newParentId })
      .eq('id', deptId)

    if (error) {
      alert('Error updating parent: ' + error.message)
    } else {
      setEditingDeptId(null)
      setNewParentId(null)
      const { data } = await supabase.from('departments').select('id, name, parent_id')
      if (data) setDepartments(data)
    }
  }

  const tree = buildTree(departments)

  const renderBranch = (parentId: string, level = 0, path: string[] = []) => {
    const children = tree[parentId] || []
    return children.map((dept) => (
      <DeptNode key={dept.id} dept={dept} level={level} path={path} />
    ))
  }

  const DeptNode = ({ dept, level, path }: { dept: Department; level: number; path: string[] }) => {
    const currentPath = [...path, dept.name]
    const descendants = getDescendants(dept.id, tree)

    return (
      <div style={{ marginLeft: `${level * 1.25}rem` }} className="mt-4 border-2 border-orange-500 rounded overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between cursor-pointer bg-teal-900 text-white px-4 py-2"
          onClick={() => toggleExpand(dept.id)}
        >
          <div className="flex items-center">
            {expanded[dept.id] ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <h2 className="ml-2 text-lg font-semibold">{dept.name}</h2>
          </div>
          <div className="text-xs italic text-white opacity-80">{currentPath.join(' › ')}</div>
        </div>

        {expanded[dept.id] && (
          <div className="bg-teal-50 px-6 py-4">
            <ul className="list-disc text-sm text-gray-800">
              {(rolesByDept[dept.id] || []).map((role) => (
                <li key={role.id} className="py-1">{role.title}</li>
              ))}
            </ul>

            <div className="flex gap-4 mt-4 text-sm flex-wrap">
              <Link href={`/admin/departments/add?parent_id=${dept.id}`} className="text-orange-500 hover:underline">
                ➕ Add Child Department
              </Link>
              {dept.parent_id && (
                <Link href={`/admin/departments/add?parent_id=${dept.parent_id}`} className="text-teal-900 hover:underline">
                  ➕ Add Sibling Department
                </Link>
              )}
              <Link href={`/admin/roles/add?department_id=${dept.id}`} className="text-green-800 hover:underline">
                ➕ Add Role
              </Link>

              {editingDeptId === dept.id ? (
                <div className="mt-2 flex gap-2 items-center w-full flex-wrap">
                  <select
                    value={newParentId ?? ''}
                    onChange={(e) => setNewParentId(e.target.value || null)}
                    className="border p-1 rounded text-sm"
                  >
                    <option value="">Set as Root</option>
                    {departments
                      .filter(d => d.id !== dept.id && !descendants.has(d.id))
                      .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleParentChange(dept.id)}
                    className="px-2 py-1 text-xs bg-teal-600 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDeptId(null)}
                    className="px-2 py-1 text-xs bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingDeptId(dept.id)
                    setNewParentId(dept.parent_id)
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ✏️ Change Parent
                </button>
              )}
            </div>

            {renderBranch(dept.id, level + 1, currentPath)}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="flex flex-col bg-white text-teal-900">
      <section className="py-16 px-6 bg-teal-50 min-h-[calc(100vh-5rem)]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center text-teal-900">🏢 Organisation Chart</h1>

          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <Link
              href="/admin/departments/add"
              className="bg-orange-600 text-white px-6 py-2 rounded-full shadow hover:bg-orange-700 transition flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Department
            </Link>
            <Link
              href="/admin/roles/add"
              className="bg-teal-600 text-white px-6 py-2 rounded-full shadow hover:bg-teal-700 transition flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Role
            </Link>
          </div>

          {renderBranch(ROOT_DEPT_ID)}
        </div>
      </section>
    </main>
  )
}
