import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import RaiseNonConformanceModal from "./RaiseNonConformanceModal";
import OverlayDialog from "@/components/ui/OverlayDialog";

interface CompleteTaskProps {
  taskAssignmentId: string;
  onComplete?: () => void;
}

interface Step {
  id: string | number;
  step_number: number;
  description: string;
  status: "pending" | "pass" | "fail" | "could_not_complete";
  completed_at?: string | null;
  notes?: string | null;
}

const STATUS_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "could_not_complete", label: "Could Not Complete" },
];

const CompleteTask: React.FC<CompleteTaskProps> = ({ taskAssignmentId, onComplete }) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNCModal, setShowNCModal] = useState<{ open: boolean; stepId: string | null }>({ open: false, stepId: null });

  useEffect(() => {
    const fetchSteps = async () => {
      setLoading(true);
      setError(null);
      // Defensive: log the assignment ID and warn if it looks like a task ID
      if (taskAssignmentId && taskAssignmentId.length < 30) {
        console.warn("[CompleteTask] WARNING: taskAssignmentId looks too short (may be a task ID, not an assignment ID):", taskAssignmentId);
      } else {
        console.log("[CompleteTask] Fetching steps for assignment ID:", taskAssignmentId);
      }
      const { data, error } = await supabase
        .from("task_assignment_step")
        .select("id, status, completed_at, notes, task_step:task_step_id(id, step_number, description)")
        .eq("task_assignment_id", taskAssignmentId);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      console.log("[CompleteTask] Steps fetched:", data);
      // Flatten and sort the data by step_number
      const steps: Step[] = (data || [])
        .map((row: any) => ({
          id: row.id,
          step_number: row.task_step.step_number,
          description: row.task_step.description,
          status: row.status,
          completed_at: row.completed_at,
          notes: row.notes,
        }))
        .sort((a, b) => a.step_number - b.step_number);
      setSteps(steps);
      setLoading(false);
    };
    fetchSteps();
  }, [taskAssignmentId]);

  const handleStatusChange = async (stepId: string, status: Step["status"]) => {
    setSaving(true);
    // Remove numericStepId logic, treat as string
    if (!stepId) {
      setError("Internal error: Step ID is missing.");
      setSaving(false);
      return;
    }
    if (status === "fail") {
      setShowNCModal({ open: true, stepId });
      setSaving(false);
      return;
    }
    const { error: updateError } = await supabase
      .from("task_assignment_step")
      .update({ status, completed_at: new Date().toISOString() })
      .eq("id", stepId);
    if (updateError) {
      setError("Failed to update step: " + (updateError.message || JSON.stringify(updateError)));
      setSaving(false);
      return;
    }
    setSteps(steps => steps.map(s => s.id === stepId ? { ...s, status, completed_at: new Date().toISOString() } : s));
    setSaving(false);
  };

  const handleNonConformance = async (reason: string) => {
    if (!showNCModal.stepId) return;
    const stepId = showNCModal.stepId;
    if (!stepId) {
      setError("Internal error: Step ID is missing.");
      return;
    }
    const { error: ncError } = await supabase.from("non_conformances").insert({
      task_assignment_step_id: stepId,
      description: reason,
      status: "open",
      created_at: new Date().toISOString(),
    });
    if (ncError) {
      setError("Failed to create non-conformance: " + (ncError.message || JSON.stringify(ncError)));
      return;
    }
    const { error: updateError } = await supabase.from("task_assignment_step").update({ status: "fail", completed_at: new Date().toISOString() }).eq("id", stepId);
    if (updateError) {
      setError("Failed to update step after non-conformance: " + (updateError.message || JSON.stringify(updateError)));
      return;
    }
    setShowNCModal({ open: false, stepId: null });
    setSteps(steps => steps.map(s => s.id === stepId ? { ...s, status: "fail", completed_at: new Date().toISOString() } : s));
    // Send alert to department managers/admins here
    try {
      await fetch("/api/notify-nonconformance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_assignment_step_id: stepId, reason }),
      });
    } catch (err) {
      // Optionally log or show error, but don't block UI
      console.error("Failed to notify managers/admins", err);
    }
  };

  const handleMarkComplete = async () => {
    setSaving(true);
    setError(null);
    // Update the assignment status to 'completed'
    const { error: updateError } = await supabase
      .from("task_assignments")
      .update({ status: "completed", completed: true, completed_at: new Date().toISOString() })
      .eq("id", taskAssignmentId);
    if (updateError) {
      setError("Failed to mark assignment complete: " + (updateError.message || JSON.stringify(updateError)));
      setSaving(false);
      return;
    }
    setSaving(false);
    if (onComplete) onComplete();
  };

  const allStepsCompleted = steps.length > 0 && steps.every(s => s.status !== "pending");

  return (
    <div className="neon-card neon-form-padding" style={{ maxWidth: 600, margin: "0 auto" }}>
      <h3>Complete Task Steps</h3>
      {loading ? <div>Loading steps...</div> : error ? <div className="neon-error">{error}</div> : (
        <ol>
          {steps.map(step => (
            <li key={step.id} style={{ marginBottom: 16 }}>
              <div><strong>Step {step.step_number}:</strong> {step.description}</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`neon-btn neon-btn-sm ${step.status === opt.value ? "neon-btn-save" : ""}`}
                    style={{ marginRight: 8 }}
                    disabled={saving || step.status !== "pending"}
                    onClick={() => handleStatusChange(String(step.id), opt.value as Step["status"])}
                  >
                    {opt.label}
                  </button>
                ))}
                {/* Status dot, styled like MyTasks */}
                {step.status !== "pending" && (
                  <span style={{ marginLeft: 12 }}>
                    {step.status === "pass" && (
                      <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#39ff14' }} title="Pass" />
                    )}
                    {step.status === "fail" && (
                      <span className="flashing-red-dot" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#ff0000' }} title="Fail" />
                    )}
                    {step.status === "could_not_complete" && (
                      <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#ffc107' }} title="Could Not Complete" />
                    )}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <RaiseNonConformanceModal
        open={showNCModal.open}
        stepId={showNCModal.stepId || ""}
        onSubmit={handleNonConformance}
        onClose={() => setShowNCModal({ open: false, stepId: null })}
      />
      <button
        className="neon-btn neon-btn-save"
        disabled={!allStepsCompleted || saving}
        style={{ marginTop: 24 }}
        onClick={handleMarkComplete}
      >
        Mark Task Assignment Complete
      </button>
    </div>
  );
};

export default CompleteTask;
