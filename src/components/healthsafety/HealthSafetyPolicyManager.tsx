"use client";

import React, { useState, useEffect } from "react";
import { FiFileText, FiEdit, FiCheck } from "react-icons/fi";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

interface Document {
  id: string;
  title: string;
  section_id?: string | null;
  document_type_id?: string | null;
  document_type_name?: string;
  created_at?: string;
  last_reviewed_at?: string;
  current_version?: number;
  reference_code?: string;
  file_url?: string;
  notes?: string;
  archived?: boolean;
  review_period_months?: number;
}

interface DocumentType {
  id: string;
  name: string;
}

export default function HealthSafetyPolicyManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", notes: "", document_type_id: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      console.log("HealthSafetyPolicyManager: Starting data fetch...");
      
      const SAFETY_DOCUMENT_TYPE_ID = "f829b346-e66a-451d-bdf2-09d561499c87";
      
      try {
        // First, get the safety document type
        const { data: safetyDocType, error: safetyDocTypeError } = await supabase
          .from("document_types")
          .select("id, name")
          .eq("id", SAFETY_DOCUMENT_TYPE_ID)
          .single();
        
        if (safetyDocTypeError) {
          console.error("Error fetching safety document type:", safetyDocTypeError);
          setError("Safety document type not found in database");
          setLoading(false);
          return;
        }
        
        console.log("Safety document type found:", safetyDocType);
        setDocumentTypes([safetyDocType]);
        
        // Fetch documents of the safety type
        const { data: docs, error: docsError } = await supabase
          .from("documents")
          .select("id, title, notes, document_type_id, created_at, current_version, archived, last_reviewed_at")
          .eq("document_type_id", SAFETY_DOCUMENT_TYPE_ID)
          .eq("archived", false)
          .order("created_at", { ascending: false });
        
        if (docsError) {
          console.error("Error fetching safety documents:", docsError);
          setError("Failed to load safety documents");
          setDocuments([]);
        } else {
          console.log("Safety documents found:", docs);
          // Map document type names
          const docsWithTypeNames = (docs || []).map(doc => ({
            ...doc,
            document_type_name: safetyDocType.name
          }));
          setDocuments(docsWithTypeNames);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred while loading data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setForm({ 
      title: document.title, 
      notes: document.notes || "", 
      document_type_id: document.document_type_id || "" 
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }

    if (!form.document_type_id) {
      setError("Document type is required");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        // Update existing document
        const { data, error } = await supabase
          .from("documents")
          .update({
            title: form.title.trim(),
            notes: form.notes || null,
            document_type_id: form.document_type_id,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setDocuments((docs) =>
                  docs.map((doc) => 
                    doc.id === editingId 
                      ? { 
                          ...doc, 
                          title: form.title.trim(),
                          notes: form.notes ? form.notes : undefined,
                          document_type_id: form.document_type_id,
                          document_type_name: documentTypes.find(dt => dt.id === form.document_type_id)?.name || "Unknown"
                        }
                      : doc
                  )
                );
      } else {
        // Create new document
        const { data, error } = await supabase
          .from("documents")
          .insert({
            title: form.title.trim(),
            notes: form.notes || null,
            document_type_id: form.document_type_id,
            archived: false,
            current_version: 1,
            last_reviewed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        const newDoc = {
          ...data,
          notes: data.notes ? data.notes : undefined,
          document_type_name: documentTypes.find(dt => dt.id === form.document_type_id)?.name || "Unknown"
        };
        setDocuments((docs) => [newDoc, ...docs]);
      }

      setEditingId(null);
      setForm({ title: "", notes: "", document_type_id: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="after-hero">
        <div className="global-content">
          <main className="global-content">
            <NeonPanel>
              <h2 className="neon-form-title">
                <FiFileText /> Health & Safety Policies
              </h2>
              <p className="neon-loading">Loading policies...</p>
            </NeonPanel>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="global-content">
          <NeonPanel>
            <h2 className="neon-form-title">
              <FiFileText /> Health & Safety Policies
            </h2>
            {error && (
              <div className="neon-error" style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.375rem" }}>
                <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
              </div>
            )}
            <form
              onSubmit={handleSave}
              className="add-policy-form"
              style={{ marginBottom: "2rem" }}
            >
              <div className="add-policy-field">
                <label className="add-policy-label">Document Type</label>
                <select
                  name="document_type_id"
                  value={form.document_type_id}
                  onChange={handleFormChange}
                  className="add-policy-input"
                  required
                  style={{ marginBottom: "1rem" }}
                >
                  <option value="">— Select Document Type —</option>
                  {documentTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.name}</option>
                  ))}
                </select>
              </div>
              <div className="add-policy-field">
                <label className="add-policy-label">Policy Title</label>
                <input
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFormChange}
                  className="add-policy-input"
                  required
                />
              </div>
              <div className="add-policy-field">
                <label className="add-policy-label">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  className="add-policy-input"
                  rows={3}
                  placeholder="Additional notes or description for this policy..."
                />
              </div>
              <div className="add-policy-actions">
                <NeonIconButton
                  variant="submit"
                  icon={<FiCheck />}
                  title={
                    saving
                      ? "Saving..."
                      : editingId
                        ? "Update Policy"
                        : "Add Policy"
                  }
                  type="submit"
                  disabled={saving}
                />
                {editingId && (
                  <NeonIconButton
                    variant="cancel"
                    title="Cancel"
                    onClick={() => {
                      setEditingId(null);
                      setForm({ title: "", notes: "", document_type_id: "" });
                      setError("");
                    }}
                    disabled={saving}
                  />
                )}
              </div>
              {success && (
                <p className="add-policy-success">
                  <FiCheck /> Policy saved!
                </p>
              )}
            </form>
            <ul className="neon-policy-list">
              {documents.length === 0 ? (
                <li className="neon-muted">No policy documents found.</li>
              ) : (
                documents.map((document) => (
                  <li key={document.id} className="neon-policy-item">
                    <div className="neon-policy-header">
                      <Link
                        href={`/health-safety/policies/${document.id}`}
                        className="neon-policy-link"
                      >
                        <strong>{document.title}</strong>
                      </Link>
                      <div className="neon-policy-meta">
                        <span className="neon-policy-type">{document.document_type_name}</span>
                        {document.current_version && (
                          <span className="neon-policy-version">v{document.current_version}</span>
                        )}
                      </div>
                    </div>
                    {document.notes && (
                      <div className="neon-policy-desc">{document.notes}</div>
                    )}
                    <div className="neon-policy-actions">
                      <NeonIconButton
                        variant="edit"
                        icon={<FiEdit />}
                        title="Edit Policy"
                        onClick={() => handleEdit(document)}
                        className="neon-policy-edit-btn"
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </NeonPanel>
        </main>
      </div>
      <style jsx>{`
        .neon-policy-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        
        .neon-policy-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.875rem;
          opacity: 0.8;
        }
        
        .neon-policy-type {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .neon-policy-version {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .neon-policy-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.5rem;
        }
        
        .add-policy-field {
          margin-bottom: 1rem;
        }
        
        .add-policy-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
