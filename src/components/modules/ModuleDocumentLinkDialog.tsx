"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiFileText, FiX } from "react-icons/fi";

interface ModuleDocumentLinkDialogProps {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  moduleName: string;
}

interface Document {
  id: string;
  title: string;
  reference_code?: string;
  current_version?: number;
}

interface LinkedDocument extends Document {
  linked_at: string;
  linked_by?: string;
}

export default function ModuleDocumentLinkDialog({
  open,
  onClose,
  moduleId,
  moduleName,
}: ModuleDocumentLinkDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, moduleId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all available documents (non-archived)
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("id, title, reference_code, current_version")
        .eq("archived", false)
        .order("title");

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

      // Fetch currently linked documents for this module
      const { data: linksData, error: linksError } = await supabase
        .from("document_modules")
        .select(`
          created_at,
          created_by,
          documents!inner (
            id,
            title,
            reference_code,
            current_version
          )
        `)
        .eq("module_id", moduleId);

      if (linksError) throw linksError;

      // Transform the data
      const linked = (linksData || []).map((link: any) => ({
        id: link.documents.id,
        title: link.documents.title,
        reference_code: link.documents.reference_code,
        current_version: link.documents.current_version,
        linked_at: link.created_at,
        linked_by: link.created_by,
      }));

      setLinkedDocuments(linked);
      setSelectedDocumentIds(linked.map((d) => d.id));
    } catch (err: any) {
      console.error("Error fetching document link data:", err);
      setError(err.message || "Failed to load document links");
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

      // Get currently linked document IDs
      const { data: currentLinks, error: currentError } = await supabase
        .from("document_modules")
        .select("id, document_id")
        .eq("module_id", moduleId);

      if (currentError) throw currentError;

      const currentDocumentIds = new Set(
        (currentLinks || []).map((link) => link.document_id)
      );
      const selectedSet = new Set(selectedDocumentIds);

      // Documents to add (in selected but not in current)
      const documentsToAdd = selectedDocumentIds.filter(
        (id) => !currentDocumentIds.has(id)
      );

      // Links to remove (in current but not in selected)
      const linksToRemove = (currentLinks || []).filter(
        (link) => !selectedSet.has(link.document_id)
      );

      // Add new links
      if (documentsToAdd.length > 0) {
        const newLinks = documentsToAdd.map((documentId) => ({
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
        `Updated document links: ${documentsToAdd.length} added, ${linksToRemove.length} removed`
      );

      // Refresh the data to show updated links
      await fetchData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error saving document links:", err);
      setError(err.message || "Failed to save document links");
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
      ariaLabelledby="module-document-link-dialog-title"
    >
      <div className="ui-dialog-container">
        <div className="ui-dialog-scrollable">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <FiFileText size={24} style={{ color: "var(--neon)" }} />
            <h2
              id="module-document-link-dialog-title"
              className="neon-label"
              style={{ fontSize: "1.5rem", margin: 0 }}
            >
              Link Documents to Module
            </h2>
          </div>

          <p className="neon-text" style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
            Module: <strong>{moduleName}</strong>
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
            Loading documents...
          </p>
        ) : (
          <>
            {/* Current linked documents table */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 className="neon-label" style={{ marginBottom: "1rem" }}>
                Currently Linked Documents ({linkedDocuments.length})
              </h3>
              {linkedDocuments.length === 0 ? (
                <p className="neon-text" style={{ opacity: 0.6, fontStyle: "italic" }}>
                  No documents currently linked to this module
                </p>
              ) : (
                <NeonTable
                  columns={[
                    { header: "Ref Code", accessor: "reference_code", width: 120, align: "center" },
                    { header: "Document Title", accessor: "title", width: 450, align: "center" },
                    { header: "Version", accessor: "current_version", width: 100, align: "center" },
                    { header: "Linked Date", accessor: "linked_date", width: 120, align: "center" },
                  ]}
                  data={linkedDocuments.map((document) => ({
                    reference_code: document.reference_code || "—",
                    title: document.title,
                    current_version: document.current_version || "—",
                    linked_date: new Date(document.linked_at).toLocaleDateString("en-GB"),
                  }))}
                  onColumnResize={() => {}}
                />
              )}
            </div>

            {/* Document selection */}
            <div style={{ marginBottom: "16rem", position: "relative", zIndex: 10 }}>
              <label className="neon-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                Select Documents
              </label>
              <SearchableMultiSelect
                options={documents.map(d => ({
                  ...d,
                  display_name: d.reference_code ? `${d.reference_code} - ${d.title}` : d.title
                }))}
                selected={selectedDocumentIds}
                onChange={setSelectedDocumentIds}
                labelKey="display_name"
                valueKey="id"
                placeholder="Search documents..."
              />
              <p className="neon-text" style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.6 }}>
                Select one or more documents that are related to this training module
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="save"
                label={saving ? "Saving..." : "Save Document Links"}
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
