"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiList } from "react-icons/fi";
import { useUser } from "@/context/UserContext"; // ← use your context

type Task = {
  id: number;
  title: string;
  area: string | null;
  frequency: string | null;
  instructions: string | null;
};

export default function TaskListWidget() {
  const { user, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const departmentId = user?.department_id;

  useEffect(() => {
    if (!departmentId) return;

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, area, frequency, instructions")
        .eq("department_id", departmentId) // 🔑 only tasks for user's dept
        .order("title", { ascending: true });

      if (error) setError("Failed to load tasks.");
      setTasks(data || []);
      setLoading(false);
    };

    fetchTasks();
  }, [departmentId]);

  if (userLoading) return <p className="neon-info">Loading user...</p>;

  return (
    <div>
      <h2 className="neon-section-title">
        <FiList /> Department Tasks
      </h2>
      {loading ? (
        <p className="neon-info">Loading tasks...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="neon-info">No tasks found for your department.</p>
      ) : (
        <ul className="neon-list">
          {tasks.map((task) => (
            <li key={task.id} className="neon-list-item">
              <h3 className="neon-list-title">{task.title}</h3>
              <p className="neon-list-meta">
                {(task.area ?? "") + " · " + (task.frequency ?? "")}
              </p>
              <p className="neon-list-desc">{task.instructions ?? ""}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
