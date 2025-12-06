// RotaByDepartment.tsx - Table of users grouped by shift within a single department
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import SuccessModal from "@/components/ui/SuccessModal";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id?: string;
  shift_id?: string;
  role_id?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
}

export default function RotaByDepartment({ departmentId }: { departmentId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [
        { data: userRows, error: userError },
        { data: deptRows, error: deptError },
        { data: shiftRows, error: shiftError },
        { data: roleRows, error: roleError }
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id, first_name, last_name, email, department_id, shift_id, role_id")
          .eq("is_archived", false)
          .eq("is_leaver", false),
        supabase.from("departments").select("id, name"),
        supabase.from("shift_patterns").select("id, name"),
        supabase.from("roles").select("id, title"),
      ]);

      setDepartments(deptRows || []);
      setShifts(shiftRows || []);
      setRoles(roleRows || []);
      setUsers(userRows || []);
      setLoading(false);

      if (userError) {
        // eslint-disable-next-line no-console
        console.error("Supabase user fetch error:", userError);
      }
      if (roleError) {
        // eslint-disable-next-line no-console
        console.error("Supabase role fetch error:", roleError);
      }
      if (deptError) {
        // eslint-disable-next-line no-console
        console.error("Supabase department fetch error:", deptError);
      }
      if (shiftError) {
        // eslint-disable-next-line no-console
        console.error("Supabase shift fetch error:", shiftError);
      }

      // Debug log to see what we got
      // eslint-disable-next-line no-console
      console.log("Fetched roles:", roleRows);
      // eslint-disable-next-line no-console
      console.log("Sample user role_id:", userRows?.[0]?.role_id);
    };
    fetchData();
  }, []);

  // Get current department
  const currentDepartment = departments.find(d => d.id === departmentId) || null;

  // Filter users by department - only show data when a department is selected
  const filteredUsers = departmentId
    ? users.filter(u => u.department_id === departmentId)
    : [];

  // Group users by shift, then by role
  const grouped: Record<string, Record<string, User[]>> = {};
  filteredUsers.forEach(u => {
    const shiftId = u.shift_id || "none";
    const roleId = u.role_id || "none";

    if (!grouped[shiftId]) grouped[shiftId] = {};
    if (!grouped[shiftId][roleId]) grouped[shiftId][roleId] = [];
    grouped[shiftId][roleId].push(u);
  });

  // Sort users within each role group by last name, then first name
  Object.keys(grouped).forEach(shiftId => {
    Object.keys(grouped[shiftId]).forEach(roleId => {
      grouped[shiftId][roleId].sort((a, b) => {
        const lastNameCompare = (a.last_name || "").localeCompare(b.last_name || "");
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.first_name || "").localeCompare(b.first_name || "");
      });
    });
  });

  // Handle opening dialog to change shift
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setSelectedShift(user.shift_id || "");
    setError("");
    setDialogOpen(true);
  };

  // Handle saving shift change
  const handleSaveShift = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      setError("");

      const { error: updateError } = await supabase
        .from("users")
        .update({ shift_id: selectedShift || null })
        .eq("id", selectedUser.id);

      if (updateError) throw updateError;

      // Update local state
      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? { ...u, shift_id: selectedShift || undefined }
          : u
      ));

      setDialogOpen(false);
      setSuccessMessage(`Shift updated for ${selectedUser.first_name} ${selectedUser.last_name}`);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error updating shift:", err);
      setError(err.message || "Failed to update shift");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {!departmentId ? (
        <div className="neon-label">Please select a department to view shifts.</div>
      ) : (
        <>
          {loading ? (
            <div className="neon-loading">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="neon-label">No users found in this department.</div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 32,
                flexWrap: "wrap",
                overflowX: "auto",
                paddingBottom: 8,
              }}
            >
              {shifts.map(shift => {
                const shiftUsers = grouped[shift.id] || {};
                const totalCount = Object.values(shiftUsers).flat().length;

                return (
                  <div key={shift.id} style={{ minWidth: 160, maxWidth: 240, flex: "1 1 180px" }}>
                    <h3 style={{ margin: "8px 0 8px 0", fontWeight: 600 }}>
                      {shift.name} <span style={{ fontWeight: 400, color: '#888' }}>({totalCount})</span>
                    </h3>
                    {Object.entries(shiftUsers)
                      .sort(([roleIdA], [roleIdB]) => {
                        // Sort "none" to the end
                        if (roleIdA === "none") return 1;
                        if (roleIdB === "none") return -1;
                        // Sort other roles alphabetically by title
                        const roleNameA = roles.find(r => r.id === roleIdA)?.title || "";
                        const roleNameB = roles.find(r => r.id === roleIdB)?.title || "";
                        return roleNameA.localeCompare(roleNameB);
                      })
                      .map(([roleId, users]) => {
                      const roleName = roleId === "none" ? "No Role" : (roles.find(r => r.id === roleId)?.title || "Unknown Role");
                      return (
                        <div key={roleId} style={{ marginBottom: "12px" }}>
                          <h4 style={{
                            margin: "0 0 4px 0",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            color: "#999"
                          }}>
                            {roleName} ({users.length})
                          </h4>
                          <ul style={{ margin: 0, padding: 0, paddingLeft: "8px", listStyle: "none" }}>
                            {users.map(u => (
                              <li
                                key={u.id}
                                style={{
                                  padding: "3px 0",
                                  cursor: "pointer",
                                  color: "#40e0d0",
                                  transition: "opacity 0.2s"
                                }}
                                onClick={() => handleUserClick(u)}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                              >
                                {`${u.first_name} ${u.last_name}`.trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {/* Optionally, show users with no shift */}
              {grouped["none"] && Object.keys(grouped["none"]).length > 0 && (() => {
                const noShiftUsers = grouped["none"];
                const totalCount = Object.values(noShiftUsers).flat().length;

                return (
                  <div key="none" style={{ minWidth: 160, maxWidth: 240, flex: "1 1 180px" }}>
                    <h3 style={{ margin: "8px 0 8px 0", fontWeight: 600 }}>
                      No Shift <span style={{ fontWeight: 400, color: '#888' }}>({totalCount})</span>
                    </h3>
                    {Object.entries(noShiftUsers)
                      .sort(([roleIdA], [roleIdB]) => {
                        // Sort "none" to the end
                        if (roleIdA === "none") return 1;
                        if (roleIdB === "none") return -1;
                        // Sort other roles alphabetically by title
                        const roleNameA = roles.find(r => r.id === roleIdA)?.title || "";
                        const roleNameB = roles.find(r => r.id === roleIdB)?.title || "";
                        return roleNameA.localeCompare(roleNameB);
                      })
                      .map(([roleId, users]) => {
                      const roleName = roleId === "none" ? "No Role" : (roles.find(r => r.id === roleId)?.title || "Unknown Role");
                      return (
                        <div key={roleId} style={{ marginBottom: "12px" }}>
                          <h4 style={{
                            margin: "0 0 4px 0",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            color: "#999"
                          }}>
                            {roleName} ({users.length})
                          </h4>
                          <ul style={{ margin: 0, padding: 0, paddingLeft: "8px", listStyle: "none" }}>
                            {users.map(u => (
                              <li
                                key={u.id}
                                style={{
                                  padding: "3px 0",
                                  cursor: "pointer",
                                  color: "#40e0d0",
                                  transition: "opacity 0.2s"
                                }}
                                onClick={() => handleUserClick(u)}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                              >
                                {`${u.first_name} ${u.last_name}`.trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Shift Change Dialog */}
      <OverlayDialog
        showCloseButton={true}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser(null);
          setError("");
        }}
        ariaLabelledby="shift-change-title"
      >
        <div className="neon-form-title" id="shift-change-title">
          Change Shift
        </div>

        {error && (
          <div className="neon-error-message" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {selectedUser && (
          <div className="user-manager-form">
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(64, 224, 208, 0.1)", borderRadius: "8px" }}>
              <p style={{ margin: "0.25rem 0" }}><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
              <p style={{ margin: "0.25rem 0" }}><strong>Email:</strong> {selectedUser.email}</p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Current Shift:</strong> {
                  selectedUser.shift_id
                    ? shifts.find(s => s.id === selectedUser.shift_id)?.name || "Unknown"
                    : "No shift"
                }
              </p>
            </div>

            <div className="user-manager-form-field">
              <label htmlFor="shift-select">New Shift</label>
              <select
                id="shift-select"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="neon-input"
                style={{ width: "100%" }}
              >
                <option value="">No shift</option>
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>{shift.name}</option>
                ))}
              </select>
            </div>

            <div className="user-manager-form-actions" style={{ marginTop: "1.5rem" }}>
              <TextIconButton
                variant="secondary"
                label="Cancel"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedUser(null);
                  setError("");
                }}
                disabled={saving}
              />
              <TextIconButton
                variant="primary"
                label={saving ? "Saving..." : "Save Shift"}
                onClick={handleSaveShift}
                disabled={saving}
              />
            </div>
          </div>
        )}
      </OverlayDialog>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
        autoCloseMs={2000}
      />
    </div>
  );
}
