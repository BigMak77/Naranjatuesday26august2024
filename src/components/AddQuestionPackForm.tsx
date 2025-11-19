// Custom tooltips added to all buttons
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonPanel from "@/components/NeonPanel";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SuccessModal from "@/components/ui/SuccessModal";
import TextIconButton from "@/components/ui/TextIconButtons";

export default function AddQuestionPackForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    pass_mark: 80,
    max_attempts: 1,
    time_limit_minutes: 30,
    is_active: true,
    version: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryQuestions, setCategoryQuestions] = useState<{ id: string; question_text: string }[]>([]);
  const [selectedExisting, setSelectedExisting] = useState<string[]>([]);
  const [showAddMore, setShowAddMore] = useState(false);
  const [createdPackId, setCreatedPackId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("question_categories")
        .select("id, name")
        .order("name");
      if (!error && data) setCategories(data);
      else setCategories([]);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryQuestions([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("training_questions")
        .select("id, question_text")
        .eq("category_id", selectedCategory);
      if (!error && data) setCategoryQuestions(data);
      else setCategoryQuestions([]);
    })();
  }, [selectedCategory]);

  function handleQuestionChange(idx: number, value: string) {
    setQuestions(prev => prev.map((q, i) => i === idx ? value : q));
  }

  function addQuestionField() {
    setQuestions(prev => [...prev, ""]);
  }

  function removeQuestionField(idx: number) {
    setQuestions(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    let packId = createdPackId;
    // Insert the pack first if not already created
    if (!packId) {
      const { data, error } = await supabase.from("question_packs").insert([
        {
          ...form,
          pass_mark: Number(form.pass_mark),
          max_attempts: Number(form.max_attempts),
          time_limit_minutes: Number(form.time_limit_minutes),
          is_active: !!form.is_active,
          version: Number(form.version),
        },
      ]).select();
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
      packId = data?.[0]?.id;
      setCreatedPackId(packId);
      if (!packId) {
        setLoading(false);
        setError("Failed to create question pack.");
        return;
      }
    }
    // Insert new questions if any are provided
    const validQuestions = questions.map(q => q.trim()).filter(q => q.length > 0);
    let newQuestionIds: string[] = [];
    if (validQuestions.length > 0) {
      const { data: newQs, error: qErr } = await supabase.from("training_questions").insert(
        validQuestions.map(q => ({
          question_text: q,
          category_id: selectedCategory || null,
        }))
      ).select();
      if (qErr) {
        setLoading(false);
        setError(qErr.message);
        return;
      }
      newQuestionIds = (newQs || []).map((q: any) => q.id).filter(Boolean);
    }
    // Insert into join table for both new and selected questions
    const allQuestionIds = [...selectedExisting, ...newQuestionIds];
    if (allQuestionIds.length > 0) {
      const rows = allQuestionIds.map(qid => ({ pack_id: packId, question_id: qid }));
      const { error: joinErr } = await supabase.from("question_pack_questions").insert(rows);
      if (joinErr) {
        setLoading(false);
        setError(joinErr.message);
        return;
      }
    }
    setLoading(false);
    setShowAddMore(true);
    // Do not reset form yet, wait for user choice
  }

  function handleAddAnotherCategory() {
    setSelectedCategory("");
    setCategoryQuestions([]);
    setSelectedExisting([]);
    setQuestions([""]);
    setShowAddMore(false);
  }

  function handleFinish() {
    setSuccess(true);
    setForm({
      title: "",
      description: "",
      pass_mark: 80,
      max_attempts: 1,
      time_limit_minutes: 30,
      is_active: true,
      version: 1,
    });
    setQuestions([""]);
    setSelectedCategory("");
    setCategoryQuestions([]);
    setSelectedExisting([]);
    setCreatedPackId(null);
    setShowAddMore(false);
    if (onSuccess) onSuccess();
  }

  return (
    <>
      <form className="neon-form" onSubmit={handleSubmit}>
        <h2>Add Question Pack</h2>
        {error && <div className="training-card training-danger">{error}</div>}
        {success && <div className="training-card training-badgePass">Pack added!</div>}
        <label>
          Title
          <input className="neon-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </label>
        <label>
          Description
          <textarea className="neon-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </label>
        <label>
          Pass Mark (%)
          <input className="neon-input" type="number" min={0} max={100} required value={form.pass_mark} onChange={e => setForm(f => ({ ...f, pass_mark: Number(e.target.value) }))} />
        </label>
        <label>
          Max Attempts
          <input className="neon-input" type="number" min={1} required value={form.max_attempts} onChange={e => setForm(f => ({ ...f, max_attempts: Number(e.target.value) }))} />
        </label>
        <label>
          Time Limit (minutes)
          <input className="neon-input" type="number" min={0} value={form.time_limit_minutes} onChange={e => setForm(f => ({ ...f, time_limit_minutes: Number(e.target.value) }))} />
        </label>
        <label className="neon-checkbox-label">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          Active
        </label>
        <label>
          Version
          <input className="neon-input" type="number" min={1} value={form.version} onChange={e => setForm(f => ({ ...f, version: Number(e.target.value) }))} />
        </label>
        <label>
          Category
          <select
            className="neon-input"
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedExisting([]);
            }}
          >
            <option value="">Select a category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        {selectedCategory && categoryQuestions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label className="neon-label">Select Existing Questions</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #222', borderRadius: 6, padding: 8, background: '#0a1a1a' }}>
              {categoryQuestions.map(q => (
                <label key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedExisting.includes(q.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedExisting(prev => [...prev, q.id]);
                      else setSelectedExisting(prev => prev.filter(id => id !== q.id));
                    }}
                  />
                  <span>{q.question_text}</span>
                </label>
              ))}
              {categoryQuestions.length === 0 && <div className="neon-info">No questions in this category.</div>}
            </div>
          </div>
        )}
        <div style={{ margin: '16px 0' }}>
          <label className="neon-label">Add New Questions</label>
          {questions.map((q, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <input
                className="neon-input"
                placeholder={`Question ${idx + 1}`}
                value={q}
                onChange={e => handleQuestionChange(idx, e.target.value)}
                required={idx === 0 && selectedExisting.length === 0}
              />
              {questions.length > 1 && (
                <CustomTooltip text="Remove this question field">
                  <TextIconButton
                    variant="delete"
                    label="Remove"
                    onClick={() => removeQuestionField(idx)}
                  />
                </CustomTooltip>
              )}
            </div>
          ))}
          <CustomTooltip text="Add another question input field">
            <TextIconButton
              variant="add"
              label="Add Question"
              onClick={addQuestionField}
            />
          </CustomTooltip>
        </div>
        <CustomTooltip text={loading ? "Creating question pack..." : createdPackId ? "Add questions from another category" : "Create the question pack"}>
          <TextIconButton
            variant="next"
            label={loading ? "Adding…" : createdPackId ? "Add More from Category" : "Add Pack"}
            type="submit"
            disabled={loading}
          />
        </CustomTooltip>
      </form>
      {/* Add More Modal */}
      {showAddMore && (
        <OverlayDialog showCloseButton={true} open={showAddMore} onClose={handleFinish} ariaLabelledby="add-more-title">
          <NeonPanel>
            <h2 id="add-more-title">Add More Questions?</h2>
            <p>Would you like to add questions from another category to this pack?</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <CustomTooltip text="Add questions from another category to this pack">
                <TextIconButton
                  variant="primary"
                  label="Yes, add from another category"
                  onClick={handleAddAnotherCategory}
                />
              </CustomTooltip>
              <CustomTooltip text="Finish creating this question pack">
                <TextIconButton
                  variant="secondary"
                  label="No, finish"
                  onClick={handleFinish}
                />
              </CustomTooltip>
            </div>
          </NeonPanel>
        </OverlayDialog>
      )}
      {/* Success Modal */}
      <SuccessModal
        open={success}
        onClose={() => setSuccess(false)}
        title="Pack added!"
        message="Question pack created successfully."
      />
    </>
  );
}
