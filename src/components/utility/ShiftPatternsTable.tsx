// components/utility/ShiftPatternsTable.tsx
"use client";

import { useEffect, useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import NeonForm from "@/components/NeonForm";
import { supabase } from "@/lib/supabase-client";

interface ShiftPattern {
  id: string;
  name: string;
  start: string; // time without time zone
  end_time: string; // time without time zone
  created_at: string;
}

export default function ShiftPatternsTable() {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<ShiftPattern | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shift_patterns")
        .select("id, name, start, end_time, created_at")
        .order("name", { ascending: true }); // sort alphabetically by name
      if (!error && data) setPatterns(data);
      setLoading(false);
    })();
  }, [showDialog]);

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
      .from("shift_patterns")
      .insert({ name: newName, start: newStart, end_time: newEnd, created_by: userData.user.id });
    if (insertErr) setError(insertErr.message);
    else setShowDialog(false);
    setSaving(false);
    setNewName("");
    setNewStart("");
    setNewEnd("");
  };

  const openEditDialog = (pattern: ShiftPattern) => {
    setEditDialog(pattern);
    setEditName(pattern.name);
    setEditStart(pattern.start);
    setEditEnd(pattern.end_time);
    setError(null);
  };

  const handleEdit = (pattern: ShiftPattern) => {
    openEditDialog(pattern);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog) return;
    setSaving(true);
    setError(null);
    const { error: updateErr } = await supabase
      .from("shift_patterns")
      .update({ name: editName, start: editStart, end_time: editEnd })
      .eq("id", editDialog.id);
    if (updateErr) setError(updateErr.message);
    else setEditDialog(null);
    setSaving(false);
    setEditName("");
    setEditStart("");
    setEditEnd("");
    // Refresh patterns
    setLoading(true);
    const { data, error } = await supabase
      .from("shift_patterns")
      .select("id, name, start, end_time, created_at")
      .order("name", { ascending: true });
    if (!error && data) setPatterns(data);
    setLoading(false);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this shift pattern?")) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("shift_patterns")
      .update({ archived: true })
      .eq("id", id);
    if (error) setError(error.message);
    setSaving(false);
    setPatterns((prev: ShiftPattern[]) => prev.filter((p: ShiftPattern) => p.id !== id));
  };

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
          label="Add Shift Pattern"
          onClick={() => setShowDialog(true)}
        />
      </div>
      <NeonTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Start", accessor: "start" },
          { header: "End Time", accessor: "end_time" },
          { header: "Created At", accessor: "created_at" },
          { header: "Actions", accessor: "actions", width: 120 },
        ]}
        data={patterns.map((p) => ({
          ...p,
          created_at: p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB") : "",
          start: p.start ? p.start.slice(0,5) : "",
          end_time: p.end_time ? p.end_time.slice(0,5) : "",
          actions: (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <TextIconButton
                variant="edit"
                label="Edit Shift Pattern"
                onClick={() => handleEdit(p)}
              />
              <TextIconButton
                variant="archive"
                label="Archive Shift Pattern"
                onClick={() => handleArchive(p.id)}
              />
            </div>
          ),
        }))}
      />
      <OverlayDialog showCloseButton={true} open={showDialog} onClose={() => setShowDialog(false)}>
        <NeonForm
          title="Add Shift Pattern"
          onSubmit={handleAdd}
          submitLabel={saving ? "Saving..." : "Add"}
        >
          <input
            className="neon-input"
            type="text"
            placeholder="Shift pattern name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            autoFocus
          />
          <input
            className="neon-input"
            type="time"
            placeholder="Start time"
            value={newStart}
            onChange={e => setNewStart(e.target.value)}
            required
          />
          <input
            className="neon-input"
            type="time"
            placeholder="End time"
            value={newEnd}
            onChange={e => setNewEnd(e.target.value)}
            required
          />
          {error && <div className="neon-error" style={{ marginTop: '0.5rem' }}>{error}</div>}
        </NeonForm>
      </OverlayDialog>
      <OverlayDialog showCloseButton={true} open={!!editDialog} onClose={() => setEditDialog(null)}>
        <NeonForm
          title="Edit Shift Pattern"
          onSubmit={handleEditSave}
          submitLabel={saving ? "Saving..." : "Save"}
        >
          <input
            className="neon-input"
            type="text"
            placeholder="Shift pattern name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            required
            autoFocus
          />
          <input
            className="neon-input"
            type="time"
            placeholder="Start time"
            value={editStart}
            onChange={e => setEditStart(e.target.value)}
            required
          />
          <input
            className="neon-input"
            type="time"
            placeholder="End time"
            value={editEnd}
            onChange={e => setEditEnd(e.target.value)}
            required
          />
          {error && <div className="neon-error" style={{ marginTop: '0.5rem' }}>{error}</div>}
        </NeonForm>
      </OverlayDialog>
    </NeonPanel>
  );
}
