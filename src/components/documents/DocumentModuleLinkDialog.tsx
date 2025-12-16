"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiBookOpen, FiX } from "react-icons/fi";

interface DocumentModuleLinkDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

interface Module {
  id: string;
  name: string;
  ref_code?: string;
  description?: string;
}

interface LinkedModule extends Module {
  linked_at: string;
  linked_by?: string;
}

export default function DocumentModuleLinkDialog({
  open,
  onClose,
  documentId,
  documentTitle,
}: DocumentModuleLinkDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [linkedModules, setLinkedModules] = useState<LinkedModule[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, documentId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all available modules (non-archived)
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("id, name, ref_code, description")
        .eq("is_archived", false)
        .order("name");

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Fetch currently linked modules for this document
      const { data: linksData, error: linksError } = await supabase
        .from("document_modules")
        .select(`
          created_at,
          created_by,
          modules!inner (
            id,
            name,
            ref_code,
            description
          )
        `)
        .eq("document_id", documentId);

      if (linksError) throw linksError;

      // Transform the data
      const linked = (linksData || []).map((link: any) => ({
        id: link.modules.id,
        name: link.modules.name,
        ref_code: link.modules.ref_code,
        description: link.modules.description,
        linked_at: link.created_at,
        linked_by: link.created_by,
      }));

      setLinkedModules(linked);
      setSelectedModuleIds(linked.map((m) => m.id));
    } catch (err: any) {
      console.error("Error fetching module link data:", err);
      setError(err.message || "Failed to load module links");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get currently linked module IDs
      const { data: currentLinks, error: currentError } = await supabase
        .from("document_modules")
        .select("id, module_id")
        .eq("document_id", documentId);

      if (currentError) throw currentError;

      const currentModuleIds = new Set(
        (currentLinks || []).map((link) => link.module_id)
      );
      const selectedSet = new Set(selectedModuleIds);

      // Modules to add (in selected but not in current)
      const modulesToAdd = selectedModuleIds.filter(
        (id) => !currentModuleIds.has(id)
      );

      // Links to remove (in current but not in selected)
      const linksToRemove = (currentLinks || []).filter(
        (link) => !selectedSet.has(link.module_id)
      );

      // Add new links
      if (modulesToAdd.length > 0) {
        const newLinks = modulesToAdd.map((moduleId) => ({
          document_id: documentId,
          module_id: moduleId,
          created_by: userData.user?.id,
        }));

        const { error: insertError } = await supabase
          .from("document_modules")
          .insert(newLinks);

        if (insertError) throw insertError;
      }

      // Remove old links
      if (linksToRemove.length > 0) {
        const idsToRemove = linksToRemove.map((link) => link.id);
        const { error: deleteError } = await supabase
          .from("document_modules")
          .delete()
          .in("id", idsToRemove);

        if (deleteError) throw deleteError;
      }

      setSuccessMessage(
        `Updated module links: ${modulesToAdd.length} added, ${linksToRemove.length} removed`
      );

      // Refresh the data to show updated links
      await fetchData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error saving module links:", err);
      setError(err.message || "Failed to save module links");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OverlayDialog
      open={open}
      onClose={onClose}
      width={900}
      showCloseButton={true}
      ariaLabelledby="document-module-link-dialog-title"
    >
      <div className="ui-dialog-container">
        <div className="ui-dialog-scrollable">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <FiBookOpen size={24} style={{ color: "var(--neon)" }} />
            <h2
              id="document-module-link-dialog-title"
              className="neon-label"
              style={{ fontSize: "1.5rem", margin: 0 }}
            >
              Link Training Modules
            </h2>
          </div>

          <p className="neon-text" style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
            Document: <strong>{documentTitle}</strong>
          </p>

        {error && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              color: "#22c55e",
            }}
          >
            {successMessage}
          </div>
        )}

        {loading ? (
          <p className="neon-text" style={{ textAlign: "center", padding: "2rem" }}>
            Loading modules...
          </p>
        ) : (
          <>
            {/* Current linked modules table */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 className="neon-label" style={{ marginBottom: "1rem" }}>
                Currently Linked Modules ({linkedModules.length})
              </h3>
              {linkedModules.length === 0 ? (
                <p className="neon-text" style={{ opacity: 0.6, fontStyle: "italic" }}>
                  No training modules currently linked to this document
                </p>
              ) : (
                <NeonTable
                  columns={[
                    { header: "Ref Code", accessor: "ref_code", width: 120 },
                    { header: "Module Name", accessor: "name", width: 450 },
                    { header: "Linked Date", accessor: "linked_date", width: 120 },
                  ]}
                  data={linkedModules.map((module) => ({
                    ref_code: module.ref_code || "—",
                    name: module.name,
                    linked_date: new Date(module.linked_at).toLocaleDateString("en-GB"),
                  }))}
                  onColumnResize={() => {}}
                />
              )}
            </div>

            {/* Module selection */}
            <div style={{ marginBottom: "16rem", position: "relative", zIndex: 10 }}>
              <label className="neon-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                Select Training Modules
              </label>
              <SearchableMultiSelect
                options={modules.map(m => ({
                  ...m,
                  display_name: m.ref_code ? `${m.ref_code} - ${m.name}` : m.name
                }))}
                selected={selectedModuleIds}
                onChange={setSelectedModuleIds}
                labelKey="display_name"
                valueKey="id"
                placeholder="Search modules..."
              />
              <p className="neon-text" style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.6 }}>
                Select one or more training modules that users must complete to understand this document
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="save"
                label={saving ? "Saving..." : "Save Module Links"}
                onClick={handleSave}
                disabled={saving}
              />
            </div>
          </>
        )}
        </div>
      </div>
    </OverlayDialog>
  );
}
