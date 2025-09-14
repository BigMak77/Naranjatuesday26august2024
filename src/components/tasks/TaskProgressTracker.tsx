import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";

interface TaskProgressProps {
  userId: string;
}

interface TaskAssignment {
  id: string;
  task_id: string;
  assigned_date: string;
  completed: boolean;
  completed_at: string | null;
  task: {
    title: string;
    frequency: string; // e.g. '7d', '1w', '30d', '1m', etc.
  };
}

function parseFrequencyToMs(frequency: string): number {
  // Supports 'Xd', 'Xw', 'Xm', 'Xy' (days, weeks, months, years)
  if (!frequency) return 0;
  const match = frequency.match(/(\d+)([dwmy])/i);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "d": return value * 24 * 60 * 60 * 1000;
    case "w": return value * 7 * 24 * 60 * 60 * 1000;
    case "m": return value * 30 * 24 * 60 * 60 * 1000; // approx
    case "y": return value * 365 * 24 * 60 * 60 * 1000; // approx
    default: return 0;
  }
}

function getProgress(assignedDate: string, frequency: string): { percent: number; dueDate: Date } {
  const assigned = new Date(assignedDate);
  const durationMs = parseFrequencyToMs(frequency);
  const now = new Date();
  const dueDate = new Date(assigned.getTime() + durationMs);
  const total = dueDate.getTime() - assigned.getTime();
  const elapsed = now.getTime() - assigned.getTime();
  const percent = Math.max(0, Math.min(100, (elapsed / total) * 100));
  return { percent, dueDate };
}

export default function TaskProgressTracker({ userId }: TaskProgressProps) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("task_assignments")
      .select("id, task_id, assigned_date, completed, completed_at, task(title, frequency)")
      .eq("assigned_to", userId)
      .then(({ data }) => {
        // Map task from array to object if needed
        const fixedData = (data || []).map((a: any) => ({
          ...a,
          task: Array.isArray(a.task) ? a.task[0] : a.task,
        }));
        setAssignments(fixedData);
        setLoading(false);
      });
  }, [userId]);

  return (
    <NeonPanel className="max-w-2xl mx-auto">
      <h2 className="dashboard-section-title">Task Progress</h2>
      {loading ? (
        <div>Loading progress...</div>
      ) : assignments.length === 0 ? (
        <div>No assigned tasks found.</div>
      ) : (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {assignments.map(a => {
            const { dueDate } = getProgress(a.assigned_date, a.task.frequency);
            const completed = !!a.completed || !!a.completed_at;
            const now = new Date();
            // Status indicator logic
            let statusDot = null;
            if (completed) {
              statusDot = <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#39ff14', marginRight: 8 }} title="Complete" />;
            } else if (now > dueDate) {
              statusDot = <span className="flashing-red-dot" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#ea1c1c', marginRight: 8, animation: 'flash 1s infinite alternate' }} title="Overdue" />;
            } else if (dueDate.getTime() - now.getTime() <= 30 * 60 * 1000) {
              statusDot = <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#ffc107', marginRight: 8 }} title="Due soon" />;
            }
            return (
              <li key={a.id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                  {statusDot}
                  {a.task.title}
                </div>
                <div style={{ fontSize: "0.95em", color: "#aaa" }}>
                  Assigned: {new Date(a.assigned_date).toLocaleString()}<br />
                  Due: {dueDate.toLocaleString()}<br />
                  Frequency: {a.task.frequency}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .flashing-red-dot { animation: flash 1s infinite alternate; }
      `}</style>
    </NeonPanel>
  );
}
