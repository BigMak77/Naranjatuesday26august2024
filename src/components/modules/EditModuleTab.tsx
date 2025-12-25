"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiPlus, FiX } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";
import ModuleFileAttachments, { ModuleAttachment } from "@/components/modules/ModuleFileAttachments";

interface Category {
  id: string;
  name: string;
  description?: string;
  prefix?: string;
}

interface QuestionPack {
  id: string;
  title: string;
  description: string;
  pass_mark: number;
  time_limit_minutes: number | null;
}

interface Module {
  id: string;
  name: string;
  description?: string;
  ref_code?: string;
  version?: number;
  is_archived?: boolean;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  requires_follow_up?: boolean;
  review_period?: string;
  attachments?: ModuleAttachment[];
  categories?: string[];
}

interface EditModuleTabProps {
  module: Module;
  onSuccess?: () => void;
}

export default function EditModuleTab({ module, onSuccess }: EditModuleTabProps) {
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

  // Form state
  const [name, setName] = useState(module.name || "");
  const [description, setDescription] = useState(module.description || "");
  const [refCode, setRefCode] = useState(module.ref_code || "");
  const [version, setVersion] = useState<number>(module.version || 1);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(
    module.estimated_duration ? parseInt(module.estimated_duration) : 0
  );
  const [deliveryFormat, setDeliveryFormat] = useState(module.delivery_format || "");
  const [prerequisites, setPrerequisites] = useState<string[]>(module.prerequisites || []);
  const [tags, setTags] = useState<string[]>(module.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(module.requires_follow_up || false);
  const [reviewPeriod, setReviewPeriod] = useState(module.review_period || "0");
  const [attachments, setAttachments] = useState<ModuleAttachment[]>(module.attachments || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(module.categories || []);

  // Categories state
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  // Tests state
  const [availableTests, setAvailableTests] = useState<QuestionPack[]>([]);
  const [attachedTests, setAttachedTests] = useState<QuestionPack[]>([]);
  const [testsToAttach, setTestsToAttach] = useState<string[]>([]);
  const [testsToDetach, setTestsToDetach] = useState<string[]>([]);

  // Reference code validation state
  const [refCodeExists, setRefCodeExists] = useState(false);
  const [allModules, setAllModules] = useState<any[]>([]);

  // Fetch categories, modules, and tests on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("module_categories")
        .select("id, name, description, prefix")
        .eq("archived", false)
        .order("name");

      if (!error && data) {
        setAvailableCategories(data);
      }
    };

    const fetchModules = async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, ref_code");

      if (!error && data) {
        setAllModules(data);
      }
    };

    const fetchTests = async () => {
      // Fetch unassigned tests
      const { data: unassignedData, error: unassignedError } = await supabase
        .from("question_packs")
        .select("id, title, description, pass_mark, time_limit_minutes")
        .is("module_id", null)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("title");

      if (!unassignedError && unassignedData) {
        setAvailableTests(unassignedData);
      }

      // Fetch tests attached to this module
      const { data: attachedData, error: attachedError } = await supabase
        .from("question_packs")
        .select("id, title, description, pass_mark, time_limit_minutes")
        .eq("module_id", module.id)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("title");

      if (!attachedError && attachedData) {
        setAttachedTests(attachedData);
      }
    };

    fetchCategories();
    fetchModules();
    fetchTests();
  }, [module.id]);

  // Update state when module prop changes
  useEffect(() => {
    setName(module.name || "");
    setDescription(module.description || "");
    setRefCode(module.ref_code || "");
    setVersion(module.version || 1);
    setEstimatedDuration(module.estimated_duration ? parseInt(module.estimated_duration) : 0);
    setDeliveryFormat(module.delivery_format || "");
    setPrerequisites(module.prerequisites || []);
    setTags(module.tags || []);
    setRequiresFollowUp(module.requires_follow_up || false);
    setReviewPeriod(module.review_period || "0");
    setAttachments(module.attachments || []);
    setSelectedCategories(module.categories || []);
  }, [module]);

  // Check for duplicate ref code (exclude current module)
  useEffect(() => {
    if (!refCode.trim()) {
      setRefCodeExists(false);
      return;
    }

    // Check if ref code already exists (excluding current module)
    const isDuplicate = allModules.some(
      m => m.id !== module.id && m.ref_code && m.ref_code.toLowerCase() === refCode.toLowerCase()
    );
    setRefCodeExists(isDuplicate);
  }, [refCode, allModules, module.id]);

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
      setReviewPeriod("1 week");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate ref code before submitting
    if (refCodeExists) {
      setError("This reference code already exists. Please choose a different one.");
      return;
    }

    setShowVersionModal(true);
  };

  const handleVersionConfirm = async (isNewVersion: boolean) => {
    setShowVersionModal(false);
    setError(null);

    console.log("=== EditModuleTab: Saving changes ===");
    console.log("Module ID:", module.id);
    console.log("Is new version:", isNewVersion);

    let newVersion = version;
    if (isNewVersion) {
      newVersion = Number(version) + 1;
      setVersion(newVersion);
    }

    // Note: Need to add refresh_period to state and form
    const payload = {
      name,
      description,
      ref_code: refCode || null,
      version: newVersion,
      estimated_duration: estimatedDuration,
      delivery_format: deliveryFormat,
      prerequisites,
      tags: tags.length > 0 ? tags : null,
      requires_follow_up: requiresFollowUp,
      follow_up_period: requiresFollowUp ? reviewPeriod : "0",
      // refresh_period: refreshPeriod, // TODO: Add this field to form
      attachments: attachments.length > 0 ? attachments : [],
      categories: selectedCategories.length > 0 ? selectedCategories : [],
      updated_at: new Date().toISOString(),
    };

    console.log("Payload to update:", payload);

    const { data, error } = await supabase
      .from("modules")
      .update(payload)
      .eq("id", module.id)
      .select();

    console.log("Supabase response - data:", data, "error:", error);

    if (error) {
      console.error("❌ Error updating module:", error);
      setError("Failed to update module");
    } else {
      // Handle test attachments/detachments
      try {
        // Detach tests
        if (testsToDetach.length > 0) {
          console.log("Detaching tests:", testsToDetach);
          const { error: detachError } = await supabase
            .from("question_packs")
            .update({ module_id: null })
            .in("id", testsToDetach);

          if (detachError) {
            console.error("❌ Error detaching tests:", detachError);
            throw new Error("Module updated but failed to detach tests: " + detachError.message);
          }
          console.log("✅ Tests detached successfully!");
        }

        // Attach tests
        if (testsToAttach.length > 0) {
          console.log("Attaching tests:", testsToAttach);
          const { error: attachError } = await supabase
            .from("question_packs")
            .update({ module_id: module.id })
            .in("id", testsToAttach);

          if (attachError) {
            console.error("❌ Error attaching tests:", attachError);
            throw new Error("Module updated but failed to attach tests: " + attachError.message);
          }
          console.log("✅ Tests attached successfully!");
        }

        console.log("✅ Module updated successfully!");
        setSuccess(true);

        // Reset test tracking states
        setTestsToAttach([]);
        setTestsToDetach([]);

        // Refresh test lists
        const { data: unassignedData } = await supabase
          .from("question_packs")
          .select("id, title, description, pass_mark, time_limit_minutes")
          .is("module_id", null)
          .eq("is_active", true)
          .eq("is_archived", false)
          .order("title");

        if (unassignedData) {
          setAvailableTests(unassignedData);
        }

        const { data: attachedData } = await supabase
          .from("question_packs")
          .select("id, title, description, pass_mark, time_limit_minutes")
          .eq("module_id", module.id)
          .eq("is_active", true)
          .eq("is_archived", false)
          .order("title");

        if (attachedData) {
          setAttachedTests(attachedData);
        }

        if (onSuccess) onSuccess();
        setTimeout(() => setSuccess(false), 1200);
      } catch (err) {
        console.error("❌ Error managing tests:", err);
        setError(err instanceof Error ? err.message : "Module updated but failed to manage tests");
      }
    }
  };

  return (
    <>
      <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
        Edit module details
      </h2>

      <NeonForm onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="add-module-tab-field" style={{ flex: 2 }}>
            <label className="add-module-tab-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="add-module-tab-input neon-input"
              required
            />
          </div>

          <div className="add-module-tab-field" style={{ flex: 1 }}>
            <label className="add-module-tab-label">Category</label>
            <select
              value={selectedCategories[0] || ""}
              onChange={(e) => {
                const newCategoryId = e.target.value;
                setSelectedCategories(newCategoryId ? [newCategoryId] : []);
              }}
              className="add-module-tab-input neon-input"
            >
              <option value="">Select category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="add-module-tab-field" style={{ flex: 1 }}>
            <label className="add-module-tab-label">Reference Code</label>
            {selectedCategories.length > 0 && availableCategories.find(c => c.id === selectedCategories[0])?.prefix ? (
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div className="neon-input" style={{
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: '4px',
                  paddingLeft: '8px',
                  flex: '0 0 auto',
                  width: 'auto',
                  minWidth: 'auto'
                }}>
                  {availableCategories.find(c => c.id === selectedCategories[0])?.prefix}-
                </div>
                <input
                  type="text"
                  value={(() => {
                    const prefix = availableCategories.find(c => c.id === selectedCategories[0])?.prefix || '';
                    if (refCode.startsWith(`${prefix}-`)) {
                      return refCode.substring(prefix.length + 1);
                    }
                    return refCode;
                  })()}
                  onChange={(e) => {
                    const prefix = availableCategories.find(c => c.id === selectedCategories[0])?.prefix || '';
                    const value = e.target.value.toUpperCase();

                    // Remove all non-alphanumeric characters
                    const alphanumericOnly = value.replace(/[^A-Z0-9]/g, '');

                    // Format as YYYY (4 characters max for suffix)
                    const suffix = alphanumericOnly.slice(0, 4);

                    setRefCode(`${prefix}-${suffix}`);
                  }}
                  onKeyDown={(e) => {
                    // Allow navigation keys
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      return;
                    }
                    // Only allow alphanumeric characters
                    if (!/^[a-zA-Z0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="add-module-tab-input neon-input"
                  placeholder="____"
                  maxLength={4}
                  style={{
                    flex: 1,
                    borderRadius: '0 4px 4px 0',
                    paddingLeft: '4px',
                    borderColor: refCodeExists ? 'var(--danger)' : undefined
                  }}
                />
              </div>
            ) : (
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                className="add-module-tab-input neon-input"
                placeholder="e.g., HS-01-23"
                style={{
                  borderColor: refCodeExists ? 'var(--danger)' : undefined
                }}
              />
            )}
            {refCodeExists && (
              <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                This reference code already exists
              </p>
            )}
          </div>
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
              id="requiresFollowUpEdit"
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
            <label htmlFor="requiresFollowUpEdit" className="add-module-tab-label" style={{ margin: 0 }}>
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

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Manage Tests</label>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Add or remove tests for this module.
          </p>

          {/* Currently Attached Tests */}
          {attachedTests.filter(test => !testsToDetach.includes(test.id)).length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500, marginBottom: '8px' }}>
                Currently Attached ({attachedTests.filter(test => !testsToDetach.includes(test.id)).length}):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachedTests
                  .filter(test => !testsToDetach.includes(test.id))
                  .map((test) => (
                    <div
                      key={test.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                          {test.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Pass Mark: {test.pass_mark}%{test.time_limit_minutes ? ` • Time Limit: ${test.time_limit_minutes} min` : ''}
                        </div>
                      </div>
                      <TextIconButton
                        variant="delete"
                        icon={<FiX size={16} />}
                        label="Remove"
                        onClick={() => setTestsToDetach(prev => [...prev, test.id])}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Add New Tests */}
          {availableTests.length > 0 && (
            <>
              <label className="add-module-tab-label" style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
                Add Tests
              </label>
              <select
                className="add-module-tab-input neon-input"
                value=""
                onChange={(e) => {
                  const testId = e.target.value;
                  if (testId && !testsToAttach.includes(testId)) {
                    setTestsToAttach(prev => [...prev, testId]);
                  }
                }}
              >
                <option value="">Select a test to add...</option>
                {availableTests
                  .filter(test => !testsToAttach.includes(test.id))
                  .map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title} (Pass: {test.pass_mark}%{test.time_limit_minutes ? `, ${test.time_limit_minutes} min` : ''})
                    </option>
                  ))}
              </select>

              {testsToAttach.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500, marginBottom: '8px' }}>
                    Tests to Add ({testsToAttach.length}):
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {testsToAttach.map((testId) => {
                      const test = availableTests.find(t => t.id === testId);
                      if (!test) return null;
                      return (
                        <div
                          key={testId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'var(--surface)',
                            border: '1px solid var(--accent)',
                            borderRadius: '4px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                              {test.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Pass Mark: {test.pass_mark}%{test.time_limit_minutes ? ` • Time Limit: ${test.time_limit_minutes} min` : ''}
                            </div>
                          </div>
                          <TextIconButton
                            variant="delete"
                            icon={<FiX size={16} />}
                            label="Remove"
                            onClick={() => setTestsToAttach(prev => prev.filter(id => id !== testId))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {availableTests.length === 0 && attachedTests.filter(test => !testsToDetach.includes(test.id)).length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No tests available or attached to this module.
            </p>
          )}
        </div>

        {error && <p className="add-module-tab-error">{error}</p>}
        {success && (
          <p className="add-module-tab-success">
            Module updated successfully!
          </p>
        )}
      </NeonForm>

      {/* Version Confirmation Modal */}
      {showVersionModal && (
        <OverlayDialog showCloseButton={true}
          open={showVersionModal}
          onClose={() => setShowVersionModal(false)}
          ariaLabelledby="version-dialog-title"
        >
          <div style={{ padding: "24px", minWidth: "400px" }}>
            <h3
              id="version-dialog-title"
              style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.1rem", marginBottom: "16px" }}
            >
              Is this a new version of the module?
            </h3>
            <p style={{ color: 'var(--text)', marginBottom: '24px' }}>
              If yes, the version number will be incremented automatically from {version} to {version + 1}.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <TextIconButton
                variant="cancel"
                icon={<FiX size={16} />}
                label="No, update current"
                onClick={() => handleVersionConfirm(false)}
              />
              <TextIconButton
                variant="add"
                icon={<FiPlus size={16} />}
                label="Yes, new version"
                onClick={() => handleVersionConfirm(true)}
              />
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Follow-up Assessment Dialog */}
      {showFollowUpDialog && (
        <OverlayDialog showCloseButton={true}
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
