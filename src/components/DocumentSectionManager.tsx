/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import { FiArchive, FiFileText, FiBookOpen, FiClipboard, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { useUser } from "@/lib/useUser";
import NeonIconButton from "@/components/ui/NeonIconButton";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonForm from "@/components/NeonForm";
import MainHeader from "@/components/ui/MainHeader";

interface Document {
  id: string;
  title: string;
  section_id?: string | null;
  document_type: "policy" | "ssow" | "work_instruction";
  created_at?: string;
  last_reviewed_at?: string;
  current_version?: number;
  reference_code?: string;
  file_url?: string;
  notes?: string;
  archived?: boolean;
  review_period_months?: number;
}

interface Section {
  id: string;
  code: string;
  title: string;
  description?: string;
  parent_section_id?: string | null;
}

// Helper function to check for valid UUID
function isValidUUID(str: string | null | undefined) {
  return (
    !!str &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      str,
    )
  );
}

type ViewMode = "list" | "add" | "edit" | "archived";

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [loading, setLoading] = useState(true);

  // NEW: local view for add/edit/archived
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Archive modal state you already had
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveDocId, setArchiveDocId] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [archiveErrorMsg, setArchiveErrorMsg] = useState("");
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);

  // Edit Section modal (unchanged)
  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editSectionCode, setEditSectionCode] = useState("");
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionDescription, setEditSectionDescription] = useState("");
  const [editSectionParentName, setEditSectionParentName] = useState("");
  const [editSectionError, setEditSectionError] = useState("");

  const { user } = useUser();

  const defaultColumnWidths = {
    title: 220,
    document_type: 120,
    section: 220,
    created: 120,
    version: 100,
    edit: 80,
    archive: 100,
  };
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const handleColumnResize = (accessor: string, newWidth: number) => {
    setColumnWidths((prev) => ({ ...prev, [accessor]: Math.max(60, newWidth) }));
  };

  // Fetch docs + sections
  useEffect(() => {
    (async () => {
      const { data: docs, error: docsErr } = await supabase
        .from("documents")
        .select(
          "id, title, section_id, document_type, created_at, last_reviewed_at, current_version, reference_code, file_url, notes, archived, review_period_months",
        );
      if (docsErr) console.error("Error fetching documents:", docsErr);

      const { data: secs, error: secsErr } = await supabase
        .from("standard_sections")
        .select("id, code, title, description, parent_section_id");
      if (secsErr) console.error("Error fetching sections:", secsErr);

      setDocuments((docs || []).filter((doc) => !doc.archived));
      setSections(secs || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesSearch = !q || (doc.title || "").toLowerCase().includes(q);
      const matchesType = !filterType || doc.document_type === (filterType as any);
      const matchesSection = !filterSection || doc.section_id === filterSection;
      return matchesSearch && matchesType && matchesSection;
    });
  }, [documents, search, filterType, filterSection]);

  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Archive flow
  const handleArchiveClick = async (id: string) => {
    if (buttonLoading) return;
    setButtonLoading(id);
    setArchiveDocId(id);
    setChangeSummary("");
    setArchiveErrorMsg("");
    setShowArchiveModal(true);
  };

  const handleArchiveSubmit = async () => {
    if (!changeSummary.trim()) {
      setArchiveErrorMsg("Change summary is required.");
      return;
    }
    if (!archiveDocId) return;
    setShowArchiveModal(false);
    setButtonLoading(archiveDocId);
    await archiveDocument(archiveDocId, changeSummary);
    setArchiveDocId(null);
    setChangeSummary("");
    setButtonLoading(null);
  };

  const archiveDocument = async (id: string, summary: string) => {
    setLoading(true);
    if (!user?.auth_id) {
      alert("Cannot archive: user not loaded. Please refresh and try again.");
      setLoading(false);
      return;
    }

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !doc) {
      alert("Failed to fetch document for archiving.");
      setLoading(false);
      return;
    }

    const { error: archiveError } = await supabase
      .from("document_archive")
      .insert({
        document_id: doc.id,
        archived_version: doc.current_version || 1,
        title: doc.title,
        reference_code: doc.reference_code,
        file_url: doc.file_url,
        document_type: doc.document_type,
        notes: doc.notes || null,
        section_id: doc.section_id || null,
        created_at: doc.created_at || null,
        change_summary: summary,
        change_date: new Date().toISOString(),
        archived_by_auth_id: user.auth_id,
      });

    if (archiveError) {
      console.error("Error archiving document:", archiveError);
      alert("Failed to archive document: " + archiveError.message);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("documents")
      .update({ archived: true })
      .eq("id", id);

    if (error) {
      alert("Failed to archive document.");
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      alert("Document archived.");
    }
    setLoading(false);
  };

  // When archiving, update local state immediately
  const handleArchiveAndUpdate = async (id: string, summary: string) => {
    if (!user?.auth_id) return;
    await supabase
      .from("documents")
      .update({ archived: true, archived_by_auth_id: user.auth_id })
      .eq("id", id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Section editor
  const handleEditSectionClick = (section: Section) => {
    setEditSection(section);
    setEditSectionCode(section.code);
    setEditSectionTitle(section.title);
    setEditSectionDescription(section.description || "");
    if (section.parent_section_id) {
      const parent = sections.find((s) => s.id === section.parent_section_id);
      setEditSectionParentName(parent ? `${parent.code} – ${parent.title}` : "");
    } else {
      setEditSectionParentName("");
    }
    setEditSectionError("");
    setEditSectionModalOpen(true);
  };

  const handleEditSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSection) return;
    if (!editSectionCode.trim() || !editSectionTitle.trim()) {
      setEditSectionError("Code and Title are required.");
      return;
    }
    setEditSectionError("");

    const { data: updateData, error } = await supabase
      .from("standard_sections")
      .update({
        code: editSectionCode.trim(),
        title: editSectionTitle.trim(),
        description: editSectionDescription,
      })
      .eq("id", editSection.id)
      .select();
    if (error) {
      setEditSectionError(error.message);
      return;
    }
    if (!updateData || updateData.length === 0) {
      setEditSectionError("No section was updated. Check if the ID is correct.");
      return;
    }
    const { data: secs, error: secsErr } = await supabase
      .from("standard_sections")
      .select("id, code, title, description, parent_section_id");
    if (secsErr) {
      setEditSectionError(secsErr.message);
      return;
    }
    setSections(secs || []);
    setEditSectionModalOpen(false);
    setEditSection(null);
  };

  // Quick lookup map
  const sectionsById = useMemo(() => {
    const m: Record<string, Section> = {};
    sections.forEach((s) => (m[s.id] = s));
    return m;
  }, [sections]);

  // NEW: Edit stage modal state
  const [showEditStageModal, setShowEditStageModal] = useState(false);
  const [editStageDocId, setEditStageDocId] = useState<string | null>(null);
  // Add stage state for edit modal
  const [editStage, setEditStage] = useState<string | null>(null);

  return (
    <>
      <MainHeader
        title="Document Manager"
        subtitle="Manage, edit, and archive your documents"
      />
      {/* ===== FILTER BAR ===== */}
      <section className="content-controls neon-panel neon-form-padding">
        <div className="controls-left">
          <div className="control">
            <label className="neon-label" htmlFor="filterType">Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="neon-select"
            >
              <option value="">All Types</option>
              <option value="policy">Policy</option>
              <option value="ssow">SSOW</option>
              <option value="work_instruction">Work Instruction</option>
            </select>
          </div>
          <div className="control section-edit-inline">
            <label className="neon-label" htmlFor="filterSection">Section</label>
            <div className="section-picker">
              <select
                id="filterSection"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="neon-select"
              >
                <option value="">All Sections</option>
                {sections
                  .slice()
                  .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} – {s.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="neon-loading">Loading...</p>
      ) : (
        <>
          <div className="document-section-table-wrapper neon-panel neon-form-padding">
            <div className="neon-table-toolbar">
              <div className="neon-table-toolbar-search">
                <input
                  id="table-search"
                  className="neon-input"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-describedby="table-count"
                />
                <span id="table-count" className="match-count neon-label" aria-live="polite">
                  Showing {filtered.length} matching documents
                </span>
              </div>

              <div className="neon-table-toolbar-actions">
                <NeonIconButton
                  variant="edit"
                  title={
                    filterSection
                      ? `Edit section: ${
                          sections.find((s) => s.id === filterSection)?.code || ""
                        } – ${
                          sections.find((s) => s.id === filterSection)?.title || ""
                        }`
                      : "Select a section to edit"
                  }
                  aria-label="Edit selected section"
                  onClick={() => {
                    const section = sections.find((s) => s.id === filterSection);
                    if (section) handleEditSectionClick(section);
                  }}
                  disabled={!filterSection}
                />
                {/* CHANGED: open add dialog instead of route */}
                <NeonIconButton
                  variant="add"
                  title="Add Document"
                  aria-label="Add Document"
                  onClick={() => { setActiveDocId(null); setViewMode("add"); }}
                  disabled={!!buttonLoading}
                />
                {/* CHANGED: open archived dialog instead of route */}
                <NeonIconButton
                  variant="viewArchive"
                  title="View Archived Documents"
                  aria-label="View Archived Documents"
                  onClick={() => setViewMode("archived")}
                  disabled={!!buttonLoading}
                  className="neon-btn-view-archive"
                />
              </div>

              <div className="neon-table-toolbar-pagination">
                <select
                  className="neon-table-toolbar-dropdown neon-input"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  style={{ minWidth: 90, maxWidth: 100, height: 32 }}
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
                <div className="neon-btn-group">
                  <NeonIconButton
                    variant="back"
                    title="Previous page"
                    aria-label="Previous page"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  />
                  <span className="neon-label" style={{ margin: '0 8px' }}>
                    Page {currentPage} / {totalPages}
                  </span>
                  <NeonIconButton
                    variant="next"
                    title="Next page"
                    aria-label="Next page"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  />
                </div>
              </div>
            </div>

            <NeonTable
              columns={[
                { header: "Title", accessor: "title", width: columnWidths.title },
                { header: "Type", accessor: "document_type", width: columnWidths.document_type },
                { header: "Section", accessor: "section", width: columnWidths.section },
                { header: "Created", accessor: "created", width: columnWidths.created },
                { header: "Review Due", accessor: "review_due", width: 120 },
                { header: "Version", accessor: "version", width: columnWidths.version },
                { header: "Edit", accessor: "edit", width: columnWidths.edit },
              ]}
              data={paginatedData
                .filter(
                  (doc) =>
                    isValidUUID(doc.id) &&
                    (!doc.section_id || isValidUUID(doc.section_id)),
                )
                .map((doc: Document) => {
                  const section = doc.section_id ? sectionsById[doc.section_id] : undefined;
                  let typeIcon = null;
                  if (doc.document_type === "policy") {
                    typeIcon = <FiFileText size={20} className="neon-icon" title="Policy" />;
                  } else if (doc.document_type === "ssow") {
                    typeIcon = <FiClipboard size={20} className="neon-icon" title="SSOW" />;
                  } else if (doc.document_type === "work_instruction") {
                    typeIcon = <FiBookOpen size={20} className="neon-icon" title="Work Instruction" />;
                  }
                  // Calculate review due: last_reviewed_at + review_period_months (months)
                  let reviewDue = "—";
                  if (doc.last_reviewed_at && doc.review_period_months) {
                    const d = new Date(doc.last_reviewed_at);
                    d.setMonth(d.getMonth() + doc.review_period_months);
                    reviewDue = d.toLocaleDateString("en-GB");
                  }
                  return {
                    title: doc.title,
                    document_type: <div className="document-type-icon-cell neon-label">{typeIcon}</div>,
                    section: section ? `${section.code} – ${section.title}` : "—",
                    created: doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-GB") : "—",
                    review_due: <div className="document-review-due-cell neon-label">{reviewDue}</div>,
                    version: <div className="document-version-cell neon-label">{doc.current_version || "—"}</div>,
                    // CHANGED: open edit dialog instead of <a href=...>
                    edit: (
                      <div className="document-edit-cell">
                        <NeonIconButton
                          variant="edit"
                          title="Edit document"
                          aria-label="Edit document"
                          onClick={() => {
                            setEditStageDocId(doc.id);
                            setShowEditStageModal(true);
                          }}
                        />
                      </div>
                    ),
                  };
                })}
              onColumnResize={handleColumnResize}
            />
          </div>
        </>
      )}

      {/* ===== Archive confirmation dialog ===== */}
      <OverlayDialog
        open={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setArchiveDocId(null);
          setChangeSummary("");
          setButtonLoading(null);
        }}
      >
        <div style={{ minWidth: 380, maxWidth: 480, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <FiArchive className="neon-icon danger-text" />
            <h2 className="neon-dialog-title" style={{ margin: 0 }}>
              Archive Document
            </h2>
          </div>
          <p className="neon-label" style={{ marginBottom: 16 }}>
            Are you sure you want to archive this document? This action cannot be undone.<br />
            Please provide a change summary below.
          </p>
          <NeonForm
            title="Archive Document"
            onSubmit={(e) => {
              e.preventDefault();
              handleArchiveSubmit();
            }}
            submitLabel={buttonLoading ? "Archiving..." : "Archive"}
            onCancel={() => {
              setShowArchiveModal(false);
              setArchiveDocId(null);
              setChangeSummary("");
              setButtonLoading(null);
            }}
          >
            <label className="neon-label" htmlFor="changeSummary">
              Change Summary <span className="danger-text">*</span>
            </label>
            <textarea
              id="changeSummary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="neon-input mb-2"
              placeholder="Describe why this document is being archived..."
              required
              rows={3}
              style={{ width: "100%" }}
            />
            {archiveErrorMsg && <p className="danger-text mb-2">{archiveErrorMsg}</p>}
          </NeonForm>
        </div>
      </OverlayDialog>

      {/* ===== Add/Edit Document Sheet ===== */}
      <OverlayDialog
        open={viewMode === "add" || (viewMode === "edit" && !!activeDocId)}
        onClose={() => { setViewMode("list"); setActiveDocId(null); }}
      >
        {(viewMode === "add" || (viewMode === "edit" && !!activeDocId)) && (
          <DocumentForm
            id={viewMode === "edit" ? activeDocId ?? undefined : undefined}
            sections={sections}
            onCancel={() => { setViewMode("list"); setActiveDocId(null); }}
            onSaved={(saved) => {
              setDocuments((prev) => {
                // Remove any previous (now archived) document with same reference_code and section_id
                const filtered = prev.filter(
                  (d) =>
                    d.id !== saved.id &&
                    !(d.reference_code === saved.reference_code && d.section_id === saved.section_id)
                );
                return [saved, ...filtered];
              });
              setViewMode("list");
              setActiveDocId(null);
            }}
          />
        )}
      </OverlayDialog>

      {/* ===== Archived list dialog ===== */}
      <OverlayDialog
        open={viewMode === "archived"}
        onClose={() => setViewMode("list")}
      >
        {viewMode === "archived" && (
          <ArchivedDocuments
            onRestore={(restored) => {
              setDocuments((prev) => [restored, ...prev]);
              setViewMode("list");
            }}
          />
        )}
      </OverlayDialog>

      {/* ===== Edit Section Dialog (unchanged) ===== */}
      <OverlayDialog
        open={editSectionModalOpen}
        onClose={() => {
          setEditSectionModalOpen(false);
          setEditSection(null);
          setEditSectionError("");
        }}
      >
        <NeonForm
          title="Edit Section"
          onSubmit={handleEditSectionSubmit}
          submitLabel="Save"
          onCancel={() => {
            setEditSectionModalOpen(false);
            setEditSection(null);
            setEditSectionError("");
          }}
        >
          {editSectionParentName && (
            <div className="neon-label" style={{ marginBottom: 8 }}>
              <strong>Parent Section:</strong> {editSectionParentName}
            </div>
          )}
          <label className="neon-label" htmlFor="editSectionCode">Code</label>
          <input
            id="editSectionCode"
            className="neon-input mb-2"
            value={editSectionCode}
            onChange={(e) => setEditSectionCode(e.target.value)}
            required
          />
          <label className="neon-label" htmlFor="editSectionTitle">Title</label>
          <input
            id="editSectionTitle"
            className="neon-input mb-2"
            value={editSectionTitle}
            onChange={(e) => setEditSectionTitle(e.target.value)}
            required
          />
          <label className="neon-label" htmlFor="editSectionDescription">Description</label>
          <textarea
            id="editSectionDescription"
            className="neon-input mb-2"
            value={editSectionDescription}
            onChange={(e) => setEditSectionDescription(e.target.value)}
            rows={3}
          />
          {editSectionError && <p className="danger-text mb-2">{editSectionError}</p>}
        </NeonForm>
      </OverlayDialog>

      {/* ===== Edit Stage Modal ===== */}
      <OverlayDialog
        open={showEditStageModal}
        onClose={() => {
          setShowEditStageModal(false);
          setEditStageDocId(null);
          setEditStage(null);
        }}
      >
        <div style={{ minWidth: 340, maxWidth: 420, padding: 24 }}>
          <h2 className="neon-dialog-title" style={{ marginBottom: 16 }}>Edit Document</h2>
          {editStage === "archive" ? (
            <>
              <p className="neon-label" style={{ marginBottom: 16 }}>
                Are you sure you want to archive this document? This action cannot be undone.<br />
                Please provide a change summary below.
              </p>
              <NeonForm
                title="Archive Document"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editStageDocId || !user?.auth_id) return;
                  if (!changeSummary.trim()) {
                    setArchiveErrorMsg("Change summary is required.");
                    return;
                  }
                  await handleArchiveAndUpdate(editStageDocId, changeSummary);
                  setShowEditStageModal(false);
                  setEditStage(null);
                  setArchiveDocId(null);
                  setChangeSummary("");
                  setArchiveErrorMsg("");
                  alert("Document archived.");
                }}
                submitLabel="Archive"
                onCancel={() => {
                  setEditStage(null);
                  setChangeSummary("");
                  setArchiveErrorMsg("");
                }}
              >
                <label className="neon-label" htmlFor="changeSummary">
                  Change Summary <span className="danger-text">*</span>
                </label>
                <textarea
                  id="changeSummary"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="neon-input mb-2"
                  placeholder="Describe why this document is being archived..."
                  required
                  rows={3}
                  style={{ width: "100%" }}
                />
                {archiveErrorMsg && <p className="danger-text mb-2">{archiveErrorMsg}</p>}
              </NeonForm>
            </>
          ) : editStage === "review" ? (
            <>
              <p className="neon-label" style={{ marginBottom: 16 }}>
                You confirm that there are no changes to be made to this document.<br />
                The review date will be updated.
              </p>
              <NeonForm
                title="Review Document"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editStageDocId) return;
                  await supabase
                    .from("documents")
                    .update({ last_reviewed_at: new Date().toISOString() })
                    .eq("id", editStageDocId);
                  setShowEditStageModal(false);
                  setEditStage(null);
                  alert("Review date updated.");
                }}
                submitLabel="Confirm Review"
                onCancel={() => {
                  setEditStage(null);
                }}
              >
                <></>
              </NeonForm>
            </>
          ) : (
            <>
              <p className="neon-label" style={{ marginBottom: 16 }}>
                Would you like to perform a <strong>Review</strong> (update last reviewed date), create a <strong>New Version</strong>, or <strong>Archive</strong> this document?
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <NeonIconButton
                  variant="refresh"
                  className="neon-btn-review"
                  title="Review (update last reviewed date)"
                  aria-label="Review"
                  onClick={() => {
                    setEditStage("review");
                  }}
                />
                <NeonIconButton
                  variant="edit"
                  title="New Version (edit document)"
                  aria-label="New Version"
                  onClick={() => {
                    setShowEditStageModal(false);
                    setActiveDocId(editStageDocId);
                    setViewMode("edit");
                  }}
                >New Version</NeonIconButton>
                <NeonIconButton
                  variant="archive"
                  title="Archive document"
                  aria-label="Archive document"
                  className="neon-btn-archive"
                  onClick={() => {
                    setEditStage("archive");
                  }}
                />
              </div>
            </>
          )}
        </div>
      </OverlayDialog>
    </>
  );
}

