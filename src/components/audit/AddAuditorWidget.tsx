// src/components/task/AddAuditorWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiPlus } from "react-icons/fi";

export default function AddAuditorWidget({
  onAdded,
}: {
  onAdded?: () => void;
}) {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [users, setUsers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch departments on mount
  useEffect(() => {
    supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError("Failed to load departments");
        else setDepartments(data || []);
      });
  }, []);

  // Fetch users for selected department (not archived, not already auditor)
  useEffect(() => {
    setUsers([]);
    setSelectedUsers([]);
    if (!selectedDept) return;
    setLoading(true);
    supabase
      .from("users")
      .select("id, first_name, last_name, is_auditor")
      .eq("department_id", selectedDept)
      .eq("is_archived", false)
      .eq("is_auditor", false)
      .order("first_name", { ascending: true })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) setError("Failed to load users");
        else setUsers((data || []).filter(u => !u.is_auditor));
      });
  }, [selectedDept]);

  const handleCheckbox = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!selectedUsers.length) {
      setError("Please select at least one user.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_auditor: true })
      .in("id", selectedUsers);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setSelectedDept("");
      setSelectedUsers([]);
      if (onAdded) onAdded();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="neon-panel"
      style={{ maxWidth: 400 }}
    >
      <h2 className="neon-section-title">Mark Users as Auditors</h2>
      <label className="neon-label" htmlFor="dept-select">Department</label>
      <select
        id="dept-select"
        className="neon-input"
        value={selectedDept}
        onChange={e => setSelectedDept(e.target.value)}
        required
      >
        <option value="">Select Department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <div style={{ marginTop: 12 }}>
        <label className="neon-label">Users</label>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #222', borderRadius: 6, padding: 8, background: '#0a1a1a' }}>
          {users.length === 0 && <div className="neon-info">No eligible users found.</div>}
          {users.map((u) => (
            <label key={u.id} style={{ display: 'block', marginBottom: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                value={u.id}
                checked={selectedUsers.includes(u.id)}
                onChange={() => handleCheckbox(u.id)}
                disabled={loading}
                style={{ marginRight: 8 }}
              />
              {u.first_name} {u.last_name}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="neon-error">{error}</p>}
      {success && <p className="neon-success">Users marked as auditors!</p>}
      <button
        type="submit"
        className="neon-btn neon-btn-confirm"
        style={{ marginTop: 16, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
        disabled={loading}
        aria-label="Submit"
      >
        <FiPlus />
      </button>
    </form>
  );
}
