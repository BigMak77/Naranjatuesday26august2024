"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiUsers } from "react-icons/fi";

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

      // Fetch users from selected departments and roles separately
      const usersByDept: any[] = [];
      const usersByRole: any[] = [];

      if (selectedDepartments.length > 0) {
        const { data, error: deptError } = await supabase
          .from("users")
          .select("auth_id, department_id, role_id")
          .in("department_id", selectedDepartments);

        if (deptError) throw deptError;
        usersByDept.push(...(data || []));
      }

      if (selectedRoles.length > 0) {
        const { data, error: roleError } = await supabase
          .from("users")
          .select("auth_id, department_id, role_id")
          .in("role_id", selectedRoles);

        if (roleError) throw roleError;
        usersByRole.push(...(data || []));
      }

      // Combine and deduplicate users by auth_id
      const userMap = new Map();
      [...usersByDept, ...usersByRole].forEach((user) => {
        userMap.set(user.auth_id, user);
      });
      targetUsers = Array.from(userMap.values());

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

  return (
    <OverlayDialog
      open={open}
      onClose={onClose}
      width={1000}
      showCloseButton={true}
      ariaLabelledby="document-assignment-dialog-title"
    >
      <div className="dialog-content">
        <div className="flex items-center gap-3 mb-6">
          <FiUsers size={24} className="neon-icon" />
          <h2 id="document-assignment-dialog-title" className="neon-label text-xl m-0">
            Document Assignments
          </h2>
        </div>

        <p className="neon-text mb-6 opacity-80">
          Document: <strong>{documentTitle}</strong>
        </p>

        {error && <div className="error-box">{error}</div>}

        {successMessage && <div className="success-box">{successMessage}</div>}

        {loading ? (
          <p className="loading-state">Loading assignments...</p>
        ) : (
          <>
            {/* Current assignments table */}
            <div className="mb-8">
              <h3 className="neon-label mb-4">
                Current Assignments ({assignments.length})
              </h3>
              {assignments.length === 0 ? (
                <p className="empty-state">
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
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Department selection */}
              <div className="form-section">
                <label className="neon-label mb-2">
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
                <p className="neon-text text-sm mt-2 opacity-60">
                  Select departments to assign this document to all users in those departments
                </p>
              </div>

              {/* Role selection */}
              <div className="form-section">
                <label className="neon-label mb-2">
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
                <p className="neon-text text-sm mt-2 opacity-60">
                  Select specific roles to assign this document to users with those roles
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-buttons justify-end gap-4">
              <TextIconButton
                variant="save"
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
