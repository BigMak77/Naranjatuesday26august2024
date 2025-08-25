"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/context/UserContext";
import { FiClipboard } from "react-icons/fi";
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function MyTasksWidget() {
  const { user, loading: userLoading } = useUser();
  type TaskAssignment = {
    id: number;
    due_date: string | null;
    status: string;
    task: {
      id: number;
      title: string;
      description: string;
    } | null;
  };

  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && user?.auth_id) {
      setLoading(true);
      setError(null);
      const fetchTasks = async () => {
        const { data, error } = await supabase
          .from("task_assignments")
          .select("id, due_date, status, task:tasks(id, title, description)")
          .eq("assigned_to", user.auth_id)
          .order("due_date", { ascending: true });

        if (error) setError("Failed to load tasks.");
        setTasks(
          (data || []).map(
            (item: {
              id: number;
              due_date: string | null;
              status: string;
              task:
                | { id: number; title: string; description: string }[]
                | { id: number; title: string; description: string }
                | null;
            }) => ({
              ...item,
              task: Array.isArray(item.task)
                ? item.task[0] || null
                : (item.task ?? null),
            }),
          ),
        );
        setLoading(false);
      };
      fetchTasks();
    }
  }, [userLoading, user]);

  if (userLoading) return <p className="neon-loading">Loading user...</p>;
  if (!user) return null;

  return (
    <div>
      <h2 className="neon-section-title">
        <FiClipboard /> My Tasks
      </h2>

      {loading ? (
        <p className="neon-loading">Loading tasks...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="neon-muted">No tasks assigned to you.</p>
      ) : (
        <NeonTable
          columns={[
            { header: "Task", accessor: "task" },
            { header: "Description", accessor: "description" },
            { header: "Due Date", accessor: "due_date" },
            { header: "Status", accessor: "status" },
            {
              header: "Actions",
              accessor: "id",
              render: () => (
                <NeonIconButton
                  variant="view"
                  title="View Task"
                  aria-label="View Task"
                />
              ),
            },
          ]}
          data={tasks.map((t) => ({
            task: t.task?.title || "Untitled",
            description: t.task?.description || "—",
            due_date: t.due_date
              ? (() => {
                  if (typeof window === "undefined") return "—";
                  try {
                    return new Date(t.due_date).toLocaleDateString("en-GB");
                  } catch {
                    return "—";
                  }
                })()
              : "—",
            status: t.status || "Pending",
            id: t.id,
          }))}
        />
      )}
    </div>
  );
}
