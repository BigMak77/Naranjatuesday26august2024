"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonModuleForm, {
  NeonModuleFormField,
} from "@/components/NeonModuleForm";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus, FiX } from "react-icons/fi";

// --- helpers ---
const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    v,
  );

const extractUuidFromPath = (path: string | null) => {
  if (!path) return null;
  const m = path.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/,
  );
  return m ? m[0] : null;
};

export interface Module {
  id: string;
  name: string;
  description?: string;
  version?: number;
  is_archived?: boolean;
  group_id?: string;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

export function ViewModuleTab({ module }: { module: Module }) {
  // Display module details in read-only mode
  return (
    <div className="view-module-tab">
      <h2 className="view-module-title">{module.name}</h2>
      <p className="view-module-description">{module.description}</p>
      <div className="view-module-meta">
        Version: <span>{module.version}</span>
      </div>
      <div className="view-module-meta">
        Status: <span>{module.is_archived ? "Archived" : "Active"}</span>
      </div>
      <div className="view-module-meta">
        Group ID: <span>{module.group_id}</span>
      </div>
      <div className="view-module-meta">
        Learning Objectives: <span>{module.learning_objectives || "—"}</span>
      </div>
      <div className="view-module-meta">
        Estimated Duration: <span>{module.estimated_duration || "—"}</span>
      </div>
      <div className="view-module-meta">
        Delivery Format: <span>{module.delivery_format || "—"}</span>
      </div>
      <div className="view-module-meta">
        Target Audience: <span>{module.target_audience || "—"}</span>
      </div>
      <div className="view-module-meta">
        Prerequisites:{" "}
        <span>
          {module.prerequisites && module.prerequisites.length > 0
            ? module.prerequisites.join(", ")
            : "—"}
        </span>
      </div>
      <div className="view-module-meta">
        Tags:{" "}
        <span>
          {module.tags && module.tags.length > 0 ? module.tags.join(", ") : "—"}
        </span>
      </div>
      <div className="view-module-meta">
        Created At:{" "}
        <span>
          {module.created_at
            ? new Date(module.created_at).toLocaleString()
            : "—"}
        </span>
      </div>
      <div className="view-module-meta">
        Updated At:{" "}
        <span>
          {module.updated_at
            ? new Date(module.updated_at).toLocaleString()
            : "—"}
        </span>
      </div>
    </div>
  );
}

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const pathname = usePathname();

