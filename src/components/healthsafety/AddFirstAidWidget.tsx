// src/components/audit/AddFirstAidWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus } from "react-icons/fi";

export default function AddFirstAidWidget({
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

  // Fetch users for selected department (not archived, not already first aid)
  useEffect(() => {
    setUsers([]);
    setSelectedUsers([]);
    if (!selectedDept) return;
    setLoading(true);
    
    const fetchEligibleUsers = async () => {
      try {
        // Get users in department
        const { data: deptUsers, error: userError } = await supabase
          .from("users")
          .select("id, first_name, last_name, auth_id")
          .eq("department_id", selectedDept)
          .eq("is_archived", false)
          .order("first_name", { ascending: true });

        if (userError) throw userError;

        // Get existing first aid assignments
        const FIRST_AID_MODULE_ID = "f1236b6b-ee01-4e68-9082-e2380b0fa600";
        const authIds = deptUsers?.map(u => u.auth_id).filter(Boolean) || [];
        const { data: assignments, error: assignmentError } = await supabase
          .from("user_assignments")
          .select("auth_id")
          .eq("item_type", "module")
          .eq("item_id", FIRST_AID_MODULE_ID)
          .in("auth_id", authIds);

        if (assignmentError) throw assignmentError;

        const assignedAuthIds = new Set(assignments?.map(a => a.auth_id) || []);

        // Filter out users who already have first aid assignments
        const eligibleUsers = (deptUsers || []).filter(user => 
          user.auth_id && !assignedAuthIds.has(user.auth_id)
        );

        setUsers(eligibleUsers);
      } catch (error: any) {
        setError("Failed to load users: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleUsers();
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
    
    try {
      // Get auth_ids for selected users
      const { data: usersWithAuth, error: userError } = await supabase
        .from("users")
        .select("id, auth_id")
        .in("id", selectedUsers);

      if (userError) throw userError;

      // Create user assignments for first aid module
      const FIRST_AID_MODULE_ID = "f1236b6b-ee01-4e68-9082-e2380b0fa600";
      const assignments = usersWithAuth?.map(user => ({
        auth_id: user.auth_id,
        item_id: FIRST_AID_MODULE_ID,
        item_type: "module" as const
      })).filter(a => a.auth_id) || [];

      // Add assigned_at and completed_at timestamps to all assignments
      const completedAssignments = assignments.map(assignment => ({
        ...assignment,
        assigned_at: new Date().toISOString(), // When the assignment was made
        completed_at: new Date().toISOString() // Mark as completed when designated
      }));

      const { error: assignmentError } = await supabase
        .from("user_assignments")
        .upsert(completedAssignments, { 
          onConflict: "auth_id,item_id,item_type",
          ignoreDuplicates: true 
        });

      if (assignmentError) throw assignmentError;

      setSuccess(true);
      setSelectedDept("");
      setSelectedUsers([]);
      if (onAdded) onAdded();
    } catch (error: any) {
      setError(error.message || "Failed to assign first aid roles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="neon-panel"
      style={{ maxWidth: 400 }}
    >
      <h2 className="neon-section-title">Mark Users as First Aid</h2>
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
      {success && <p className="neon-success">Users marked as first aid!</p>}
      <button
        type="submit"
        className="neon-btn neon-btn-confirm"
        style={{ marginTop: 16, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
        disabled={loading}
        aria-label="Submit"
        title="Submit"
      >
        <FiPlus />
      </button>
    </form>
  );
}
