// components/compliance/DocumentTypeTable.tsx
"use client";

import { useEffect, useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import NeonForm from "@/components/NeonForm";
import { supabase } from "@/lib/supabase-client";

interface DocumentType {
  id: string;
  created_at: string;
  name: string;
  summary?: string;
  ref_code?: string;
  created_by: string;
}

export default function DocumentTypeTable() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newRefCode, setNewRefCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; id: string | null; name: string; summary: string; ref_code: string }>(
    { open: false, id: null, name: '', summary: '', ref_code: '' }
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("document_types")
        .select("id, created_at, name, summary, ref_code, created_by")
        .order("created_at", { ascending: false });
      if (!error && data) setDocumentTypes(data);
      setLoading(false);
    })();
  }, [showDialog]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Get current user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setError("Could not get current user");
      setSaving(false);
      return;
    }
    const { error: insertErr } = await supabase
      .from("document_types")
      .insert({ name: newName, summary: newSummary, ref_code: newRefCode || null, created_by: userData.user.id });
    if (insertErr) setError(insertErr.message);
    else setShowDialog(false);
    setSaving(false);
    setNewName("");
    setNewSummary("");
    setNewRefCode("");
  };

  function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this document type?")) return;
    setSaving(true);
    setError(null);
    supabase
      .from("document_types")
      .update({ archived: true })
      .eq("id", id)
      .then(({ error }) => {
        if (error) setError(error.message);
        setShowDialog(false);
        setSaving(false);
        // Optionally, refresh the list
        setDocumentTypes(types => types.filter(dt => dt.id !== id));
      });
  }

  function handleEdit(dt: DocumentType) {
    setEditDialog({ open: true, id: dt.id, name: dt.name, summary: dt.summary || '', ref_code: dt.ref_code || '' });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (!editDialog.id) return;
    const { error: updateErr } = await supabase
      .from('document_types')
      .update({ name: editDialog.name, summary: editDialog.summary, ref_code: editDialog.ref_code || null })
      .eq('id', editDialog.id);
    if (updateErr) setError(updateErr.message);
    else setEditDialog({ open: false, id: null, name: '', summary: '', ref_code: '' });
    setSaving(false);
    // Refresh list
    const { data, error } = await supabase
      .from('document_types')
      .select('id, created_at, name, summary, ref_code, created_by')
      .order('created_at', { ascending: false });
    if (!error && data) setDocumentTypes(data);
  }

  return (
    <NeonPanel>
      <div style={{ height: 24 }} />
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        marginBottom: '1rem' 
      }}>
        <TextIconButton
          variant="add"
          label="Add Document Type"
          onClick={() => setShowDialog(true)}
        />
      </div>
      <NeonTable
        columns={[
          { header: "Name", accessor: "name", width: 200 },
          { header: "Ref Code", accessor: "ref_code", width: 80 },
          { header: "Summary", accessor: "summary", width: 380 },
          { header: "Created At", accessor: "created_at", width: 100 },
          { header: "Actions", accessor: "actions", width: 80 },
        ]}
        data={documentTypes.map(dt => ({
          id: dt.id,
          name: dt.name,
          ref_code: dt.ref_code || "—",
          summary: dt.summary || "", // fallback if summary is missing
          created_at: dt.created_at ? new Date(dt.created_at).toLocaleDateString("en-GB") : "",
          created_by: dt.created_by,
          actions: (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <TextIconButton
                variant="edit"
                label="Edit Document Type"
                onClick={() => handleEdit(dt)}
              />
              <TextIconButton
                variant="archive"
                label="Archive Document Type"
                onClick={() => handleArchive(dt.id)}
              />
            </div>
          ),
        }))}
      />
      <OverlayDialog showCloseButton={true} open={showDialog} onClose={() => setShowDialog(false)}>
        <NeonForm
          title="Add Document Type"
          onSubmit={handleAdd}
          submitLabel={saving ? "Saving..." : "Add"}
        >
          <input
            className="neon-input"
            type="text"
            placeholder="Document type name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            autoFocus
          />
          <div id="ref-code-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Optional: Enter a 2-character reference code (e.g., "PO" for Policy, "PR" for Procedure)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="neon-input"
              type="text"
              placeholder="XX"
              aria-describedby="ref-code-help"
              value={newRefCode}
              onChange={e => {
                const value = e.target.value.toUpperCase();
                // Only allow alphanumeric characters, max 2
                const cleaned = value.replace(/[^A-Z0-9]/g, '').slice(0, 2);
                setNewRefCode(cleaned);
              }}
              onKeyDown={e => {
                // Allow navigation keys
                if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  return;
                }
                // Only allow alphanumeric characters
                if (!/^[a-zA-Z0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              maxLength={2}
              style={{ marginTop: 0, flex: 1 }}
            />
            {newRefCode && (
              <TextIconButton
                variant="delete"
                label="Clear ref code"
                onClick={() => setNewRefCode('')}
              />
            )}
          </div>
          <div id="summary-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Please provide a summary or purpose of this type of document.
          </div>
          <textarea
            className="neon-input"
            placeholder="Summary or purpose"
            aria-describedby="summary-help"
            value={newSummary}
            onChange={e => setNewSummary(e.target.value)}
            required
            rows={3}
            style={{ marginTop: 0 }}
          />
          {error && <div className="neon-error mt-2">{error}</div>}
        </NeonForm>
      </OverlayDialog>
      <OverlayDialog showCloseButton={true} open={editDialog.open} onClose={() => setEditDialog({ open: false, id: null, name: '', summary: '', ref_code: '' })}>
        <NeonForm
          title="Edit Document Type"
          onSubmit={handleEditSave}
          submitLabel={saving ? "Saving..." : "Save"}
        >
          <input
            className="neon-input"
            type="text"
            placeholder="Document type name"
            value={editDialog.name}
            onChange={e => setEditDialog(d => ({ ...d, name: e.target.value }))}
            required
            autoFocus
          />
          <div id="edit-ref-code-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Optional: Enter a 2-character reference code (e.g., "PO" for Policy, "PR" for Procedure)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="neon-input"
              type="text"
              placeholder="XX"
              aria-describedby="edit-ref-code-help"
              value={editDialog.ref_code}
              onChange={e => {
                const value = e.target.value.toUpperCase();
                // Only allow alphanumeric characters, max 2
                const cleaned = value.replace(/[^A-Z0-9]/g, '').slice(0, 2);
                setEditDialog(d => ({ ...d, ref_code: cleaned }));
              }}
              onKeyDown={e => {
                // Allow navigation keys
                if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  return;
                }
                // Only allow alphanumeric characters
                if (!/^[a-zA-Z0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              maxLength={2}
              style={{ marginTop: 0, flex: 1 }}
            />
            {editDialog.ref_code && (
              <TextIconButton
                variant="delete"
                label="Clear ref code"
                onClick={() => setEditDialog(d => ({ ...d, ref_code: '' }))}
              />
            )}
          </div>
          <div id="edit-summary-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Please provide a summary or purpose of this type of document.
          </div>
          <textarea
            className="neon-input"
            placeholder="Summary or purpose"
            aria-describedby="edit-summary-help"
            value={editDialog.summary}
            onChange={e => setEditDialog(d => ({ ...d, summary: e.target.value }))}
            required
            rows={3}
            style={{ marginTop: 0 }}
          />
          {error && <div className="neon-error mt-2">{error}</div>}
        </NeonForm>
      </OverlayDialog>
    </NeonPanel>
  );
}