  // derive id safely from params, else try the pathname
  const derivedId = useMemo(() => {
    const fromParams = Array.isArray(params?.id) ? params?.id?.[0] : params?.id;
    if (isUuid(fromParams)) return fromParams || null;
    const fromPath = extractUuidFromPath(pathname);
    return isUuid(fromPath) ? fromPath : null;
  }, [params?.id, pathname]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState<number>(1);
  const [groupId, setGroupId] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [reviewPeriod, setReviewPeriod] = useState("0");

  // fetch module
  useEffect(() => {
    const run = async () => {
      if (!derivedId) {
        setError("Invalid or missing module ID in URL.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", derivedId)
        .eq("is_archived", false) // Only fetch non-archived modules
        .single();

      if (error || !data) {
        setError("Module not found");
        setLoading(false);
        return;
      }

      setName(data.name || "");
      setDescription(data.description || "");
      setVersion(
        typeof data.version === "number"
          ? data.version
          : Number(data.version ?? 1) || 1,
      );
      setGroupId(data.group_id || "");
      setLearningObjectives(data.learning_objectives || "");
      setEstimatedDuration(data.estimated_duration || "");
      setDeliveryFormat(data.delivery_format || "");
      setTargetAudience(data.target_audience || "");
      setPrerequisites(
        Array.isArray(data.prerequisites) ? data.prerequisites : [],
      );
      setThumbnailUrl(data.thumbnail_url || "");
      setRequiresFollowUp(data.requires_follow_up || false);
      setReviewPeriod(data.review_period || "0");
      setLoading(false);
    };

    run();
  }, [derivedId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowVersionModal(true);
  };

  const handleVersionConfirm = async (isNewVersion: boolean) => {
    setShowVersionModal(false);
    setError(null);

    if (!derivedId) {
      setError("Invalid module ID.");
      return;
    }

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
        requires_follow_up: requiresFollowUp,
        review_period: requiresFollowUp ? reviewPeriod : "0",
        updated_at: new Date().toISOString(),
      })
      .eq("id", derivedId);

    if (error) {
      setError("Failed to update module");
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push("/admin/modules"); // back to modules list
      }, 1200);
    }
  };

  if (loading) return <p className="neon-loading">Loading module...</p>;
  if (error) return <p className="neon-error">{error}</p>;

  const handleFollowUpChange = (checked: boolean) => {
    setRequiresFollowUp(checked);
    if (checked && reviewPeriod === "0") {
      setReviewPeriod("1 week");
    }
  };

  const fields: NeonModuleFormField[] = [
    {
      key: "name",
      label: "Name",
      type: "text",
      value: name,
      onChange: (v) => setName(String(v)),
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "text",
      value: description,
      onChange: (v) => setDescription(String(v)),
    },
    {
      key: "learningObjectives",
      label: "Learning Objectives",
      type: "textarea",
      value: learningObjectives,
      onChange: (v) => setLearningObjectives(String(v)),
      rows: 2,
    },
    {
      key: "groupId",
      label: "Group ID",
      type: "text",
      value: groupId,
      onChange: (v) => setGroupId(String(v)),
      required: true,
    },
    {
      key: "estimatedDuration",
      label: "Estimated Duration",
      type: "text",
      value: estimatedDuration,
      onChange: (v) => setEstimatedDuration(String(v)),
      placeholder: "Enter duration (e.g. 1h 30m)",
    },
    {
      key: "deliveryFormat",
      label: "Delivery Format",
      type: "text",
      value: deliveryFormat,
      onChange: (v) => setDeliveryFormat(String(v)),
    },
    {
      key: "targetAudience",
      label: "Target Audience",
      type: "text",
      value: targetAudience,
      onChange: (v) => setTargetAudience(String(v)),
    },
    {
      key: "thumbnailUrl",
      label: "Thumbnail URL",
      type: "text",
      value: thumbnailUrl,
      onChange: (v) => setThumbnailUrl(String(v)),
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

        {/* Follow-up Assessment Checkbox */}
        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--panel)', borderRadius: 'var(--radius)', border: '1px solid rgba(64, 224, 208, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="requiresFollowUpEdit"
              checked={requiresFollowUp}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  setRequiresFollowUp(true);
                  if (reviewPeriod === "0") {
                    setReviewPeriod("1 week");
                  }
                  setShowFollowUpDialog(true);
                } else {
                  setRequiresFollowUp(false);
                  setReviewPeriod("0");
                  setShowFollowUpDialog(false);
                }
              }}
              className="neon-checkbox"
            />
            <label htmlFor="requiresFollowUpEdit" style={{ color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>
              After completion, does this training require a follow-up assessment?
            </label>
          </div>
          {requiresFollowUp && (
            <div style={{ marginTop: '8px', marginLeft: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Review period: {reviewPeriod}
            </div>
          )}
        </div>
      </div>

      {showVersionModal && (
        <div
          className="ui-dialog-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVersionModal(false);
          }}
        >
          <div
            className="ui-dialog-content neon-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-title"
            style={{ maxWidth: 420 }}
          >
            <h2 id="version-title" className="font-title neon-text mb-2">
              Is this a new version of the module?
            </h2>
            <p className="font-body mb-4">
              If yes, the version number will be incremented automatically.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="neon-btn neon-btn-save"
                onClick={() => handleVersionConfirm(true)}
                style={{ minWidth: 40, minHeight: 40 }}
                aria-label="Confirm new version"
              >
                {/* Icon only, no label */}
              </button>
              <button
                className="neon-btn neon-btn-edit"
                onClick={() => handleVersionConfirm(false)}
                style={{ minWidth: 40, minHeight: 40 }}
                aria-label="Keep current version"
              >
                {/* Icon only, no label */}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Assessment Dialog */}
      {showFollowUpDialog && (
        <OverlayDialog
          open={showFollowUpDialog}
          onClose={() => setShowFollowUpDialog(false)}
          ariaLabelledby="follow-up-dialog-title-edit"
        >
          <div style={{ padding: "24px", minWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3
                id="follow-up-dialog-title-edit"
                style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.1rem", margin: 0 }}
              >
                Follow-up Assessment Configuration
              </h3>
              <NeonIconButton
                variant="delete"
                icon={<FiX size={18} />}
                title="Close"
                onClick={() => {
                  setShowFollowUpDialog(false);
                  if (!requiresFollowUp) {
                    setReviewPeriod("0");
                  }
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="requiresFollowUpDialog"
                  checked={requiresFollowUp}
                  onChange={(e) => handleFollowUpChange(e.target.checked)}
                  className="neon-checkbox"
                />
                <label htmlFor="requiresFollowUpDialog" style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                  After completion, does this training require a follow-up assessment?
                </label>
              </div>

              {requiresFollowUp && (
                <div>
                  <label style={{
                    color: 'var(--accent)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Review Period
                  </label>
                  <select
                    value={reviewPeriod}
                    onChange={(e) => setReviewPeriod(e.target.value)}
                    className="add-module-tab-input neon-input"
                    style={{ width: '100%' }}
                  >
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <NeonIconButton
                variant="delete"
                icon={<FiX size={16} />}
                title="Cancel"
                onClick={() => {
                  setShowFollowUpDialog(false);
                  setRequiresFollowUp(false);
                  setReviewPeriod("0");
                }}
              />
              <NeonIconButton
                variant="add"
                icon={<FiPlus size={16} />}
                title="Save Configuration"
                onClick={() => setShowFollowUpDialog(false)}
              />
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
