"use client";
import React, { useState } from "react";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
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
  const [learningObjectives, setLearningObjectives] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [reviewPeriod, setReviewPeriod] = useState("0");
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  // Removed unused 'saving' state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Debug logging
  console.log("AddModuleTab render - showFollowUpDialog:", showFollowUpDialog, "requiresFollowUp:", requiresFollowUp);

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
      setReviewPeriod("1 week"); // Set default review period when enabling follow-up
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log("=== AddModuleTab: Form submitted ===");
    console.log("Form values:", { name, description, version, learningObjectives, estimatedDuration, deliveryFormat, tags, requiresFollowUp, reviewPeriod });

    try {
      // Only export fields present in the add form
      const payload = {
        name: name, // required, never null
        description: description || null,
        version: version, // required, never null
        learning_objectives: learningObjectives || null,
        estimated_duration: estimatedDuration || null,
        delivery_format: deliveryFormat || null,
        tags: tags.length > 0 ? tags : null,
        requires_follow_up: requiresFollowUp,
        review_period: requiresFollowUp ? reviewPeriod : "0",
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
      setDescription("");
      setVersion(1);
      setName("");
      setLearningObjectives("");
      setEstimatedDuration("");
      setDeliveryFormat("");
      setTags([]);
      setTagInput("");
      setRequiresFollowUp(false);
      setReviewPeriod("0");
    } catch (err) {
      console.error("❌ Error adding module:", err);
      setError(err instanceof Error ? err.message : "Failed to add module.");
    }
  };

  return (
    <>
      <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
        Fill in the details to create a new training module
      </h2>
        
        <NeonForm onSubmit={handleSubmit}>
        {/* Same fields as edit, but for adding */}
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
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Version</label>
          <input
            type="number"
            value={version}
            onChange={(e) => setVersion(Number(e.target.value))}
            className="add-module-tab-input neon-input"
            min={1}
            required
          />
        </div>

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Learning Objectives</label>
          <textarea
            value={learningObjectives}
            onChange={(e) => setLearningObjectives(e.target.value)}
            className="add-module-tab-input neon-input"
            rows={2}
          />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Estimated Duration</label>
          <input
            type="text"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            className="add-module-tab-input neon-input"
          />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Delivery Format</label>
          <input
            type="text"
            value={deliveryFormat}
            onChange={(e) => setDeliveryFormat(e.target.value)}
            className="add-module-tab-input neon-input"
          />
        </div>
        
        <div className="add-module-tab-field">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="requiresFollowUpMain"
              checked={requiresFollowUp}
              onChange={(e) => {
                const checked = e.target.checked;
                console.log("Checkbox clicked:", checked);
                if (checked) {
                  // When checking the box, set default period and show dialog
                  setRequiresFollowUp(true);
                  if (reviewPeriod === "0") {
                    setReviewPeriod("1 week");
                  }
                  console.log("About to show dialog");
                  setShowFollowUpDialog(true);
                } else {
                  // When unchecking, disable follow-up and reset period
                  setRequiresFollowUp(false);
                  setReviewPeriod("0");
                  setShowFollowUpDialog(false);
                }
              }}
              className="neon-checkbox"
            />
            <label htmlFor="requiresFollowUpMain" className="add-module-tab-label" style={{ margin: 0 }}>
              After completion, does this training require a follow-up assessment?
            </label>
          </div>
          {requiresFollowUp && (
            <div style={{ marginTop: '8px', marginLeft: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Review period: {reviewPeriod}
            </div>
          )}
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
            <NeonIconButton
              variant="add"
              icon={<FiPlus size={16} />}
              title="Add Tag"
              onClick={addTag}
              disabled={!tagInput.trim()}
            />
          </div>
          <div className="add-module-tab-tag-list">
            {tags.map((t, i) => (
              <span key={i} className="add-module-tab-tag">
                {t}
                <NeonIconButton
                  variant="delete"
                  icon={<FiX color="white" />}
                  title="Remove"
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="add-module-tab-tag-remove"
                />
              </span>
            ))}
          </div>
        </div>
        {error && <p className="add-module-tab-error">{error}</p>}
        {success && (
          <p className="add-module-tab-success">
            <NeonIconButton
              variant="add"
              icon={<FiPlus color="white" />}
              title="Added"
            />
            {/* Icon only, no label */}
          </p>
        )}
        <div className="add-module-tab-actions"></div>
      </NeonForm>

      {/* Follow-up Assessment Dialog */}
      {showFollowUpDialog && (
        <OverlayDialog
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
