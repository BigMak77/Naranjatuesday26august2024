// components/QuestionEditor.tsx
// Custom tooltips added to all buttons
"use client";

import { Question, Department } from "@/types";
import { useState } from "react";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

type Props = {
  questions: Question[];
  departments: Department[];
  updateQuestion: (
    id: string,
    field: keyof Question,
    value: string | number | boolean | null,
  ) => void;
  removeQuestion: (id: string) => void;
  addQuestion: () => void;
  bulkAddQuestions: (bulkText: string) => void;
};

export default function QuestionEditor({
  questions,
  departments,
  updateQuestion,
  removeQuestion,
  addQuestion,
  bulkAddQuestions,
}: Props) {
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState("");

  return (
    <div>
      <h2 className="question-editor-title">
        Audit Questions
      </h2>

      <CustomTooltip text={showBulkInput ? "Hide bulk question input" : "Show bulk question input to add multiple questions at once"}>
        <button
          type="button"
          onClick={() => setShowBulkInput(!showBulkInput)}
          className="question-editor-bulk-toggle"
        >
          {showBulkInput ? "Hide Bulk Input" : "Bulk Add Questions"}
        </button>
      </CustomTooltip>

      {showBulkInput && (
        <div className="question-editor-bulk-wrapper">
          <textarea
            className="question-editor-bulk-textarea"
            rows={5}
            placeholder="Paste questions here, one per line..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <CustomTooltip text="Add all questions from the text area">
            <button
              type="button"
              className="question-editor-bulk-add-btn"
              onClick={() => {
                bulkAddQuestions(bulkText);
                setBulkText("");
                setShowBulkInput(false);
              }}
            >
              Add Questions
            </button>
          </CustomTooltip>
        </div>
      )}

      <div className="question-editor-list">
        {questions.map((q, i) => (
          <div key={q.id} className="question-editor-item">
            <label className="question-editor-label">Question {i + 1}</label>
            <input
              type="text"
              value={q.question_text}
              onChange={(e) =>
                updateQuestion(q.id, "question_text", e.target.value)
              }
              className="question-editor-input"
              required
            />
            <div className="question-editor-meta-row">
              <span className="question-editor-meta-badge">
                Pass / Fail / N/A
              </span>
              <select
                value={q.fail_department_id || ""}
                onChange={(e) =>
                  updateQuestion(q.id, "fail_department_id", e.target.value)
                }
                className="question-editor-select"
              >
                <option value="">Escalate to department (optional)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {questions.length > 1 && (
                <CustomTooltip text="Remove this question from the audit">
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="question-editor-remove-btn"
                  >
                    Remove
                  </button>
                </CustomTooltip>
              )}
            </div>
          </div>
        ))}
      </div>

      <CustomTooltip text="Add a single new question">
        <button
          type="button"
          className="question-editor-add-btn"
          onClick={addQuestion}
        >
          Add Question
        </button>
      </CustomTooltip>
    </div>
  );
}
