"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";
import Modal from "@/components/modal";

export default function RaiseIssuePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name");
      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data || []);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("issues").insert([
      {
        title,
        description,
        priority,
        category,
        department_id: departmentId,
        reported_by: user.id,
      },
    ]);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/turkus/issues");
    }
  };

  return (
    <Modal open={true} onClose={() => router.push("/turkus/issues")}>
      <form className="neon-panel" onSubmit={handleSubmit}>
        <h1 className="font-title accent-text">New Issue</h1>
        <input
          className="neon-input"
          placeholder="Issue Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="neon-input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
        />
        <select
          className="neon-input"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select
          className="neon-input"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {error && (
          <p className="neon-error">
            <FiAlertCircle /> {error}
          </p>
        )}
        <button type="submit" className="neon-btn" disabled={loading}>
          <FiAlertCircle style={{ display: loading ? "none" : "inline-block" }} />
          {/* Icon only, no label */}
          {loading && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-loader neon-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </button>
      </form>
    </Modal>
  );
}
