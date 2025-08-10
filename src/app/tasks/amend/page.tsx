'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import TaskItem from '@/components/TaskItem'

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
    <div className="p-6 max-w-4xl mx-auto flex-grow">
      <h1 className="text-2xl font-bold text-orange-600 mb-6">Amend Tasks</h1>

      {loading ? (
        <p>Loading tasks...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-600">No tasks available.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={handleEditClick} />
          ))}
        </ul>
      )}
    </div>
  )
}
