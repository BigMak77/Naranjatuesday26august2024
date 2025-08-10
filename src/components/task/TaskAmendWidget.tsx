'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useUser } from '@/context/UserContext'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import NeonForm from '@/components/NeonForm'

export default function TaskAmendWidget() {
  const { user, loading: userLoading } = useUser()
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('')
  const [frequency, setFrequency] = useState('')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch tasks for the current user
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, area, frequency, instructions, created_by')
      .eq('created_by', user?.auth_id)

    if (error) setError('Failed to load tasks.')
    setTasks(data || [])
  }

  useEffect(() => {
    if (user?.auth_id) fetchTasks()
  }, [user])

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(taskId)
      setTitle(task.title)
      setArea(task.area)
      setFrequency(task.frequency)
      setInstructions(task.instructions)
      setSuccess(false)
      setError(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase
      .from('tasks')
      .update({ title, area, frequency, instructions })
      .eq('id', selectedTask)

    if (error) setError('Failed to save changes.')
    else {
      setSuccess(true)
      await fetchTasks()
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedTask) return
    const confirm = window.confirm('Are you sure you want to delete this task?')
    if (!confirm) return

    setDeleting(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase.from('tasks').delete().eq('id', selectedTask)

    if (error) setError('Failed to delete task.')
    else {
      setSelectedTask('')
      setTitle('')
      setArea('')
      setFrequency('')
      setInstructions('')
      await fetchTasks()
    }

    setDeleting(false)
  }

  if (userLoading) return <p className="neon-info">Loading user...</p>

  return (
    <div className="neon-panel neon-task-amend mb-8">
      <div className="neon-flex items-center gap-3 mb-4">
        <div className="neon-icon-bg">
          <FiEdit />
        </div>
        <h2 className="neon-section-title">Amend Task</h2>
      </div>

      <ul className="neon-list mb-6">
        {tasks.length === 0 ? (
          <li className="neon-info">You haven't created any tasks to amend.</li>
        ) : (
          tasks.map(t => (
            <li key={t.id}>
              <button
                className="neon-link"
                onClick={() => handleEdit(t.id)}
              >
                {t.title}
              </button>
            </li>
          ))
        )}
      </ul>

      {selectedTask && (
        <NeonForm title="Amend Task" submitLabel={saving ? 'Saving...' : 'Save Changes'} onSubmit={handleSave}>
          <div className="neon-grid">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="neon-input"
              placeholder="Title"
            />
            <input
              value={area}
              onChange={e => setArea(e.target.value)}
              className="neon-input"
              placeholder="Area"
            />
          </div>
          <input
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            className="neon-input"
            placeholder="Frequency"
          />
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className="neon-input"
            placeholder="Instructions"
            rows={4}
          />
          <div className="neon-flex gap-4 justify-between neon-flex-col-md-row">
            <button
              type="submit"
              disabled={saving}
              className="neon-btn neon-btn-edit w-full md:w-auto"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="neon-btn neon-btn-danger w-full md:w-auto flex items-center gap-2"
            >
              <FiTrash2 />
              {deleting ? 'Deleting...' : 'Delete Task'}
            </button>
          </div>
          {error && <p className="neon-error mt-2">{error}</p>}
          {success && <p className="neon-success mt-2">Changes saved successfully.</p>}
        </NeonForm>
      )}
    </div>
  )
}
