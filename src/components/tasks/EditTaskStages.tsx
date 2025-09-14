import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

const EditTaskStages: React.FC<{ taskId: string; onClose: () => void; onSaved: () => void }> = ({ taskId, onClose, onSaved }) => {
  const [task, setTask] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskAndSteps = async () => {
      setLoading(true);
      setError(null);
      // Fetch the task
      const { data: taskData, error: taskError } = await supabase
        .from("task")
        .select("*")
        .eq("id", taskId)
        .single();
      // Fetch the steps
      const { data: stepsData, error: stepsError } = await supabase
        .from("task_step")
        .select("id, task_id, step_number, description")
        .eq("task_id", taskId)
        .order("step_number", { ascending: true });
      if (taskError) setError("Failed to load task: " + taskError.message);
      if (stepsError) setError("Failed to load steps: " + stepsError.message);
      setTask(taskData);
      setSteps(stepsData || []);
      setLoading(false);
    };
    fetchTaskAndSteps();
  }, [taskId]);

  if (!taskId) return null;

  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal" style={{ minWidth: 380, maxWidth: 480 }}>
        <h2>Edit Task (ID: {taskId})</h2>
        <div style={{ fontSize: 12, marginBottom: 8 }}>Debug: taskId = {String(taskId)}</div>
        <div style={{ fontSize: 12, marginBottom: 8 }}>Debug: steps = {JSON.stringify(steps)}</div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="neon-error">{error}</div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <strong>Title:</strong> {task?.title}<br />
              <strong>Area:</strong> {task?.area}<br />
              <strong>Frequency:</strong> {task?.frequency}<br />
              <strong>Type:</strong> {task?.task_type}<br />
              <strong>Instructions:</strong> {task?.instructions}
            </div>
            <div>
              <strong>Steps:</strong>
              <ol style={{ paddingLeft: 20 }}>
                {steps.length === 0 ? (
                  <li>(No steps found)</li>
                ) : (
                  steps.map((step) => (
                    <li key={step.id}>{step.description}</li>
                  ))
                )}
              </ol>
            </div>
          </>
        )}
        <button className="neon-btn" onClick={onClose} style={{ marginTop: 16 }}>Close</button>
      </div>
    </div>
  );
};

export default EditTaskStages;