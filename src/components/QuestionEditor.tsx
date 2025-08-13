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
        <div className="question-editor-bulk-wrapper">
          <textarea
            className="question-editor-bulk-textarea"
            rows={5}
            placeholder="Paste questions here, one per line..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button
            type="button"
            className="question-editor-bulk-add-btn"
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

      <div className="question-editor-list">
        {questions.map((q, i) => (
          <div key={q.id} className="question-editor-item">
            <label className="question-editor-label">
              Question {i + 1}
            </label>
            <input
              type="text"
              value={q.question_text}
              onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
              className="question-editor-input"
              required
            />
            <div className="question-editor-meta-row">
              <span className="question-editor-meta-badge">
                Pass / Fail / N/A
              </span>
              <select
                value={q.fail_department_id || ''}
                onChange={(e) => updateQuestion(q.id, 'fail_department_id', e.target.value)}
                className="question-editor-select"
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
                  className="question-editor-remove-btn"
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
        className="question-editor-add-btn"
        onClick={addQuestion}
      >
        ➕ Add Question
      </button>
    </div>
  )
}
