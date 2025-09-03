"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";
import NeonPanel from "@/components/NeonPanel";

export default function RaiseIssuePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("");
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
    <div style={{ maxWidth: 480, margin: '3rem auto' }}>
      <NeonPanel>
        <form onSubmit={handleSubmit}>
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
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ marginBottom: 8 }}
          >
            <option value="">Select Category</option>
            <option value="Safety">Safety</option>
            <option value="Quality">Quality</option>
            <option value="Environment">Environment</option>
            <option value="Other">Other</option>
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
          <button type="submit" className="neon-btn" disabled={loading} aria-label="Raise Issue">
            <FiAlertCircle className="neon-icon" />
          </button>
        </form>
      </NeonPanel>
    </div>
  );
}
