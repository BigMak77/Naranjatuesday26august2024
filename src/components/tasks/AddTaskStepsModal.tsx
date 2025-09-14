import React, { useState, useEffect } from "react";
import NeonForm from "@/components/NeonForm";
import { supabase } from "@/lib/supabase-client";
import SetTaskLiveModal from "@/components/tasks/SetTaskLiveModal";

interface AddTaskStepsModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  onStepsSaved?: () => void;
}

export default function AddTaskStepsModal({ open, onClose, taskId, onStepsSaved }: AddTaskStepsModalProps) {
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !taskId) return;
    setLoading(true);
    supabase
      .from("task_step")
      .select("description")
      .eq("task_id", taskId)
      .order("step_number", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to load steps: " + error.message);
          setSteps([""]);
        } else if (data && data.length > 0) {
          setSteps(data.map((s: any) => s.description));
        } else {
          setSteps([""]);
        }
        setLoading(false);
      });
  }, [open, taskId]);

  const handleStepChange = (idx: number, value: string) => {
    setSteps(s => {
      const arr = [...s];
      arr[idx] = value;
      return arr;
    });
  };

  const handleAddStep = () => setSteps(s => [...s, ""]);
  const handleRemoveStep = (idx: number) => setSteps(s => s.length > 1 ? s.filter((_, i) => i !== idx) : s);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const stepsToInsert = steps
      .map((desc, idx) => desc.trim() ? { task_id: taskId, step_number: idx + 1, description: desc } : null)
      .filter(Boolean);
    if (stepsToInsert.length === 0) {
      setError("Please enter at least one step.");
      setSaving(false);
      return;
    }
    // Remove existing steps for this task before inserting new ones
    await supabase.from("task_step").delete().eq("task_id", taskId);
    const { error: stepsErr } = await supabase.from("task_step").insert(stepsToInsert);
    if (stepsErr) {
      setError("Failed to save steps: " + stepsErr.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSuccess(true);
    if (onStepsSaved) onStepsSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal" style={{ minWidth: 380, maxWidth: 480 }}>
        <NeonForm title="Edit Steps for Task" onSubmit={handleSubmit} submitLabel={saving ? "Saving..." : "Save Steps"} onCancel={onClose}>
          {loading ? (
            <div>Loading steps...</div>
          ) : (
            <>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <input
                    className="neon-input"
                    placeholder={`Step ${idx + 1}`}
                    value={step}
                    onChange={e => handleStepChange(idx, e.target.value)}
                    required={idx === 0}
                    style={{ flex: 1 }}
                  />
                  {steps.length > 1 && (
                    <button type="button" className="neon-icon-btn neon-icon-btn-delete" style={{ marginLeft: 8 }} onClick={() => handleRemoveStep(idx)} aria-label="Remove step">
                      <span className="neon-icon">✕</span>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="neon-icon-btn neon-icon-btn-add" onClick={handleAddStep} aria-label="Add step">
                <span className="neon-icon">＋</span>
              </button>
            </>
          )}
          {error && <div className="neon-error">{error}</div>}
          {success && <div className="neon-success">Steps and live date saved!</div>}
        </NeonForm>
      </div>
    </div>
  );
}
