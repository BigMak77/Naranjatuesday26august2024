'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiClipboard } from 'react-icons/fi'

interface Task {
  id: string
  title: string
}

interface Role {
  id: string
  title: string
  department_id: string
}

interface Department {
  id: string
  name: string
}

export default function TaskRoleManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: r }, { data: d }] = await Promise.all([
        supabase.from('tasks').select('id, title').order('title'),
        supabase.from('roles').select('id, title, department_id').order('title'),
        supabase.from('departments').select('id, name').order('name'),
      ])
      setTasks(t || [])
      setRoles(r || [])
      setDepartments(d || [])
    }
    load()
  }, [])

  const loadRolesWithTasks = useCallback(async (deptId: string) => {
    const { data: deptRoles } = await supabase
      .from('roles')
      .select('id, title, department_id')
      .eq('department_id', deptId)

    if (!deptRoles) {
      return
    }

    const roleIds = deptRoles.map(r => r.id)
    const { data: assignments } = await supabase
      .from('role_tasks')
      .select('role_id, task_id')
      .in('role_id', roleIds)

    const taskMap = new Map(tasks.map(t => [t.id, t]))
    deptRoles.map(role => {
      const taskIds = assignments?.filter(a => a.role_id === role.id).map(a => a.task_id) || []
      const assignedTasks = taskIds.map(id => taskMap.get(id)).filter(Boolean) as Task[]
      return { ...role, tasks: assignedTasks, newTaskId: '' }
    })
  }, [tasks]);

  useEffect(() => {
    loadRolesWithTasks('')
  }, [tasks, loadRolesWithTasks])

  if (departments.length === 0 || roles.length === 0) return null

  return (
    <div>
      <h2 className="neon-section-title">
        <FiClipboard /> Task Role Manager
      </h2>
      {/* ...rest of your component UI... */}
    </div>
  )
}
