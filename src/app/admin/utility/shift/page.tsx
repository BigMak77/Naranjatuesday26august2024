"use client";

import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import NeonForm from "@/components/NeonForm";
import TextIconButton from "@/components/ui/TextIconButtons";
import { supabase } from "@/lib/supabase-client";

export default function AdminShiftPage() {
  const [shifts, setShifts] = useState<
    Array<{ id: string; name: string; start: string; end_time: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [form, setForm] = useState({ name: "", start: "", end_time: "" });
  const [submitting, setSubmitting] = useState(false);
  const [newShiftId, setNewShiftId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [users, setUsers] = useState<
    Array<{ id: string; first_name: string; last_name: string }>
  >([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shift_patterns")
        .select("*")
        .order("start");
      if (error) setError("Failed to load shifts");
      setShifts(data || []);
      setLoading(false);
    };
    fetchShifts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shift pattern?")) return;
    await supabase.from("shift_patterns").delete().eq("id", id);
    setShifts((shifts) => shifts.filter((s) => s.id !== id));
  };

  // Stage 1: Create shift pattern
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { name, start, end_time } = form;
    if (!name || !start || !end_time) {
      setError("All fields required");
      setSubmitting(false);
      return;
    }
    const { error, data } = await supabase
      .from("shift_patterns")
      .insert([{ name, start, end_time }])
      .select();
    if (error) setError("Failed to create shift");
    if (data && data[0]) {
      setNewShiftId(data[0].id);
      setShifts((shifts) => [...shifts, data[0]]);
      setStage(2);
    }
    setSubmitting(false);
  };

  // Stage 2: Add to department?
  const handleFetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name")
      .order("name");
    if (!error && data) setDepartments(data);
  };

  // Stage 3: Select users?
  const handleFetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .order("first_name");
    if (!error && data) setUsers(data);
  };

  // Final save: assign to dept/users if selected
  const handleFinalSave = async () => {
    setSubmitting(true);
    setError(null);
    // Assign to department
    if (selectedDept && newShiftId) {
      await supabase
        .from("department_shifts")
        .insert({ department_id: selectedDept, shift_id: newShiftId });
    }
    // Assign to users
    if (selectedUsers.length > 0 && newShiftId) {
      const assignments = selectedUsers.map((uid) => ({
        user_id: uid,
        shift_id: newShiftId,
      }));
      await supabase.from("user_shifts").insert(assignments);
    }
    // Reset
    setForm({ name: "", start: "", end_time: "" });
    setSelectedDept("");
    setSelectedUsers([]);
    setNewShiftId(null);
    setStage(1);
    setSubmitting(false);
  };

  return (
    <>
      <h2 className="neon-section-title mb-4">Shift Patterns</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : (
        <div className="space-y-6">
          {" "}
          {/* Add vertical spacing between table and forms */}
          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Start", accessor: "start" },
              { header: "End", accessor: "end_time" },
              { header: "Actions", accessor: "actions" },
            ]}
            data={shifts.map((s) => ({
              ...s,
              actions: (
                <TextIconButton
                  variant="delete"
                  label="Delete"
                  onClick={() => handleDelete(s.id)}
                />
              ),
            }))}
          />
          <div className="mt-8">
            {stage === 1 && (
              <NeonForm
                title="Create New Shift Pattern"
                onSubmit={handleCreateShift}
                submitLabel={submitting ? "Creating..." : "Next"}
              >
                <label className="neon-form-title">
                  Name
                  <input
                    className="neon-input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="neon-form-title">
                  Start Time
                  <input
                    className="neon-input"
                    type="time"
                    value={form.start}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="neon-form-title">
                  End Time
                  <input
                    className="neon-input"
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_time: e.target.value }))
                    }
                    required
                  />
                </label>
                {error && <div className="neon-error text-base">{error}</div>}
              </NeonForm>
            )}
            {stage === 2 && (
              <div className="neon-form-group">
                <p className="mb-4">Add this shift to a department?</p>
                <button
                  className="neon-btn neon-btn-primary mr-4"
                  onClick={async () => {
                    await handleFetchDepartments();
                    setStage(21);
                  }}
                >
                  Yes
                </button>
                <button
                  className="neon-btn neon-btn-secondary"
                  onClick={() => setStage(3)}
                >
                  No
                </button>
              </div>
            )}
            {stage === 21 && (
              <div className="neon-form-group">
                <p className="mb-2">Select a department:</p>
                <select
                  className="neon-input mb-4"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="">Select...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  className="neon-btn neon-btn-primary mr-4"
                  onClick={() => setStage(3)}
                >
                  Next
                </button>
                <button
                  className="neon-btn neon-btn-secondary"
                  onClick={() => {
                    setSelectedDept("");
                    setStage(3);
                  }}
                >
                  Skip
                </button>
              </div>
            )}
            {stage === 3 && (
              <div className="neon-form-group">
                <p className="mb-4">Select users for this shift?</p>
                <button
                  className="neon-btn neon-btn-primary mr-4"
                  onClick={async () => {
                    await handleFetchUsers();
                    setStage(31);
                  }}
                >
                  Yes
                </button>
                <button
                  className="neon-btn neon-btn-secondary"
                  onClick={handleFinalSave}
                >
                  No, Save
                </button>
              </div>
            )}
            {stage === 31 && (
              <div className="neon-form-group">
                <p className="mb-2">Search and select users:</p>
                <input
                  className="neon-input mb-2"
                  type="search"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto mb-4">
                  {users
                    .filter((u) =>
                      `${u.first_name} ${u.last_name}`
                        .toLowerCase()
                        .includes(userSearch.toLowerCase()),
                    )
                    .map((u) => (
                      <label key={u.id} className="block mb-1">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedUsers((arr) => [...arr, u.id]);
                            else
                              setSelectedUsers((arr) =>
                                arr.filter((id) => id !== u.id),
                              );
                          }}
                        />{" "}
                        {u.first_name} {u.last_name}
                      </label>
                    ))}
                </div>
                <button
                  className="neon-btn neon-btn-primary mr-4"
                  onClick={handleFinalSave}
                >
                  Save
                </button>
                <button
                  className="neon-btn neon-btn-secondary"
                  onClick={handleFinalSave}
                >
                  Skip & Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
