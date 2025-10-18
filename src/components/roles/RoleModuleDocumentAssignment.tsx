"use client";
import React, { useEffect, useState } from "react";
import NeonDualListbox from "@/components/ui/NeonDualListbox";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import NeonPanel from "@/components/NeonPanel";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";
import NeonIconButton from "@/components/ui/NeonIconButton";

interface Role {
  id: string;
  title: string;
}
interface Module {
  id: string;
  label: string;
}
interface Document {
  id: string;
  label: string;
}

type Stage = "choose" | "create" | "amend";
type AssignmentStep = "modules" | "documents" | "review";

export default function RoleModuleDocumentAssignment() {
  const [stage, setStage] = useState<Stage>("choose");
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
      const { data: rolesData } = await supabase.from("roles").select("id, title");
      const { data: modulesData } = await supabase.from("modules").select("id, name");
      const { data: documentsData } = await supabase.from("documents").select("id, title");
      const { data: departmentsData } = await supabase.from("departments").select("id, name");
      setRoles(rolesData || []);
      setModules((modulesData || []).map((m: any) => ({ id: m.id, label: m.name })));
      setDocuments((documentsData || []).map((d: any) => ({ id: d.id, label: d.title })));
      setDepartments(departmentsData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const fetchRoleAssignments = async (roleId: string) => {
    if (!roleId) return;
    
    // Fetch existing assignments for this role
    const { data: roleAssignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", roleId);
    
    if (roleAssignments) {
      const modules = roleAssignments
        .filter(a => a.type === "module")
        .map(a => a.item_id);
      const documents = roleAssignments
        .filter(a => a.type === "document")
        .map(a => a.item_id);
      
      setAssignments(prev => ({
        ...prev,
        [roleId]: { modules, documents }
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
    const { modules: modIds = [], documents: docIds = [] } = assignments[roleId] || {};
    
    // First, clear existing assignments for this role to avoid conflicts
    const { error: deleteError } = await supabase
      .from("role_assignments")
      .delete()
      .eq("role_id", roleId);
    
    if (deleteError) {
      alert("Error clearing existing assignments: " + deleteError.message);
      console.error("Supabase delete error:", deleteError);
      return;
    }
    
    // Only insert new assignments if there are any
    if (modIds.length > 0 || docIds.length > 0) {
      // Insert module assignments - include both new item_id and legacy columns for compatibility
      const moduleRows = modIds.map((item_id: string) => ({ 
        role_id: roleId, 
        item_id, 
        module_id: item_id, // Legacy column for constraint compatibility
        document_id: null,  // Legacy column for constraint compatibility
        type: "module" 
      }));
      // Insert document assignments - include both new item_id and legacy columns for compatibility
      const documentRows = docIds.map((item_id: string) => ({ 
        role_id: roleId, 
        item_id, 
        module_id: null,    // Legacy column for constraint compatibility
        document_id: item_id, // Legacy column for constraint compatibility
        type: "document" 
      }));
      const allRows = [...moduleRows, ...documentRows];
      const { error: assignmentError } = await supabase.from("role_assignments").insert(allRows);
      
      if (assignmentError) {
        alert("Error saving assignments: " + assignmentError.message);
        console.error("Supabase assignment insert error:", assignmentError);
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
    setShowSuccessModal(true);
  };

  if (showSuccessModal) {
    return <SuccessModal open={true} onClose={() => setShowSuccessModal(false)} message="Assignments saved and users updated for role." />;
  }

  if (loading) return <div>Loading...</div>;

  // Stage 1: Choose create or amend
  if (stage === "choose") {
    return (
      <NeonPanel>
        <h2 className="neon-heading">Role Training Assignment</h2>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <NeonIconButton 
            variant="add"
            title="Add New Role"
            onClick={() => setStage("create")}
          />
          <NeonIconButton 
            variant="edit"
            title="Assign Training to Existing Role"
            onClick={() => setStage("amend")}
          />
        </div>
      </NeonPanel>
    );
  }

  // Stage 2: Create a new role (simple form)
  if (stage === "create") {
    return (
      <OverlayDialog open={true} onClose={() => setStage("choose")}> 
        <NeonForm
          title="Add New Role"
          submitLabel="Save Role"
          onCancel={() => setStage("choose")}
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
            // Optionally refresh roles list
            const { data: rolesData } = await supabase.from("roles").select("id, title");
            setRoles(rolesData || []);
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

            {/* Step 1: Modules */}
            {assignmentStep === "modules" && (
              <>
                <div style={{ marginTop: 16 }}>
                  <NeonDualListbox
                    items={modules}
                    selected={assignments[selectedRoleId]?.modules || []}
                    onChange={selected => handleModuleChange(selectedRoleId, selected)}
                    titleLeft="Available Modules"
                    titleRight="Assigned Modules"
                  />
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: "12px" }}>
                  <NeonIconButton
                    variant="next"
                    title="Next Step"
                    onClick={() => setAssignmentStep("documents")}
                  />
                  <NeonIconButton
                    variant="back"
                    title="Go Back"
                    onClick={() => {
                      setStage("choose");
                      setSelectedRoleId("");
                      setAssignmentStep("modules");
                    }}
                  />
                </div>
              </>
            )}

            {/* Step 2: Documents */}
            {assignmentStep === "documents" && (
              <>
                <div style={{ marginTop: 16 }}>
                  <NeonDualListbox
                    items={documents}
                    selected={assignments[selectedRoleId]?.documents || []}
                    onChange={selected => handleDocumentChange(selectedRoleId, selected)}
                    titleLeft="Available Documents"
                    titleRight="Assigned Documents"
                  />
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: "12px" }}>
                  <NeonIconButton
                    variant="back"
                    title="Go Back"
                    onClick={() => setAssignmentStep("modules")}
                  />
                  <NeonIconButton
                    variant="save"
                    title="Save Assignments"
                    onClick={() => handleSave(selectedRoleId)}
                  />
                </div>
              </>
            )}
          </div>
        )}
        {!selectedRoleId && (
          <div style={{ marginTop: 24 }}>
            <NeonIconButton 
              variant="back"
              title="Go Back"
              onClick={() => setStage("choose")}
            />
          </div>
        )}
      </NeonPanel>
    );
  }

  return null;
}
