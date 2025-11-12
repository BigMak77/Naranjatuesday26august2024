import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import { useUser } from "@/lib/useUser";
import CompleteTask from "./CompleteTask";
import OverlayDialog from "../ui/OverlayDialog";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function MyTasks() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteTask, setShowCompleteTask] = useState<{ open: boolean; assignmentId: string | null }>({ open: false, assignmentId: null });

  useEffect(() => {
    if (!user?.auth_id) return;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      // Get all assignments for this user, now including completed and completed_at
      const { data, error } = await supabase
        .from("task_assignments")
        .select("id, task_id, assigned_date, completed, completed_at")
        .eq("assigned_to", user.auth_id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const taskIds = (data || []).map((a: any) => a.task_id).filter(Boolean);
      let tasksData: any[] = [];
      if (taskIds.length) {
        const { data: tData } = await supabase
          .from("task")
          .select("id, title, task_type, area, frequency")
          .in("id", taskIds);
        // Merge assigned_date, completed, completed_at, and assignment_id from assignments into tasks
        tasksData = (tData || []).map((t: any) => {
          const assignment = (data || []).find((a: any) => a.task_id === t.id);
          return {
            ...t,
            assigned_date: assignment?.assigned_date || null,
            completed: assignment?.completed ?? false,
            completed_at: assignment?.completed_at || null,
            assignment_id: assignment?.id || null, // <-- add assignment_id
          };
        });
      }
      setTasks(tasksData);
      setLoading(false);
    };
    fetch();
  }, [user?.auth_id]);

  // Add a function to refresh tasks
  const refreshTasks = async () => {
    if (!user?.auth_id) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("task_assignments")
      .select("id, task_id, assigned_date, completed, completed_at")
      .eq("assigned_to", user.auth_id);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const taskIds = (data || []).map((a: any) => a.task_id).filter(Boolean);
    let tasksData: any[] = [];
    if (taskIds.length) {
      const { data: tData } = await supabase
        .from("task")
        .select("id, title, task_type, area, frequency")
        .in("id", taskIds);
      tasksData = (tData || []).map((t: any) => {
        const assignment = (data || []).find((a: any) => a.task_id === t.id);
        return {
          ...t,
          assigned_date: assignment?.assigned_date || null,
          completed: assignment?.completed ?? false,
          completed_at: assignment?.completed_at || null,
          assignment_id: assignment?.id || null,
        };
      });
    }
    setTasks(tasksData);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-full mx-auto lg:max-w-6xl">
      <NeonPanel className="neon-form-padding">
        <h2 className="neon-form-title">My Tasks</h2>
      {loading ? (
        <div>Loading tasks...</div>
      ) : error ? (
        <div className="neon-error">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="neon-info">No tasks assigned.</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <div style={{ minWidth: '800px' }}>
            <NeonTable
            columns={[
            { header: "Title", accessor: "title", width: "25%" },
            { header: "Type", accessor: "task_type", width: "15%" },
            { header: "Area", accessor: "area", width: "15%" },
            { header: "Frequency", accessor: "frequency", width: "10%" },
            { header: "Due Date", accessor: "due_date", width: "15%", render: (_v, row) => {
              // Calculate due date: assigned_date + frequency
              const assigned = row.assigned_date;
              let freq = row.frequency;
              if (!assigned || typeof assigned !== "string" || !freq) return "";
              // Ensure frequency is a string
              const freqStr = String(freq).trim();
              if (!freqStr) return "";
              const assignedDate = new Date(assigned);
              if (isNaN(assignedDate.getTime())) return "";
              // Parse frequency (e.g. '7d', '1w', '1m', '1y')
              const match = freqStr.match(/^(\d+)([dwmy])$/i);
              if (!match) return "";
              const value = parseInt(match[1], 10);
              const unit = match[2].toLowerCase();
              let ms = 0;
              switch (unit) {
                case "d": ms = value * 24 * 60 * 60 * 1000; break;
                case "w": ms = value * 7 * 24 * 60 * 60 * 1000; break;
                case "m": ms = value * 30 * 24 * 60 * 60 * 1000; break;
                case "y": ms = value * 365 * 24 * 60 * 60 * 1000; break;
                default: ms = 0;
              }
              if (!ms) return "";
              const due = new Date(assignedDate.getTime() + ms);
              if (isNaN(due.getTime())) return "";
              return due.toLocaleDateString("en-GB");
            }},
            { header: "Progress", accessor: "progress", width: "10%", render: (_v, row) => {
              const assigned = row.assigned_date;
              let freq = row.frequency;
              // Explicitly check for boolean true or a non-null completed_at
              const completed = row.completed === true || !!row.completed_at;
              if (!assigned || typeof assigned !== "string" || !freq) return null;
              const freqStr = String(freq).trim();
              if (!freqStr) return null;
              const assignedDate = new Date(assigned);
              if (isNaN(assignedDate.getTime())) return null;
              const match = freqStr.match(/^(\d+)([dwmy])$/i);
              if (!match) return null;
              const value = parseInt(match[1], 10);
              const unit = match[2].toLowerCase();
              let ms = 0;
              switch (unit) {
                case "d": ms = value * 24 * 60 * 60 * 1000; break;
                case "w": ms = value * 7 * 24 * 60 * 60 * 1000; break;
                case "m": ms = value * 30 * 24 * 60 * 60 * 1000; break;
                case "y": ms = value * 365 * 24 * 60 * 60 * 1000; break;
                default: ms = 0;
              }
              if (!ms) return null;
              const due = new Date(assignedDate.getTime() + ms);
              const now = new Date();
              console.log({ assigned, freq, due: due.toISOString(), now: now.toISOString(), completed });
              if (completed) {
                return <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#39ff14' }} title="Complete" />;
              } else if (now > due) {
                return <span className="flashing-red-dot" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#ff0000', animation: 'flash 1s infinite alternate' }} title="Overdue" />;
              } else if (due.getTime() - now.getTime() <= 30 * 60 * 1000) {
                return <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: '#ffc107' }} title="Due soon" />;
              }
              return null;
            }},
            { header: "Actions", accessor: "actions", width: "10%", render: (_v, row) => {
              // Only show if not completed
              if (!row.completed) {
                return (
                  <NeonIconButton
                    variant="save"
                    title="Complete Task"
                    onClick={() => setShowCompleteTask({ open: true, assignmentId: String(row.assignment_id) })}
                  />
                );
              }
              return null;
            }},
          ]}
          data={tasks}
        />
          </div>
        </div>
      )}
      <OverlayDialog showCloseButton={true} open={showCompleteTask.open} onClose={() => setShowCompleteTask({ open: false, assignmentId: null })} ariaLabelledby="complete-task-title">
        <CompleteTask
          taskAssignmentId={showCompleteTask.assignmentId || ""}
          onComplete={() => {
            setShowCompleteTask({ open: false, assignmentId: null });
            refreshTasks(); // Refresh tasks after completion
          }}
        />
      </OverlayDialog>
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .flashing-red-dot { animation: flash 1s infinite alternate; }
        
        /* Responsive table styles */
        @media (max-width: 768px) {
          .neon-table {
            font-size: 0.75rem;
          }
          .neon-table th,
          .neon-table td {
            padding: 0.5rem;
          }
        }
        
        @media (max-width: 640px) {
          .neon-table {
            font-size: 0.7rem;
          }
          .neon-table th,
          .neon-table td {
            padding: 0.375rem;
          }
        }
      `}</style>
      </NeonPanel>
    </div>
  );
}
