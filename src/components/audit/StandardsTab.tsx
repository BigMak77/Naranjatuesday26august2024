// components/audit/StandardsTab.tsx
// Custom tooltips added to all buttons
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from '@/components/ui/OverlayDialog';
import NeonForm from '@/components/NeonForm';
import TextIconButton from '@/components/ui/TextIconButtons';
import { CustomTooltip } from "@/components/ui/CustomTooltip";

// Type for standard_sections row
interface StandardSection {
  id: string;
  standard_id: string;
  code: string;
  title: string;
  description?: string | null;
  parent_section_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function StandardsTab() {
  const [sections, setSections] = useState<StandardSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("standard_sections")
        .select("id, standard_id, code, title, description, parent_section_id, created_at, updated_at")
        .order("title", { ascending: true });
      if (!alive) return;
      if (error) {
        setErr(error.message);
        setSections([]);
      } else {
        setSections(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Split into headers and children
  const headers = sections.filter(s => !s.parent_section_id);
  const children = sections.filter(s => s.parent_section_id);

  // Group children by parent_section_id
  const grouped: Record<string, StandardSection[]> = {};
  children.forEach(child => {
    if (!grouped[child.parent_section_id!]) grouped[child.parent_section_id!] = [];
    grouped[child.parent_section_id!].push(child);
  });

  // State for selected section
  const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);
  // Modal state
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [existingQuestions, setExistingQuestions] = useState<{ id: string; question_text: string }[]>([]);
  const [editingQuestions, setEditingQuestions] = useState<{ id: string; question_text: string }[]>([]);

  // Add state for description editing
  const [descEditSection, setDescEditSection] = useState<StandardSection | null>(null);
  const [descEditValue, setDescEditValue] = useState("");
  const [descEditSaving, setDescEditSaving] = useState(false);
  const [descEditError, setDescEditError] = useState<string | null>(null);

  // Fetch existing questions when modal opens
  useEffect(() => {
    if (!modalOpen) {
      setExistingQuestions([]);
      return;
    }
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("audit_questions")
        .select("id, question_text")
        .eq("standard_section_id", modalOpen); // Use modalOpen as section id
      if (!alive) return;
      setExistingQuestions(error ? [] : (data ?? []));
    })();
    return () => { alive = false; };
  }, [modalOpen]);

  // When existingQuestions change, sync editingQuestions
  useEffect(() => {
    setEditingQuestions(existingQuestions.map(q => ({ ...q })));
  }, [existingQuestions]);

  // Handler to add a new question input
  const handleAddQuestionInput = () => {
    setQuestions(prev => [...prev, ""]);
  };

