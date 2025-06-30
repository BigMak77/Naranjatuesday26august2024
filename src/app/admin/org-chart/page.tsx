'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'
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

interface User {
  id: string
  first_name: string
  last_name: string
  role_id: string | null
  department_id: string | null
}

type RolesByDept = Record<string, Role[]>
type ExpandedMap = Record<string, boolean>

const ROOT_DEPT_ID = '00000000-0000-0000-0000-000000000000'

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [rolesByDept, setRolesByDept] = useState<RolesByDept>({})
  const [expanded, setExpanded] = useState<ExpandedMap>({})
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [{ data: deptData }, { data: roleData }, { data: userData }] = await Promise.all([
      supabase.from('departments').select('id, name, parent_id'),
      supabase.from('roles').select('id, title, department_id'),
      supabase.from('users').select('id, first_name, last_name, role_id, department_id'),
    ])

    if (deptData) setDepartments(deptData)
    if (userData) setUsers(userData)

    const grouped: RolesByDept = {}
    for (const role of roleData || []) {
      if (!grouped[role.department_id]) grouped[role.department_id] = []
      grouped[role.department_id].push(role)
    }
    setRolesByDept(grouped)
  }

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

  const tree = buildTree(departments)

  const renderBranch = (parentId: string, level = 0, path: string[] = []) => {
    const children = tree[parentId] || []
    return children.map((dept) => (
      <DeptNode key={dept.id} dept={dept} level={level} path={path} />
    ))
  }

  const DeptNode = ({ dept, level, path }: { dept: Department; level: number; path: string[] }) => {
    const currentPath = [...path, dept.name]

    return (
      <div
        style={{ marginLeft: `${level * 1.25}rem` }}
        className="mt-4 bg-white border-l-2 border-teal-200 pl-4 py-2 rounded shadow-sm"
      >
        <div className="flex items-center justify-between cursor-pointer">
          <div onClick={() => toggleExpand(dept.id)} className="flex items-center">
            {expanded[dept.id] ? (
              <ChevronDown className="w-4 h-4 text-teal-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-teal-600" />
            )}
            <h2 className="ml-2 text-lg font-semibold text-teal-800">{dept.name}</h2>
          </div>
          <div className="text-xs text-gray-500 italic">{currentPath.join(' › ')}</div>
        </div>

        {expanded[dept.id] && (
          <div className="ml-6">
            <ul className="mt-2 list-disc text-sm text-gray-800">
              {(rolesByDept[dept.id] || []).map((role) => (
                <li key={role.id} className="py-1">
                  {role.title}
                </li>
              ))}
            </ul>

            <div className="flex gap-4 mt-4 text-sm">
              <Link
                href={`/admin/departments/add?parent_id=${dept.id}`}
                className="text-orange-600 hover:underline"
              >
                ➕ Add Child Department
              </Link>
              {dept.parent_id && (
                <Link
                  href={`/admin/departments/add?parent_id=${dept.parent_id}`}
                  className="text-blue-600 hover:underline"
                >
                  ➕ Add Sibling Department
                </Link>
              )}
              <Link
                href={`/admin/roles/add?department_id=${dept.id}`}
                className="text-teal-600 hover:underline"
              >
                ➕ Add Role
              </Link>
            </div>

            {renderBranch(dept.id, level + 1, currentPath)}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      <section className="py-16 px-6 bg-teal-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center text-teal-900">🏢 Organisation Chart</h1>

          <div className="flex justify-center gap-4 mb-8">
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
            <Link
              href="/admin/departments/manage"
              className="bg-gray-700 text-white px-6 py-2 rounded-full shadow hover:bg-gray-800 transition flex items-center"
            >
              🛠 Manage Departments
            </Link>
          </div>

          {renderBranch(ROOT_DEPT_ID)}
        </div>
      </section>

      <Footer />
    </main>
  )
}
