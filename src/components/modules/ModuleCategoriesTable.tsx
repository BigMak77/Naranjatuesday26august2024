"use client";

import { useEffect, useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import NeonForm from "@/components/NeonForm";
import { supabase } from "@/lib/supabase-client";

interface ModuleCategory {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  prefix?: string;
  created_by: string;
}

export default function ModuleCategoriesTable() {
  const [categories, setCategories] = useState<ModuleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; id: string | null; name: string; description: string; prefix: string }>(
    { open: false, id: null, name: '', description: '', prefix: '' }
  );

  useEffect(() => {
    fetchCategories();
  }, [showDialog]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("module_categories")
      .select("id, created_at, name, description, prefix, created_by")
      .eq("archived", false)
      .order("name", { ascending: true });
    if (!error && data) setCategories(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setError("Could not get current user");
      setSaving(false);
      return;
    }
    const { error: insertErr } = await supabase
      .from("module_categories")
      .insert({ name: newName, description: newDescription, prefix: newPrefix || null, created_by: userData.user.id });
    if (insertErr) setError(insertErr.message);
    else {
      setShowDialog(false);
      setNewName("");
      setNewDescription("");
      setNewPrefix("");
      fetchCategories();
    }
    setSaving(false);
  };

  function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this category?")) return;
    setSaving(true);
    setError(null);
    supabase
      .from("module_categories")
      .update({ archived: true })
      .eq("id", id)
      .then(({ error }) => {
        if (error) setError(error.message);
        setSaving(false);
        setCategories(cats => cats.filter(c => c.id !== id));
      });
  }

  function handleEdit(cat: ModuleCategory) {
    setEditDialog({ open: true, id: cat.id, name: cat.name, description: cat.description || '', prefix: cat.prefix || '' });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (!editDialog.id) return;
    const { error: updateErr } = await supabase
      .from('module_categories')
      .update({ name: editDialog.name, description: editDialog.description, prefix: editDialog.prefix || null })
      .eq('id', editDialog.id);
    if (updateErr) setError(updateErr.message);
    else {
      setEditDialog({ open: false, id: null, name: '', description: '', prefix: '' });
      fetchCategories();
    }
    setSaving(false);
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
          label="Add Category"
          onClick={() => setShowDialog(true)}
        />
      </div>
      <NeonTable
        columns={[
          { header: "Name", accessor: "name", width: 180 },
          { header: "Prefix", accessor: "prefix", width: 80 },
          { header: "Description", accessor: "description", width: 340 },
          { header: "Created At", accessor: "created_at", width: 80 },
          { header: "Actions", accessor: "actions", width: 80 },
        ]}
        data={categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          prefix: cat.prefix || "",
          description: cat.description || "",
          created_at: cat.created_at ? new Date(cat.created_at).toLocaleDateString("en-GB") : "",
          created_by: cat.created_by,
          actions: (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <TextIconButton
                variant="edit"
                label="Edit Category"
                onClick={() => handleEdit(cat)}
              />
              <TextIconButton
                variant="archive"
                label="Archive Category"
                onClick={() => handleArchive(cat.id)}
              />
            </div>
          ),
        }))}
      />
      <OverlayDialog showCloseButton={true} open={showDialog} onClose={() => setShowDialog(false)}>
        <NeonForm
          title="Add Module Category"
          onSubmit={handleAdd}
          submitLabel={saving ? "Saving..." : "Add"}
        >
          <input
            className="neon-input"
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            autoFocus
          />
          <div id="prefix-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Optional: Enter a prefix for module reference codes (format: XX-XX, e.g., "HS-01" or "SF-WP")
          </div>
          <input
            className="neon-input"
            type="text"
            placeholder="__-__"
            aria-describedby="prefix-help"
            value={newPrefix}
            onChange={e => {
              const value = e.target.value.toUpperCase();

              // Remove all non-alphanumeric characters except hyphen
              const cleaned = value.replace(/[^A-Z0-9-]/g, '');

              // Remove any hyphens that aren't in position 2
              let withoutHyphens = cleaned.replace(/-/g, '');

              // Format with hyphen at position 2
              let formatted = '';
              if (withoutHyphens.length <= 2) {
                formatted = withoutHyphens;
              } else if (withoutHyphens.length <= 4) {
                formatted = withoutHyphens.slice(0, 2) + '-' + withoutHyphens.slice(2);
              } else {
                formatted = withoutHyphens.slice(0, 2) + '-' + withoutHyphens.slice(2, 4);
              }

              setNewPrefix(formatted);
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
            maxLength={5}
            style={{ marginTop: 0 }}
          />
          <div id="description-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Please provide a description for this category.
          </div>
          <textarea
            className="neon-input"
            placeholder="Description"
            aria-describedby="description-help"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            rows={3}
            style={{ marginTop: 0 }}
          />
          {error && <div className="neon-error mt-2">{error}</div>}
        </NeonForm>
      </OverlayDialog>
      <OverlayDialog showCloseButton={true} open={editDialog.open} onClose={() => setEditDialog({ open: false, id: null, name: '', description: '', prefix: '' })}>
        <NeonForm
          title="Edit Module Category"
          onSubmit={handleEditSave}
          submitLabel={saving ? "Saving..." : "Save"}
        >
          <input
            className="neon-input"
            type="text"
            placeholder="Category name"
            value={editDialog.name}
            onChange={e => setEditDialog(d => ({ ...d, name: e.target.value }))}
            required
            autoFocus
          />
          <div id="edit-prefix-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Optional: Enter a prefix for module reference codes (format: XX-XX, e.g., "HS-01" or "SF-WP")
          </div>
          <input
            className="neon-input"
            type="text"
            placeholder="__-__"
            aria-describedby="edit-prefix-help"
            value={editDialog.prefix}
            onChange={e => {
              const value = e.target.value.toUpperCase();

              // Remove all non-alphanumeric characters except hyphen
              const cleaned = value.replace(/[^A-Z0-9-]/g, '');

              // Remove any hyphens that aren't in position 2
              let withoutHyphens = cleaned.replace(/-/g, '');

              // Format with hyphen at position 2
              let formatted = '';
              if (withoutHyphens.length <= 2) {
                formatted = withoutHyphens;
              } else if (withoutHyphens.length <= 4) {
                formatted = withoutHyphens.slice(0, 2) + '-' + withoutHyphens.slice(2);
              } else {
                formatted = withoutHyphens.slice(0, 2) + '-' + withoutHyphens.slice(2, 4);
              }

              setEditDialog(d => ({ ...d, prefix: formatted }));
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
            maxLength={5}
            style={{ marginTop: 0 }}
          />
          <div id="edit-description-help" className="neon-label" style={{ marginBottom: 8, fontSize: 13, marginTop: 16 }}>
            Please provide a description for this category.
          </div>
          <textarea
            className="neon-input"
            placeholder="Description"
            aria-describedby="edit-description-help"
            value={editDialog.description}
            onChange={e => setEditDialog(d => ({ ...d, description: e.target.value }))}
            rows={3}
            style={{ marginTop: 0 }}
          />
          {error && <div className="neon-error mt-2">{error}</div>}
        </NeonForm>
      </OverlayDialog>
    </NeonPanel>
  );
}
