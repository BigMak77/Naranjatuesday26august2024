"use client";
import React, { useEffect, useState } from "react";
import DualPaneSelector from "@/components/ui/DualPaneSelector";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import NeonPanel from "@/components/NeonPanel";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";
import TextIconButton from "@/components/ui/TextIconButtons";

interface Role {
  id: string;
  title: string;
}
interface Module {
  value: string;
  label: string;
}
interface Document {
  value: string;
  label: string;
}

type Stage = "choose" | "create" | "amend";
type AssignmentStep = "modules" | "documents" | "review";

interface RoleModuleDocumentAssignmentProps {
  onSaved?: () => void | Promise<void>;
  skipRoleCreation?: boolean;
}

export default function RoleModuleDocumentAssignment({ onSaved, skipRoleCreation = false }: RoleModuleDocumentAssignmentProps) {
  const [stage, setStage] = useState<Stage>(skipRoleCreation ? "amend" : "choose");
  const [assignmentStep, setAssignmentStep] = useState<AssignmentStep>("modules");
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assignments, setAssignments] = useState<Record<string, { modules: string[]; documents: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleError, setNewRoleError] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [newRoleDepartmentId, setNewRoleDepartmentId] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: rolesData } = await supabase.from("roles").select("id, title").order("title", { ascending: true });
      const { data: modulesData } = await supabase.from("modules").select("id, name").order("name", { ascending: true });
      const { data: documentsData } = await supabase.from("documents").select("id, title").order("title", { ascending: true });
      const { data: departmentsData } = await supabase.from("departments").select("id, name").order("name", { ascending: true });
      setRoles(rolesData || []);
      setModules((modulesData || []).map((m: any) => ({ value: m.id, label: m.name })));
      setDocuments((documentsData || []).map((d: any) => ({ value: d.id, label: d.title })));
      setDepartments(departmentsData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const fetchRoleAssignments = async (roleId: string) => {
    if (!roleId) return;

    // Fetch direct role assignments
    const { data: roleAssignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", roleId);

    console.log("🔍 Role assignments:", roleAssignments);

    // Fetch department assignments for this role's department
    const { data: roleWithDept } = await supabase
      .from("roles")
      .select("department_id")
      .eq("id", roleId)
      .single();

    console.log("🔍 Role department data:", roleWithDept);

    let departmentAssignments: { item_id: string; type: string }[] = [];
    if (roleWithDept?.department_id) {
      const { data: deptAssignments } = await supabase
        .from("department_assignments")
        .select("item_id, type")
        .eq("department_id", roleWithDept.department_id);
      departmentAssignments = deptAssignments || [];
      console.log("🔍 Department assignments:", departmentAssignments);
    } else {
      console.log("⚠️ No department_id found for this role");
    }

    // Combine both role and department assignments (remove duplicates)
    const allAssignments = [...(roleAssignments || []), ...departmentAssignments];
    console.log("🔍 All assignments before deduplication:", allAssignments);

    const uniqueAssignments = Array.from(
      new Map(allAssignments.map(a => [`${a.item_id}-${a.type}`, a])).values()
    );
    console.log("🔍 Unique assignments after deduplication:", uniqueAssignments);

    if (uniqueAssignments.length > 0) {
      const modules = uniqueAssignments
        .filter(a => a.type === "module")
        .map(a => a.item_id);
      const documents = uniqueAssignments
        .filter(a => a.type === "document")
        .map(a => a.item_id);

      setAssignments(prev => ({
        ...prev,
        [roleId]: { modules, documents }
      }));
    } else {
      setAssignments(prev => ({
        ...prev,
        [roleId]: { modules: [], documents: [] }
      }));
    }
  };

  const handleModuleChange = (roleId: string, selected: string[]) => {
    setAssignments((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        modules: selected,
        documents: prev[roleId]?.documents || [],
      },
    }));
  };
  const handleDocumentChange = (roleId: string, selected: string[]) => {
    setAssignments((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        modules: prev[roleId]?.modules || [],
        documents: selected,
      },
    }));
  };

  const handleSave = async (roleId: string) => {
    // Save assignments for modules and documents using role_assignments table
    // NOTE: This only modifies role-specific assignments, NOT department-inherited ones
    const { modules: newModIds = [], documents: newDocIds = [] } = assignments[roleId] || {};

    // Fetch department assignments to exclude them from removal
    const { data: roleWithDept } = await supabase
      .from("roles")
      .select("department_id")
      .eq("id", roleId)
      .single();

    let departmentModuleIds: string[] = [];
    let departmentDocIds: string[] = [];

    if (roleWithDept?.department_id) {
      const { data: deptAssignments } = await supabase
        .from("department_assignments")
        .select("item_id, type")
        .eq("department_id", roleWithDept.department_id);

      if (deptAssignments) {
        departmentModuleIds = deptAssignments
          .filter(a => a.type === "module")
          .map(a => a.item_id);
        departmentDocIds = deptAssignments
          .filter(a => a.type === "document")
          .map(a => a.item_id);
      }
    }

    // Fetch current ROLE-SPECIFIC assignments from database to calculate diff
    const { data: currentAssignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", roleId);

    const currentModIds = (currentAssignments || [])
      .filter(a => a.type === "module")
      .map(a => a.item_id);
    const currentDocIds = (currentAssignments || [])
      .filter(a => a.type === "document")
      .map(a => a.item_id);

    // Filter out department-inherited assignments from newModIds/newDocIds
    // to get only role-specific selections
    const roleSpecificModIds = newModIds.filter(id => !departmentModuleIds.includes(id));
    const roleSpecificDocIds = newDocIds.filter(id => !departmentDocIds.includes(id));

    // Calculate what to add and remove (only for role-specific assignments)
    const modulesToAdd = roleSpecificModIds.filter(id => !currentModIds.includes(id));
    const modulesToRemove = currentModIds.filter(id => !roleSpecificModIds.includes(id));
    const documentsToAdd = roleSpecificDocIds.filter(id => !currentDocIds.includes(id));
    const documentsToRemove = currentDocIds.filter(id => !roleSpecificDocIds.includes(id));

    // Remove assignments that are no longer selected
    const itemsToRemove = [...modulesToRemove, ...documentsToRemove];
    if (itemsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("role_assignments")
        .delete()
        .eq("role_id", roleId)
        .in("item_id", itemsToRemove);

      if (deleteError) {
        alert("Error removing assignments: " + deleteError.message);
        console.error("Supabase delete error:", deleteError);
        return;
      }
    }

    // Add new assignments
    const rowsToInsert = [];

    // Add new module assignments
    for (const item_id of modulesToAdd) {
      rowsToInsert.push({
        role_id: roleId,
        item_id,
        module_id: item_id, // Legacy column for constraint compatibility
        document_id: null,  // Legacy column for constraint compatibility
        type: "module"
      });
    }

    // Add new document assignments
    for (const item_id of documentsToAdd) {
      rowsToInsert.push({
        role_id: roleId,
        item_id,
        module_id: null,    // Legacy column for constraint compatibility
        document_id: item_id, // Legacy column for constraint compatibility
        type: "document"
      });
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("role_assignments")
        .insert(rowsToInsert);

      if (insertError) {
        alert("Error adding assignments: " + insertError.message);
        console.error("Supabase insert error:", insertError);
        return;
      }
    }
    // Fetch all users with matching role_id
    const { data: users } = await supabase.from("users").select("auth_id").eq("role_id", roleId);
    const authIds = (users || []).map((u: any) => u.auth_id);
    if (authIds.length > 0) {
      await fetch("/api/sync-training-from-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleId, auth_ids: authIds }),
      });
    }

    // Show success modal and reset form
    setShowSuccessModal(true);

    // Call onSaved callback to refresh parent data
    if (onSaved) {
      await onSaved();
    }
  };

  if (showSuccessModal) {
    return <SuccessModal
      open={true}
      onClose={() => {
        setShowSuccessModal(false);
        // Reset to role selection after closing modal
        if (skipRoleCreation) {
          setSelectedRoleId("");
          setAssignmentStep("modules");
        } else {
          setStage("choose");
          setSelectedRoleId("");
          setAssignmentStep("modules");
        }
      }}
      message="Assignments saved and users updated for role."
    />;
  }

  if (loading) return <div>Loading...</div>;

  // Stage 1: Choose create or amend
  if (stage === "choose") {
    return (
      <NeonPanel>
        <h2 className="neon-heading">Role Training Assignment</h2>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <TextIconButton 
            variant="add"
            label="Add New Role"
            onClick={() => setStage("create")}
          />
          <TextIconButton 
            variant="edit"
            label="Assign Training to Existing Role"
            onClick={() => setStage("amend")}
          />
        </div>
      </NeonPanel>
    );
  }

  // Stage 2: Create a new role (simple form)
  if (stage === "create") {
    return (
      <OverlayDialog showCloseButton={true} open={true} onClose={() => setStage("choose")}>
        <NeonForm
          title="Add New Role"
          submitLabel="Save Role"
          onSubmit={async (e) => {
            e.preventDefault();
            setCreatingRole(true);
            setNewRoleError("");
            if (!newRoleDepartmentId) {
              setNewRoleError("Please select a department.");
              setCreatingRole(false);
              return;
            }
            const { error } = await supabase.from("roles").insert({ title: newRoleTitle, department_id: newRoleDepartmentId });
            if (error) {
              setNewRoleError(error.message);
              setCreatingRole(false);
              return;
            }
            setNewRoleTitle("");
            setNewRoleDepartmentId("");
            setCreatingRole(false);
            setStage("choose");
            // Refresh roles list
            const { data: rolesData } = await supabase.from("roles").select("id, title").order("title", { ascending: true });
            setRoles(rolesData || []);

            // Call onSaved callback to refresh parent data
            if (onSaved) {
              await onSaved();
            }
          }}
        >
          <label>
            Role Title
            <input
              className="neon-input"
              type="text"
              value={newRoleTitle}
              onChange={e => setNewRoleTitle(e.target.value)}
              required
              disabled={creatingRole}
            />
          </label>
          <label>
            Department
            <select
              className="neon-input"
              value={newRoleDepartmentId}
              onChange={e => setNewRoleDepartmentId(e.target.value)}
              required
              disabled={creatingRole}
            >
              <option value="">-- Select Department --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </label>
          {newRoleError && <div className="neon-form-error">{newRoleError}</div>}
        </NeonForm>
      </OverlayDialog>
    );
  }

  // Stage 3: Amend an existing role
  if (stage === "amend") {
    return (
      <NeonPanel>
        <h2 className="neon-heading">Amend an Existing Role</h2>
        <label>
          Select a role:
          <select
            value={selectedRoleId}
            onChange={e => {
              setSelectedRoleId(e.target.value);
              fetchRoleAssignments(e.target.value);
              setAssignmentStep("modules"); // Reset to modules step when role changes
            }}
            className="neon-input"
          >
            <option value="">-- Choose a role --</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.title}</option>
            ))}
          </select>
        </label>
        {selectedRoleId && (
          <div style={{ marginTop: 24 }}>
            <h3 className="neon-heading">
              {assignmentStep === "modules" ? "Step 1: Select Modules" : "Step 2: Select Documents"} for {roles.find(r => r.id === selectedRoleId)?.title}
            </h3>

            <div style={{
              marginTop: 12,
              marginBottom: 16,
              padding: '12px 16px',
              background: 'rgba(0, 200, 255, 0.1)',
              border: '1px solid rgba(0, 200, 255, 0.3)',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              ℹ️ <strong>Note:</strong> This shows both role-specific assignments and training inherited from the role's department.
              To manage department-wide assignments, use the "Department Training" button.
            </div>

            {/* Step 1: Modules */}
            {assignmentStep === "modules" && (
              <>
                <div style={{ marginTop: 16 }}>
                  <DualPaneSelector
                    availableOptions={modules}
                    selectedValues={assignments[selectedRoleId]?.modules || []}
                    onSelectionChange={selected => handleModuleChange(selectedRoleId, selected)}
                    availableTitle="Available Modules"
                    selectedTitle="Assigned Modules (Role + Department)"
                    searchPlaceholder="Search modules..."
                  />
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: "12px" }}>
                  <TextIconButton
                    variant="next"
                    label="Next Step"
                    onClick={() => setAssignmentStep("documents")}
                  />
                  {!skipRoleCreation && (
                    <TextIconButton
                      variant="back"
                      label="Go Back"
                      onClick={() => {
                        setStage("choose");
                        setSelectedRoleId("");
                        setAssignmentStep("modules");
                      }}
                    />
                  )}
                </div>
              </>
            )}

            {/* Step 2: Documents */}
            {assignmentStep === "documents" && (
              <>
                <div style={{ marginTop: 16 }}>
                  <DualPaneSelector
                    availableOptions={documents}
                    selectedValues={assignments[selectedRoleId]?.documents || []}
                    onSelectionChange={selected => handleDocumentChange(selectedRoleId, selected)}
                    availableTitle="Available Documents"
                    selectedTitle="Assigned Documents (Role + Department)"
                    searchPlaceholder="Search documents..."
                  />
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: "12px" }}>
                  <TextIconButton
                    variant="back"
                    label="Go Back"
                    onClick={() => setAssignmentStep("modules")}
                  />
                  <TextIconButton
                    variant="save"
                    label="Save Assignments"
                    onClick={() => handleSave(selectedRoleId)}
                  />
                </div>
              </>
            )}
          </div>
        )}
        {!selectedRoleId && !skipRoleCreation && (
          <div style={{ marginTop: 24 }}>
            <TextIconButton
              variant="back"
              label="Go Back"
              onClick={() => setStage("choose")}
            />
          </div>
        )}
      </NeonPanel>
    );
  }

  return null;
}
