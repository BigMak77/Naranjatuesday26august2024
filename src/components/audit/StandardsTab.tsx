// components/audit/StandardsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from '@/components/ui/OverlayDialog';
import NeonForm from '@/components/NeonForm';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [existingQuestions, setExistingQuestions] = useState<{ id: string; question_text: string }[]>([]);
  const [editingQuestions, setEditingQuestions] = useState<{ id: string; question_text: string }[]>([]);

  // Fetch existing questions when modal opens
  useEffect(() => {
    if (!modalOpen || !selectedHeaderId) {
      setExistingQuestions([]);
      return;
    }
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("audit_questions")
        .select("id, question_text")
        .eq("standard_section_id", selectedHeaderId);
      if (!alive) return;
      setExistingQuestions(error ? [] : (data ?? []));
    })();
    return () => { alive = false; };
  }, [modalOpen, selectedHeaderId]);

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
      .eq("standard_section_id", selectedHeaderId);
    setExistingQuestions(data ?? []);
  };

  // Handler to submit all questions
  const handleAddQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedHeaderId || questions.every(q => !q.trim())) {
      setFormError("At least one question is required.");
      return;
    }
    // Only insert questions that are not empty and not already present
    const existingTexts = existingQuestions.map(q => q.question_text.trim().toLowerCase());
    const toInsert = questions.filter(q => q.trim() && !existingTexts.includes(q.trim().toLowerCase())).map(q => ({
      question_text: q.trim(),
      fail_department_id: null,
      standard_section_id: selectedHeaderId
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
      .eq("standard_section_id", selectedHeaderId);
    setExistingQuestions(data ?? []);
    setModalOpen(false);
    setQuestions([""]);
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
                      onClick={() => setModalOpen(true)}
                    >
                      {header.title}
                    </span>
                    {header.description && <div className="standards-section-header-desc">{header.description}</div>}
                  </div>
                  <NeonTable
                    columns={[
                      { header: "Code", accessor: "code", width: 60, render: (value) => (
                        <span
                          className="neon-link neon-table-code-link"
                          style={{ cursor: "pointer", textAlign: "center", display: "block", margin: "0 auto" }}
                          onClick={() => setModalOpen(true)}
                        >
                          {String(value ?? '')}
                        </span>
                      ) },
                      { header: "Title", accessor: "title", width: 240 },
                      { header: "Description", accessor: "description", width: 320 },
                      { header: "Created", accessor: "created_at", width: 120, render: (value) => <div style={{textAlign: 'center'}}>{value ? new Date(String(value)).toLocaleDateString() : ""}</div> },
                      { header: "Updated", accessor: "updated_at", width: 120, render: (value) => <div style={{textAlign: 'center'}}>{value ? new Date(String(value)).toLocaleDateString() : ""}</div> },
                    ]}
                    data={sortedChildren.map(s => ({ ...s }))}
                    toolbar={null}
                  />
                  {modalOpen && (
                    <OverlayDialog open={modalOpen} onClose={() => setModalOpen(false)}>
                      <div className="standards-modal-wide">
                        {header.description && (
                          <div className="standards-section-header-desc" style={{ marginBottom: '1.5rem' }}>
                            {header.description}
                          </div>
                        )}
                        {editingQuestions.length > 0 && (
                          <div style={{ marginBottom: '2rem' }}>
                            <div className="neon-label" style={{ marginBottom: '0.5rem' }}>Existing Questions:</div>
                            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                              {editingQuestions.map((q, idx) => (
                                <li key={q.id} style={{ marginBottom: '0.5rem', color: '#ccc', listStyle: 'none' }}>
                                  <input
                                    type="text"
                                    className="neon-input"
                                    value={q.question_text}
                                    onChange={e => handleEditExistingQuestion(idx, e.target.value)}
                                    style={{ width: '80%' }}
                                  />
                                </li>
                              ))}
                            </ul>
                            <button type="button" className="neon-btn neon-btn-save" onClick={handleSaveEditedQuestions} style={{ marginTop: '0.5rem' }}>
                              Save Changes
                            </button>
                          </div>
                        )}
                        <NeonForm
                          title={`Add Questions to ${header.title}`}
                          onSubmit={handleAddQuestions}
                          submitLabel="Add Questions"
                        >
                          {questions.map((q, idx) => (
                            <div className="neon-form-group" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <label htmlFor={`new-question-${idx}`} className="neon-form-label">Question {idx + 1}</label>
                              <input
                                id={`new-question-${idx}`}
                                type="text"
                                className="neon-input"
                                value={q}
                                onChange={e => handleQuestionChange(idx, e.target.value)}
                                required={idx === 0}
                              />
                            </div>
                          ))}
                          <div style={{ margin: '1rem 0' }}>
                            <button type="button" className="neon-btn neon-btn-add" onClick={handleAddQuestionInput} title="Add another question">
                              + Add Question
                            </button>
                          </div>
                          {formError && <div className="neon-error">{formError}</div>}
                        </NeonForm>
                      </div>
                    </OverlayDialog>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </NeonPanel>
  );
}
