"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiSave } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SuccessModal from "@/components/ui/SuccessModal";

interface UserViewPermission {
  id?: string;
  user_id: string;
  department_id?: string;
  shift_id?: string;
}

interface UserViewPermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    access_level?: string;
    department_id?: string;
    shift_id?: string;
  };
}

export default function UserViewPermissionsDialog({
  open,
  onClose,
  user,
}: UserViewPermissionsDialogProps) {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine user role for display
  const getUserRoleDescription = () => {
    if (user.access_level === "Manager" || user.access_level === "Dept. Manager") {
      return "Manager";
    }
    if (user.access_level === "Trainer") {
      return "Trainer";
    }
    return user.access_level || "User";
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, user.id]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch departments and shifts
      const [
        { data: deptData, error: deptError },
        { data: shiftData, error: shiftError },
        { data: permissionsData, error: permissionsError },
      ] = await Promise.all([
        supabase
          .from("departments")
          .select("id, name")
          .order("name", { ascending: true }),
        supabase
          .from("shift_patterns")
          .select("id, name")
          .order("name", { ascending: true }),
        supabase
          .from("user_view_permissions")
          .select("id, department_id, shift_id")
          .eq("user_id", user.id),
      ]);

      if (deptError) throw deptError;
      if (shiftError) throw shiftError;
      if (permissionsError) throw permissionsError;

      setDepartments(deptData || []);
      setShifts(shiftData || []);

      // Extract selected departments and shifts from permissions
      const deptIds = permissionsData
        ?.filter((p) => p.department_id)
        .map((p) => p.department_id!)
        .filter((id, index, self) => self.indexOf(id) === index) || [];

      const shiftIds = permissionsData
        ?.filter((p) => p.shift_id)
        .map((p) => p.shift_id!)
        .filter((id, index, self) => self.indexOf(id) === index) || [];

      setSelectedDepartments(deptIds);
      setSelectedShifts(shiftIds);
    } catch (err: any) {
      console.error("Error loading view permissions:", err);
      setError(err.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // First, delete all existing permissions for this user
      const { error: deleteError } = await supabase
        .from("user_view_permissions")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Create new permissions based on selections
      const newPermissions: UserViewPermission[] = [];

      // Add department permissions
      selectedDepartments.forEach((deptId) => {
        newPermissions.push({
          user_id: user.id,
          department_id: deptId,
        });
      });

      // Add shift permissions
      selectedShifts.forEach((shiftId) => {
        newPermissions.push({
          user_id: user.id,
          shift_id: shiftId,
        });
      });

      // Insert new permissions if there are any
      if (newPermissions.length > 0) {
        const { error: insertError } = await supabase
          .from("user_view_permissions")
          .insert(newPermissions);

        if (insertError) throw insertError;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error saving view permissions:", err);
      setError(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleShift = (shiftId: string) => {
    setSelectedShifts((prev) =>
      prev.includes(shiftId)
        ? prev.filter((id) => id !== shiftId)
        : [...prev, shiftId]
    );
  };

  return (
    <>
      <OverlayDialog
        showCloseButton={true}
        open={open}
        onClose={onClose}
        ariaLabelledby="view-permissions-title"
      >
        <div className="neon-form-title" id="view-permissions-title" style={{ marginBottom: "1rem" }}>
          View Permissions - {getUserRoleDescription()}
        </div>

        {error && (
          <div className="neon-error" style={{ color: "#ea1c1c", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#40e0d0" }}>
            Loading permissions...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(64, 224, 208, 0.1)", borderRadius: "8px" }}>
              <h4 style={{ color: "#40e0d0", marginBottom: "0.5rem" }}>User Information</h4>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Name:</strong> {user.first_name} {user.last_name}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Email:</strong> {user.email}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Access Level:</strong> {user.access_level}
              </p>
            </div>

            <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(255, 165, 0, 0.1)", borderRadius: "4px", border: "1px solid rgba(255, 165, 0, 0.3)" }}>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>
                <strong>Default Access:</strong> By default, this user can view their own department ({departments.find(d => d.id === user.department_id)?.name || "Not assigned"}) and shift ({shifts.find(s => s.id === user.shift_id)?.name || "Not assigned"}).
                Select additional departments and shifts below to grant extended access.
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontWeight: 600,
                  color: "#40e0d0",
                  marginBottom: "0.75rem",
                  fontSize: "1.1rem",
                  borderBottom: "2px solid rgba(64, 224, 208, 0.3)",
                  paddingBottom: "0.5rem"
                }}
              >
                Additional Departments
              </div>
              <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem" }}>
                Grant access to view additional departments beyond their default:
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "0.5rem",
                  maxHeight: "300px",
                  overflowY: "auto",
                  padding: "0.5rem",
                  border: "1px solid rgba(64, 224, 208, 0.3)",
                  borderRadius: "4px"
                }}
              >
                {departments.map((dept) => (
                  <label
                    key={dept.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      cursor: "pointer",
                      borderRadius: "4px",
                      background: selectedDepartments.includes(dept.id)
                        ? "rgba(64, 224, 208, 0.2)"
                        : "transparent",
                      border: selectedDepartments.includes(dept.id)
                        ? "1px solid rgba(64, 224, 208, 0.5)"
                        : "1px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(dept.id)}
                      onChange={() => toggleDepartment(dept.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontWeight: 600,
                  color: "#39ff14",
                  marginBottom: "0.75rem",
                  fontSize: "1.1rem",
                  borderBottom: "2px solid rgba(57, 255, 20, 0.3)",
                  paddingBottom: "0.5rem"
                }}
              >
                Additional Shifts
              </div>
              <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem" }}>
                Grant access to view additional shifts beyond their default:
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "0.5rem",
                  maxHeight: "200px",
                  overflowY: "auto",
                  padding: "0.5rem",
                  border: "1px solid rgba(57, 255, 20, 0.3)",
                  borderRadius: "4px"
                }}
              >
                {shifts.map((shift) => (
                  <label
                    key={shift.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      cursor: "pointer",
                      borderRadius: "4px",
                      background: selectedShifts.includes(shift.id)
                        ? "rgba(57, 255, 20, 0.2)"
                        : "transparent",
                      border: selectedShifts.includes(shift.id)
                        ? "1px solid rgba(57, 255, 20, 0.5)"
                        : "1px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedShifts.includes(shift.id)}
                      onChange={() => toggleShift(shift.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>{shift.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div
              className="neon-panel-actions"
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "2rem"
              }}
            >
              <CustomTooltip text={saving ? "Saving permissions..." : "Save view permissions"}>
                <TextIconButton
                  variant="save"
                  icon={saving ? <span className="neon-spinner" style={{ marginRight: 8 }} /> : <FiSave />}
                  label={saving ? "Saving..." : "Save Permissions"}
                  onClick={handleSave}
                  disabled={saving}
                />
              </CustomTooltip>
            </div>
          </>
        )}
      </OverlayDialog>

      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="View permissions saved successfully!"
        autoCloseMs={1500}
      />
    </>
  );
}
