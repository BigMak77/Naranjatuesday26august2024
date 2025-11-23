"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";

export default function AddTrainingQuestionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    question_text: "",
    category_id: "",
    points: 1,
    type: "mcq_single",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [answers, setAnswers] = useState([
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);
  const [existingQuestions, setExistingQuestions] = useState<{ id: string; question_text: string; category_id: string }[]>([]);
  const [selectedExisting, setSelectedExisting] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("question_categories")
        .select("id, name")
        .order("name");
      if (ignore) return;
      if (error) {
        setError("Failed to load categories: " + error.message);
        setCategories([]);
      } else {
        setCategories(data || []);
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!form.category_id) {
      setExistingQuestions([]);
      return;
    }
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("training_questions")
        .select("id, question_text, category_id")
        .eq("category_id", form.category_id);
      if (ignore) return;
      if (error) {
        setExistingQuestions([]);
      } else {
        setExistingQuestions(data || []);
      }
    })();
    return () => { ignore = true; };
  }, [form.category_id]);

  function handleAnswerChange(idx: number, field: "text" | "is_correct", value: string | boolean) {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      )
    );
  }

  function addAnswer() {
    setAnswers((prev) => [...prev, { text: "", is_correct: false }]);
  }

  function removeAnswer(idx: number) {
    setAnswers((prev) => prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let questionId: string | undefined;
      if (selectedExisting.length > 0) {
        questionId = selectedExisting[0];
      } else {
        if (!answers.some(a => a.is_correct)) {
          setError("At least one answer must be marked correct.");
          setLoading(false);
          return;
        }
        if (answers.some(a => !a.text.trim())) {
          setError("All answer fields must be filled.");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.from("training_questions").insert([
          {
            question_text: form.question_text,
            category_id: form.category_id,
            points: Number(form.points),
            type: form.type,
          },
        ]).select();
        if (error) throw error;
        questionId = data?.[0]?.id;
        if (!questionId) throw new Error("Failed to create question.");
        const { error: ansError } = await supabase.from("question_options").insert(
          answers.map(a => ({
            question_id: questionId,
            answer_text: a.text,
            is_correct: a.is_correct,
          }))
        );
        if (ansError) throw ansError;
      }
      setForm({ question_text: "", category_id: "", points: 1, type: "mcq_single" });
      setAnswers([
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ]);
      setSelectedExisting([]);
      setOpenForm(false);
      setShowSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', width: '100%' }}>
      <div style={{ width: '100%', height: '100%' }}>
        <NeonPanel>
          {showSuccess && (
            <div className="training-card training-success">Question Added!</div>
          )}
          <form className="neon-form" onSubmit={handleSubmit} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 id="add-training-form-title">Add Training Question</h2>
            {error && <div className="training-card training-danger">{error}</div>}
            <label>
              Category
              <select
                className="neon-input"
                required
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">Select a category…</option>
                {categories.length === 0 && <option disabled>No categories found</option>}
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            {form.category_id && existingQuestions.length > 0 && (
              <label>
                Select Existing Question
                <select
                  className="neon-input"
                  value={selectedExisting[0] || ""}
                  onChange={e => setSelectedExisting(e.target.value ? [e.target.value] : [])}
                >
                  <option value="">-- Select a question --</option>
                  {existingQuestions.map(q => (
                    <option key={q.id} value={q.id}>{q.question_text}</option>
                  ))}
                </select>
              </label>
            )}
            {/* Only show the new question form if not selecting existing */}
            {(!selectedExisting.length) && (
              <>
                <label>
                  Question Text
                  <input
                    className="neon-input"
                    required
                    value={form.question_text}
                    onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                  />
                </label>
                <label>
                  Points
                  <input
                    className="neon-input"
                    type="number"
                    min={1}
                    value={form.points}
                    onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Type
                  <select
                    className="neon-input"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="mcq_single">Multiple Choice (Single Answer)</option>
                    <option value="mcq_multi">Multiple Choice (Multiple Answers)</option>
                  </select>
                </label>
                <div>
                  <label className="neon-label">Answers</label>
                  {answers.map((a, idx) => (
                    <div key={`answer-${idx}-${a.text.substring(0, 10)}`}>
                      <input
                        className="neon-input"
                        placeholder={`Answer ${idx + 1}`}
                        value={a.text}
                        onChange={e => handleAnswerChange(idx, "text", e.target.value)}
                        required
                      />
                      <label className="neon-checkbox-label">
                        <input
                          type="checkbox"
                          checked={a.is_correct}
                          onChange={e => handleAnswerChange(idx, "is_correct", e.target.checked)}
                        />
                        Correct
                      </label>
                      {answers.length > 2 && (
                        <button type="button" className="neon-btn neon-btn-icon neon-btn-danger" onClick={() => removeAnswer(idx)}>
                          <span className="neonicon-cancel" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="neon-btn neon-btn-icon neon-btn-primary" onClick={addAnswer}>
                    <span className="neonicon-plus" /> Add Answer
                  </button>
                </div>
              </>
            )}
            <button
              className="neon-btn neon-btn-next"
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding…" : "Add Question"}
            </button>
          </form>
        </NeonPanel>
      </div>
    </div>
  );
}