/* =========================
   Minimal inline components
   ========================= */

function DocumentForm({
  id,
  sections,
  onSaved,
  onCancel,
}: {
  id?: string;
  sections: Section[];
  onSaved: (doc: Document) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<Document["document_type"]>("policy");
  const [sectionId, setSectionId] = useState<string>("");
  const [referenceCode, setReferenceCode] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewPeriodMonths, setReviewPeriodMonths] = useState<number>(12); // default 12 months
  const [lastReviewAt, setLastReviewAt] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setReviewPeriodMonths(12);
        setLastReviewAt(new Date().toISOString().slice(0, 10));
        return;
      }
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setTitle(data.title || "");
      setDocumentType(data.document_type || "policy");
      setSectionId(data.section_id || "");
      setReferenceCode(data.reference_code || "");
      setFileUrl(data.file_url || "");
      setNotes(data.notes || "");
      setReviewPeriodMonths(data.review_period_months ?? 12);
      setLastReviewAt(data.last_reviewed_at ? data.last_reviewed_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);

    if (id) {
      // Fetch current version
      const { data: currentDoc, error: fetchError } = await supabase
        .from("documents")
        .select("current_version")
        .eq("id", id)
        .single();
      let newVersion = 1;
      if (!fetchError && currentDoc && typeof currentDoc.current_version === "number") {
        newVersion = currentDoc.current_version + 1;
      }
      const { data, error } = await supabase
        .from("documents")
        .update({
          title: title.trim(),
          document_type: documentType,
          section_id: sectionId || null,
          reference_code: referenceCode || null,
          file_url: fileUrl || null,
          notes: notes || null,
          current_version: newVersion,
          review_period_months: reviewPeriodMonths,
          last_reviewed_at: lastReviewAt,
        })
        .eq("id", id)
        .select()
        .single();
      setLoading(false);
      if (error || !data) { setError(error?.message || "Update failed"); return; }
      onSaved(data as Document);
    } else {
      // Archive previous version if exists
      let previousDoc: Document | null = null;
      if (referenceCode && sectionId) {
        const { data: prev, error: prevErr } = await supabase
          .from("documents")
          .select("*")
          .eq("reference_code", referenceCode)
          .eq("section_id", sectionId)
          .eq("archived", false)
          .order("current_version", { ascending: false })
          .limit(1)
          .single();
        if (!prevErr && prev) previousDoc = prev;
      }
      if (previousDoc) {
        // Archive previous document
        await supabase.from("document_archive").insert({
          document_id: previousDoc.id,
          archived_version: previousDoc.current_version || 1,
          title: previousDoc.title,
          reference_code: previousDoc.reference_code,
          file_url: previousDoc.file_url,
          document_type: previousDoc.document_type,
          notes: previousDoc.notes || null,
          section_id: previousDoc.section_id || null,
          created_at: previousDoc.created_at || null,
          change_summary: "Auto-archived due to new version added.",
          change_date: new Date().toISOString(),
          archived_by_auth_id: null, // Optionally set user auth_id if available
        });
        await supabase.from("documents").update({ archived: true }).eq("id", previousDoc.id);
      }
      // Now insert new document
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: title.trim(),
          document_type: documentType,
          section_id: sectionId || null,
          reference_code: referenceCode || null,
          file_url: fileUrl || null,
          notes: notes || null,
          archived: false,
          current_version: previousDoc ? (previousDoc.current_version || 1) + 1 : 1,
          review_period_months: reviewPeriodMonths,
          last_reviewed_at: lastReviewAt,
        })
        .select()
        .single();
      setLoading(false);
      if (error || !data) { setError(error?.message || "Create failed"); return; }
      onSaved(data as Document);
    }
  };

  if (loading) return <p className="neon-loading">Loading…</p>;

  return (
    <NeonForm
      title={id ? "Edit Document" : "Add Document"}
      onSubmit={handleSubmit}
      submitLabel={id ? "Save Changes" : "Create Document"}
      onCancel={onCancel}
    >
      {error && <p className="danger-text mb-2">{error}</p>}

      <label className="neon-label" htmlFor="docTitle">Title</label>
      <input id="docTitle" className="neon-input mb-2" value={title} onChange={e=>setTitle(e.target.value)} required />

      <label className="neon-label" htmlFor="docType">Type</label>
      <select id="docType" className="neon-select mb-2" value={documentType} onChange={e=>setDocumentType(e.target.value as Document["document_type"])}>
        <option value="policy">Policy</option>
        <option value="ssow">SSOW</option>
        <option value="work_instruction">Work Instruction</option>
      </select>

      <label className="neon-label" htmlFor="docSection">Section</label>
      <select id="docSection" className="neon-select mb-2" value={sectionId} onChange={e=>setSectionId(e.target.value)}>
        <option value="">— None —</option>
        {sections
          .slice()
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map(s => <option key={s.id} value={s.id}>{s.code} – {s.title}</option>)
        }
      </select>

      <label className="neon-label" htmlFor="referenceCode">Reference Code</label>
      <input id="referenceCode" className="neon-input mb-2" value={referenceCode} onChange={e=>setReferenceCode(e.target.value)} />

      <label className="neon-label" htmlFor="fileUrl">File URL</label>
      <input id="fileUrl" className="neon-input mb-2" value={fileUrl} onChange={e=>setFileUrl(e.target.value)} />

      <label className="neon-label" htmlFor="notes">Notes</label>
      <textarea id="notes" className="neon-input mb-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />

      <label className="neon-label" htmlFor="reviewPeriodMonths">Review Period (months)</label>
      <input
        id="reviewPeriodMonths"
        type="number"
        min={1}
        max={60}
        className="neon-input mb-2"
        value={reviewPeriodMonths}
        onChange={e => setReviewPeriodMonths(Number(e.target.value))}
        required
      />
      <label className="neon-label" htmlFor="lastReviewAt">Last Review At</label>
      <input
        id="lastReviewAt"
        type="date"
        className="neon-input mb-2"
        value={lastReviewAt}
        onChange={e => setLastReviewAt(e.target.value)}
        required
      />
    </NeonForm>
  );
}

