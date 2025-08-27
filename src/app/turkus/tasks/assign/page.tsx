"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus } from "react-icons/fi";

interface TurkusTask {
  id: string;
  title: string;
}
interface User {
  auth_id: string;
  first_name: string;
  last_name: string;
}

export default function AssignTask() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<TurkusTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState(false);
  const [interval, setInterval] = useState("daily");
  const [intervalCount, setIntervalCount] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.auth_id) return;

      const { data: taskData } = await supabase
        .from("turkus_tasks")
        .select("id, title");
      setTasks(taskData || []);

      const { data: manager } = await supabase
        .from("users")
        .select("department_id")
        .eq("auth_id", user.auth_id)
        .single();

      if (!manager?.department_id) return;

      const { data: teamData } = await supabase
        .from("users")
        .select("auth_id, first_name, last_name")
        .eq("department_id", manager.department_id)
        .neq("auth_id", user.auth_id);

      setUsers(teamData || []);
    };

    fetchData();
  }, [user]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!selectedTask || !selectedUser || !dueDate) {
      alert("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!user?.auth_id) {
      alert("User not found. Please log in again.");
      setLoading(false);
      return;
    }

    // Assign the task
    const { error: assignError } = await supabase
      .from("task_assignments")
      .insert({
        task_id: selectedTask,
        assigned_to: selectedUser,
        assigned_by: user.auth_id,
        due_date: dueDate,
      });

    if (assignError) {
      alert("Error assigning task.");
      console.error(assignError);
      setLoading(false);
      return;
    }

    // Add recurrence if needed
    if (recurrence) {
      const { data: managerMeta, error: metaError } = await supabase
        .from("users")
        .select("department_id")
        .eq("auth_id", user.auth_id)
        .single();

      if (!metaError && managerMeta?.department_id) {
        const { error: recurrenceError } = await supabase
          .from("recurring_assignments")
          .insert({
            task_id: selectedTask,
            assigned_by: user.auth_id,
            department_id: managerMeta.department_id,
            frequency: interval,
            interval_count: intervalCount,
            next_due_at: dueDate,
          });

        if (recurrenceError) {
          console.error("Recurrence error:", recurrenceError);
          alert("Task assigned, but failed to set recurrence.");
        }
      }
    }

    alert("✅ Task assigned successfully.");
    setSelectedTask("");
    setSelectedUser("");
    setDueDate("");
    setRecurrence(false);
    setLoading(false);
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <h1 className="assign-task-title">Assign Task</h1>
        <form onSubmit={handleAssign} className="assign-task-form">
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="assign-task-input"
            required
          >
            <option value="">Select Task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="assign-task-input"
            required
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.auth_id} value={u.auth_id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="assign-task-input"
            required
          />
          <label className="assign-task-recurrence-label">
            <input
              type="checkbox"
              checked={recurrence}
              onChange={(e) => setRecurrence(e.target.checked)}
            />
            <span className="assign-task-recurrence-text">Set Recurrence</span>
          </label>
          {recurrence && (
            <div className="assign-task-recurrence-fields">
              <div>
                <label className="assign-task-recurrence-label">
                  Repeat Every
                </label>
                <input
                  type="number"
                  min={1}
                  value={intervalCount}
                  onChange={(e) => setIntervalCount(Number(e.target.value))}
                  className="assign-task-input"
                />
              </div>
              <div>
                <label className="assign-task-recurrence-label">Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="assign-task-input"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          )}
          <NeonIconButton variant="add" icon={<FiPlus />} title="Assign Task" />
        </form>
      </div>
    </div>
  );
}
