"use client";
import React, { useState, useEffect } from "react";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiPlus, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import ModuleFileAttachments, { ModuleAttachment } from "@/components/modules/ModuleFileAttachments";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";

interface AddModuleTabProps {
  onSuccess?: () => void;
}

export default function AddModuleTab({
  onSuccess,
}: AddModuleTabProps) {
  // Form state
  const [name, setName] = useState("");
  const [moduleReference, setModuleReference] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(1);
  const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  const [learningObjectives, setLearningObjectives] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string; name: string}>>([]);
  const [requiresFollowUp, setRequiresFollowUp] = useState("No");
  const [reviewPeriod, setReviewPeriod] = useState("1 week");
  const [refreshPeriod, setRefreshPeriod] = useState("Never");
  const [attachments, setAttachments] = useState<ModuleAttachment[]>([]);
  const [hasTest, setHasTest] = useState("No");
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [availableTests, setAvailableTests] = useState<Array<{id: string; title: string}>>([]);
  const [hasSignOffForm, setHasSignOffForm] = useState("No");
  const [signOffFormUrl, setSignOffFormUrl] = useState("");
  // Removed unused 'saving' state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchAvailableTests();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("module_categories")
      .select("id, name")
      .eq("archived", false)
      .order("name", { ascending: true });
    if (!error && data) {
      setAvailableCategories(data);
    }
  };

  const fetchAvailableTests = async () => {
    const { data, error } = await supabase
      .from("question_packs")
      .select("id, title")
      .eq("is_active", true)
      .order("title", { ascending: true });
    if (!error && data) {
      setAvailableTests(data);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFollowUpChange = (value: string) => {
    setRequiresFollowUp(value);
    if (value === "Yes" && reviewPeriod === "0") {
      setReviewPeriod("1 week");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log("=== AddModuleTab: Form submitted ===");
    console.log("Form values:", { name, description, version, learningObjectives, estimatedDuration, deliveryFormat, tags, requiresFollowUp, reviewPeriod, attachments });

    try {
      // Only export fields present in the add form
      const payload = {
        name: name, // required, never null
        description: description || null,
        version: version, // required, never null
        created_at: createdDate,
        learning_objectives: learningObjectives || null,
        estimated_duration: estimatedDuration || null,
        delivery_format: deliveryFormat || null,
        tags: tags.length > 0 ? tags : null,
        categories: selectedCategories.length > 0 ? selectedCategories : [],
        requires_follow_up: requiresFollowUp === "Yes",
        review_period: requiresFollowUp === "Yes" ? reviewPeriod : "0",
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
      setDescription("");
      setVersion(1);
      setName("");
      setModuleReference("");
      setCreatedDate(new Date().toISOString().split('T')[0]);
      setLearningObjectives("");
      setEstimatedDuration("");
      setDeliveryFormat("");
      setTags([]);
      setTagInput("");
      setSelectedCategories([]);
      setRequiresFollowUp("No");
      setReviewPeriod("1 week");
      setRefreshPeriod("Never");
      setAttachments([]);
      setHasTest("No");
      setSelectedTestId("");
      setHasSignOffForm("No");
      setSignOffFormUrl("");
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="add-module-tab-input neon-input"
              required
            />
          </div>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Module Reference</label>
            <input
              type="text"
              value={moduleReference}
              onChange={(e) => setModuleReference(e.target.value)}
              className="add-module-tab-input neon-input"
              placeholder="e.g., MOD-001"
            />
          </div>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Version *</label>
            <input
              type="number"
              value={version}
              onChange={(e) => setVersion(Number(e.target.value))}
              className="add-module-tab-input neon-input"
              min={1}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Date</label>
            <input
              type="date"
              value={createdDate}
              onChange={(e) => setCreatedDate(e.target.value)}
              className="add-module-tab-input neon-input"
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 165, 0, 0.2)', marginTop: '8px', marginBottom: '8px' }} />

        {/* Description and Learning Objectives side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="add-module-tab-input neon-input"
              rows={4}
            />
          </div>

          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Learning Objectives</label>
            <textarea
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className="add-module-tab-input neon-input"
              rows={4}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 165, 0, 0.2)', marginTop: '8px', marginBottom: '8px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Estimated Duration</label>
            <input
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="add-module-tab-input neon-input"
              placeholder="e.g., 2 hours"
            />
          </div>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Delivery Format</label>
            <input
              type="text"
              value={deliveryFormat}
              onChange={(e) => setDeliveryFormat(e.target.value)}
              className="add-module-tab-input neon-input"
              placeholder="e.g., Online, In-person"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="add-module-tab-field">
            <MultiSelectDropdown
              label="Categories"
              options={availableCategories}
              selectedIds={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Select categories..."
            />
          </div>

          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Tags (e.g., Safety, Compliance, Technical, HR)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter a tag and press Enter"
                className="add-module-tab-input neon-input"
                style={{ flex: 1 }}
              />
              <TextIconButton
                variant="add"
                icon={<FiPlus size={16} />}
                label="Add"
                onClick={addTag}
                disabled={!tagInput.trim()}
              />
            </div>
            {tags.length > 0 && (
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
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 165, 0, 0.2)', marginTop: '8px', marginBottom: '8px' }} />

        <div className="add-module-tab-field">
          <h3 style={{ color: "var(--accent)", fontSize: "1rem", fontWeight: 600, marginBottom: "12px" }}>
            Follow-up & Refresh
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: requiresFollowUp === "Yes" ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="add-module-tab-label">Requires follow-up training?</label>
              <select
                value={requiresFollowUp}
                onChange={(e) => handleFollowUpChange(e.target.value)}
                className="add-module-tab-input neon-input"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {requiresFollowUp === "Yes" && (
              <div>
                <label className="add-module-tab-label">Review period</label>
                <select
                  value={reviewPeriod}
                  onChange={(e) => setReviewPeriod(e.target.value)}
                  className="add-module-tab-input neon-input"
                >
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                </select>
              </div>
            )}

            <div>
              <label className="add-module-tab-label">When should this training be refreshed?</label>
              <select
                value={refreshPeriod}
                onChange={(e) => setRefreshPeriod(e.target.value)}
                className="add-module-tab-input neon-input"
              >
                <option value="Never">Never</option>
                <option value="6 months">6 months</option>
                <option value="12 months">12 months</option>
                <option value="18 months">18 months</option>
                <option value="2 years">2 years</option>
                <option value="3 years">3 years</option>
                <option value="5 years">5 years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 165, 0, 0.2)', marginTop: '8px', marginBottom: '8px' }} />

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Attachments (PDFs, Videos, Audio files, etc.)</label>
          <ModuleFileAttachments
            attachments={attachments}
            onChange={setAttachments}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 165, 0, 0.2)', marginTop: '8px', marginBottom: '8px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Add a test?</label>
            <select
              value={hasTest}
              onChange={(e) => setHasTest(e.target.value)}
              className="add-module-tab-input neon-input"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            {hasTest === "Yes" && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="add-module-tab-input neon-input"
                >
                  <option value="">-- Select a test --</option>
                  {availableTests.map(test => (
                    <option key={test.id} value={test.id}>{test.title}</option>
                  ))}
                </select>
                <TextIconButton
                  variant="add"
                  icon={<FiPlus size={16} />}
                  label="Create New Test"
                  onClick={() => window.open('/training/assessment', '_blank')}
                />
              </div>
            )}
          </div>

          <div className="add-module-tab-field">
            <label className="add-module-tab-label">Attach a sign off form?</label>
            <select
              value={hasSignOffForm}
              onChange={(e) => setHasSignOffForm(e.target.value)}
              className="add-module-tab-input neon-input"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            {hasSignOffForm === "Yes" && (
              <input
                type="url"
                value={signOffFormUrl}
                onChange={(e) => setSignOffFormUrl(e.target.value)}
                className="add-module-tab-input neon-input"
                placeholder="Enter sign off form URL (e.g., https://...)"
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
        </div>

        {error && <p className="add-module-tab-error">{error}</p>}
        {success && (
          <p className="add-module-tab-success">
            <TextIconButton
              variant="add"
              icon={<FiPlus color="white" />}
              label="Added"
            />
          </p>
        )}
      </NeonForm>
    </>
  );
}