  // Handler to change a question input
  const handleQuestionChange = (idx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? value : q));
  };

  // Handler to change an existing question
  const handleEditExistingQuestion = (idx: number, value: string) => {
    setEditingQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: value } : q));
  };

  // Handler to save edits to existing questions
  const handleSaveEditedQuestions = async () => {
    setFormError(null);
    const updates = editingQuestions.filter(q => q.question_text.trim());
    if (updates.length === 0) return;
    // Only update if the question text is different from the original
    const changed = updates.filter((q, i) => q.question_text.trim() !== (existingQuestions[i]?.question_text ?? ""));
    if (changed.length === 0) return;
    const { error } = await supabase
      .from("audit_questions")
      .upsert(changed.map(q => ({ id: q.id, question_text: q.question_text.trim() })), { onConflict: 'id' });
    if (error) {
      setFormError(error.message);
      return;
    }
    // Refresh existing questions
    const { data } = await supabase
      .from("audit_questions")
      .select("id, question_text")
      .eq("standard_section_id", modalOpen); // Use modalOpen for consistency
    setExistingQuestions(data ?? []);
  };

  // Handler to submit all questions
  const handleAddQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!modalOpen || questions.every(q => !q.trim())) {
      setFormError("At least one question is required.");
      return;
    }
    // Only insert questions that are not empty and not already present
    const existingTexts = existingQuestions.map(q => q.question_text.trim().toLowerCase());
    const toInsert = questions.filter(q => q.trim() && !existingTexts.includes(q.trim().toLowerCase())).map(q => ({
      question_text: q.trim(),
      fail_department_id: null,
      standard_section_id: modalOpen // Use modalOpen as section id
    }));
    if (toInsert.length === 0) {
      setFormError("No new questions to add.");
      return;
    }
    const { error } = await supabase
      .from("audit_questions")
      .insert(toInsert)
      .select();
    if (error) {
      setFormError(error.message);
      return;
    }
    // Refresh existing questions
    const { data } = await supabase
      .from("audit_questions")
      .select("id, question_text")
      .eq("standard_section_id", modalOpen); // Use modalOpen as section id
    setExistingQuestions(data ?? []);
    setEditingQuestions((data ?? []).map(q => ({ ...q })));
    setQuestions([""]); // Optionally reset input
  };

  return (
    <NeonPanel className="standards-tab-panel">
      <h3 className="standards-tab-title">Standards Sections</h3>
      {err && <div className="standards-tab-error">{err}</div>}
      {loading ? (
        <div className="standards-tab-loading">Loading…</div>
      ) : sections.length === 0 ? (
        <div className="standards-tab-empty">No standards found.</div>
      ) : (
        <div className="standards-table-wrapper">
          <div className="standards-section-select">
            <label htmlFor="section-select" className="standards-section-select-label">Select Section:</label>
            <select
              id="section-select"
              className="neon-input"
              value={selectedHeaderId ?? ''}
              onChange={e => setSelectedHeaderId(e.target.value || null)}
            >
              <option value="">-- Choose a section --</option>
              {headers.map(header => (
                <option key={header.id} value={header.id}>
                  {header.title}
                </option>
              ))}
            </select>
          </div>
          {selectedHeaderId && (
            (() => {
              const header = headers.find(h => h.id === selectedHeaderId);
              if (!header) return null;
              // Sort children by code (numerical order)
              const sortedChildren = (grouped[header.id] || []).slice().sort((a, b) => {
                const aCode = Number(a.code);
                const bCode = Number(b.code);
                if (isNaN(aCode) || isNaN(bCode)) {
                  return String(a.code).localeCompare(String(b.code));
                }
                return aCode - bCode;
              });
              return (
                <div className="standards-section-group">
                  <div className="standards-section-header">
                    <span
                      className="standards-section-header-title neon-link"
                      style={{ cursor: "pointer", fontWeight: "bold", fontSize: "1.2rem" }}
                      onClick={() => setModalOpen(header.id)}
                    >
                      {header.title}
                    </span>
                    {header.description && <div className="standards-section-header-desc">{header.description}</div>}
                  </div>
                  <NeonTable
                    columns={[
                      { header: "Code", accessor: "code", width: 60, render: (value, row) => (
                        <span
                          className="neon-link neon-table-code-link"
                          style={{ cursor: "pointer", textAlign: "center", display: "block", margin: "0 auto" }}
                          onClick={() => {
                            const section = row as unknown as StandardSection;
                            setModalOpen(section.id);
                          }}
                        >
                          {String(value ?? '')}
                        </span>
                      ) },
                      { header: "Title", accessor: "title", width: 240 },
                      { header: "Description", accessor: "description", width: 320 },
                      { header: "Created", accessor: "created_at", width: 120, render: (value) => <div style={{textAlign: 'center'}}>{value ? new Date(String(value)).toLocaleDateString() : ""}</div> },
                      { header: "Updated", accessor: "updated_at", width: 120, render: (value) => <div style={{textAlign: 'center'}}>{value ? new Date(String(value)).toLocaleDateString() : ""}</div> },
                      {
                        header: "Edit",
                        accessor: "edit",
                        width: 60,
                        render: (_, row) => {
                          const section = row as unknown as StandardSection;
                          return (
                            <CustomTooltip text="Edit this section's description">
                              <TextIconButton
                                variant="edit"
                                label="Edit section description"
                                onClick={() => {
                                  setDescEditSection(section);
                                  setDescEditValue(section.description ?? "");
                                  setDescEditError(null);
                                }}
                              />
                            </CustomTooltip>
                          );
                        },
                      },
                      {
                        header: "Manage Questions",
                        accessor: "manageQuestions",
                        width: 60,
                        render: (_, row) => {
                          const section = row as unknown as StandardSection;
                          return (
                            <CustomTooltip text="Manage audit questions for this section">
                              <TextIconButton
                                variant="view"
                                label="Manage questions for this section"
                                onClick={() => {
                                  setSelectedHeaderId(section.id);
                                  setModalOpen(section.id);
                                }}
                              />
                            </CustomTooltip>
                          );
                        },
                      },
                    ]}
                    data={sortedChildren.map(s => ({ ...s }))}
                    toolbar={null}
                  />
                </div>
              );
            })()
          )}
        </div>
      )}
      {/* Description Edit Overlay */}
      {descEditSection && (
        <OverlayDialog showCloseButton={true} open={!!descEditSection} onClose={() => setDescEditSection(null)}>
          <div className="standards-modal-wide">
            <h3>Edit Section Description</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setDescEditSaving(true);
                setDescEditError(null);
                const { error: updateError } = await supabase
                  .from("standard_sections")
                  .update({ description: descEditValue })
                  .eq("id", descEditSection.id);
                if (updateError) {
                  setDescEditError(updateError.message);
                  setDescEditSaving(false);
                  return;
                }
                setDescEditSaving(false);
                // Refresh sections
                const { data } = await supabase
                  .from("standard_sections")
                  .select("id, standard_id, code, title, description, parent_section_id, created_at, updated_at")
                  .order("title", { ascending: true });
                setSections(data ?? []);
                // Only close modal if user wants to (e.g. after save, keep modal open for further edits)
                setDescEditSection(null);
              }}
            >
              <label className="neon-label" htmlFor="edit-desc">Description</label>
              <textarea
                id="edit-desc"
                className="neon-input"
                value={descEditValue}
                onChange={e => setDescEditValue(e.target.value)}
                rows={4}
                style={{ width: "100%" }}
                disabled={descEditSaving}
              />
              {descEditError && <div className="neon-error">{descEditError}</div>}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <CustomTooltip text={descEditSaving ? "Saving description..." : "Save the section description"}>
                  <TextIconButton
                    variant="save"
                    label={descEditSaving ? "Saving…" : "Save"}
                    type="submit"
                    disabled={descEditSaving}
                  />
                </CustomTooltip>
                <CustomTooltip text="Cancel editing and close dialog">
                  <TextIconButton
                    variant="secondary"
                    label="Cancel"
                    onClick={() => setDescEditSection(null)}
                    disabled={descEditSaving}
                  />
                </CustomTooltip>
              </div>
            </form>
          </div>
        </OverlayDialog>
      )}
      {/* Questions Management Overlay */}
      {modalOpen && (
        <OverlayDialog showCloseButton={true} open={!!modalOpen} onClose={() => setModalOpen(null)}>
          <div className="standards-modal-wide">
            <h3>Manage Questions</h3>
            <form onSubmit={handleAddQuestions}>
              <label className="neon-label">Add New Questions</label>
              {questions.map((q, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                  <input
                    className="neon-input"
                    type="text"
                    value={q}
                    onChange={e => handleQuestionChange(idx, e.target.value)}
                    placeholder={`Question ${idx + 1}`}
                    style={{ flex: 1 }}
                  />
                  {idx === questions.length - 1 && (
                    <CustomTooltip text="Add another question input field">
                      <TextIconButton
                        variant="add"
                        label="Add another question"
                        onClick={handleAddQuestionInput}
                        style={{ marginLeft: 8 }}
                      />
                    </CustomTooltip>
                  )}
                </div>
              ))}
              <CustomTooltip text="Add all questions to this section">
                <TextIconButton
                  variant="save"
                  label="Add Questions"
                  type="submit"
                  style={{ marginTop: 8 }}
                />
              </CustomTooltip>
            </form>
            <hr style={{ margin: "1rem 0" }} />
            <label className="neon-label">Existing Questions</label>
            {existingQuestions.length === 0 ? (
              <div style={{ color: "#888", marginBottom: 8 }}>No questions yet.</div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSaveEditedQuestions(); }}>
                {editingQuestions.map((q, idx) => (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                    <input
                      className="neon-input"
                      type="text"
                      value={q.question_text}
                      onChange={e => handleEditExistingQuestion(idx, e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
                <CustomTooltip text="Save changes to existing questions">
                  <TextIconButton
                    variant="save"
                    label="Save Changes"
                    type="submit"
                    style={{ marginTop: 8 }}
                  />
                </CustomTooltip>
              </form>
            )}
            {formError && <div className="neon-error" style={{ marginTop: 8 }}>{formError}</div>}
            <div style={{ marginTop: "1rem" }}>
              <CustomTooltip text="Close questions management dialog">
                <TextIconButton
                  variant="secondary"
                  label="Close"
                  onClick={() => setModalOpen(null)}
                />
              </CustomTooltip>
            </div>
          </div>
        </OverlayDialog>
      )}
    </NeonPanel>
  );
}
