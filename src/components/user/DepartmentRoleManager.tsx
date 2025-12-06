"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";
import { FiEdit, FiSave } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { useUser } from "@/lib/useUser";

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  employee_number?: string;
  department_id?: string;
  role_id?: string;
  auth_id?: string;
}

interface DepartmentRoleManagerProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DepartmentRoleManager({
  user,
  onClose,
  onSuccess
}: DepartmentRoleManagerProps) {
  const { user: currentUser } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(user.department_id || "");
  const [selectedRoleId, setSelectedRoleId] = useState(user.role_id || "");
  const [changeReason, setChangeReason] = useState("");

  // Track original values
  const [originalDepartmentId] = useState(user.department_id || null);
  const [originalRoleId] = useState(user.role_id || null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: depts }, { data: rolesData }] = await Promise.all([
        supabase.from("departments").select("id, name").order("name"),
        supabase.from("roles").select("id, title, department_id").order("title")
      ]);

      setDepartments(depts || []);
      setRoles(rolesData || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load departments and roles");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      selectedDepartmentId !== (originalDepartmentId || "") ||
      selectedRoleId !== (originalRoleId || "")
    );
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      setError("No changes detected");
      return;
    }

    if (!selectedDepartmentId) {
      setError("Please select a department");
      return;
    }

    if (!selectedRoleId) {
      setError("Please select a role");
      return;
    }

    if (!changeReason.trim()) {
      setError("Please provide a reason for this change");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Use the API endpoint to handle the entire department/role change
      // This avoids authentication issues with direct client-side database inserts
      const response = await fetch("/api/change-user-department-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          old_department_id: originalDepartmentId,
          old_role_id: originalRoleId,
          new_department_id: selectedDepartmentId,
          new_role_id: selectedRoleId,
          changed_by: currentUser?.id || null,
          change_reason: changeReason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update department and role");
      }

      const result = await response.json();
      console.log("Department/role change successful:", result);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error saving department/role change:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter((r) => r.department_id === selectedDepartmentId);

  // Get display names
  const originalDepartmentName =
    departments.find((d) => d.id === originalDepartmentId)?.name || "None";
  const originalRoleName = roles.find((r) => r.id === originalRoleId)?.title || "None";
  const newDepartmentName =
    departments.find((d) => d.id === selectedDepartmentId)?.name || "None";
  const newRoleName = roles.find((r) => r.id === selectedRoleId)?.title || "None";

  return (
    <>
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Department and role updated successfully!"
        autoCloseMs={1500}
      />

      <div className="neon-form-content" style={{ minWidth: "700px", maxWidth: "800px", overflow: "visible" }}>
        <div className="neon-form-title" style={{ marginBottom: "1.5rem" }}>
          Change Department & Role
        </div>

        {/* Personal Details & Current Assignment Section */}
        <div
          style={{
            padding: "0.75rem",
            background: "rgba(64, 224, 208, 0.08)",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid rgba(64, 224, 208, 0.2)"
          }}
        >
          <div style={{
            fontWeight: 600,
            color: "#40e0d0",
            marginBottom: "0.5rem",
            fontSize: "1.1rem",
            borderBottom: "1px solid rgba(64, 224, 208, 0.3)",
            paddingBottom: "0.5rem"
          }}>
            Current Details
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
            fontSize: "0.95rem"
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Name</div>
              <div>{user.first_name || ""} {user.last_name || ""}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Employee Number</div>
              <div>{user.employee_number || "—"}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Department</div>
              <div>{originalDepartmentName}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Role</div>
              <div>{originalRoleName}</div>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="neon-error"
            style={{
              color: "#ea1c1c",
              padding: "0.75rem",
              background: "rgba(234, 28, 28, 0.1)",
              borderRadius: "4px",
              marginBottom: "1rem",
              border: "1px solid rgba(234, 28, 28, 0.3)"
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", opacity: 0.7 }}>
            Loading departments and roles...
          </div>
        ) : (
          <>
            {/* New Assignment Section */}
            <div
              style={{
                padding: "0.75rem",
                background: "rgba(57, 255, 20, 0.08)",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                border: "1px solid rgba(57, 255, 20, 0.2)"
              }}
            >
              <div style={{
                fontWeight: 600,
                color: "#39ff14",
                marginBottom: "0.5rem",
                fontSize: "1.1rem",
                borderBottom: "1px solid rgba(57, 255, 20, 0.3)",
                paddingBottom: "0.5rem"
              }}>
                New Assignment
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {/* Department Selection */}
                <div>
                  <label className="neon-label" htmlFor="department-select">
                    Department *
                  </label>
                  <select
                    id="department-select"
                    className="neon-input"
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedRoleId(""); // Reset role when department changes
                    }}
                    disabled={saving}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="neon-label" htmlFor="role-select">
                    Role *
                  </label>
                  <select
                    id="role-select"
                    className="neon-input"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    disabled={!selectedDepartmentId || saving}
                  >
                    <option value="">Select Role</option>
                    {filteredRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title}
                      </option>
                    ))}
                  </select>
                  {selectedDepartmentId && filteredRoles.length === 0 && (
                    <div style={{ fontSize: "0.875rem", color: "#ffa500", marginTop: "0.5rem" }}>
                      No roles available for this department
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Change Reason Section */}
            <div
              style={{
                padding: "0.75rem",
                background: "rgba(138, 43, 226, 0.08)",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                border: "1px solid rgba(138, 43, 226, 0.2)"
              }}
            >
              <div style={{
                fontWeight: 600,
                color: "#9370db",
                marginBottom: "0.5rem",
                fontSize: "1.1rem",
                borderBottom: "1px solid rgba(138, 43, 226, 0.3)",
                paddingBottom: "0.5rem"
              }}>
                Change Details
              </div>

              <div>
                <label className="neon-label" htmlFor="change-reason">
                  Reason for Change *
                </label>
                <select
                  id="change-reason"
                  className="neon-input"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select a reason...</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Change of Role">Change of Role</option>
                  <option value="Secondment (Temporary)">Secondment (Temporary)</option>
                  <option value="Admin Error">Admin Error</option>
                </select>
              </div>
            </div>

            {/* Change Summary */}
            {hasChanges() && (
              <div
                style={{
                  padding: "1rem",
                  background: "rgba(255, 165, 0, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 165, 0, 0.3)"
                }}
              >
                <div style={{ fontWeight: 600, color: "#ffa500", marginBottom: "0.5rem" }}>
                  Change Summary
                </div>
                <div style={{ fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "0.25rem" }}>
                    <span style={{ opacity: 0.7 }}>Department:</span>
                    <span>
                      <span style={{ color: "#ea1c1c" }}>{originalDepartmentName}</span>
                      {" → "}
                      <span style={{ color: "#39ff14" }}>{newDepartmentName}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <span style={{ opacity: 0.7 }}>Role:</span>
                    <span>
                      <span style={{ color: "#ea1c1c" }}>{originalRoleName}</span>
                      {" → "}
                      <span style={{ color: "#39ff14" }}>{newRoleName}</span>
                    </span>
                  </div>
                </div>
                {selectedRoleId !== originalRoleId && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      marginTop: "0.75rem",
                      padding: "0.5rem",
                      background: "rgba(64, 224, 208, 0.1)",
                      borderRadius: "4px"
                    }}
                  >
                    ℹ️ Training assignments will be automatically updated based on the new role
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(64, 224, 208, 0.2)"
          }}
        >
          <CustomTooltip
            text={
              !hasChanges()
                ? "No changes to save"
                : saving
                ? "Saving changes and updating history..."
                : "Save department and role changes with history tracking"
            }
          >
            <TextIconButton
              variant="save"
              icon={saving ? <span className="neon-spinner" /> : <FiSave />}
              label={saving ? "Saving..." : "Save Changes"}
              onClick={handleSave}
              disabled={saving || !hasChanges()}
            />
          </CustomTooltip>
        </div>
      </div>
    </>
  );
}
