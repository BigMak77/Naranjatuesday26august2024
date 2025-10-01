// components/training/TrainingQuestionForm.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Department } from "@/types";

interface Props {
  moduleId: string;
  onAdded?: () => void;
}

export default function TrainingQuestionForm({ moduleId, onAdded }: Props) {
  const [questionText, setQuestionText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [failDepartmentId, setFailDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => setDepartments(data || []));
    supabase
      .from("question_categories")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => setCategories(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    if (!questionText.trim()) {
      setError("Question text is required.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("training_questions").insert({
      question_text: questionText.trim(),
      module_id: moduleId,
      category_id: categoryId || null,
      fail_department_id: failDepartmentId || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setQuestionText("");
      setCategoryId("");
      setFailDepartmentId("");
      if (onAdded) onAdded();
    }
  };

  return (
    <form className="neon-panel" onSubmit={handleSubmit} style={{ maxWidth: 500, marginBottom: 24 }}>
      <h3 className="neon-section-title">Add Training Question</h3>
      <label className="neon-label">Question Text
        <input
          className="neon-input"
          type="text"
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          required
        />
      </label>
      <label className="neon-label">Category
        <select
          className="neon-input"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          <option value="">Select category (optional)</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="neon-label">Escalate to Department
        <select
          className="neon-input"
          value={failDepartmentId}
          onChange={e => setFailDepartmentId(e.target.value)}
        >
          <option value="">None</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </label>
      <button className="neon-btn neon-btn-primary" type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Question"}
      </button>
      {error && <div className="neon-error-message">{error}</div>}
      {success && <div className="neon-success-message">Question added!</div>}
    </form>
  );
}
