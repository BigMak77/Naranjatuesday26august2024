"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";
import SuccessModal from "@/components/ui/SuccessModal";

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
}

interface SimpleRoleAssignmentProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SimpleRoleAssignment({
  user,
  onClose,
  onSuccess
}: SimpleRoleAssignmentProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(user.department_id || "");
  const [selectedRoleId, setSelectedRoleId] = useState(user.role_id || "");

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

  const handleSave = async () => {
    if (!selectedDepartmentId) {
      setError("Please select a department");
      return;
    }

    if (!selectedRoleId) {
      setError("Please select a role");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Simple update - just update the user's department and role
      const { error: updateError } = await supabase
        .from("users")
        .update({
          department_id: selectedDepartmentId,
          role_id: selectedRoleId
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error saving:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter((r) => r.department_id === selectedDepartmentId);

  if (loading) {
    return (
      <div className="neon-form-content" style={{ minWidth: "600px", padding: "2rem", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Department and role updated successfully!"
        autoCloseMs={1500}
      />

      <div className="neon-form-content" style={{ minWidth: "600px", maxWidth: "700px" }}>
        <div className="neon-form-title" style={{ marginBottom: "1.5rem" }}>
          Assign Department & Role
        </div>

        {/* User Details Section */}
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
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
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
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Email</div>
              <div>{user.email}</div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem",
            background: "rgba(255, 0, 0, 0.1)",
            border: "1px solid rgba(255, 0, 0, 0.3)",
            borderRadius: "8px",
            color: "#ff6b6b",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}

        {/* Department Selection */}
        <div style={{ marginBottom: "1rem" }}>
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
            <option value="">Select a department...</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="neon-label" htmlFor="role-select">
            Role *
          </label>
          <select
            id="role-select"
            className="neon-input"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            disabled={saving || !selectedDepartmentId}
          >
            <option value="">Select a role...</option>
            {filteredRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
          {selectedDepartmentId && filteredRoles.length === 0 && (
            <div style={{ fontSize: "0.85rem", color: "#ffa500", marginTop: "0.25rem" }}>
              No roles available for this department
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <TextIconButton
            variant="secondary"
            label="Cancel"
            onClick={onClose}
            disabled={saving}
          />
          <TextIconButton
            variant="primary"
            label={saving ? "Saving..." : "Save"}
            onClick={handleSave}
            disabled={saving || !selectedDepartmentId || !selectedRoleId}
          />
        </div>
      </div>
    </>
  );
}
