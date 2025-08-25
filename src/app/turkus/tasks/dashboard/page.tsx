"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiCalendar,
} from "react-icons/fi";
import NeonPanel from "@/components/NeonPanel";
import NeonFeatureCard from "@/components/NeonFeatureCard";

interface TaskAssignment {
  id: number;
  due_date: string;
  status: string;
  completed_at?: string;
  task?: {
    id: number;
    title: string;
  };
}

const TaskDashboard = () => {
  const [todayTasks, setTodayTasks] = useState<TaskAssignment[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskAssignment[]>([]);
  const [lateTasks, setLateTasks] = useState<TaskAssignment[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const { data: assignments, error } = await supabase
        .from("turkus_assignments")
        .select(
          "id, due_date, status, completed_at, task:turkus_tasks (id, title)",
        )
        .order("due_date", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
        return;
      }

      // Helper to get date in YYYY-MM-DD
      const toDateOnly = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };

      // Ensure task is a single object, not an array
      const normalizedTasks = (assignments || []).map((t) => ({
        ...t,
        task: Array.isArray(t.task) ? t.task[0] : t.task,
      }));

      const completedToday = normalizedTasks.filter((t) => {
        return (
          t.status === "complete" &&
          t.completed_at &&
          toDateOnly(t.completed_at) === todayStr
        );
      });

      const dueToday = normalizedTasks.filter((t) => {
        return t.due_date && toDateOnly(t.due_date) === todayStr;
      });

      const lateCompletions = normalizedTasks.filter((t) => {
        return (
          t.status === "complete" &&
          t.completed_at &&
          new Date(t.completed_at) > new Date(t.due_date)
        );
      });

      const overdue = normalizedTasks.filter((t) => {
        return t.status !== "complete" && new Date(t.due_date) < today;
      });

      setTodayTasks(dueToday);
      setCompletedTasks(completedToday);
      setLateTasks(lateCompletions);
      setOverdueTasks(overdue);
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="task-dashboard-wrapper">
      {loading ? (
        <NeonPanel>
          <div className="task-dashboard-loading-msg">Loading tasks...</div>
        </NeonPanel>
      ) : (
        <>
          {/* Summary Feature Cards */}
          <NeonPanel>
            <div className="neon-feature-card-list">
              <NeonFeatureCard
                icon={<FiCalendar aria-label="Due Today" />}
                title="Due Today"
                text={todayTasks.length.toString()}
                href={""}
              />
              <NeonFeatureCard
                icon={<FiCheckCircle aria-label="Completed Today" />}
                title="Completed Today"
                text={completedTasks.length.toString()}
                href={""}
              />
              <NeonFeatureCard
                icon={<FiClock aria-label="Late Completions" />}
                title="Late Completions"
                text={lateTasks.length.toString()}
                href={""}
              />
              <NeonFeatureCard
                icon={<FiAlertTriangle aria-label="Overdue" />}
                title="Overdue"
                text={overdueTasks.length.toString()}
                href={""}
              />
            </div>
          </NeonPanel>

          <NeonPanel>
            <Section
              title={
                <>
                  <FiClock
                    className="task-dashboard-section-icon"
                    aria-label="Completed Late"
                  />{" "}
                  Completed Late
                </>
              }
            >
              {lateTasks.length === 0 ? (
                <p className="task-dashboard-empty-msg">No late completions.</p>
              ) : (
                <ul className="task-dashboard-list">
                  {lateTasks.map((t) => (
                    <li key={t.id} className="task-dashboard-list-item">
                      <strong className="task-dashboard-task-title">
                        {t.task?.title}
                      </strong>{" "}
                      – Due: {formatDateTime(t.due_date)}
                      {t.completed_at
                        ? `, Completed: ${formatDateTime(t.completed_at)}`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </NeonPanel>

          <NeonPanel>
            <Section title="Overdue Tasks">
              {overdueTasks.length === 0 ? (
                <p className="task-dashboard-empty-msg">No overdue tasks.</p>
              ) : (
                <ul className="task-dashboard-list">
                  {overdueTasks.map((t) => (
                    <li key={t.id} className="task-dashboard-list-item">
                      <strong className="task-dashboard-task-title">
                        {t.task?.title}
                      </strong>{" "}
                      – Due: {formatDateTime(t.due_date)}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </NeonPanel>
        </>
      )}
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="task-dashboard-section">
    <h2 className="task-dashboard-section-title">{title}</h2>
    {children}
  </section>
);

export default TaskDashboard;
