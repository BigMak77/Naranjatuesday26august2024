"use client";

// GroupProfileCreate.tsx
// Staged component for creating a group profile: 1) name, 2) add departments, 3) add modules, 4) submit & success modal

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonDualListbox from "@/components/ui/NeonDualListbox";
import SuccessModal from "@/components/ui/SuccessModal";
import { FiArrowLeft, FiArrowRight, FiSave } from "react-icons/fi";

const steps = [
  { label: "Group Name" },
  { label: "Departments" },
  { label: "Modules" },
  { label: "Submit" },
];

type GroupProfileCreateProps = {
  onSubmit?: (group: {
    id: number;
    name: string;
    selectedDepartments: number[];
    selectedModules: number[];
  }) => void;
  onCancel?: () => void;
};

// Keep IDs as strings while the UI controls selection.
// Convert to numbers only when persisting.
type Option = { id: string; label: string; parent_id?: string | null };

export default function GroupProfileCreate({
  onSubmit,
  onCancel,
}: GroupProfileCreateProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");

  const [departments, setDepartments] = useState<Option[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const [modules, setModules] = useState<Option[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch list data lazily when entering each step
  useEffect(() => {
    if (step === 1) {
      supabase
        .from("departments")
        .select("id, name, parent_id")
        .then(({ data, error }) => {
          if (error) {
            setError(error.message);
            return;
          }
          setDepartments(
            (data || []).map((d: { id: number|string; name: string; parent_id?: string|null }) => ({
              id: String(d.id),
              label: d.name,
              parent_id: d.parent_id ? String(d.parent_id) : null,
            }))
          );
        });
    }
    if (step === 2) {
      supabase
        .from("modules")
        .select("id, name")
        .then(({ data, error }) => {
          if (error) {
            setError(error.message);
            return;
          }
          setModules(
            (data || []).map((m: { id: number; name: string }) => ({
              id: String(m.id),
              label: m.name,
            }))
          );
        });
    }
  }, [step]);

  // Helper: build a map of id -> children ids
  const departmentChildrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    departments.forEach((d: any) => {
      if (!d.parent_id) return;
      if (!map[d.parent_id]) map[d.parent_id] = [];
      map[d.parent_id].push(d.id);
    });
    return map;
  }, [departments]);

  // Helper: get all descendant ids for a department
  function getAllDescendantIds(id: string): string[] {
    const children = departmentChildrenMap[id] || [];
    let all: string[] = [...children];
    for (const child of children) {
      all = all.concat(getAllDescendantIds(child));
    }
    return all;
  }

  // Hierarchical select handler
  function handleDepartmentChange(selected: string[]) {
    // Find what was added or removed
    const prev = new Set(selectedDepartments);
    const next = new Set(selected);
    // Added
    for (const id of selected) {
      if (!prev.has(id)) {
        // Add all descendants
        getAllDescendantIds(id).forEach((descId) => next.add(descId));
      }
    }
    // Removed
    for (const id of selectedDepartments) {
      if (!next.has(id)) {
        // Remove all descendants
        getAllDescendantIds(id).forEach((descId) => next.delete(descId));
      }
    }
    setSelectedDepartments(Array.from(next));
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async () => {
    setSaving(true);
    setError("");

    if (!name.trim()) {
      setError("Group name is required.");
      setSaving(false);
      return;
    }

    try {
      // Insert group profile
      const { data: group, error: groupErr } = await supabase
        .from("group_profiles")
        .insert([{ name }])
        .select("id")
        .single();

      if (groupErr) throw groupErr;
      if (!group) throw new Error("Failed to create group profile.");

      // Convert selections to UUIDs for persistence
      const departmentIds = selectedDepartments;
      const moduleIds = selectedModules;

      // Link departments
      let depErr = null;
      if (departmentIds.length > 0) {
        const { error } = await supabase.from("group_departments").insert(
          departmentIds.map((id) => ({ group_id: group.id, department_id: id }))
        );
        depErr = error;
      }

      // Link modules
      let modErr = null;
      if (moduleIds.length > 0) {
        const { error } = await supabase.from("group_modules").insert(
          moduleIds.map((id) => ({ group_id: group.id, module_id: id }))
        );
        modErr = error;
      }

      if (depErr || modErr) {
        throw new Error(
          (depErr?.message || "") + (modErr?.message ? ", " + modErr.message : "")
        );
      }

      setShowSuccess(true);
      onSubmit?.({
        id: group.id,
        name,
        selectedDepartments: departmentIds as unknown as any, // allow string[] for now
        selectedModules: moduleIds as unknown as any,
      });

      // Reset wizard
      setName("");
      setSelectedDepartments([]);
      setSelectedModules([]);
      setStep(0);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "message" in e) {
        setError((e as { message: string }).message || "Failed to create group profile");
      } else {
        setError("Failed to create group profile");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeonPanel className="neon-panel-lg">
      {/* Stepper */}
      <div className="neon-flex items-center gap-2 text-base font-bold mb-6">
        <StepDot active={step === 0} label="1) Name" />
        <span>—</span>
        <StepDot active={step === 1} label="2) Departments" />
        <span>—</span>
        <StepDot active={step === 2} label="3) Modules" />
        <span>—</span>
        <StepDot active={step === 3} label="4) Submit" />
      </div>

      <div className="neon-flex flex-col gap-6">
        {/* Step 0: Group name */}
        {step === 0 && (
          <div>
            <label className="neon-form-title">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="neon-input w-full"
              placeholder="Enter group name"
            />
          </div>
        )}

        {/* Step 1: Departments */}
        {step === 1 && (
          <NeonDualListbox
            items={departments.map(({ id, label }) => ({ id, label }))} // flatten for display
            selected={selectedDepartments}
            onChange={handleDepartmentChange}
            titleLeft="Available Departments"
            titleRight="Selected Departments"
          />
        )}

        {/* Step 2: Modules */}
        {step === 2 && (
          <NeonDualListbox
            items={modules} // [{ id: string, label: string }]
            selected={selectedModules} // string[]
            onChange={(selected: string[]) => setSelectedModules(selected)}
            titleLeft="Available Modules"
            titleRight="Selected Modules"
          />
        )}

        {/* Step 3: Submit */}
        {step === 3 && (
          <div className="text-center">
            <p>Ready to create group profile?</p>
            <div className="my-4">
              <strong>Name:</strong> {name}
              <br />
              <strong>Departments:</strong> {selectedDepartments.length}
              <br />
              <strong>Modules:</strong> {selectedModules.length}
            </div>
            {error && (
              <div className="neon-message neon-message-error mb-2">{error}</div>
            )}
            <button
              className="neon-btn neon-btn-save neon-btn-icon"
              onClick={handleSave}
              disabled={saving}
            >
              <FiSave /> Submit
            </button>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="neon-flex gap-4 justify-between mt-4">
        <button
          className="neon-btn neon-btn-danger neon-btn-icon"
          onClick={step === 0 ? onCancel : handleBack}
          type="button"
          aria-label={step === 0 ? "Cancel" : "Back"}
          data-tooltip={step === 0 ? "Cancel" : "Back"}
          disabled={saving}
        >
          <FiArrowLeft />
        </button>

        {step < steps.length - 1 && (
          <button
            className="neon-btn neon-btn-next neon-btn-icon"
            onClick={handleNext}
            type="button"
            aria-label="Next"
            data-tooltip="Next"
            disabled={saving || (step === 0 && !name.trim())}
          >
            <FiArrowRight />
          </button>
        )}
      </div>

      <SuccessModal
        open={showSuccess}
        title="Group Profile Created"
        message="Your group profile has been successfully created."
        onClose={() => setShowSuccess(false)}
      />
    </NeonPanel>
  );
}

type StepDotProps = {
  active: boolean;
  label: string;
};

function StepDot({ active, label }: StepDotProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: active
          ? "var(--dot-active, rgba(0,0,0,0.2))"
          : "var(--dot, rgba(0,0,0,0.08))",
        fontWeight: active ? 600 : 500,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: active ? "var(--accent, #0ea5e9)" : "rgba(0,0,0,0.25)",
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}
