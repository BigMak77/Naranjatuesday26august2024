'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useUser } from '@/lib/useUser'

// TaskListWidget: shows all tasks
// TaskAssignWidget: handles assigning tasks to users
// TaskCreateWidget: for creating new tasks
// TaskAmendWidget: for editing/amending tasks
// MyTasksWidget: shows tasks assigned to the logged-in user
// These widgets should be created in /components/task and imported as needed.

export default function AddTurkusTaskPage() {
  const router = useRouter()
  const { user } = useUser()
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [instructions, setInstructions] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const frequencies = [
    'Hourly',
    'Every Few Hours',
    'Twice Daily',
    'Daily',
    'Weekly',
    'Monthly',
    'Quarterly',
    'Annually',
  ]

  const addQuestion = () => setQuestions([...questions, ''])

  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions]
    updated[index] = value
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    const filtered = questions.filter((_, idx) => idx !== index)
    setQuestions(filtered.length > 0 ? filtered : [''])
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    if (!user?.auth_id) {
      setError('User not found. Please log in again.')
      return
    }

    if (questions.some((q) => q.trim() === '')) {
      setError('Please fill in all steps or remove empty ones.')
      return
    }

    setSaving(true)
    setError(null)

    const { data: task, error: insertError } = await supabase
      .from('turkus_tasks')
      .insert({
        title: title.trim(),
        area: area.trim(),
        frequency,
        instructions: instructions.trim(),
        created_by: user.auth_id,
      })
      .select()
      .single()

    if (insertError || !task?.id) {
      console.error(insertError)
      setError('❌ Failed to create task.')
      setSaving(false)
      return
    }

    const validQuestions = questions.filter((q) => q.trim() !== '')
    if (validQuestions.length > 0) {
      const formatted = validQuestions.map((q, idx) => ({
        task_id: task.id,
        question_text: q.trim(),
        sort_order: idx + 1,
      }))
      const { error: qError } = await supabase
        .from('turkus_task_questions')
        .insert(formatted)

      if (qError) {
        console.error(qError)
        setError('Task saved, but failed to save steps.')
        setSaving(false)
        return
      }
    }

    alert('✅ Task created successfully.')
    router.push('/turkus/tasks')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-teal-800 mb-6">➕ Add Turkus Task</h1>

      <div className="space-y-5">
        <div>
          <label className="block font-medium text-teal-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Inspect freezer door"
            className="w-full border border-teal-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium text-teal-700 mb-1">Area</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Cold Room"
            className="w-full border border-teal-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium text-teal-700 mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border border-teal-300 rounded px-4 py-2"
          >
            {frequencies.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-teal-700 mb-1">
            Instructions <span className="text-sm text-gray-500">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full border border-teal-300 rounded px-4 py-2"
            placeholder="Explain how to complete this check"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-teal-700 mb-2">Steps / Questions</h2>
          {questions.map((q, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={q}
                onChange={(e) => updateQuestion(idx, e.target.value)}
                className="flex-1 border border-teal-300 rounded px-3 py-2"
                placeholder={`Step ${idx + 1}`}
              />
              <button
                onClick={() => removeQuestion(idx)}
                type="button"
                className="text-red-600 hover:text-red-800"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center text-sm text-teal-700 hover:text-teal-900 mt-2"
          >
            <FiPlus className="mr-1" /> Add Step
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Task'}
        </button>

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  )
}
