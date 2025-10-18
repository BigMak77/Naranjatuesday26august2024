"use client";

import React, { useState, useEffect } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

interface Document {
  id: string;
  title: string;
  document_type_id: string;
  notes: string | null;
  created_at: string;
  last_reviewed_at: string | null;
  current_version: number;
  archived: boolean;
}

const SAFETY_DOCUMENT_TYPE_ID = "f829b346-e66a-451d-bdf2-09d561499c87";
const SAFETY_DOCUMENT_TYPE_NAME = "Health & Safety";

export default function HealthSafetyPolicyManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, notes, document_type_id, created_at, current_version, archived, last_reviewed_at")
        .eq("document_type_id", SAFETY_DOCUMENT_TYPE_ID)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      showMessage('error', err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({ title: "", notes: "" });
    setShowForm(true);
  };

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setForm({ 
      title: document.title, 
      notes: document.notes || "" 
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", notes: "" });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      showMessage('error', "Title is required");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        // Update existing document
        const { error } = await supabase
          .from("documents")
          .update({
            title: form.title.trim(),
            notes: form.notes.trim() || null,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;

        // Update local state
        setDocuments(docs =>
          docs.map(doc => 
            doc.id === editingId 
              ? { ...doc, title: form.title.trim(), notes: form.notes.trim() || null, last_reviewed_at: new Date().toISOString() }
              : doc
          )
        );
        showMessage('success', "Policy updated successfully");
      } else {
        // Create new document
        const { data, error } = await supabase
          .from("documents")
          .insert({
            title: form.title.trim(),
            notes: form.notes.trim() || null,
            document_type_id: SAFETY_DOCUMENT_TYPE_ID,
            archived: false,
            current_version: 1,
            last_reviewed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        setDocuments(docs => [data, ...docs]);
        showMessage('success', "Policy created successfully");
      }

      handleCancel();
    } catch (err: any) {
      showMessage('error', err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this policy?")) return;

    try {
      const { error } = await supabase
        .from("documents")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;

      setDocuments(docs => docs.filter(doc => doc.id !== id));
      showMessage('success', "Policy archived successfully");
    } catch (err: any) {
      showMessage('error', err.message || "Failed to archive policy");
    }
  };

  if (loading) {
    return (
      <NeonPanel>
        <h2 className="neon-heading">Health & Safety Policies</h2>
        <p style={{ color: "var(--text)", opacity: 0.7 }}>Loading policies...</p>
      </NeonPanel>
    );
  }

  return (
    <NeonPanel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="neon-heading" style={{ margin: 0 }}>Health & Safety Policies</h2>
        {!showForm && (
          <NeonIconButton
            variant="add"
            title="Add New Policy"
            onClick={handleAdd}
          />
        )}
      </div>

      {message && (
        <div style={{ 
          marginBottom: "1rem", 
          padding: "0.75rem", 
          backgroundColor: message.type === 'error' ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", 
          border: `1px solid ${message.type === 'error' ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`, 
          borderRadius: "8px",
          color: message.type === 'error' ? "#ef4444" : "#22c55e"
        }}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} style={{ 
          marginBottom: "2rem", 
          padding: "1.5rem", 
          background: "var(--field)", 
          border: "1px solid var(--border)", 
          borderRadius: "8px" 
        }}>
          <h3 style={{ color: "var(--neon)", marginTop: 0, marginBottom: "1rem" }}>
            {editingId ? "Edit Policy" : "New Policy"}
          </h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Policy Title *
            </label>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleFormChange}
              className="neon-input"
              placeholder="Enter policy title..."
              required
              autoFocus
            />
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "var(--neon)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              className="neon-input"
              rows={4}
              placeholder="Additional notes or description for this policy..."
            />
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <NeonIconButton
              variant="save"
              title={saving ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
              type="submit"
              disabled={saving}
            />
            <NeonIconButton
              variant="cancel"
              title="Cancel"
              onClick={handleCancel}
              disabled={saving}
              type="button"
            />
          </div>
        </form>
      )}

      <div style={{ marginTop: "2rem" }}>
        {documents.length === 0 ? (
          <div style={{ 
            padding: "3rem", 
            textAlign: "center", 
            background: "var(--field)", 
            border: "1px dashed var(--border)", 
            borderRadius: "8px" 
          }}>
            <p className="neon-muted" style={{ margin: 0 }}>
              No health & safety policies found. Click "Add New Policy" to create one.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {documents.map((document) => (
              <div 
                key={document.id} 
                style={{ 
                  padding: "1.5rem", 
                  background: "var(--field)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  transition: "border-color 0.2s"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start", 
                  marginBottom: "0.75rem" 
                }}>
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/health-safety/policies/${document.id}`}
                      style={{ 
                        color: "var(--neon)", 
                        textDecoration: "none", 
                        fontWeight: "600",
                        fontSize: "1.1rem",
                        display: "block",
                        marginBottom: "0.5rem"
                      }}
                    >
                      {document.title}
                    </Link>
                    
                    {document.notes && (
                      <p style={{ 
                        color: "var(--text)", 
                        opacity: 0.8, 
                        margin: "0.5rem 0 0 0",
                        fontSize: "0.95rem" 
                      }}>
                        {document.notes}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", marginLeft: "1rem" }}>
                    <span style={{ 
                      background: "rgba(59, 130, 246, 0.1)", 
                      color: "#3b82f6", 
                      padding: "0.25rem 0.75rem", 
                      borderRadius: "4px", 
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      {SAFETY_DOCUMENT_TYPE_NAME}
                    </span>
                    {document.current_version && (
                      <span style={{ 
                        background: "rgba(34, 197, 94, 0.1)", 
                        color: "#22c55e", 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "4px", 
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        whiteSpace: "nowrap"
                      }}>
                        v{document.current_version}
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border)"
                }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text)", opacity: 0.6 }}>
                    {document.last_reviewed_at && (
                      <span>Last reviewed: {new Date(document.last_reviewed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <NeonIconButton
                      variant="edit"
                      title="Edit Policy"
                      onClick={() => handleEdit(document)}
                    />
                    <NeonIconButton
                      variant="archive"
                      title="Archive Policy"
                      onClick={() => handleArchive(document.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </NeonPanel>
  );
}
