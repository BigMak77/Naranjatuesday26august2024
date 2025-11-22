import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import AddTaskStepsModal from "./AddTaskStepsModal";

interface CreateTaskProps {
  onCreated?: (task: any) => void;
}

const initialState = {
  title: "",
  area: "",
  frequency: "",
  instructions: "",
  task_type: "",
};

const FREQUENCY_OPTIONS = [
  "1d", "2d", "3d", "7d", "14d", "30d", // days
  "1w", "2w", "4w", // weeks
  "1m", "3m", "6m", // months
  "1y", "2y" // years
];

const TYPE_OPTIONS = [
  "Safety check",
  "Factory inspection",
  "Departmental check",
  "Security check",
  "Technical check",
  "People check",
  "Cleaning task",
  "Engineering task",
];

const CreateTask: React.FC<CreateTaskProps> = ({ onCreated }) => {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user auth_id from Supabase (v2 client)
    supabase.auth.getUser().then(({ data }) => {
      if (data && data.user && data.user.id) {
        setAuthId(data.user.id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    if (!form.title || !form.area || !form.frequency || !form.task_type) {
      setError("Please fill in all required fields.");
      setSaving(false);
      return;
    }
    if (!authId) {
      setError("User not authenticated.");
      setSaving(false);
      return;
    }
    // 1. Create the task
    const { data: task, error: err } = await supabase.from("task")
      .insert({
        title: form.title,
        area: form.area,
        frequency: form.frequency,
        instructions: form.instructions,
        task_type: form.task_type,
        created_date: new Date().toISOString(),
        created_by: authId, // add auth_id as created_by
      })
      .select()
      .single();
    setSaving(false);
    if (err) {
      setError("Failed to create task: " + err.message);
      return;
    }
    setNewTaskId(task.id);
    setShowStepsModal(true);
    setForm(initialState);
    setSuccess(true);
    if (onCreated) onCreated(task);
  };

  return (
    <>
      <NeonForm
        title="Create Task"
        onSubmit={handleSubmit}
        submitLabel={saving ? "Creating..." : "Create Task"}
      >
        <select
          className="neon-input"
          value={form.task_type}
          onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}
          required
        >
          <option value="">Select type*</option>
          {TYPE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <input
          className="neon-input"
          placeholder="Title*"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          className="neon-input"
          placeholder="Area*"
          value={form.area}
          onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
          required
        />
        <select
          className="neon-input"
          value={form.frequency}
          onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
          required
        >
          <option value="">Select frequency*</option>
          {FREQUENCY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <textarea
          className="neon-input"
          placeholder="Instructions"
          value={form.instructions}
          onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
        />
        {error && <div style={{
          background: 'var(--status-danger-light)',
          border: '1px solid var(--status-danger)',
          borderRadius: '6px',
          padding: '12px',
          color: 'var(--status-danger)',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-base)',
          marginTop: '12px'
        }}>{error}</div>}
        {success && <div style={{
          background: 'var(--status-success-light)',
          border: '1px solid var(--status-success)',
          borderRadius: '6px',
          padding: '12px',
          color: 'var(--status-success)',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-base)',
          marginTop: '12px'
        }}>Task created!</div>}
      </NeonForm>
      <AddTaskStepsModal
        open={showStepsModal}
        onClose={() => setShowStepsModal(false)}
        taskId={newTaskId || ""}
        onStepsSaved={() => setShowStepsModal(false)}
      />
    </>
  );
};

export default CreateTask;
