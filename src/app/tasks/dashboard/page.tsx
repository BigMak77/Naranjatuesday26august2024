'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiClock, FiCheckCircle, FiAlertTriangle, FiCalendar } from 'react-icons/fi'

interface TaskAssignment {
  id: number
  due_date: string
  status: string
  completed_at?: string
  task?: {
    id: number
    title: string
  }
}

const TaskDashboard = () => {
  const [todayTasks, setTodayTasks] = useState<TaskAssignment[]>([])
  const [completedTasks, setCompletedTasks] = useState<TaskAssignment[]>([])
  const [lateTasks, setLateTasks] = useState<TaskAssignment[]>([])
  const [overdueTasks, setOverdueTasks] = useState<TaskAssignment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      const { data: assignments, error } = await supabase
        .from('turkus_assignments')
        .select('id, due_date, status, completed_at, task:turkus_tasks (id, title)')
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        setLoading(false)
        return
      }

      // Helper to get date in YYYY-MM-DD
      const toDateOnly = (dateStr: string) => {
        const d = new Date(dateStr)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }

      // Ensure task is a single object, not an array
      const normalizedTasks = (assignments || []).map(t => ({
        ...t,
        task: Array.isArray(t.task) ? t.task[0] : t.task
      }))

      const completedToday = normalizedTasks.filter((t) => {
        return (
          t.status === 'complete' &&
          t.completed_at &&
          toDateOnly(t.completed_at) === todayStr
        )
      })

      const dueToday = normalizedTasks.filter((t) => {
        return (
          t.due_date &&
          toDateOnly(t.due_date) === todayStr
        )
      })

      const lateCompletions = normalizedTasks.filter((t) => {
        return (
          t.status === 'complete' &&
          t.completed_at &&
          new Date(t.completed_at) > new Date(t.due_date)
        )
      })

      const overdue = normalizedTasks.filter((t) => {
        return (
          t.status !== 'complete' &&
          new Date(t.due_date) < today
        )
      })

      setTodayTasks(dueToday)
      setCompletedTasks(completedToday)
      setLateTasks(lateCompletions)
      setOverdueTasks(overdue)
      setLoading(false)
    }

    fetchDashboard()
  }, [])

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen bg-slate-900 text-white">
      {loading ? (
        <div className="text-center text-slate-400">Loading tasks...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              icon={<FiCalendar />}
              title="Due Today"
              value={todayTasks.length}
            />
            <SummaryCard
              icon={<FiCheckCircle />}
              title="Completed Today"
              value={completedTasks.length}
            />
            <SummaryCard
              icon={<FiClock />}
              title="Late Completions"
              value={lateTasks.length}
            />
            <SummaryCard
              icon={<FiAlertTriangle />}
              title="Overdue"
              value={overdueTasks.length}
            />
          </div>

          <Section title="🕒 Completed Late">
            {lateTasks.length === 0 ? (
              <p className="text-slate-400">No late completions.</p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {lateTasks.map((t) => (
                  <li
                    key={t.id}
                    className="hover:bg-slate-800/50 px-2 py-1 rounded transition"
                  >
                    <strong className="text-teal-300">{t.task?.title}</strong> – Due:{' '}
                    {formatDateTime(t.due_date)}, Completed:{' '}
                    {t.completed_at ? formatDateTime(t.completed_at) : ''}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Overdue Tasks">
            {overdueTasks.length === 0 ? (
              <p className="text-slate-400">No overdue tasks.</p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {overdueTasks.map((t) => (
                  <li
                    key={t.id}
                    className="hover:bg-slate-800/50 px-2 py-1 rounded transition"
                  >
                    <strong className="text-teal-300">{t.task?.title}</strong> – Due:{' '}
                    {formatDateTime(t.due_date)}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

const SummaryCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: number
}) => (
  <div className="flex items-center gap-4 p-5 rounded-lg shadow-md bg-slate-800 border border-teal-500 hover:shadow-teal-500/30 transition">
    <div className="text-3xl text-teal-300">{icon}</div>
    <div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
)

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-teal-300 mb-3 border-b border-teal-700 pb-1">
      {title}
    </h2>
    {children}
  </div>
)

export default TaskDashboard
