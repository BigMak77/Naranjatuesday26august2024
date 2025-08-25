/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import {
  FiArchive,
  FiFileText,
  FiBookOpen,
  FiClipboard,
  FiPlus,
  FiEdit,
} from "react-icons/fi";
import { useUser } from "@/lib/useUser";
import NeonIconButton from "@/components/ui/NeonIconButton";
import Modal from "@/components/modal";
import NeonForm from "@/components/NeonForm";

interface Document {
  id: string;
  title: string;
  section_id?: string | null;
  document_type: string;
  created_at?: string;
  current_version?: number;
  reference_code?: string;
  file_url?: string;
  notes?: string;
  archived?: boolean;
}

interface Section {
  id: string;
  code: string;
  title: string;
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

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveDocId, setArchiveDocId] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [archiveErrorMsg, setArchiveErrorMsg] = useState("");
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const { data: docs, error: docsErr } = await supabase
        .from("documents")
        .select(
          "id, title, section_id, document_type, created_at, current_version, reference_code, file_url, notes, archived",
        );
      if (docsErr) console.error("Error fetching documents:", docsErr);

      const { data: secs, error: secsErr } = await supabase
        .from("standard_sections")
        .select("id, code, title");
      if (secsErr) console.error("Error fetching sections:", secsErr);

      setDocuments((docs || []).filter((doc) => !doc.archived));
      setSections(secs || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSearch("");
    setFilterType("");
    setFilterSection("");
  }, []);

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType ? doc.document_type === filterType : true;
    const matchesSection = filterSection
      ? doc.section_id === filterSection
      : true;
    return matchesSearch && matchesType && matchesSection;
  });

  const handleArchiveClick = async (id: string) => {
    if (buttonLoading) return; // Prevent double click
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

    const { data: archiveData, error: archiveError } = await supabase
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
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      alert("Document archived.");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Archive Modal */}
      <Modal
        open={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setArchiveDocId(null);
          setChangeSummary("");
          setButtonLoading(null);
        }}
      >
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
          />
          {archiveErrorMsg && (
            <p className="danger-text mb-2">{archiveErrorMsg}</p>
          )}
        </NeonForm>
      </Modal>

      <div className="document-section-controls neon-panel neon-form-padding">
        <div className="document-section-controls-filters">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="neon-input neon-select"
          >
            <option value="">All Types</option>
            <option value="policy">Policy</option>
            <option value="ssow">SSOW</option>
            <option value="work_instruction">Work Instruction</option>
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="neon-input neon-select"
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} – {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="document-section-controls-actions">
          <button
            onClick={() => router.push("/admin/documents/add")}
            className="neon-btn neon-btn-add"
            title="Add Document"
            disabled={!!buttonLoading}
          >
            <FiPlus size={22} />
            <span className="sr-only">Add Document</span>
          </button>
          <button
            onClick={() => router.push("/admin/documents/archived")}
            className="neon-btn neon-btn-archive"
            title="View Archived Documents"
            disabled={!!buttonLoading}
          >
            <FiArchive size={22} />
            <span className="sr-only">Archived Documents</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="neon-loading">Loading...</p>
      ) : (
        <>
          <div className="document-section-table-wrapper neon-panel neon-form-padding">
            <NeonTable
              columns={[
                { header: "Title", accessor: "title" },
                { header: "Type", accessor: "document_type" },
                { header: "Section", accessor: "section" },
                { header: "Created", accessor: "created" },
                { header: "Version", accessor: "version" },
                { header: "Edit", accessor: "edit" },
                { header: "Archive", accessor: "archive" },
              ]}
              data={filtered
                .filter(
                  (doc) =>
                    isValidUUID(doc.id) &&
                    (!doc.section_id || isValidUUID(doc.section_id)),
                )
                .map((doc: Document) => {
                  const section = sections.find((s) => s.id === doc.section_id);
                  let typeIcon = null;
                  if (doc.document_type === "policy") {
                    typeIcon = (
                      <FiFileText
                        size={18}
                        className="neon-icon"
                        title="Policy"
                      />
                    );
                  } else if (doc.document_type === "ssow") {
                    typeIcon = (
                      <FiClipboard
                        size={18}
                        className="neon-icon"
                        title="SSOW"
                      />
                    );
                  } else if (doc.document_type === "work_instruction") {
                    typeIcon = (
                      <FiBookOpen
                        size={18}
                        className="neon-icon"
                        title="Work Instruction"
                      />
                    );
                  }
                  return {
                    title: doc.title,
                    document_type: (
                      <div className="document-type-icon-cell neon-label">
                        {typeIcon}
                      </div>
                    ),
                    section: section
                      ? `${section.code} – ${section.title}`
                      : "—",
                    created: doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString("en-GB")
                      : "—",
                    version: (
                      <div className="document-version-cell neon-label">
                        {doc.current_version || "—"}
                      </div>
                    ),
                    edit: (
                      <div className="document-edit-cell">
                        <a
                          href={`/admin/documents/edit/${doc.id}`}
                          title="Edit document"
                        >
                          <NeonIconButton
                            variant="edit"
                            title="Edit document"
                            aria-label="Edit document"
                          />
                        </a>
                      </div>
                    ),
                    archive: user?.auth_id ? (
                      <div className="document-archive-cell">
                        <NeonIconButton
                          variant="archive"
                          icon={<FiArchive size={18} />}
                          title="Archive document"
                          aria-label="Archive document"
                          onClick={() => handleArchiveClick(doc.id)}
                        />
                      </div>
                    ) : (
                      "—"
                    ),
                  };
                })}
              toolbar={
                <p className="document-section-table-count neon-label">
                  Showing {filtered.length} matching documents
                </p>
              }
            />
          </div>
        </>
      )}
    </>
  );
}