function ArchivedDocuments({ onRestore }: { onRestore: (doc: Document) => void }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("document_archive")
        .select("*")
        .order("change_date", { ascending: false });
      if (error) { setError(error.message); setLoading(false); return; }
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const restore = async (archiveRow: any) => {
    const { data, error } = await supabase
      .from("documents")
      .update({ archived: false })
      .eq("id", archiveRow.document_id)
      .select()
      .single();
    if (error || !data) { alert(error?.message || "Restore failed"); return; }
    onRestore(data as Document);
  };

  if (loading) return <p className="neon-loading">Loading archived…</p>;
  if (error) return <p className="danger-text">{error}</p>;

  return (
    <div style={{ minWidth: 600 }}>
      <h2 className="neon-dialog-title">Archived Documents</h2>
      <div className="neon-table" role="table" aria-label="Archived documents">
        {rows.map((r) => (
          <div key={r.id} className="neon-row" role="row">
            <div role="cell" className="neon-cell">{r.title}</div>
            <div role="cell" className="neon-cell">v{r.archived_version}</div>
            <div role="cell" className="neon-cell">{new Date(r.change_date).toLocaleString("en-GB")}</div>
            <div role="cell" className="neon-cell">
              <NeonIconButton variant="edit" title="Restore" aria-label="Restore" onClick={() => restore(r)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
