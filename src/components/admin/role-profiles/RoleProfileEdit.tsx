"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import ContentHeader from "@/components/headersandfooters/ContentHeader";
import DocumentSelectorWidget from "./widgets/DocumentSelectorWidget";
import BehaviourSelectorWidget from "./widgets/BehaviourSelectorWidget";
import NeonIconButton from "../../ui/NeonIconButton";
import { FiArrowLeft, FiArrowRight, FiSave } from "react-icons/fi";
import NeonDualListbox from "@/components/ui/NeonDualListbox";

export default function RoleProfileEdit({
  roleProfileId,
  onSubmit,
  onCancel,
}: {
  roleProfileId: string;
  onSubmit?: (data: {
    roleProfileId: string;
    name: string;
    description: string;
    selectedModules: string[];
    selectedDocuments: string[];
    selectedBehaviours: string[];
    selectedRoles: string[];
  }) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editNameDesc, setEditNameDesc] = useState<boolean | null>(null);
  const [editModules, setEditModules] = useState<boolean | null>(null);
  const [editDocuments, setEditDocuments] = useState<boolean | null>(null);
  const [editBehaviours, setEditBehaviours] = useState<boolean | null>(null);

  const [modules, setModules] = useState<{ id: string; label: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profile, error } = await supabase
        .from("role_profiles")
        .select("*")
        .eq("id", roleProfileId)
        .single();

      if (error || !profile) return setError("Failed to load profile");
      setName(profile.name || "");
      setDescription(profile.description || "");

      // Fetch all modules for dual listbox
      const { data: allModules } = await supabase
        .from("modules")
        .select("id, name");
      setModules((allModules || []).map((m) => ({ id: m.id, label: m.name })));

      // Fetch selected modules
      const { data: modules } = await supabase
        .from("role_profile_modules")
        .select("module_id")
        .eq("role_profile_id", roleProfileId);
      setSelectedModules((modules || []).map((m) => m.module_id));

      const { data: documents } = await supabase
        .from("role_profile_documents")
        .select("document_id")
        .eq("role_profile_id", roleProfileId);
      setSelectedDocuments((documents || []).map((d) => d.document_id));

      const { data: behaviours } = await supabase
        .from("role_profile_behaviours")
        .select("behaviour_id")
        .eq("role_profile_id", roleProfileId);
      setSelectedBehaviours((behaviours || []).map((b) => b.behaviour_id));

      // Fetch all roles for dual listbox
      const { data: allRoles } = await supabase
        .from("roles")
        .select("id, name");
      setRoles((allRoles || []).map((r) => ({ id: r.id, label: r.name })));

      // Fetch selected roles
      const { data: assignments } = await supabase
        .from("role_profile_assignments")
        .select("role_id")
        .eq("role_profile_id", roleProfileId);
      setSelectedRoles((assignments || []).map((a) => a.role_id));

      setLoading(false);
    };

    fetchProfile();
  }, [roleProfileId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const { error: profileError } = await supabase
      .from("role_profiles")
      .update({ name, description })
      .eq("id", roleProfileId);

    if (profileError) {
      setError("Failed to update profile");
      setSaving(false);
      return;
    }

    // Replace all role-profile link tables
    await supabase
      .from("role_profile_modules")
      .delete()
      .eq("role_profile_id", roleProfileId);
    if (selectedModules.length > 0) {
      await supabase
        .from("role_profile_modules")
        .insert(
          selectedModules.map((module_id) => ({
            role_profile_id: roleProfileId,
            module_id,
          })),
        );
    }

    await supabase
      .from("role_profile_documents")
      .delete()
      .eq("role_profile_id", roleProfileId);
    if (selectedDocuments.length > 0) {
      await supabase
        .from("role_profile_documents")
        .insert(
          selectedDocuments.map((document_id) => ({
            role_profile_id: roleProfileId,
            document_id,
          })),
        );
    }

    await supabase
      .from("role_profile_behaviours")
      .delete()
      .eq("role_profile_id", roleProfileId);
    if (selectedBehaviours.length > 0) {
      await supabase
        .from("role_profile_behaviours")
        .insert(
          selectedBehaviours.map((behaviour_id) => ({
            role_profile_id: roleProfileId,
            behaviour_id,
          })),
        );
    }

    await supabase
      .from("role_profile_assignments")
      .delete()
      .eq("role_profile_id", roleProfileId);
    if (selectedRoles.length > 0) {
      await supabase
        .from("role_profile_assignments")
        .insert(
          selectedRoles.map((role_id) => ({
            role_profile_id: roleProfileId,
            role_id,
          })),
        );
    }

    setSaving(false);
    toast.success("✅ Role profile updated");
    onSubmit?.({
      roleProfileId,
      name,
      description,
      selectedModules,
      selectedDocuments,
      selectedBehaviours,
      selectedRoles,
    });
  };

  if (loading)
    return <div className="text-center py-10 text-white">Loading...</div>;

  return (
    <>
      <ContentHeader title="Edit Role Profile" />
      <div className="role-profile-edit-content">
        {step === 0 && (
          <>
            {editNameDesc === null ? (
              <YesNoQuestion
                question="Do you want to edit the name or description?"
                onYes={() => setEditNameDesc(true)}
                onNo={() => setEditNameDesc(false)}
              />
            ) : (
              editNameDesc && (
                <>
                  <InputField
                    label="Profile Name"
                    value={name}
                    onChange={setName}
                  />
                  <TextareaField
                    label="Description"
                    value={description}
                    onChange={setDescription}
                  />
                </>
              )
            )}
          </>
        )}

        {step === 1 && (
          <>
            {editModules === null ? (
              <YesNoQuestion
                question="Do you want to edit modules?"
                onYes={() => setEditModules(true)}
                onNo={() => setEditModules(false)}
              />
            ) : (
              editModules && (
                <NeonDualListbox
                  items={modules}
                  selected={selectedModules}
                  onChange={setSelectedModules}
                  titleLeft="Available Modules"
                  titleRight="Selected Modules"
                />
              )
            )}
          </>
        )}

        {step === 2 && (
          <>
            {editDocuments === null ? (
              <YesNoQuestion
                question="Do you want to edit documents?"
                onYes={() => setEditDocuments(true)}
                onNo={() => setEditDocuments(false)}
              />
            ) : (
              editDocuments && (
                <DocumentSelectorWidget
                  selectedDocuments={selectedDocuments}
                  onChange={setSelectedDocuments}
                />
              )
            )}
          </>
        )}

        {step === 3 && (
          <>
            {editBehaviours === null ? (
              <YesNoQuestion
                question="Do you want to edit behaviours?"
                onYes={() => setEditBehaviours(true)}
                onNo={() => setEditBehaviours(false)}
              />
            ) : (
              editBehaviours && (
                <BehaviourSelectorWidget
                  selectedBehaviours={selectedBehaviours}
                  onChange={setSelectedBehaviours}
                />
              )
            )}
          </>
        )}

        {step === 4 && (
          <>
            <NeonDualListbox
              items={roles}
              selected={selectedRoles}
              onChange={setSelectedRoles}
              titleLeft="Available Roles"
              titleRight="Assigned Roles"
            />
          </>
        )}

        {/* Controls */}
        <div className="neon-mt-8 neon-flex justify-between items-center">
          <NeonIconButton
            variant="back"
            icon={<FiArrowLeft />}
            title={step === 0 ? "Cancel" : "Back"}
            onClick={step === 0 ? onCancel : () => setStep(step - 1)}
          />

          {step < 4 ? (
            <NeonIconButton
              variant="next"
              icon={<FiArrowRight />}
              title="Next"
              onClick={() => setStep(step + 1)}
            />
          ) : (
            <NeonIconButton
              variant="save"
              icon={<FiSave />}
              title="Save Changes"
              onClick={handleSave}
              disabled={saving}
            />
          )}
        </div>

        {error && <div className="neon-error mt-4">{error}</div>}
      </div>
    </>
  );
}

// Utility Components

function YesNoQuestion({
  question,
  onYes,
  onNo,
}: {
  question: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="mb-6">
      <p className="neon-form-title mb-2">{question}</p>
      <div className="flex gap-4">
        <button className="neon-btn neon-btn-edit" onClick={onYes}>
          Yes
        </button>
        <button className="neon-btn neon-btn-view" onClick={onNo}>
          No
        </button>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <label className="neon-form-title">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="neon-input w-full"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <label className="neon-form-title">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="neon-input w-full"
        rows={3}
      />
    </div>
  );
}
