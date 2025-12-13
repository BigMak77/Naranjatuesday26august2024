"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import DualPaneSelector from "@/components/ui/DualPaneSelector";
import SuccessModal from "@/components/ui/SuccessModal";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { FiSearch } from "react-icons/fi";

interface Module {
  id: string;
  name: string;
  ref_code?: string;
  description: string;
}

interface Role {
  id: string;
  title: string;
}

interface Department {
  id: string;
  name: string;
}

type AssignmentType = "role" | "department" | null;

interface BulkModuleAssignmentProps {
  preSelectedModuleId?: string;
  onClose?: () => void;
}

export default function BulkModuleAssignment({ preSelectedModuleId, onClose }: BulkModuleAssignmentProps = {}) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(preSelectedModuleId || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Step 2: Assignment type selection
  const [showAssignmentTypeDialog, setShowAssignmentTypeDialog] = useState(false);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(null);

  // Step 3: Role/Department selection
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Success state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  // Separate effect to handle pre-selected module
  useEffect(() => {
    if (preSelectedModuleId && modules.length > 0) {
      handleModuleSelect(preSelectedModuleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedModuleId, modules.length]);

  const fetchModules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("id, name, ref_code, description")
      .eq("is_archived", false)
      .order("name", { ascending: true });

    if (!error && data) {
      setModules(data);
    }
    setLoading(false);
  };

  const fetchRolesAndDepartments = async () => {
    const { data: rolesData } = await supabase
      .from("roles")
      .select("id, title")
      .order("title", { ascending: true });

    const { data: departmentsData } = await supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true });

    setRoles(rolesData || []);
    setDepartments(departmentsData || []);
  };

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      (m.ref_code && m.ref_code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleModuleSelect = async (moduleId: string) => {
    setSelectedModuleId(moduleId);
    await fetchRolesAndDepartments();
    setShowAssignmentTypeDialog(true);
  };

  const handleAssignmentTypeSelect = async (type: AssignmentType) => {
    setAssignmentType(type);
    setShowAssignmentTypeDialog(false);

    // Fetch existing assignments for this module
    if (type === "role") {
      const { data: existingAssignments } = await supabase
        .from("role_assignments")
        .select("role_id")
        .eq("item_id", selectedModuleId)
        .eq("type", "module");

      if (existingAssignments) {
        const existingRoleIds = existingAssignments.map(a => a.role_id);
        setSelectedRoles(existingRoleIds);
      }
    } else if (type === "department") {
      const { data: existingAssignments } = await supabase
        .from("department_assignments")
        .select("department_id")
        .eq("item_id", selectedModuleId)
        .eq("type", "module");

      if (existingAssignments) {
        const existingDeptIds = existingAssignments.map(a => a.department_id);
        setSelectedDepartments(existingDeptIds);
      }
    }

    setShowSelectionDialog(true);
  };

  const handleSave = async () => {
    if (!selectedModuleId || !assignmentType) return;

    setSaving(true);

    try {
      if (assignmentType === "role") {
        // Get current assignments from database
        const { data: currentAssignments } = await supabase
          .from("role_assignments")
          .select("role_id")
          .eq("item_id", selectedModuleId)
          .eq("type", "module");

        const currentRoleIds = (currentAssignments || []).map(a => a.role_id);

        // Calculate additions and removals
        const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id));
        const rolesToRemove = currentRoleIds.filter(id => !selectedRoles.includes(id));

        // Remove deselected assignments
        if (rolesToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from("role_assignments")
            .delete()
            .eq("item_id", selectedModuleId)
            .eq("type", "module")
            .in("role_id", rolesToRemove);

          if (deleteError) {
            console.error("Error removing module from roles:", deleteError);
            alert(`Error removing module from roles: ${deleteError.message}`);
            setSaving(false);
            return;
          }
        }

        // Add new assignments
        if (rolesToAdd.length > 0) {
          const newAssignments = rolesToAdd.map(roleId => ({
            role_id: roleId,
            item_id: selectedModuleId,
            module_id: selectedModuleId, // Legacy column
            document_id: null, // Legacy column
            type: "module"
          }));

          const { error: insertError } = await supabase
            .from("role_assignments")
            .insert(newAssignments);

          if (insertError) {
            console.error("Error assigning module to roles:", insertError);
            alert(`Error assigning module to roles: ${insertError.message}`);
            setSaving(false);
            return;
          }
        }

        // Sync training for all affected roles (both added and removed)
        const affectedRoleIds = [...new Set([...rolesToAdd, ...rolesToRemove])];
        for (const roleId of affectedRoleIds) {
          const { data: users } = await supabase
            .from("users")
            .select("auth_id")
            .eq("role_id", roleId);

          const authIds = (users || []).map((u: any) => u.auth_id);
          if (authIds.length > 0) {
            await fetch("/api/sync-training-from-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role_id: roleId, auth_ids: authIds }),
            });
          }
        }
      } else if (assignmentType === "department") {
        // Get current assignments from database
        const { data: currentAssignments } = await supabase
          .from("department_assignments")
          .select("department_id")
          .eq("item_id", selectedModuleId)
          .eq("type", "module");

        const currentDeptIds = (currentAssignments || []).map(a => a.department_id);

        // Calculate additions and removals
        const deptsToAdd = selectedDepartments.filter(id => !currentDeptIds.includes(id));
        const deptsToRemove = currentDeptIds.filter(id => !selectedDepartments.includes(id));

        // Remove deselected assignments
        if (deptsToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from("department_assignments")
            .delete()
            .eq("item_id", selectedModuleId)
            .eq("type", "module")
            .in("department_id", deptsToRemove);

          if (deleteError) {
            console.error("Error removing module from departments:", deleteError);
            alert(`Error removing module from departments: ${deleteError.message}`);
            setSaving(false);
            return;
          }
        }

        // Add new assignments
        if (deptsToAdd.length > 0) {
          const newAssignments = deptsToAdd.map(departmentId => ({
            department_id: departmentId,
            item_id: selectedModuleId,
            type: "module"
          }));

          const { error: insertError } = await supabase
            .from("department_assignments")
            .insert(newAssignments);

          if (insertError) {
            console.error("Error assigning module to departments:", insertError);
            alert(`Error assigning module to departments: ${insertError.message}`);
            setSaving(false);
            return;
          }
        }

        // Sync training for all affected departments (both added and removed)
        const affectedDeptIds = [...new Set([...deptsToAdd, ...deptsToRemove])];
        for (const departmentId of affectedDeptIds) {
          await fetch("/api/sync-department-training", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ department_id: departmentId }),
          });
        }
      }

      // Success - show modal and reset
      setShowSelectionDialog(false);
      setShowSuccessModal(true);
      setSelectedModuleId("");
      setAssignmentType(null);
      setSelectedRoles([]);
      setSelectedDepartments([]);

      // If used in dialog mode, close after success
      if (preSelectedModuleId && onClose) {
        setTimeout(() => {
          setShowSuccessModal(false);
          onClose();
        }, 2000); // Close after 2 seconds to show success message
      }
    } catch (err) {
      console.error("Error saving bulk assignment:", err);
      alert("An error occurred while saving assignments");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAssignmentTypeDialog(false);
    setShowSelectionDialog(false);
    setSelectedModuleId("");
    setAssignmentType(null);
    setSelectedRoles([]);
    setSelectedDepartments([]);
    // Call onClose callback if provided (for dialog usage)
    if (onClose) {
      onClose();
    }
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  if (loading) {
    return <div>Loading modules...</div>;
  }

  if (showSuccessModal) {
    return (
      <SuccessModal
        open={true}
        onClose={() => setShowSuccessModal(false)}
        message={`Module successfully assigned to ${assignmentType === "role" ? selectedRoles.length + " role(s)" : selectedDepartments.length + " department(s)"}`}
      />
    );
  }

  return (
    <>
      {/* Only show the module selection panel if no pre-selected module */}
      {!preSelectedModuleId && (
        <NeonPanel>
          <h2 className="neon-heading">Bulk Module Assignment</h2>
          <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
            Select a module below, then choose whether to assign it to roles or departments
          </p>

          <div style={{ marginBottom: 16 }}>
            <CustomTooltip text="Search modules by name, ref code, or description">
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search modules..."
                  className="neon-input"
                  style={{ paddingLeft: "40px" }}
                />
                <FiSearch
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                    fontSize: "1.2rem"
                  }}
                />
              </div>
            </CustomTooltip>
          </div>

          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Ref Code", accessor: "ref_code", width: 120 },
              { header: "Description", accessor: "description" },
              { header: "Actions", accessor: "actions", width: 120 },
            ]}
            data={filteredModules.map((m) => ({
              ...m,
              ref_code: m.ref_code || <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>,
              actions: (
                <CustomTooltip text="Assign this module to roles or departments">
                  <TextIconButton
                    variant="next"
                    label="Assign"
                    onClick={() => handleModuleSelect(m.id)}
                  />
                </CustomTooltip>
              ),
            }))}
          />
        </NeonPanel>
      )}

      {/* Step 2: Assignment Type Selection Dialog */}
      {showAssignmentTypeDialog && (
        <OverlayDialog
          open={true}
          onClose={handleCancel}
          showCloseButton={true}
          width={500}
        >
          <div style={{ padding: 24 }}>
            <h3 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.25rem", marginBottom: 16 }}>
              Choose Assignment Type
            </h3>
            <p style={{ marginBottom: 24, color: "var(--text-secondary)" }}>
              Module: <span style={{ color: "var(--neon)", fontWeight: 600 }}>{selectedModule?.name}</span>
            </p>
            <p style={{ marginBottom: 24 }}>
              Would you like to assign this module to roles or departments?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <TextIconButton
                variant="edit"
                label="Assign to Roles"
                onClick={() => handleAssignmentTypeSelect("role")}
              />
              <TextIconButton
                variant="edit"
                label="Assign to Departments"
                onClick={() => handleAssignmentTypeSelect("department")}
              />
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Step 3: Role/Department Selection Dialog */}
      {showSelectionDialog && assignmentType && (
        <OverlayDialog
          open={true}
          onClose={handleCancel}
          showCloseButton={true}
          width={900}
        >
          <div style={{ padding: 24 }}>
            <h3 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.25rem", marginBottom: 16 }}>
              Select {assignmentType === "role" ? "Roles" : "Departments"}
            </h3>
            <p style={{ marginBottom: 24, color: "var(--text-secondary)" }}>
              Module: <span style={{ color: "var(--neon)", fontWeight: 600 }}>{selectedModule?.name}</span>
            </p>

            <div style={{ marginBottom: 24 }}>
              <DualPaneSelector
                availableOptions={
                  assignmentType === "role"
                    ? roles.map(r => ({ value: r.id, label: r.title }))
                    : departments.map(d => ({ value: d.id, label: d.name }))
                }
                selectedValues={assignmentType === "role" ? selectedRoles : selectedDepartments}
                onSelectionChange={(selected) => {
                  if (assignmentType === "role") {
                    setSelectedRoles(selected);
                  } else {
                    setSelectedDepartments(selected);
                  }
                }}
                availableTitle={`Available ${assignmentType === "role" ? "Roles" : "Departments"}`}
                selectedTitle={`Selected ${assignmentType === "role" ? "Roles" : "Departments"}`}
                searchPlaceholder={`Search ${assignmentType === "role" ? "roles" : "departments"}...`}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
              <TextIconButton
                variant="back"
                label="Go Back"
                onClick={() => {
                  setShowSelectionDialog(false);
                  setShowAssignmentTypeDialog(true);
                  setAssignmentType(null);
                  setSelectedRoles([]);
                  setSelectedDepartments([]);
                }}
                disabled={saving}
              />
              <TextIconButton
                variant="save"
                label={saving ? "Saving..." : "Save Assignments"}
                onClick={handleSave}
                disabled={
                  saving ||
                  (assignmentType === "role" && selectedRoles.length === 0) ||
                  (assignmentType === "department" && selectedDepartments.length === 0)
                }
              />
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
