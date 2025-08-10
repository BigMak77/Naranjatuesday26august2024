'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import HeroHeader from '@/components/HeroHeader'
import NeonForm from '@/components/NeonForm'
import NeonTable from '@/components/NeonTable'
import MyTasksWidget from '@/components/task/MyTasksWidget'
import { FiAlertCircle, FiClock } from 'react-icons/fi'

export default function TurkusAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)

      const [{ data: tasks }, { data: users }, { data: assignments }, { data: departments }] = await Promise.all([
        supabase.from('turkus_tasks').select('id, title, area, frequency'),
        supabase.from('users').select('auth_id, first_name, last_name, department_id'),
        supabase
          .from('turkus_assignments')
          .select(`
            id,
            due_date,
            task:turkus_tasks (title),
            user:users (first_name, last_name, department_id)
          `),
        supabase.from('departments').select('id, name'),
      ])

      setTasks(tasks || [])
      setUsers(users || [])
      setAssignments(assignments || [])
      setDepartments(departments || [])
      setLoading(false)
    }

    fetchAll()
  }, [])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !selectedUser || !dueDate) {
      alert('Please select task, user, and due date.')
      return
    }

    const user = users.find((u) => u.auth_id === selectedUser)

    const { error } = await supabase.from('turkus_assignments').insert({
      task_id: selectedTask,
      user_auth_id: selectedUser,
      department_id: user?.department_id || null,
      due_date: dueDate,
    })

    if (error) {
      alert('Failed to assign task.')
      console.error(error)
    } else {
      setSelectedTask('')
      setSelectedUser('')
      setDueDate('')

      // Refresh assignments
      const { data } = await supabase
        .from('turkus_assignments')
        .select(`
          id,
          due_date,
          task:turkus_tasks (title),
          user:users (first_name, last_name, department_id)
        `)

      setAssignments(data || [])
    }
  }

  return (
    <>
      <HeroHeader
        title="Assign Turkus Tasks"
        subtitle="Assign tasks to users and manage Turkus assignments."
      />
      <div className="centered-content">
        <div className="max-w-6xl w-full px-8 mt-10 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <NeonForm title="Assign a Task" onSubmit={handleAssign} submitLabel="➕ Assign Task">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="neon-form-title">Task</label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="neon-input"
                    required
                  >
                    <option value="">Select a task</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="neon-form-title">User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="neon-input"
                    required
                  >
                    <option value="">Select a user</option>
                    {users.map((u) => (
                      <option key={u.auth_id} value={u.auth_id}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="neon-form-title">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="neon-input"
                    required
                  />
                </div>
              </div>
            </NeonForm>
            <MyTasksWidget />
          </div>
          {loading ? (
            <p className="neon-success">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="neon-success">No assignments found.</p>
          ) : (
            <NeonTable
              columns={[
                { header: 'Task', accessor: 'task' },
                { header: 'User', accessor: 'user' },
                { header: 'Department', accessor: 'department' },
                { header: 'Due Date', accessor: 'due_date' },
              ]}
              data={assignments.map((a) => {
                let dueDateCell: React.ReactNode = '-';
                if (a.due_date) {
                  const due = new Date(a.due_date);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                  if (diff < 0) {
                    // Overdue
                    dueDateCell = (
                      <span
                        className="neon-error animate-pulse flex items-center justify-center cursor-pointer relative group"
                        tabIndex={0}
                      >
                        <FiAlertCircle className="inline" />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-8 mb-2 w-max px-3 py-1 rounded bg-black bg-opacity-80 text-xs neon-error opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50 pointer-events-auto shadow-lg border border-red-500">
                          Overdue: This assignment was due on {due.toLocaleDateString('en-GB')}
                        </span>
                      </span>
                    );
                  } else if (diff <= 1) {
                    // Due today or tomorrow
                    dueDateCell = (
                      <span
                        className="neon-warning animate-pulse flex items-center justify-center cursor-pointer relative group"
                        tabIndex={0}
                      >
                        <FiClock className="inline" />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-8 mb-2 w-max px-3 py-1 rounded bg-black bg-opacity-80 text-xs neon-warning opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50 pointer-events-auto shadow-lg border border-yellow-400">
                          Due soon: {due.toLocaleDateString('en-GB')}
                        </span>
                      </span>
                    );
                  } else {
                    dueDateCell = (
                      <span className="neon-info flex items-center justify-center">{due.toLocaleDateString('en-GB')}</span>
                    );
                  }
                }
                // Get department name from departments list
                let departmentName = '-';
                if (a.user?.department_id) {
                  const deptObj = departments.find(d => d.id === a.user.department_id);
                  departmentName = deptObj?.name || a.user.department_id || '-';
                }
                return {
                  task: a.task?.title || '-',
                  user: a.user ? `${a.user.first_name} ${a.user.last_name}` : '-',
                  department: departmentName,
                  due_date: dueDateCell,
                };
              })}
            />
          )}
        </div>
      </div>
    </>
  )
}
