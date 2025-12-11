"use client";
import React, { useState } from "react";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiPlus, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import ModuleFileAttachments, { ModuleAttachment } from "@/components/modules/ModuleFileAttachments";
import OverlayDialog from "@/components/ui/OverlayDialog";

interface AddModuleTabProps {
  onSuccess?: () => void;
}

export default function AddModuleTab({
  onSuccess,
}: AddModuleTabProps) {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(1);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [reviewPeriod, setReviewPeriod] = useState("0");
  const [attachments, setAttachments] = useState<ModuleAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);


  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFollowUpChange = (checked: boolean) => {
    setRequiresFollowUp(checked);
    if (checked && reviewPeriod === "0") {
      setReviewPeriod("1");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log("=== AddModuleTab: Form submitted ===");
    console.log("Form values:", { name, description, version, estimatedDuration, deliveryFormat, tags, requiresFollowUp, reviewPeriod, attachments });

    try {
      const payload = {
        name,
        description,
        version,
        estimated_duration: estimatedDuration,
        delivery_format: deliveryFormat,
        prerequisites,
        tags: tags.length > 0 ? tags : null,
        requires_follow_up: requiresFollowUp,
        follow_up_period: requiresFollowUp ? reviewPeriod : "0",
        attachments: attachments.length > 0 ? attachments : [],
      };

      console.log("Payload to insert:", payload);

      const { data, error } = await supabase.from("modules").insert([payload]).select();

      console.log("Supabase response - data:", data, "error:", error);

      if (error) throw error;

      console.log("✅ Module added successfully!");
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 1200);
      // Reset form fields
      setName("");
      setDescription("");
      setVersion(1);
      setEstimatedDuration(0);
      setDeliveryFormat("");
      setPrerequisites([]);
      setTags([]);
      setTagInput("");
      setRequiresFollowUp(false);
      setReviewPeriod("0");
      setAttachments([]);
    } catch (err) {
      console.error("❌ Error adding module:", err);
      setError(err instanceof Error ? err.message : "Failed to add module.");
    }
  };

  return (
    <>
      <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
        Create New Training Module
      </h2>

      <NeonForm onSubmit={handleSubmit}>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="add-module-tab-input neon-input"
            required
          />
        </div>

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="add-module-tab-input neon-input"
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="add-module-tab-field" style={{ flex: 1 }}>
            <label className="add-module-tab-label">Estimated Duration (minutes)</label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 0)}
              className="add-module-tab-input neon-input"
              min="0"
              step="1"
            />
          </div>

          <div className="add-module-tab-field" style={{ flex: 1 }}>
            <label className="add-module-tab-label">Delivery Format</label>
            <select
              value={deliveryFormat}
              onChange={(e) => setDeliveryFormat(e.target.value)}
              className="add-module-tab-input neon-input"
            >
              <option value="">Select delivery format</option>
              <option value="online/elearning">Online/eLearning</option>
              <option value="delivered in person">Delivered in person</option>
              <option value="read instruction">Read instruction</option>
              <option value="step-by-step instruction">Step-by-step instruction</option>
              <option value="classroom delivery">Classroom delivery</option>
              <option value="delivered off-site">Delivered off-site</option>
            </select>
          </div>
        </div>

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Tags</label>
          <div className="add-module-tab-tag-row" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Enter a tag and press Enter"
              className="add-module-tab-input neon-input"
              style={{ flex: 1 }}
            />
            <TextIconButton
              variant="add"
              icon={<FiPlus size={16} />}
              label="Add Tag"
              onClick={addTag}
              disabled={!tagInput.trim()}
            />
          </div>
          <div className="add-module-tab-tag-list">
            {tags.map((t, i) => (
              <span key={i} className="add-module-tab-tag">
                {t}
                <TextIconButton
                  variant="delete"
                  icon={<FiX color="white" />}
                  label="Remove"
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="add-module-tab-tag-remove"
                />
              </span>
            ))}
          </div>
        </div>

        {/* Section Divider */}
        <div style={{
          margin: '24px 0 16px 0',
          padding: '12px 0',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)'
        }}>
          <h3 style={{
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: '1rem',
            margin: 0
          }}>
            Review Periods & Assessment
          </h3>
        </div>

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Review Period</label>
          <select
            value={reviewPeriod}
            onChange={(e) => setReviewPeriod(e.target.value)}
            className="add-module-tab-input neon-input"
          >
            <option value="0">No review required</option>
            <option value="1">1 month</option>
            <option value="2">2 months</option>
            <option value="3">3 months</option>
            <option value="4">4 months</option>
            <option value="5">5 months</option>
            <option value="6">6 months</option>
            <option value="7">7 months</option>
            <option value="8">8 months</option>
            <option value="9">9 months</option>
            <option value="10">10 months</option>
            <option value="11">11 months</option>
            <option value="12">12 months</option>
            <option value="12-18">12-18 months</option>
            <option value="18">18 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="48">48 months</option>
            <option value="60">60 months</option>
          </select>
        </div>

        <div className="add-module-tab-field">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="requiresFollowUp"
              checked={requiresFollowUp}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  setRequiresFollowUp(true);
                  if (reviewPeriod === "0") {
                    setReviewPeriod("1");
                  }
                  setShowFollowUpDialog(true);
                } else {
                  setRequiresFollowUp(false);
                  setShowFollowUpDialog(false);
                }
              }}
              className="neon-checkbox"
            />
            <label htmlFor="requiresFollowUp" className="add-module-tab-label" style={{ margin: 0 }}>
              After completion, does this training require a follow-up assessment?
            </label>
          </div>
        </div>

        {/* Section Divider */}
        <div style={{
          margin: '24px 0 16px 0',
          padding: '12px 0',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)'
        }}>
          <h3 style={{
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: '1rem',
            margin: 0
          }}>
            Training Materials
          </h3>
        </div>

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Attachments</label>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Upload training materials such as presentations, SCORM packages, PDFs, videos, etc.
          </p>
          <ModuleFileAttachments
            attachments={attachments}
            onChange={setAttachments}
          />
        </div>

        {error && <p className="add-module-tab-error">{error}</p>}
        {success && (
          <p className="add-module-tab-success">
            Module added successfully!
          </p>
        )}
      </NeonForm>

      {/* Follow-up Assessment Dialog */}
      {showFollowUpDialog && (
        <OverlayDialog showCloseButton={true}
          open={showFollowUpDialog}
          onClose={() => setShowFollowUpDialog(false)}
          ariaLabelledby="follow-up-dialog-title"
        >
          <div style={{ padding: "24px", minWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3
                id="follow-up-dialog-title"
                style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.1rem", margin: 0 }}
              >
                Follow-up Assessment Configuration
              </h3>
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
              <TextIconButton
                variant="add"
                icon={<FiPlus size={16} />}
                label="Save Configuration"
                onClick={() => setShowFollowUpDialog(false)}
              />
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
