import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import TextIconButton from "@/components/ui/TextIconButtons";

interface AssignTaskProps {
  taskId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department_id?: string;
  departments?: { name: string }[];
}

export default function AssignTask({ taskId, onClose, onAssigned }: AssignTaskProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [liveAt, setLiveAt] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch departments
    supabase
      .from("departments") // <-- fixed table name
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError("Failed to load departments: " + error.message);
        setDepartments(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedDepartmentId) return;
    setLoading(true);
    setError(null);
    // Fetch managers or admins for the selected department, including department name via join
    supabase
      .from("users")
      .select("id, email, first_name, last_name, department_id, departments(name)")
      .eq("department_id", selectedDepartmentId)
      .in("access_level", ["Manager", "Admin"])
      .order("email", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError("Failed to load users: " + error.message);
        setUsers((data || []) as User[]);
        setLoading(false);
      });
  }, [selectedDepartmentId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .order("email", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError("Failed to load users: " + error.message);
        setUsers(data || []);
        setLoading(false);
      });
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Please select a user to assign.");
      return;
    }
    if (!liveAt) {
      setError("Please select a live date/time.");
      return;
    }
    // Directly assign, no extra confirmation step
    await handleFinalAssign();
  };

  const handleFinalAssign = async () => {
    if (assigning) return; // Prevent double submission
    setAssigning(true);
    setError(null);
    setSuccess(false);
    // Get current user (assigned_by) from Supabase auth
    let assignedBy = null;
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      assignedBy = data?.user?.id || null;
    } catch (err) {
      setError("Could not get current user. Please re-login.");
      setAssigning(false);
      return;
    }
    // Fetch the task's frequency
    let frequency = null;
    try {
      const { data: taskData, error: freqError } = await supabase
        .from("task")
        .select("frequency")
        .eq("id", taskId)
        .maybeSingle();
      if (freqError) throw freqError;
      frequency = taskData?.frequency || null;
    } catch (err) {
      setError("Could not fetch task frequency.");
      setAssigning(false);
      return;
    }
    // Calculate due_date
    let dueDate = null;
    if (frequency) {
      const freqStr = String(frequency).trim();
      const match = freqStr.match(/^(\d+)([dwmy])$/i);
      let ms = 0;
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        switch (unit) {
          case "d": ms = value * 24 * 60 * 60 * 1000; break;
          case "w": ms = value * 7 * 24 * 60 * 60 * 1000; break;
          case "m": ms = value * 30 * 24 * 60 * 60 * 1000; break;
          case "y": ms = value * 365 * 24 * 60 * 60 * 1000; break;
          default: ms = 0;
        }
        // Use liveAt as base date if valid, else now
        let baseDate = new Date();
        if (liveAt && !isNaN(new Date(liveAt).getTime())) {
          baseDate = new Date(liveAt);
        }
        dueDate = new Date(baseDate.getTime() + ms).toISOString();
      } else {
        dueDate = null;
      }
    } else {
      dueDate = null;
    }
    // Insert assignment into task_assignments table
    const { data: assignmentData, error: assignError } = await supabase
      .from("task_assignments")
      .insert({
        task_id: taskId,
        assigned_to: selectedUserId,
        assigned_by: assignedBy,
        status: "assigned",
        assigned_date: liveAt || new Date().toISOString(),
        due_date: dueDate,
        completed: false, // Ensure boolean false is set
      })
      .select()
      .single();
    if (!assignError && assignmentData?.id) {
      // Also update the status column in the task table
      await supabase
        .from("task")
        .update({ status: "assigned" })
        .eq("id", taskId);
      // Fetch all steps for this task
      const { data: steps, error: stepsError } = await supabase
        .from("task_step")
        .select("id, step_number")
        .eq("task_id", taskId);
      if (!stepsError && Array.isArray(steps) && steps.length > 0) {
        // Insert a task_assignment_step for each step
        const stepRows = steps.map((step: any) => ({
          task_assignment_id: assignmentData.id, // use correct FK
          task_step_id: step.id, // use correct FK
          step_number: step.step_number, // for ordering
          status: "pending",
        }));
        const { error: tasError } = await supabase
          .from("task_assignment_step")
          .insert(stepRows);
        if (tasError) {
          setError("Failed to create assignment steps: " + tasError.message);
          setAssigning(false);
          return;
        }
      }
    }
    setAssigning(false);
    if (assignError) {
      setError("Failed to assign task: " + assignError.message);
      return;
    }
    if (onAssigned) onAssigned();
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 500); // Give user feedback before closing
  };

  if (!taskId) return null;

  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal" style={{ minWidth: 380, maxWidth: 480 }}>
        <NeonForm
          title="Assign Task"
          onSubmit={handleAssign}
          submitLabel={assigning ? "Assigning..." : "Assign"}
          onCancel={onClose}
        >
          {/* Department select */}
          <select
            className="neon-input"
            value={selectedDepartmentId}
            onChange={e => {
              setSelectedDepartmentId(e.target.value);
              setSelectedUserId("");
            }}
            required
          >
            <option value="">Select department...</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
          {/* Manager select */}
          {selectedDepartmentId && (
            loading ? (
              <div>Loading managers...</div>
            ) : (
              <select
                className="neon-input"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">Select manager...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {(u.first_name || "") + (u.last_name ? " " + u.last_name : "") || u.email}
                    {u.departments && u.departments[0]?.name ? ` (${u.departments[0].name})` : ""}
                  </option>
                ))}
              </select>
            )
          )}
          {/* Live date/time input */}
          <div style={{ marginTop: 20 }}>
            <label htmlFor="liveAt">When should this assignment become live?</label>
            <input
              id="liveAt"
              type="datetime-local"
              className="neon-input"
              value={liveAt}
              onChange={e => setLiveAt(e.target.value)}
              required
              style={{ marginTop: 8, marginBottom: 8 }}
            />
          </div>
          {error && <div className="neon-error">{error}</div>}
          {success && <div className="neon-success">Task assigned!</div>}
        </NeonForm>
      </div>
    </div>
  );
}
