'use client'

import React, { useEffect, useState } from 'react'
import NeonPanel from '@/components/NeonPanel'
import { supabase } from '@/lib/supabase-client'

interface Module {
  id: string
  name: string
}
interface Department {
  id: string
  name: string
}
interface User {
  id: string
  name: string
  department_id: string
  auth_id: string
}

export default function AssignModuleTab() {
  const [modules, setModules] = useState<Module[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [userSearch, setUserSearch] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [feedback, setFeedback] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: m, error: mErr }, { data: d, error: dErr }, { data: u, error: uErr }] = await Promise.all([
        supabase.from('modules').select('id, name'),
        supabase.from('departments').select('id, name'),
        supabase.from('users').select('id, first_name, last_name, department_id, auth_id'),
      ])
      setModules(m || [])
      setDepartments(d || [])
      setUsers((u || []).map(user => ({
        id: user.id,
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        department_id: user.department_id,
        auth_id: user.auth_id
      })))
      setLoading(false)
      if (mErr || dErr || uErr) {
        setFeedback(`Failed to load data.\nModules: ${mErr?.message || ''}\nDepartments: ${dErr?.message || ''}\nUsers: ${uErr?.message || ''}`)
      }
    }
    load()
  }, [])

  const handleAssign = async () => {
    if (!selectedModule || (!selectedDepartment && !selectedUser)) {
      setFeedback('Select a module and a department or user.')
      return
    }
    setAssigning(true)
    setFeedback('')
    let userIds: string[] = []
    if (selectedUser) {
      userIds = [users.find(u => u.id === selectedUser)?.auth_id || selectedUser]
    } else if (selectedDepartment) {
      userIds = users.filter(u => u.department_id === selectedDepartment).map(u => u.auth_id)
    }
    if (userIds.length === 0) {
      setFeedback('No users found for assignment.')
      setAssigning(false)
      return
    }
    // Check for existing assignments
    const { data: existing, error: existErr } = await supabase
      .from('user_modules')
      .select('auth_id')
      .in('auth_id', userIds)
      .eq('module_id', selectedModule)
    if (existErr) {
      setFeedback(`Error checking existing assignments: ${existErr.message}`)
      setAssigning(false)
      return
    }
    const alreadyAssigned = (existing || []).map(e => e.auth_id)
    const toAssign = userIds.filter(uid => !alreadyAssigned.includes(uid))
    // Assign module to users who don't have it yet
    const { error, status } = await supabase.from('user_modules').insert(
      toAssign.map(auth_id => ({ auth_id, module_id: selectedModule }))
    )
    if (error) {
      setFeedback(`Assignment failed. ${error.message}`)
    } else {
      setFeedback(`Module assigned to ${toAssign.length} user(s)!`)
    }
    setAssigning(false)
  }

  if (loading) return <NeonPanel className="neon-panel-module p-4">Loading...</NeonPanel>

  return (
    <NeonPanel className="neon-panel-module space-y-6">
      <h3 className="neon-section-title">🟩 Assign Training Module</h3>
      <div>
        <label className="neon-label mb-2">Select Module:</label>
        <select
          className="neon-input w-full"
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
        >
          <option value="">-- Choose Module --</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="neon-flex gap-6">
        <div className="flex-1">
          <label className="neon-label mb-2">Assign to Department:</label>
          <select
            className="neon-input w-full"
            value={selectedDepartment}
            onChange={e => {
              setSelectedDepartment(e.target.value)
              setSelectedUser('')
            }}
          >
            <option value="">-- Choose Department --</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="neon-label mb-2">Or assign to User:</label>
          <input
            type="text"
            className="neon-input w-full mb-2"
            placeholder="Search users..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
          <select
            className="neon-input w-full"
            value={selectedUser}
            onChange={e => {
              setSelectedUser(e.target.value)
              setSelectedDepartment('')
            }}
          >
            <option value="">-- Choose User --</option>
            {(selectedDepartment
              ? users.filter(u => u.department_id === selectedDepartment)
              : users
            ).filter(u =>
              u.name.toLowerCase().includes(userSearch.toLowerCase())
            ).map(u => (
              <option key={u.id} value={u.id}>{u.name} ({departments.find(d => d.id === u.department_id)?.name || 'No Dept'})</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleAssign}
        disabled={assigning}
        className="neon-btn neon-btn-edit"
      >
        {assigning ? 'Assigning...' : 'Assign Module'}
      </button>
      {feedback && <div className="neon-info mt-2 whitespace-pre-line">{feedback}</div>}
    </NeonPanel>
  )
}
