"use client";

import React, { useState, useEffect } from "react";
import NeonPanel from "@/components/NeonPanel";
import TextIconButton from "@/components/ui/TextIconButtons";
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
        <h2 className="form-title">Health & Safety Policies</h2>
        <p className="loading-text">Loading policies...</p>
      </NeonPanel>
    );
  }

  return (
    <NeonPanel>
      <div className="form-header">
        <h2 className="form-title">Health & Safety Policies</h2>
        {!showForm && (
          <TextIconButton
            variant="add"
            label="Add New Policy"
            onClick={handleAdd}
          />
        )}
      </div>

      {message && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="form-section">
          <h3 className="section-title">
            {editingId ? "Edit Policy" : "New Policy"}
          </h3>

          <div className="form-field">
            <label className="form-label required">
              Policy Title
            </label>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleFormChange}
              className="form-input"
              placeholder="Enter policy title..."
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              className="form-input"
              rows={4}
              placeholder="Additional notes or description for this policy..."
            />
          </div>

          <div className="form-actions">
            <TextIconButton
              variant="save"
              label={saving ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
              title={saving ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
              type="submit"
              disabled={saving}
            />
            <TextIconButton
              variant="cancel"
              label="Cancel"
              onClick={handleCancel}
              disabled={saving}
              type="button"
            />
          </div>
        </form>
      )}

      <div className="policy-list">
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>
              No health & safety policies found. Click "Add New Policy" to create one.
            </p>
          </div>
        ) : (
          <div className="policy-cards-container">
            {documents.map((document) => (
              <div key={document.id} className="policy-card">
                <div className="policy-card-header">
                  <div className="policy-card-content">
                    <Link
                      href={`/health-safety/policies/${document.id}`}
                      className="policy-card-title"
                    >
                      {document.title}
                    </Link>

                    {document.notes && (
                      <p className="policy-card-notes">
                        {document.notes}
                      </p>
                    )}
                  </div>

                  <div className="policy-card-badges">
                    <span className="badge badge-primary">
                      {SAFETY_DOCUMENT_TYPE_NAME}
                    </span>
                    {document.current_version && (
                      <span className="badge badge-success">
                        v{document.current_version}
                      </span>
                    )}
                  </div>
                </div>

                <div className="policy-card-footer">
                  <div className="policy-card-meta">
                    {document.last_reviewed_at && (
                      <span>Last reviewed: {new Date(document.last_reviewed_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="form-actions">
                    <TextIconButton
                      variant="edit"
                      label="Edit Policy"
                      onClick={() => handleEdit(document)}
                    />
                    <TextIconButton
                      variant="archive"
                      label="Archive Policy"
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
