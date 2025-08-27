"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiRepeat } from "react-icons/fi"; // Add Fi icon import
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "@/components/ui/NeonIconButton"; // Add NeonIconButton import

export default function RecurringTaskList() {
  const { user } = useUser();
  type RecurringTask = {
    id: number;
    frequency: string;
    interval_count: number;
    next_due_at: string | null;
    turkus_tasks: {
      id: number;
      title: string;
    } | null;
  };

  const [recurring, setRecurring] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.auth_id) return;

      const { data: userMeta, error: userError } = await supabase
        .from("users")
        .select("department_id")
        .eq("auth_id", user.auth_id)
        .single();

      if (userError || !userMeta?.department_id) {
        setError("Could not determine your department.");
        setLoading(false);
        return;
      }

      const { data, error: recurringError } = await supabase
        .from("recurring_assignments")
        .select(
          `
          id,
          frequency,
          interval_count,
          next_due_at,
          turkus_tasks (
            id,
            title
          )
        `,
        )
        .eq("department_id", userMeta.department_id);

      if (recurringError) {
        setError("Failed to load recurring tasks.");
        console.error(recurringError);
      } else {
        setRecurring(
          (data || []).map((item) => {
            let turkusTask = null;
            if (Array.isArray(item.turkus_tasks)) {
              const t = item.turkus_tasks[0];
              if (
                t &&
                typeof t.id !== "undefined" &&
                typeof t.title !== "undefined"
              ) {
                turkusTask = { id: Number(t.id), title: String(t.title) };
              }
            }
            return {
              id: Number(item.id),
              frequency: String(item.frequency),
              interval_count: Number(item.interval_count),
              next_due_at: item.next_due_at ? String(item.next_due_at) : null,
              turkus_tasks: turkusTask,
            };
          }),
        );
      }

      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <div>
      <h2 className="neon-section-title">
        <FiRepeat className="recurring-task-list-title-icon" />
      </h2>

      <NeonIconButton variant="add" icon={<FiRepeat />} title="Add Recurring Task" />

      {loading ? (
        <p className="neon-loading">Loading recurring tasks...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : recurring.length === 0 ? (
        <p className="neon-muted">No recurring tasks found.</p>
      ) : (
        <NeonTable
          columns={[
            { header: "Task", accessor: "task" },
            { header: "Frequency", accessor: "frequency" },
            { header: "Interval", accessor: "interval" },
            { header: "Next Due", accessor: "next_due" },
          ]}
          data={recurring.map((r) => ({
            task: r.turkus_tasks?.title || "Unknown Task",
            frequency: r.frequency,
            interval: r.interval_count,
            next_due: r.next_due_at
              ? typeof window !== "undefined"
                ? new Date(r.next_due_at).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"
              : "—",
          }))}
        />
      )}
    </div>
  );
}
