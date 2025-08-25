"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonModuleForm, {
  NeonModuleFormField,
} from "@/components/NeonModuleForm";

export default function EditModulePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(1);
  const [groupId, setGroupId] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    const fetchModule = async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Module not found");
        setLoading(false);
        return;
      }
      setName(data.name || "");
      setDescription(data.description || "");
      setVersion(data.version || 1);
      setGroupId(data.group_id || "");
      setLearningObjectives(data.learning_objectives || "");
      setEstimatedDuration(data.estimated_duration || "");
      setDeliveryFormat(data.delivery_format || "");
      setTargetAudience(data.target_audience || "");
      setPrerequisites(data.prerequisites || []);
      setThumbnailUrl(data.thumbnail_url || "");
      setLoading(false);
    };
    if (id) fetchModule();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowVersionModal(true);
  };

  const handleVersionConfirm = async (isNewVersion: boolean) => {
    setShowVersionModal(false);
    setError(null);
    let newVersion = version;
    if (isNewVersion) {
      newVersion = Number(version) + 1;
      setVersion(newVersion);
    }
    const { error } = await supabase
      .from("modules")
      .update({
        name,
        description,
        version: newVersion,
        group_id: groupId,
        learning_objectives: learningObjectives,
        estimated_duration: estimatedDuration,
        delivery_format: deliveryFormat,
        target_audience: targetAudience,
        prerequisites,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      setError("Failed to update module");
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push("/admin/modules"); // Return to view tab after successful submit
      }, 1200);
    }
  };

  if (loading) return <p className="neon-loading">Loading module...</p>;
  if (error) return <p className="neon-error">{error}</p>;

  // Prepare fields for NeonModuleForm
  const fields: NeonModuleFormField[] = [
    {
      key: "name",
      label: "Name",
      type: "text",
      value: name,
      onChange: (value) => setName(String(value)),
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "text",
      value: description,
      onChange: (value) => setDescription(String(value)),
    },
    {
      key: "learningObjectives",
      label: "Learning Objectives",
      type: "textarea",
      value: learningObjectives,
      onChange: (value) => setLearningObjectives(String(value)),
      rows: 2,
    },
    {
      key: "groupId",
      label: "Group ID",
      type: "text",
      value: groupId,
      onChange: (value) => setGroupId(String(value)),
      required: true,
    },
    {
      key: "estimatedDuration",
      label: "Estimated Duration",
      type: "text",
      value: estimatedDuration,
      onChange: (value) => setEstimatedDuration(String(value)),
      placeholder: "Enter duration (e.g. 1h 30m)",
    },
    {
      key: "deliveryFormat",
      label: "Delivery Format",
      type: "text",
      value: deliveryFormat,
      onChange: (value) => setDeliveryFormat(String(value)),
    },
    {
      key: "targetAudience",
      label: "Target Audience",
      type: "text",
      value: targetAudience,
      onChange: (value) => setTargetAudience(String(value)),
    },
    {
      key: "thumbnailUrl",
      label: "Thumbnail URL",
      type: "text",
      value: thumbnailUrl,
      onChange: (value) => setThumbnailUrl(String(value)),
    },
  ];

  return (
    <>
      <div className="mt-8">
        <NeonModuleForm
          title="Edit Module"
          fields={fields}
          onSubmit={handleSubmit}
          error={error}
          success={success}
        />
      </div>
      {showVersionModal && (
        <div className="ui-dialog-overlay">
          <div className="app-modal" style={{ maxWidth: 420 }}>
            <h2 className="font-title neon-text mb-2">
              Is this a new version of the module?
            </h2>
            <p className="font-body mb-4">
              If yes, the version number will be incremented automatically.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="neon-utility-btn neon-btn-save"
                onClick={() => handleVersionConfirm(true)}
                style={{ minWidth: 120 }}
              >
                Yes, new version
              </button>
              <button
                className="neon-utility-btn neon-btn-edit"
                onClick={() => handleVersionConfirm(false)}
                style={{ minWidth: 120 }}
              >
                No, keep version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
