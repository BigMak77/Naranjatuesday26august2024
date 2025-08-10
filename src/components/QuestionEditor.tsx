// components/QuestionEditor.tsx
'use client'

import { Question, Department } from '@/types'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type Props = {
  questions: Question[]
  departments: Department[]
  updateQuestion: (id: string, field: keyof Question, value: any) => void
  removeQuestion: (id: string) => void
  addQuestion: () => void
  bulkAddQuestions: (bulkText: string) => void
}

export default function QuestionEditor({
  questions,
  departments,
  updateQuestion,
  removeQuestion,
  addQuestion,
  bulkAddQuestions,
}: Props) {
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [bulkText, setBulkText] = useState('')

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-orange-800">📋 Audit Questions</h2>

      <button
        type="button"
        onClick={() => setShowBulkInput(!showBulkInput)}
        className="text-sm text-orange-700 underline mb-4"
      >
        {showBulkInput ? 'Hide Bulk Input' : '➕ Bulk Add Questions'}
      </button>

      {showBulkInput && (
        <div className="mb-6">
          <textarea
            className="w-full border px-3 py-2 rounded"
            rows={5}
            placeholder="Paste questions here, one per line..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 bg-orange-600 text-white px-4 py-1 rounded hover:bg-orange-700"
            onClick={() => {
              bulkAddQuestions(bulkText)
              setBulkText('')
              setShowBulkInput(false)
            }}
          >
            Add Questions
          </button>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="border border-[#40E0D0] rounded-xl p-4 bg-[#011f24] shadow-glow">
            <label className="block text-sm font-medium mb-1 text-[#40E0D0]">
              Question {i + 1}
            </label>
            <input
              type="text"
              value={q.question_text}
              onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
              className="w-full border border-[#40E0D0] px-3 py-2 rounded mb-2 bg-[#011f24] text-[#40E0D0] shadow-glow focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
              required
            />
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="text-sm text-[#40E0D0] px-2 py-1 rounded bg-[#011f24] border border-[#40E0D0] shadow-glow">
                Pass / Fail / N/A
              </span>
              <select
                value={q.fail_department_id || ''}
                onChange={(e) => updateQuestion(q.id, 'fail_department_id', e.target.value)}
                className="border border-[#40E0D0] px-2 py-1 rounded bg-[#011f24] text-[#40E0D0] shadow-glow focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
              >
                <option value="">Escalate to department (optional)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-sm text-red-500 hover:underline px-3 py-1 rounded bg-[#011f24] border border-red-500 shadow-glow focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 px-4 py-2 rounded bg-[#40E0D0] text-black font-semibold shadow-glow hover:bg-orange-500 hover:text-black transition"
        onClick={addQuestion}
      >
        ➕ Add Question
      </button>
    </div>
  )
}
