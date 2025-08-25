"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";

const frequencyOptions = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

export default function EditTaskPage() {
  const params = useParams();
  const taskid = Array.isArray(params.taskid)
    ? params.taskid[0]
    : params.taskid;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [frequency, setFrequency] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);

      if (!taskid) {
        setError("Missing task ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("turkus_tasks")
        .select("*")
        .eq("id", taskid)
        .single();

      if (error || !data) {
        setError("Task not found.");
      } else {
        setTitle(data.title || "");
        setArea(data.area || "");
        setFrequency(data.frequency || "");
        setInstructions(data.instructions || "");
      }

      setLoading(false);
    };

    fetchTask();
  }, [taskid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await supabase
      .from("turkus_tasks")
      .update({
        title: title.trim(),
        area: area.trim(),
        frequency,
        instructions: instructions.trim(),
      })
      .eq("id", taskid);

    setSubmitting(false);

    if (error) {
      setError("❌ Failed to update task.");
    } else {
      router.push("/turkus/tasks/amend");
    }
  };

  if (loading) return <p className="neon-loading">Loading task data...</p>;
  if (error) return <p className="neon-error">{error}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="neon-section-title">Edit Task</h1>
      <input
        type="text"
        placeholder="Task Title"
        className="neon-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Area"
        className="neon-input"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        required
      />
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        className="neon-input"
        required
      >
        <option value="">Select Frequency</option>
        {frequencyOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Instructions"
        className="neon-input"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />
      <div className="neon-panel-actions">
        <NeonIconButton
          type="submit"
          variant="save"
          icon={
            <svg
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          }
          title={submitting ? "Saving..." : "Save Changes"}
          disabled={submitting}
        />
        <NeonIconButton
          type="button"
          variant="cancel"
          icon={
            <svg
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          }
          title="Cancel"
          onClick={() => router.push("/turkus/tasks/amend")}
        />
      </div>
    </form>
  );
}
