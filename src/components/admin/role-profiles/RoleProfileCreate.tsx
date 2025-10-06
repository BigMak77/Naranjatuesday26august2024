"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import ContentHeader from "@/components/headersandfooters/ContentHeader";
import NeonPanel from "@/components/NeonPanel";
import { getChildDepartments } from "@/lib/getChildDepartments";

import DocumentSelectorWidget from "./widgets/DocumentSelectorWidget";
import AssignmentSelectorWidget from "./widgets/AssignmentSelectorWidget";
import { FiArrowLeft, FiArrowRight, FiSave } from "react-icons/fi";
import NeonDualListbox from "@/components/ui/NeonDualListbox";
import AssignTargetModal from "./widgets/AssignTargetModal";

const steps = [
  { label: "Modules" },
  { label: "Documents" },
  { label: "Assignments" },
];

type TargetType = "user" | "role" | "department";

export default function RoleProfileCreate({
  onSubmit,
  onCancel,
  profileId,
}: {
  onSubmit?: (data: {
    id: string;
    name: string;
    description: string;
    selectedModules: string[];
    selectedDocuments: string[];
    selectedAssignments: { type: TargetType; id: string; label: string }[];
  }) => void;
  onCancel?: () => void;
  profileId?: string;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<
    { type: TargetType; id: string; label: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modules, setModules] = useState<{ id: string; label: string }[]>([]);
  const [assignTargetModal, setAssignTargetModal] = useState<null | 'department' | 'role' | 'user'>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handler for when a target is selected in the modal
  function handleAssignTargetModalSelect(item: { id: string, label: string }) {
    if (!assignTargetModal) return;
    setSelectedAssignments((prev) => [
      ...prev,
      { type: assignTargetModal, id: item.id, label: item.label },
    ]);
    setAssignTargetModal(null);
  }

  // ---------- Prefill when editing ----------
  useEffect(() => {
    let cancelled = false;
    if (!profileId) return;

    const fetchProfile = async () => {
      try {
        const { data: profile, error: profileErr } = await supabase
          .from("role_profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profile) {
          // profile missing — show message but don’t crash
          toast.error("Role profile not found");
          return;
        }

        if (cancelled) return;
        setName(profile.name || "");
        setDescription(profile.description || "");

        const [mods, docs, targets] = await Promise.all([
          supabase
            .from("role_profile_modules")
            .select("module_id")
            .eq("role_profile_id", profileId),
          supabase
            .from("role_profile_documents")
            .select("document_id")
            .eq("role_profile_id", profileId),
          supabase
            .from("role_profile_targets")
            .select("target_type, target_id, label")
            .eq("role_profile_id", profileId),
        ]);

        if (cancelled) return;
        setSelectedModules(
          (mods.data ?? []).map((m: { module_id: string }) => m.module_id),
        );
        setSelectedDocuments(
          (docs.data ?? []).map((d: { document_id: string }) => d.document_id),
        );
        setSelectedAssignments(
          (targets.data ?? []).map(
            (t: {
              target_type: TargetType;
              target_id: string;
              label?: string;
            }) => ({
              type: t.target_type,
              id: t.target_id,
              label: t.label ?? "",
            }),
          ),
        );
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("Prefill error:", errMsg);
        toast.error(errMsg || "Failed to load role profile");
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  // ---------- Load selectable modules for dual listbox ----------
  useEffect(() => {
    let cancelled = false;
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from("modules")
          .select("id, name")
          .order("name", { ascending: true });
        if (error) throw error;
        if (!cancelled && data) {
          setModules(
            data.map((m: { id: string; name: string }) => ({
              id: m.id,
              label: m.name,
            })),
          );
        }
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("Load modules error:", errMsg);
        toast.error(errMsg || "Failed to load modules");
      }
    };
    fetchModules();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleAssignTargetSelect = (assignment: { type: TargetType; id: string; label: string }) => {
    setSelectedAssignments((prev) => [...prev, assignment]);
    setAssignTargetModal(null);
  };

  // ---------- Save via one API call ----------
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");

    if (!name.trim()) {
      setError("Profile name is required.");
      setSaving(false);
      return;
    }

    try {
      let profileRow;
      if (profileId) {
        // Update existing profile
        const { error: updateErr } = await supabase
          .from("role_profiles")
          .update({ name, description })
          .eq("id", profileId);
        if (updateErr) {
          console.error("Supabase update error:", updateErr);
          throw updateErr;
        }
        profileRow = { id: profileId };
      } else {
        // Insert new profile
        const { data, error: insertErr } = await supabase
          .from("role_profiles")
          .insert([{ name, description }])
          .select("id")
          .single();
        if (insertErr) {
          console.error("Supabase insert error:", insertErr, { name, description });
          throw insertErr;
        }
        profileRow = data;
      }
      const id = profileRow.id;

      // Remove old assignments if editing
      if (profileId) {
        await supabase
          .from("user_assignments")
          .delete()
          .eq("role_profile_id", id);
      }

      // Insert all assignments into user_assignments
      // For each assignment target, resolve to users in the users table
      const now = new Date().toISOString();
      let assignmentPayload: any[] = [];
      let warnings: string[] = [];
      let allCandidateAssignments: any[] = [];
      for (const a of selectedAssignments) {
        let userRows: any[] = [];
        if (a.type === "user") {
          const { data: userData, error: userErr } = await supabase
            .from("users")
            .select("auth_id")
            .eq("auth_id", a.id);
          if (userErr) throw userErr;
          userRows = userData ?? [];
        } else if (a.type === "role") {
          const { data: roleUsers, error: roleErr } = await supabase
            .from("users")
            .select("auth_id")
            .eq("role_id", a.id);
          if (roleErr) throw roleErr;
          userRows = roleUsers ?? [];
        } else if (a.type === "department") {
          // --- Hierarchical department assignment ---
          const deptIds = await getChildDepartments(a.id); // includes root
          const { data: deptUsers, error: deptErr } = await supabase
            .from("users")
            .select("auth_id")
            .in("department_id", deptIds);
          if (deptErr) throw deptErr;
          userRows = deptUsers ?? [];
        }
        for (const user of userRows) {
          selectedModules.forEach((module_id) => {
            allCandidateAssignments.push({
              auth_id: user.auth_id,
              item_id: module_id,
              item_type: "module",
              assigned_at: now,
              origin_type: a.type,
              origin_id: a.id,
            });
          });
          selectedDocuments.forEach((document_id) => {
            allCandidateAssignments.push({
              auth_id: user.auth_id,
              item_id: document_id,
              item_type: "document",
              assigned_at: now,
              origin_type: a.type,
              origin_id: a.id,
            });
          });
        }
      }
      // Query existing assignments for all relevant users/items/types
      if (allCandidateAssignments.length > 0) {
        // Get all unique auth_ids
        const authIds = Array.from(new Set(allCandidateAssignments.map(a => a.auth_id)));
        // Query all assignments for these users
        const { data: existingRows, error: existingErr } = await supabase
          .from("user_assignments")
          .select("auth_id, item_id, item_type")
          .in("auth_id", authIds);
        if (existingErr) throw existingErr;
        // Build set of existing assignment keys
        const existingSet = new Set((existingRows ?? []).map((r: any) => `${r.auth_id}|${r.item_id}|${r.item_type}`));
        assignmentPayload = allCandidateAssignments.filter(a => {
          const key = `${a.auth_id}|${a.item_id}|${a.item_type}`;
          if (existingSet.has(key)) {
            warnings.push(`${a.auth_id} already has ${a.item_type} assigned.`);
            return false;
          }
          return true;
        });
      }
      if (assignmentPayload.length > 0) {
        const { error: assignErr } = await supabase
          .from("user_assignments")
          .insert(assignmentPayload);
        if (assignErr) {
          console.error("user_assignments link error:", assignErr, assignmentPayload);
          throw assignErr;
        }
      }
      if (warnings.length > 0) {
        toast("⚠️ Some assignments were skipped: " + warnings.join("; "));
      }

      onSubmit?.({
        id,
        name,
        description,
        selectedModules,
        selectedDocuments,
        selectedAssignments,
      });

      if (!profileId) {
        setName("");
        setDescription("");
        setSelectedModules([]);
        setSelectedDocuments([]);
        setSelectedAssignments([]);
        setStep(0);
      }

      toast.success("✅ Role profile saved and assignments materialized");
      setShowSuccessModal(true);
    } catch (e) {
      setError((e as Error)?.message || "Failed to save role profile");
      toast.error((e as Error)?.message || "Failed to save role profile");
      console.error("RoleProfileCreate save error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ContentHeader title="Create Role Profile" />

      <NeonPanel className="neon-panel-lg">
        <div>
          {/* Stepper styled like AssignModuleTab */}
          <div className="neon-flex items-center gap-2 text-base font-bold mb-6">
            <StepDot active={step === 0} label="1) Modules" />
            <span>—</span>
            <StepDot active={step === 1} label="2) Documents" />
            <span>—</span>
            <StepDot active={step === 2} label="3) Assignments" />
          </div>

          {/* Step content container using global spacing */}
          <div className="neon-flex flex-col gap-6">
            {step === 0 && (
              <>
                <div>
                  <label className="neon-form-title">Profile Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="neon-input w-full profile-name-input"
                    placeholder="Enter profile name"
                  />
                </div>
                <div>
                  <label className="neon-form-title">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="neon-input w-full profile-description-input"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <NeonDualListbox
                    items={modules}
                    selected={selectedModules}
                    onChange={setSelectedModules}
                    titleLeft="Modules to add to role profile"
                    titleRight="Remove modules from role profile"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <DocumentSelectorWidget
                selectedDocuments={selectedDocuments}
                onChange={setSelectedDocuments}
              />
            )}

            {step === 2 && (
              <div>
                <label className="neon-form-title mb-2 block">
                  Select to add this profile to:
                </label>
                <div className="neon-assign-targets-row">
                  <button
                    type="button"
                    className="neon-btn neon-assign-target-btn"
                    onClick={() => setAssignTargetModal('department')}
                  >
                    Department
                  </button>
                  <button
                    type="button"
                    className="neon-btn neon-assign-target-btn"
                    onClick={() => setAssignTargetModal('role')}
                  >
                    Role
                  </button>
                  <button
                    type="button"
                    className="neon-btn neon-assign-target-btn"
                    onClick={() => setAssignTargetModal('user')}
                  >
                    User
                  </button>
                </div>
                {assignTargetModal && (
                  <AssignTargetModal
                    type={assignTargetModal}
                    onClose={() => setAssignTargetModal(null)}
                    onSelect={handleAssignTargetModalSelect}
                  />
                )}
                {/* Optionally, show current assignments below */}
                {/* <AssignmentSelectorWidget
                  selectedAssignments={selectedAssignments}
                  onChange={setSelectedAssignments}
                /> */}
              </div>
            )}
          </div>

          {error && (
            <div className="neon-message neon-message-error mb-4">{error}</div>
          )}

          {/* Button row using global flex and gap */}
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
            {step < steps.length - 1 ? (
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
            ) : (
              <button
                className="neon-btn neon-btn-save neon-btn-icon"
                onClick={handleSave}
                type="button"
                aria-label="Submit Role Profile"
                data-tooltip="Submit Role Profile"
                disabled={saving}
              >
                <FiSave />
              </button>
            )}
          </div>
        </div>
      </NeonPanel>

      {showSuccessModal && (
        <div className="fixed inset-0 neon-modal-overlay flex items-center justify-center z-50">
          <div className="neon-modal p-6 max-w-sm w-full text-center">
            <h2 className="neon-modal-title mb-2">Role Profile Created</h2>
            <p className="mb-4">Your role profile has been successfully created.</p>
            <button
              className="neon-btn neon-btn-save neon-btn-icon"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// StepDot styled for consistency
function StepDot({ active, label }: { active: boolean; label: string }) {
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
