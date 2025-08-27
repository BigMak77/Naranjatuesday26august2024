"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useUser } from "@/lib/useUser";
import NeonIconButton from "@/components/ui/NeonIconButton";

// TaskListWidget: shows all tasks
// TaskAssignWidget: handles assigning tasks to users
// TaskCreateWidget: for creating new tasks
// TaskAmendWidget: for editing/amending tasks
// MyTasksWidget: shows tasks assigned to the logged-in user
// These widgets should be created in /components/task and imported as needed.

export default function AddTurkusTaskPage() {
  const router = useRouter();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frequencies = [
    "Hourly",
    "Every Few Hours",
    "Twice Daily",
    "Daily",
    "Weekly",
    "Monthly",
    "Quarterly",
    "Annually",
  ];

  const addQuestion = () => setQuestions([...questions, ""]);

  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const filtered = questions.filter((_, idx) => idx !== index);
    setQuestions(filtered.length > 0 ? filtered : [""]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!user?.auth_id) {
      setError("User not found. Please log in again.");
      return;
    }

    if (questions.some((q) => q.trim() === "")) {
      setError("Please fill in all steps or remove empty ones.");
      return;
    }

    setSaving(true);
    setError(null);

    const { data: task, error: insertError } = await supabase
      .from("turkus_tasks")
      .insert({
        title: title.trim(),
        area: area.trim(),
        frequency,
        instructions: instructions.trim(),
        created_by: user.auth_id,
      })
      .select()
      .single();

    if (insertError || !task?.id) {
      console.error(insertError);
      setError("❌ Failed to create task.");
      setSaving(false);
      return;
    }

    const validQuestions = questions.filter((q) => q.trim() !== "");
    if (validQuestions.length > 0) {
      const formatted = validQuestions.map((q, idx) => ({
        task_id: task.id,
        question_text: q.trim(),
        sort_order: idx + 1,
      }));
      const { error: qError } = await supabase
        .from("turkus_task_questions")
        .insert(formatted);

      if (qError) {
        console.error(qError);
        setError("Task saved, but failed to save steps.");
        setSaving(false);
        return;
      }
    }

    alert("✅ Task created successfully.");
    router.push("/turkus/tasks");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <h1 className="neon-section-title">Add Turkus Task</h1>
      <div>
        <label className="neon-label">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Inspect freezer door"
          className="neon-input"
        />
      </div>
      <div>
        <label className="neon-label">Area</label>
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Cold Room"
          className="neon-input"
        />
      </div>
      <div>
        <label className="neon-label">Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="neon-input"
        >
          {frequencies.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="neon-label">
          Instructions <span className="neon-label-optional">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="neon-input"
          placeholder="Explain how to complete this check"
        />
      </div>
      <div>
        <h2 className="neon-section-title">Steps / Questions</h2>
        {questions.map((q, idx) => (
          <div key={idx} className="neon-form-row">
            <input
              type="text"
              value={q}
              onChange={(e) => updateQuestion(idx, e.target.value)}
              className="neon-input"
              placeholder={`Step ${idx + 1}`}
            />
            <NeonIconButton
              type="button"
              variant="delete"
              icon={<FiTrash2 />}
              title="Remove Step"
              onClick={() => removeQuestion(idx)}
            />
          </div>
        ))}
        <NeonIconButton
          type="button"
          variant="add"
          icon={<FiPlus />}
          title="Add Task"
          onClick={addQuestion}
        />
      </div>
      <div className="neon-panel-actions">
        <NeonIconButton
          type="submit"
          variant="save"
          icon={<FiPlus />}
          title={saving ? "Saving..." : "Create Task"}
          disabled={saving}
        />
      </div>
      {error && <p className="neon-error">{error}</p>}
    </form>
  );
}
