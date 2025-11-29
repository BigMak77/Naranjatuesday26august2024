"use client";
import React, { useEffect, useState } from "react";
import DualPaneSelector from "@/components/ui/DualPaneSelector";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import SuccessModal from "@/components/ui/SuccessModal";
import TextIconButton from "@/components/ui/TextIconButtons";

interface Department {
  id: string;
  name: string;
}

interface Module {
  value: string;
  label: string;
}

interface Document {
  value: string;
  label: string;
}

type AssignmentStep = "modules" | "documents";

interface DepartmentModuleAssignmentProps {
  onSaved?: () => void | Promise<void>;
}

export default function DepartmentModuleAssignment({ onSaved }: DepartmentModuleAssignmentProps) {
  const [assignmentStep, setAssignmentStep] = useState<AssignmentStep>("modules");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assignments, setAssignments] = useState<Record<string, { modules: string[]; documents: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: departmentsData } = await supabase
        .from("departments")
        .select("id, name")
        .order("name", { ascending: true });
      const { data: modulesData } = await supabase.from("modules").select("id, name");
      const { data: documentsData } = await supabase.from("documents").select("id, title");

      setDepartments(departmentsData || []);
      setModules((modulesData || []).map((m: any) => ({ value: m.id, label: m.name })));
      setDocuments((documentsData || []).map((d: any) => ({ value: d.id, label: d.title })));
      setLoading(false);
    }
    fetchData();
  }, []);

  const fetchDepartmentAssignments = async (departmentId: string) => {
    if (!departmentId) return;

    // Fetch existing assignments for this department
    const { data: departmentAssignments } = await supabase
      .from("department_assignments")
      .select("item_id, type")
      .eq("department_id", departmentId);

    if (departmentAssignments) {
      const modules = departmentAssignments
        .filter(a => a.type === "module")
        .map(a => a.item_id);
      const documents = departmentAssignments
        .filter(a => a.type === "document")
        .map(a => a.item_id);

      setAssignments(prev => ({
        ...prev,
        [departmentId]: { modules, documents }
      }));
    }
  };

  const handleModuleChange = (departmentId: string, selected: string[]) => {
    setAssignments((prev) => ({
      ...prev,
      [departmentId]: {
        ...prev[departmentId],
        modules: selected,
        documents: prev[departmentId]?.documents || [],
      },
    }));
  };

  const handleDocumentChange = (departmentId: string, selected: string[]) => {
    setAssignments((prev) => ({
      ...prev,
      [departmentId]: {
        ...prev[departmentId],
        modules: prev[departmentId]?.modules || [],
        documents: selected,
      },
    }));
  };

  const handleSave = async (departmentId: string) => {
    // Save assignments for modules and documents using department_assignments table
    const { modules: modIds = [], documents: docIds = [] } = assignments[departmentId] || {};

    // First, clear existing assignments for this department to avoid conflicts
    const { error: deleteError } = await supabase
      .from("department_assignments")
      .delete()
      .eq("department_id", departmentId);

    if (deleteError) {
      alert("Error clearing existing assignments: " + deleteError.message);
      console.error("Supabase delete error:", deleteError);
      return;
    }

    // Only insert new assignments if there are any
    if (modIds.length > 0 || docIds.length > 0) {
      // Insert module assignments
      const moduleRows = modIds.map((item_id: string) => ({
        department_id: departmentId,
        item_id,
        type: "module"
      }));
      // Insert document assignments
      const documentRows = docIds.map((item_id: string) => ({
        department_id: departmentId,
        item_id,
        type: "document"
      }));
      const allRows = [...moduleRows, ...documentRows];
      const { error: assignmentError } = await supabase.from("department_assignments").insert(allRows);

      if (assignmentError) {
        alert("Error saving assignments: " + assignmentError.message);
        console.error("Supabase assignment insert error:", assignmentError);
        return;
      }
    }

    // Sync department assignments to all current users in the department
    try {
      const response = await fetch("/api/sync-department-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_id: departmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Department training sync failed:", error);
        alert("Warning: Department assignments saved but user sync failed. Users may need to be resynced.");
      }
    } catch (err) {
      console.error("Department training sync error:", err);
      alert("Warning: Department assignments saved but user sync failed. Users may need to be resynced.");
    }

    // Reset to department selection
    setSelectedDepartmentId("");
    setAssignmentStep("modules");
    setShowSuccessModal(true);

    // Call onSaved callback to refresh parent data
    if (onSaved) {
      await onSaved();
    }
  };

  if (showSuccessModal) {
    return <SuccessModal open={true} onClose={() => setShowSuccessModal(false)} message="Assignments saved and users updated for department." />;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <NeonPanel>
      <h2 className="neon-heading">Department Training Assignment</h2>
      <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        Assign training modules and documents to all users within a department
      </p>
      <label>
        Select a department:
        <select
          value={selectedDepartmentId}
          onChange={e => {
            setSelectedDepartmentId(e.target.value);
            fetchDepartmentAssignments(e.target.value);
            setAssignmentStep("modules"); // Reset to modules step when department changes
          }}
          className="neon-input"
        >
          <option value="">-- Choose a department --</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </label>
      {selectedDepartmentId && (
        <div style={{ marginTop: 24 }}>
          <h3 className="neon-heading">
            {assignmentStep === "modules" ? "Step 1: Select Modules" : "Step 2: Select Documents"} for {departments.find(d => d.id === selectedDepartmentId)?.name}
          </h3>

          {/* Step 1: Modules */}
          {assignmentStep === "modules" && (
            <>
              <div style={{ marginTop: 16 }}>
                <DualPaneSelector
                  availableOptions={modules}
                  selectedValues={assignments[selectedDepartmentId]?.modules || []}
                  onSelectionChange={selected => handleModuleChange(selectedDepartmentId, selected)}
                  availableTitle="Available Modules"
                  selectedTitle="Assigned Modules"
                  searchPlaceholder="Search modules..."
                />
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: "12px" }}>
                <TextIconButton
                  variant="next"
                  label="Next Step"
                  onClick={() => setAssignmentStep("documents")}
                />
              </div>
            </>
          )}

          {/* Step 2: Documents */}
          {assignmentStep === "documents" && (
            <>
              <div style={{ marginTop: 16 }}>
                <DualPaneSelector
                  availableOptions={documents}
                  selectedValues={assignments[selectedDepartmentId]?.documents || []}
                  onSelectionChange={selected => handleDocumentChange(selectedDepartmentId, selected)}
                  availableTitle="Available Documents"
                  selectedTitle="Assigned Documents"
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
                  onClick={() => handleSave(selectedDepartmentId)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </NeonPanel>
  );
}
