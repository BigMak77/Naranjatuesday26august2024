"use client";
import React, { useState, useEffect } from "react";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiPlus, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import ModuleFileAttachments, { ModuleAttachment } from "@/components/modules/ModuleFileAttachments";
import OverlayDialog from "@/components/ui/OverlayDialog";

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

interface AddModuleTabProps {
  onSuccess?: () => void;
}

export default function AddModuleTab({
  onSuccess,
}: AddModuleTabProps) {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [refCode, setRefCode] = useState("");
  const [version, setVersion] = useState(1);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [reviewPeriod, setReviewPeriod] = useState("0");
  const [attachments, setAttachments] = useState<ModuleAttachment[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

  // Categories state
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  // Tests state
  const [availableTests, setAvailableTests] = useState<QuestionPack[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Reference code validation state
  const [refCodeExists, setRefCodeExists] = useState(false);
  const [refCodeSuggestions, setRefCodeSuggestions] = useState<string[]>([]);
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
        .select("ref_code, categories, name");

      if (!error && data) {
        setAllModules(data);
      }
    };

    const fetchTests = async () => {
      const { data, error } = await supabase
        .from("question_packs")
        .select("id, title, description, pass_mark, time_limit_minutes")
        .is("module_id", null)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("title");

      if (!error && data) {
        setAvailableTests(data);
      }
    };

    fetchCategories();
    fetchModules();
    fetchTests();
  }, []);

  // Check for duplicate ref code and generate suggestions
  useEffect(() => {
    if (!refCode.trim()) {
      setRefCodeExists(false);
      setRefCodeSuggestions([]);
      return;
    }

    // Check if ref code already exists
    const isDuplicate = allModules.some(
      m => m.ref_code && m.ref_code.toLowerCase() === refCode.toLowerCase()
    );
    setRefCodeExists(isDuplicate);

    // Generate suggestions based on selected category
    if (selectedCategories.length > 0) {
      const selectedCategoryId = selectedCategories[0];
      const categoryData = availableCategories.find(c => c.id === selectedCategoryId);

      if (categoryData) {
        // Get modules in the same category with ref codes
        const modulesInCategory = allModules.filter(m =>
          m.categories && m.categories.includes(selectedCategoryId) && m.ref_code
        );

        const suggestions: string[] = [];

        if (modulesInCategory.length > 0) {
          // Analyze existing patterns: count occurrences of each prefix
          const prefixCounts = new Map<string, number>();
          const prefixNumbers = new Map<string, number[]>();

          modulesInCategory.forEach(m => {
            const match = m.ref_code.match(/^([A-Z]+)-(\d+)$/);
            if (match) {
              const prefix = match[1];
              const number = parseInt(match[2]);

              prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);

              if (!prefixNumbers.has(prefix)) {
                prefixNumbers.set(prefix, []);
              }
              prefixNumbers.get(prefix)!.push(number);
            }
          });

          // Sort prefixes by usage count (most used first)
          const sortedPrefixes = Array.from(prefixCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([prefix]) => prefix);

          // Generate suggestions for the most commonly used prefixes
          sortedPrefixes.slice(0, 3).forEach(prefix => {
            const numbers = prefixNumbers.get(prefix) || [];
            const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
            suggestions.push(`${prefix}-${String(nextNumber).padStart(3, '0')}`);
          });

        } else {
          // No existing modules in this category - suggest based on category name
          const categoryPrefix = categoryData.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3);

          suggestions.push(`${categoryPrefix}-001`);

          // Also try common variations
          const words = categoryData.name.split(' ').filter(w => w.length > 0);
          if (words.length >= 2) {
            // Try first two letters of first word
            const altPrefix = words[0].slice(0, 2).toUpperCase();
            if (altPrefix !== categoryPrefix && altPrefix.length >= 2) {
              suggestions.push(`${altPrefix}-001`);
            }
          }
        }

        setRefCodeSuggestions(suggestions.slice(0, 3));
      }
    } else {
      setRefCodeSuggestions([]);
    }
  }, [refCode, selectedCategories, allModules, availableCategories]);

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

    // Check for duplicate ref code before submitting
    if (refCodeExists) {
      setError("This reference code already exists. Please choose a different one.");
      return;
    }

    console.log("=== AddModuleTab: Form submitted ===");
    console.log("Form values:", { name, description, version, estimatedDuration, deliveryFormat, tags, requiresFollowUp, reviewPeriod, attachments, selectedTests });

    try {
      const payload = {
        name,
        description,
        ref_code: refCode || null,
        version,
        estimated_duration: estimatedDuration,
        delivery_format: deliveryFormat,
        prerequisites,
        tags: tags.length > 0 ? tags : null,
        requires_follow_up: requiresFollowUp,
        follow_up_period: requiresFollowUp ? reviewPeriod : "0",
        attachments: attachments.length > 0 ? attachments : [],
        categories: selectedCategories.length > 0 ? selectedCategories : [],
      };

      console.log("Payload to insert:", payload);

      const { data, error } = await supabase.from("modules").insert([payload]).select();

      console.log("Supabase response - data:", data, "error:", error);

      if (error) throw error;

      // If tests were selected, attach them to the newly created module
      if (selectedTests.length > 0 && data && data.length > 0) {
        const moduleId = data[0].id;
        console.log("Attaching tests to module:", moduleId, selectedTests);

        const { error: updateError } = await supabase
          .from("question_packs")
          .update({ module_id: moduleId })
          .in("id", selectedTests);

        if (updateError) {
          console.error("❌ Error attaching tests:", updateError);
          throw new Error("Module created but failed to attach tests: " + updateError.message);
        }
        console.log("✅ Tests attached successfully!");
      }

      console.log("✅ Module added successfully!");
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 1200);
      // Reset form fields
      setName("");
      setDescription("");
      setRefCode("");
      setVersion(1);
      setEstimatedDuration(0);
      setDeliveryFormat("");
      setPrerequisites([]);
      setTags([]);
      setTagInput("");
      setRequiresFollowUp(false);
      setReviewPeriod("0");
      setAttachments([]);
      setSelectedCategories([]);
      setSelectedTests([]);

      // Refresh available tests after successful creation
      const { data: testsData } = await supabase
        .from("question_packs")
        .select("id, title, description, pass_mark, time_limit_minutes")
        .is("module_id", null)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("title");

      if (testsData) {
        setAvailableTests(testsData);
      }
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

      <NeonForm onSubmit={handleSubmit} submitLabel="Create Module" submitVariant="save">
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

                // Update ref code when category changes
                if (newCategoryId) {
                  const category = availableCategories.find(c => c.id === newCategoryId);
                  if (category?.prefix) {
                    // If new category has a prefix, update the ref code format
                    const currentSuffix = refCode.includes('-') ? refCode.split('-').pop() || '' : refCode;
                    setRefCode(`${category.prefix}-${currentSuffix}`);
                  }
                }
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
                placeholder="e.g., TM-001"
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
            {refCodeSuggestions.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Suggestions:
                </p>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {refCodeSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRefCode(suggestion)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.background = 'var(--surface-hover)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'var(--surface)';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
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

        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Attach Tests</label>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Select existing tests to attach to this module. Only unassigned tests are shown.
          </p>
          {availableTests.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No available tests found. Tests must be unassigned and active to appear here.
            </p>
          ) : (
            <>
              <select
                className="add-module-tab-input neon-input"
                value=""
                onChange={(e) => {
                  const testId = e.target.value;
                  if (testId && !selectedTests.includes(testId)) {
                    setSelectedTests(prev => [...prev, testId]);
                  }
                }}
              >
                <option value="">Select a test to add...</option>
                {availableTests
                  .filter(test => !selectedTests.includes(test.id))
                  .map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title} (Pass: {test.pass_mark}%{test.time_limit_minutes ? `, ${test.time_limit_minutes} min` : ''})
                    </option>
                  ))}
              </select>

              {selectedTests.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500, marginBottom: '8px' }}>
                    Selected Tests ({selectedTests.length}):
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTests.map((testId) => {
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
                            onClick={() => setSelectedTests(prev => prev.filter(id => id !== testId))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
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
