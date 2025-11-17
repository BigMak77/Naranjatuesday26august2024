"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiUsers, FiSave, FiX } from "react-icons/fi";

interface DocumentAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
}

interface Assignment {
  id: string;
  item_type: string;
  department_name?: string;
  role_title?: string;
  assigned_count?: number;
}

export default function DocumentAssignmentDialog({
  open,
  onClose,
  documentId,
  documentTitle,
}: DocumentAssignmentDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Track selected departments and roles
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, documentId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all departments and roles
      const [deptResult, roleResult] = await Promise.all([
        supabase.from("departments").select("id, name").order("name"),
        supabase.from("roles").select("id, title, department_id").order("title"),
      ]);

      if (deptResult.error) throw deptResult.error;
      if (roleResult.error) throw roleResult.error;

      setDepartments(deptResult.data || []);
      setRoles(roleResult.data || []);

      // Fetch current assignments for this document
      // We'll query user_assignments to see which departments/roles this document is assigned to
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("user_assignments")
        .select(`
          id,
          item_type,
          auth_id,
          users!inner (
            department_id,
            role_id,
            departments (name)
          )
        `)
        .eq("item_id", documentId)
        .eq("item_type", "document");

      if (assignmentError) throw assignmentError;

      // Group assignments by department and role to show which are assigned
      const deptSet = new Set<string>();
      const roleSet = new Set<string>();

      assignmentData?.forEach((assignment: any) => {
        const user = assignment.users;
        if (user?.department_id) {
          deptSet.add(user.department_id);
        }
        if (user?.role_id) {
          roleSet.add(user.role_id);
        }
      });

      setSelectedDepartments(Array.from(deptSet));
      setSelectedRoles(Array.from(roleSet));

      // Create assignment summary for display
      const deptAssignments = Array.from(deptSet).map((deptId) => {
        const dept = deptResult.data?.find((d) => d.id === deptId);
        const count = assignmentData?.filter(
          (a: any) => a.users?.department_id === deptId
        ).length || 0;
        return {
          id: deptId,
          item_type: "department",
          department_name: dept?.name || "Unknown",
          assigned_count: count,
        };
      });

      const roleAssignments = Array.from(roleSet).map((roleId) => {
        const role = roleResult.data?.find((r) => r.id === roleId);
        const count = assignmentData?.filter(
          (a: any) => a.users?.role_id === roleId
        ).length || 0;
        return {
          id: roleId,
          item_type: "role",
          role_title: role?.title || "Unknown",
          assigned_count: count,
        };
      });

      setAssignments([...deptAssignments, ...roleAssignments]);
    } catch (err: any) {
      console.error("Error fetching assignment data:", err);
      setError(err.message || "Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      // Get all users that should have this document assigned based on selected departments/roles
      let targetUsers: any[] = [];

      if (selectedDepartments.length > 0 || selectedRoles.length > 0) {
        const filters: string[] = [];
        if (selectedDepartments.length > 0) {
          filters.push(`department_id.in.(${selectedDepartments.join(",")})`);
        }
        if (selectedRoles.length > 0) {
          filters.push(`role_id.in.(${selectedRoles.join(",")})`);
        }

        const { data, error: userError } = await supabase
          .from("users")
          .select("auth_id, department_id, role_id")
          .or(filters.join(","));

        if (userError) throw userError;
        targetUsers = data || [];
      }

      // Get current assignments for this document
      const { data: currentAssignments, error: currentError } = await supabase
        .from("user_assignments")
        .select("id, auth_id")
        .eq("item_id", documentId)
        .eq("item_type", "document");

      if (currentError) throw currentError;

      const currentUserIds = new Set(
        currentAssignments?.map((a) => a.auth_id) || []
      );
      const targetUserIds = new Set(targetUsers?.map((u) => u.auth_id) || []);

      // Users to add (in target but not in current)
      const usersToAdd = targetUsers?.filter(
        (u) => !currentUserIds.has(u.auth_id)
      ) || [];

      // Users to remove (in current but not in target)
      const assignmentsToRemove = currentAssignments?.filter(
        (a) => !targetUserIds.has(a.auth_id)
      ) || [];

      // Add new assignments
      if (usersToAdd.length > 0) {
        const newAssignments = usersToAdd.map((user) => ({
          auth_id: user.auth_id,
          item_id: documentId,
          item_type: "document" as const,
          assigned_at: new Date().toISOString(),
          confirmation_required: true,
        }));

        const { error: insertError } = await supabase
          .from("user_assignments")
          .insert(newAssignments);

        if (insertError) throw insertError;
      }

      // Remove old assignments
      if (assignmentsToRemove.length > 0) {
        const idsToRemove = assignmentsToRemove.map((a) => a.id);
        const { error: deleteError } = await supabase
          .from("user_assignments")
          .delete()
          .in("id", idsToRemove);

        if (deleteError) throw deleteError;
      }

      setSuccessMessage(
        `Updated assignments: ${usersToAdd.length} added, ${assignmentsToRemove.length} removed`
      );

      // Refresh the data to show updated assignments
      await fetchData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error saving assignments:", err);
      setError(err.message || "Failed to save assignments");
    } finally {
      setSaving(false);
    }
  };

  // Group roles by department for better display
  const rolesByDepartment = roles.reduce((acc, role) => {
    if (!acc[role.department_id]) {
      acc[role.department_id] = [];
    }
    acc[role.department_id].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  return (
    <OverlayDialog
      open={open}
      onClose={onClose}
      width={1000}
      showCloseButton={true}
      ariaLabelledby="document-assignment-dialog-title"
    >
      <div style={{ padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <FiUsers size={24} style={{ color: "var(--neon)" }} />
          <h2
            id="document-assignment-dialog-title"
            className="neon-label"
            style={{ fontSize: "1.5rem", margin: 0 }}
          >
            Document Assignments
          </h2>
        </div>

        <p className="neon-text" style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
          Document: <strong>{documentTitle}</strong>
        </p>

        {error && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              color: "#22c55e",
            }}
          >
            {successMessage}
          </div>
        )}

        {loading ? (
          <p className="neon-text" style={{ textAlign: "center", padding: "2rem" }}>
            Loading assignments...
          </p>
        ) : (
          <>
            {/* Current assignments table */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 className="neon-label" style={{ marginBottom: "1rem" }}>
                Current Assignments ({assignments.length})
              </h3>
              {assignments.length === 0 ? (
                <p className="neon-text" style={{ opacity: 0.6, fontStyle: "italic" }}>
                  No departments or roles currently assigned
                </p>
              ) : (
                <NeonTable
                  columns={[
                    { header: "Type", accessor: "type", width: 120 },
                    { header: "Name", accessor: "name", width: 300 },
                    { header: "Users Assigned", accessor: "count", width: 150 },
                  ]}
                  data={assignments.map((assignment) => ({
                    type: assignment.item_type === "department" ? "Department" : "Role",
                    name: assignment.department_name || assignment.role_title || "—",
                    count: assignment.assigned_count || 0,
                  }))}
                  onColumnResize={() => {}}
                />
              )}
            </div>

            {/* Selection Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "16rem" }}>
              {/* Department selection */}
              <div style={{ position: "relative", zIndex: 10 }}>
                <label className="neon-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                  Assign to Departments
                </label>
                <SearchableMultiSelect
                  options={departments}
                  selected={selectedDepartments}
                  onChange={setSelectedDepartments}
                  labelKey="name"
                  valueKey="id"
                  placeholder="Search departments..."
                />
                <p className="neon-text" style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.6 }}>
                  Select departments to assign this document to all users in those departments
                </p>
              </div>

              {/* Role selection */}
              <div style={{ position: "relative", zIndex: 9 }}>
                <label className="neon-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                  Assign to Roles
                </label>
                <SearchableMultiSelect
                  options={roles}
                  selected={selectedRoles}
                  onChange={setSelectedRoles}
                  labelKey="title"
                  valueKey="id"
                  placeholder="Search roles..."
                />
                <p className="neon-text" style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.6 }}>
                  Select specific roles to assign this document to users with those roles
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="secondary"
                label="Cancel"
                onClick={onClose}
                disabled={saving}
              />
              <TextIconButton
                variant="primary"
                label={saving ? "Saving..." : "Save Assignments"}
                onClick={handleSave}
                disabled={saving}
              />
            </div>
          </>
        )}
      </div>
    </OverlayDialog>
  );
}
