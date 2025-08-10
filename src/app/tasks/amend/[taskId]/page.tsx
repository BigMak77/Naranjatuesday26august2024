'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

const frequencyOptions = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']

export default function EditTaskPage() {
  const params = useParams()
  const taskid = Array.isArray(params.taskid) ? params.taskid[0] : params.taskid
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [area, setArea] = useState('')
  const [frequency, setFrequency] = useState('')
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true)

      if (!taskid) {
        setError('Missing task ID.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('turkus_tasks')
        .select('*')
        .eq('id', taskid)
        .single()

      if (error || !data) {
        setError('Task not found.')
      } else {
        setTitle(data.title || '')
        setArea(data.area || '')
        setFrequency(data.frequency || '')
        setInstructions(data.instructions || '')
      }

      setLoading(false)
    }

    fetchTask()
  }, [taskid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error } = await supabase
      .from('turkus_tasks')
      .update({
        title: title.trim(),
        area: area.trim(),
        frequency,
        instructions: instructions.trim(),
      })
      .eq('id', taskid)

    setSubmitting(false)

    if (error) {
      setError('❌ Failed to update task.')
    } else {
      router.push('/turkus/tasks/amend')
    }
  }

  if (loading) return <p className="p-6">Loading task data...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <div className="p-6 max-w-2xl mx-auto flex-grow">
      <h1 className="text-2xl font-bold text-orange-600 mb-6">Edit Task</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Task Title"
          className="w-full border p-2 rounded text-teal-900"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Area"
          className="w-full border p-2 rounded text-teal-900"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          required
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full border p-2 rounded text-teal-900"
          required
        >
          <option value="">Select Frequency</option>
          {frequencyOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <textarea
          placeholder="Instructions"
          className="w-full border p-2 rounded text-teal-900 min-h-[120px]"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded font-medium"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/turkus/tasks/amend')}
            className="text-gray-600 underline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
