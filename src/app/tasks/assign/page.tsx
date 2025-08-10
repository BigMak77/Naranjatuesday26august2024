'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useUser } from '@/lib/useUser'

export default function AssignTask() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState(false)
  const [interval, setInterval] = useState('daily')
  const [intervalCount, setIntervalCount] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.auth_id) return

      const { data: taskData } = await supabase
        .from('turkus_tasks')
        .select('id, title')
      setTasks(taskData || [])

      const { data: manager } = await supabase
        .from('users')
        .select('department_id')
        .eq('auth_id', user.auth_id)
        .single()

      if (!manager?.department_id) return

      const { data: teamData } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name')
        .eq('department_id', manager.department_id)
        .neq('auth_id', user.auth_id)

      setUsers(teamData || [])
    }

    fetchData()
  }, [user])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!selectedTask || !selectedUser || !dueDate) {
      alert('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (!user?.auth_id) {
      alert('User not found. Please log in again.')
      setLoading(false)
      return
    }

    // Assign the task
    const { error: assignError } = await supabase.from('task_assignments').insert({
      task_id: selectedTask,
      assigned_to: selectedUser,
      assigned_by: user.auth_id,
      due_date: dueDate,
    })

    if (assignError) {
      alert('Error assigning task.')
      console.error(assignError)
      setLoading(false)
      return
    }

    // Add recurrence if needed
    if (recurrence) {
      const { data: managerMeta, error: metaError } = await supabase
        .from('users')
        .select('department_id')
        .eq('auth_id', user.auth_id)
        .single()

      if (!metaError && managerMeta?.department_id) {
        const { error: recurrenceError } = await supabase
          .from('recurring_assignments')
          .insert({
            task_id: selectedTask,
            assigned_by: user.auth_id,
            department_id: managerMeta.department_id,
            frequency: interval,
            interval_count: intervalCount,
            next_due_at: dueDate,
          })

        if (recurrenceError) {
          console.error('Recurrence error:', recurrenceError)
          alert('Task assigned, but failed to set recurrence.')
        }
      }
    }

    alert('✅ Task assigned successfully.')
    setSelectedTask('')
    setSelectedUser('')
    setDueDate('')
    setRecurrence(false)
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-orange-600 mb-6">📌 Assign Task</h1>

      <form onSubmit={handleAssign} className="space-y-4">
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="w-full border px-3 py-2 rounded text-teal-900 bg-white"
          required
        >
          <option value="">Select Task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full border px-3 py-2 rounded text-teal-900 bg-white"
          required
        >
          <option value="">Select User</option>
          {users.map((u) => (
            <option key={u.auth_id} value={u.auth_id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border px-3 py-2 rounded text-teal-900"
          required
        />

        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={recurrence}
            onChange={(e) => setRecurrence(e.target.checked)}
          />
          <span className="text-teal-900 font-medium">Set Recurrence</span>
        </label>

        {recurrence && (
          <div className="pl-4 space-y-2">
            <div>
              <label className="text-sm text-teal-700 font-medium">Repeat Every</label>
              <input
                type="number"
                min={1}
                value={intervalCount}
                onChange={(e) => setIntervalCount(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-sm text-teal-700 font-medium">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-medium w-full"
          disabled={loading}
        >
          {loading ? 'Assigning...' : 'Assign Task'}
        </button>
      </form>
    </div>
  )
}
