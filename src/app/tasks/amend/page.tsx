'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import TaskItem from '@/components/TaskItem'
import '@/styles/task-list.css'

type Task = {
  id: string
  title: string
  area: string
  frequency: string
}

export default function AmendTaskPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('turkus_tasks')
        .select('id, title, area, frequency')
        .order('title', { ascending: true })

      if (error) {
        console.error('Error fetching tasks:', error)
        setError('Failed to load tasks.')
        setTasks([])
      } else {
        setTasks(data || [])
        setError(null)
      }

      setLoading(false)
    }

    fetchTasks()
  }, [])

  const handleEditClick = (id: string) => {
    router.push(`/turkus/tasks/amend/${id}`)
  }

  return (
    <main className="page-main">
      <h1 className="page-title">Amend Tasks</h1>

      {loading ? (
        <p className="info-message">Loading tasks...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="info-message">No tasks available.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={handleEditClick} />
          ))}
        </ul>
      )}
    </main>
  )
}
