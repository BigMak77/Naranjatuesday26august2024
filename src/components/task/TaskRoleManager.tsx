'use client'

import { useEffect, useState } from 'react'
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

interface Module {
  id: string
  name: string
}

interface RoleWithTasks extends Role {
  tasks: Task[]
  newTaskId?: string
}

export default function TaskRoleManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [assignedRoleIds, setAssignedRoleIds] = useState<Set<string>>(new Set())
  const [assignedModuleRoleIds, setAssignedModuleRoleIds] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [viewDeptId, setViewDeptId] = useState('')
  const [rolesWithTasks, setRolesWithTasks] = useState<RoleWithTasks[]>([])
  const [viewLoading, setViewLoading] = useState(false)

  const [assignMode, setAssignMode] = useState<'role' | 'department'>('role');
  const [assignmentType, setAssignmentType] = useState<'task' | 'module'>('task');

  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: r }, { data: d }, { data: m }] = await Promise.all([
        supabase.from('tasks').select('id, title').order('title'),
        supabase.from('roles').select('id, title, department_id').order('title'),
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('modules').select('id, name').order('name'),
      ])
      setTasks(t || [])
      setRoles(r || [])
      setDepartments(d || [])
      setModules(m || [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedTaskId) return
    const fetchAssignments = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('role_tasks')
        .select('role_id')
        .eq('task_id', selectedTaskId)
      setAssignedRoleIds(new Set(data?.map((d) => d.role_id) || []))
      setLoading(false)
    }
    fetchAssignments()
  }, [selectedTaskId])

  useEffect(() => {
    if (!selectedModuleId) return
    const fetchAssignments = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('role_modules')
        .select('role_id')
        .eq('module_id', selectedModuleId)
      setAssignedModuleRoleIds(new Set(data?.map((d) => d.role_id) || []))
      setLoading(false)
    }
    fetchAssignments()
  }, [selectedModuleId])

  const toggleRole = (roleId: string) => {
    const newSet = new Set(assignedRoleIds)
    newSet.has(roleId) ? newSet.delete(roleId) : newSet.add(roleId)
    setAssignedRoleIds(newSet)
  }

  const toggleModuleRole = (roleId: string) => {
    const newSet = new Set(assignedModuleRoleIds)
    newSet.has(roleId) ? newSet.delete(roleId) : newSet.add(roleId)
    setAssignedModuleRoleIds(newSet)
  }

  const selectAllVisible = () => {
    const visibleRoleIds = filteredRoles.map(r => r.id)
    setAssignedRoleIds(new Set([...assignedRoleIds, ...visibleRoleIds]))
  }

  const clearAllVisible = () => {
    const updated = new Set(assignedRoleIds)
    filteredRoles.forEach(r => updated.delete(r.id))
    setAssignedRoleIds(updated)
  }

  const handleSave = async () => {
    if (!selectedTaskId) return
    setSaving(true)
    await supabase.from('role_tasks').delete().eq('task_id', selectedTaskId)
    const newLinks = Array.from(assignedRoleIds).map(roleId => ({ task_id: selectedTaskId, role_id: roleId }))
    if (newLinks.length > 0) await supabase.from('role_tasks').insert(newLinks)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const handleModuleSave = async () => {
    if (!selectedModuleId) return
    setSaving(true)
    await supabase.from('role_modules').delete().eq('module_id', selectedModuleId)
    const newLinks = Array.from(assignedModuleRoleIds).map(roleId => ({ module_id: selectedModuleId, role_id: roleId }))
    if (newLinks.length > 0) await supabase.from('role_modules').insert(newLinks)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const filteredRoles = roles.filter(role =>
    (!filterDept || role.department_id === filterDept) &&
    role.title.toLowerCase().includes(filterText.toLowerCase())
  )

  const loadRolesWithTasks = async (deptId: string) => {
    setViewLoading(true)
    const { data: deptRoles } = await supabase
      .from('roles')
      .select('id, title, department_id')
      .eq('department_id', deptId)

    if (!deptRoles) {
      setRolesWithTasks([])
      setViewLoading(false)
      return
    }

    const roleIds = deptRoles.map(r => r.id)
    const { data: assignments } = await supabase
      .from('role_tasks')
      .select('role_id, task_id')
      .in('role_id', roleIds)

    const taskMap = new Map(tasks.map(t => [t.id, t]))
    const rolesWith = deptRoles.map(role => {
      const taskIds = assignments?.filter(a => a.role_id === role.id).map(a => a.task_id) || []
      const assignedTasks = taskIds.map(id => taskMap.get(id)).filter(Boolean) as Task[]
      return { ...role, tasks: assignedTasks, newTaskId: '' }
    })

    setRolesWithTasks(rolesWith)
    setViewLoading(false)
  }

  useEffect(() => {
    if (viewDeptId) loadRolesWithTasks(viewDeptId)
  }, [viewDeptId, tasks])

  const addTaskToRole = async (roleId: string, taskId: string) => {
    await supabase.from('role_tasks').insert({ role_id: roleId, task_id: taskId })
    loadRolesWithTasks(viewDeptId)
  }

  const removeTaskFromRole = async (roleId: string, taskId: string) => {
    await supabase.from('role_tasks').delete().match({ role_id: roleId, task_id: taskId })
    loadRolesWithTasks(viewDeptId)
  }

  const updateNewTaskId = (roleId: string, taskId: string) => {
    setRolesWithTasks(prev =>
      prev.map(role =>
        role.id === roleId ? { ...role, newTaskId: taskId } : role
      )
    )
  }

  if (departments.length === 0 || roles.length === 0) return null

  return (
    <div>
      <h2 className="neon-section-title mb-4 flex items-center gap-2">
        <FiClipboard /> Task Role Manager
      </h2>
      {/* ...rest of your component UI... */}
    </div>
  )
}
