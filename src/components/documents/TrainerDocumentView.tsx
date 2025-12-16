"use client";

import React, { useEffect, useState, useMemo } from "react";
import NeonTable from "@/components/NeonTable";
import { supabase } from "@/lib/supabase-client";
import { FiSearch, FiFileText, FiDownload, FiEye, FiFilter } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";

interface DocumentType {
  id: string;
  name: string;
}

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
  review_period_months?: number;
}

interface Section {
  id: string;
  code: string;
  title: string;
  description?: string;
  parent_section_id?: string | null;
  standard_id?: string | null;
}

interface Standard {
  id: string;
  name: string;
}

export default function TrainerDocumentView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStandard, setFilterStandard] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [paginationControls, setPaginationControls] = useState<React.ReactNode>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch documents
      const { data: docs, error: docsErr } = await supabase
        .from("documents")
        .select("id, title, section_id, document_type_id, created_at, last_reviewed_at, current_version, reference_code, file_url, notes, archived, review_period_months")
        .eq("archived", false)
        .order("reference_code", { ascending: true });

      if (docsErr) console.error("Error fetching documents:", docsErr);

      // Fetch standards
      const { data: stds, error: stdsErr } = await supabase
        .from("document_standard")
        .select("id, name")
        .order("name", { ascending: true });

      if (stdsErr) console.error("Error fetching standards:", stdsErr);

      // Fetch sections
      const { data: secs, error: secsErr } = await supabase
        .from("standard_sections")
        .select("id, code, title, description, parent_section_id, standard_id");

      if (secsErr) console.error("Error fetching sections:", secsErr);

      // Fetch document types
      const { data: docTypes, error: docTypesErr } = await supabase
        .from("document_types")
        .select("id, name");

      if (docTypesErr) console.error("Error fetching document types:", docTypesErr);

      // Map document type info into documents
      const docTypesMap = Object.fromEntries((docTypes || []).map(dt => [dt.id, dt]));
      setDocuments(
        (docs || []).map((doc: any) => ({
          ...doc,
          document_type_name: docTypesMap[doc.document_type_id]?.name || "—",
        }))
      );
      setStandards(stds || []);
      setSections(secs || []);
      setDocumentTypes(docTypes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesSearch = !q ||
        (doc.title || "").toLowerCase().includes(q) ||
        (doc.reference_code || "").toLowerCase().includes(q);

      const matchesType = !filterType || doc.document_type_id === filterType;

      // If a standard is selected, check if document's section belongs to that standard
      if (filterStandard) {
        if (!doc.section_id) {
          return false;
        }
        const docSection = sections.find(s => s.id === doc.section_id);
        if (!docSection || docSection.standard_id !== filterStandard) {
          return false;
        }
      }

      const matchesSection = !filterSection || doc.section_id === filterSection;

      return matchesSearch && matchesType && matchesSection;
    });
  }, [documents, search, filterType, filterStandard, filterSection, sections]);

  // Get available sections based on selected standard
  const availableSections = useMemo(() => {
    if (!filterStandard) return sections;
    return sections.filter(s => s.standard_id === filterStandard);
  }, [sections, filterStandard]);

  const handleViewDetails = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleDownload = async () => {
    if (!selectedDocument?.file_url) return;

    try {
      window.open(selectedDocument.file_url, '_blank');
    } catch (error) {
      console.error("Error opening file:", error);
      alert("Failed to open file");
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const getSectionName = (sectionId: string | null | undefined) => {
    if (!sectionId) return "—";
    const section = sections.find(s => s.id === sectionId);
    return section ? `${section.code} - ${section.title}` : "—";
  };

  const getStandardName = (sectionId: string | null | undefined) => {
    if (!sectionId) return "—";
    const section = sections.find(s => s.id === sectionId);
    if (!section?.standard_id) return "—";
    const standard = standards.find(std => std.id === section.standard_id);
    return standard?.name || "—";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        {/* Search and Filters */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 250 }}>
            <FiSearch
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--accent)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or reference code..."
              className="neon-input"
              style={{ paddingLeft: 40, width: "100%" }}
            />
          </div>

          {/* Document Type Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
            <FiFilter style={{ color: "var(--accent)" }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="neon-input"
              style={{ flex: 1 }}
            >
              <option value="">All Types</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Standard Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
            <FiFilter style={{ color: "var(--accent)" }} />
            <select
              value={filterStandard}
              onChange={(e) => {
                setFilterStandard(e.target.value);
                setFilterSection(""); // Reset section filter when standard changes
              }}
              className="neon-input"
              style={{ flex: 1 }}
            >
              <option value="">All Standards</option>
              {standards.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          {filterStandard && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 250 }}>
              <FiFilter style={{ color: "var(--accent)" }} />
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="neon-input"
                style={{ flex: 1 }}
              >
                <option value="">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.code} - {sec.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {paginationControls && (
            <div style={{ marginLeft: "auto" }}>{paginationControls}</div>
          )}
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <NeonTable
        paginationPosition="toolbar"
        onPaginationChange={setPaginationControls}
        columns={[
          { header: "Ref Code", accessor: "reference_code", width: 120 },
          { header: "Title", accessor: "title" },
          { header: "Type", accessor: "document_type", width: 120 },
          { header: "Section", accessor: "section", width: 200 },
          { header: "Version", accessor: "version", width: 80 },
          { header: "Last Reviewed", accessor: "last_reviewed", width: 120 },
          { header: "Actions", accessor: "actions", width: 100 },
        ]}
        data={filteredDocuments.map((doc) => ({
          ...doc,
          reference_code: doc.reference_code || (
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>
          ),
          document_type: doc.document_type_name || (
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>
          ),
          section: getSectionName(doc.section_id),
          version: doc.current_version || "1",
          last_reviewed: formatDate(doc.last_reviewed_at),
          actions: (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CustomTooltip text="View document details">
                <TextIconButton
                  variant="view"
                  icon={<FiEye />}
                  label="View"
                  onClick={() => handleViewDetails(doc)}
                />
              </CustomTooltip>
            </div>
          ),
        }))}
      />

      {/* Document Details Dialog */}
      {selectedDocument && (
        <OverlayDialog
          open={true}
          onClose={() => setSelectedDocument(null)}
          showCloseButton={true}
          width={900}
        >
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.75rem", marginBottom: 8 }}>
                {selectedDocument.title}
              </h2>
              {selectedDocument.reference_code && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
                  Reference Code: <span style={{ color: "var(--neon)", fontWeight: 600 }}>{selectedDocument.reference_code}</span>
                </p>
              )}
            </div>

            <div style={{ display: "grid", gap: 24 }}>
              {/* Document Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                    Document Type
                  </p>
                  <p style={{ color: "var(--text)", fontSize: "1rem" }}>
                    {selectedDocument.document_type_name || "—"}
                  </p>
                </div>

                <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                    Version
                  </p>
                  <p style={{ color: "var(--accent)", fontSize: "1.125rem", fontWeight: 600 }}>
                    {selectedDocument.current_version || "1"}
                  </p>
                </div>

                <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                    Last Reviewed
                  </p>
                  <p style={{ color: "var(--text)", fontSize: "1rem" }}>
                    {formatDate(selectedDocument.last_reviewed_at)}
                  </p>
                </div>

                {selectedDocument.review_period_months && (
                  <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                      Review Period
                    </p>
                    <p style={{ color: "var(--text)", fontSize: "1rem" }}>
                      {selectedDocument.review_period_months} months
                    </p>
                  </div>
                )}
              </div>

              {/* Standard */}
              <div>
                <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                  Standard
                </h3>
                <p style={{ color: "var(--text)" }}>
                  {getStandardName(selectedDocument.section_id)}
                </p>
              </div>

              {/* Section */}
              <div>
                <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                  Section
                </h3>
                <p style={{ color: "var(--text)" }}>
                  {getSectionName(selectedDocument.section_id)}
                </p>
              </div>

              {/* Notes */}
              {selectedDocument.notes && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                    Notes
                  </h3>
                  <p style={{ color: "var(--text)", lineHeight: 1.6 }}>
                    {selectedDocument.notes}
                  </p>
                </div>
              )}

              {/* File Download */}
              {selectedDocument.file_url && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 12 }}>
                    Document File
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <FiFileText size={20} style={{ color: "var(--accent)" }} />
                      <p style={{ color: "var(--text)", fontWeight: 500 }}>
                        {selectedDocument.title}
                      </p>
                    </div>
                    <CustomTooltip text="Open document">
                      <TextIconButton
                        variant="download"
                        icon={<FiDownload />}
                        label="Open"
                        onClick={handleDownload}
                      />
                    </CustomTooltip>
                  </div>
                </div>
              )}

              {/* Created Date */}
              {selectedDocument.created_at && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Created: {formatDate(selectedDocument.created_at)}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="cancel"
                label="Close"
                onClick={() => setSelectedDocument(null)}
              />
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
