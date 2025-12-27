/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import FolderTabs, { type Tab } from "@/components/FolderTabs";
import { FiArchive, FiFileText, FiBookOpen, FiClipboard, FiChevronLeft, FiChevronRight, FiRefreshCw, FiFolder, FiLayers, FiList } from "react-icons/fi";
import { useUser } from "@/lib/useUser";
import TextIconButton from "@/components/ui/TextIconButtons";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonForm from "@/components/NeonForm";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import StorageFileBrowser from "@/components/ui/StorageFileBrowser";
import { STORAGE_BUCKETS } from "@/lib/storage-config";
import SuccessModal from "@/components/ui/SuccessModal";
import DocumentAssignmentDialog from "@/components/documents/DocumentAssignmentDialog";
import DocumentModuleLinkDialog from "@/components/documents/DocumentModuleLinkDialog";

interface DocumentType {
  id: string;
  name: string;
  ref_code?: string;
}

// Location reference code mapping
const LOCATION_REF_CODES: Record<string, string> = {
  'England': 'EN',
  'Wales': 'WA',
  'Poland': 'PL',
  'Group': 'GR'
};

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
  archived?: boolean;
  review_period_months?: number;
  location?: string;
}

interface Section {
  id: string;
  code: string;
  title: string;
  description?: string;
  parent_section_id?: string | null;
  standard_id?: string | null;
  ref_code?: string;
}

interface Standard {
  id: string;
  name: string;
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
  const [standards, setStandards] = useState<Standard[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStandard, setFilterStandard] = useState("");
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

  // Edit Section modal
  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [editSectionCode, setEditSectionCode] = useState("");
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionDescription, setEditSectionDescription] = useState("");
  const [editSectionParentId, setEditSectionParentId] = useState("");
  const [editSectionStandardId, setEditSectionStandardId] = useState("");
  const [editSectionError, setEditSectionError] = useState("");

  const { user } = useUser();

  const defaultColumnWidths = {
    reference_code: 120,
    title: 220,
    document_type: 120,
    section: 220,
    created: 95,
    review_due: 100,
    version: 70,
    view: 60,
    users: 80,
    modules: 80,
    edit: 60,
    archive: 100,
  };
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const handleColumnResize = (accessor: string, newWidth: number) => {
    setColumnWidths((prev) => ({ ...prev, [accessor]: Math.max(60, newWidth) }));
  };

  // Fetch all data - memoized callback for refresh
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch documents (no join)
      const { data: docs, error: docsErr } = await supabase
        .from("documents")
        .select("id, title, section_id, document_type_id, created_at, last_reviewed_at, current_version, reference_code, file_url, notes, archived, review_period_months");
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
        .select("id, name, ref_code");
      if (docTypesErr) console.error("Error fetching document types:", docTypesErr);

      // Map document type info into documents
      const docTypesMap = Object.fromEntries((docTypes || []).map(dt => [dt.id, dt]));
      setDocuments(
        (docs || []).filter((doc) => !doc.archived).map((doc: any) => ({
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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesSearch = !q || (doc.title || "").toLowerCase().includes(q);
      const matchesType = !filterType || doc.document_type_id === filterType;

      // If a standard is selected, check if document's section belongs to that standard
      if (filterStandard) {
        if (!doc.section_id) {
          // Document has no section, exclude it when standard filter is active
          return false;
        }
        const docSection = sections.find(s => s.id === doc.section_id);
        if (!docSection || docSection.standard_id !== filterStandard) {
          return false;
        }
      }

      // If a section is selected, document must match that section
      const matchesSection = !filterSection || doc.section_id === filterSection;

      return matchesSearch && matchesType && matchesSection;
    });
  }, [documents, search, filterType, filterStandard, filterSection, sections]);

  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterStandard, filterSection]);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const paginatedData = useMemo(() => {
    // Sort by reference_code using natural alphanumeric sorting
    const sorted = [...filtered].sort((a, b) => {
      const aRef = a.reference_code || '';
      const bRef = b.reference_code || '';
      return aRef.localeCompare(bRef, undefined, { numeric: true, sensitivity: 'base' });
    });
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
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
    
    // Clear any previous error messages
    setArchiveErrorMsg("");
    
    setButtonLoading(archiveDocId);
    await archiveDocument(archiveDocId, changeSummary);
    setButtonLoading(null);
  };

  const archiveDocument = async (id: string, summary: string) => {
    setLoading(true);
    if (!user?.auth_id) {
      setArchiveErrorMsg("Cannot archive: user not loaded. Please refresh and try again.");
      setLoading(false);
      return;
    }

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !doc) {
      setArchiveErrorMsg("Failed to fetch document for archiving.");
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
        document_type_id: doc.document_type_id,
        notes: doc.notes || null,
        section_id: doc.section_id || null,
        created_at: doc.created_at || null,
        change_summary: summary,
        change_date: new Date().toISOString(),
        archived_by_auth_id: user.auth_id,
      });

    if (archiveError) {
      console.error("Error archiving document:", archiveError);
      setArchiveErrorMsg("Failed to archive document: " + archiveError.message);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("documents")
      .update({ archived: true })
      .eq("id", id);

    if (error) {
      setArchiveErrorMsg("Failed to archive document.");
      setLoading(false);
      return;
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      // Success - close modal and show success message
      setShowArchiveModal(false);
      setArchiveDocId(null);
      setChangeSummary("");
      alert("Document archived successfully.");
    }
    setLoading(false);
  };

  // When archiving, update local state immediately
  const handleArchiveAndUpdate = async (id: string, summary: string) => {
    if (!user?.auth_id) return;

    // First, fetch the document to get all its data
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      alert("Failed to fetch document for archiving.");
      return;
    }

    // Insert into document_archive table
    const { error: archiveError } = await supabase
      .from("document_archive")
      .insert({
        document_id: doc.id,
        archived_version: doc.current_version || 1,
        title: doc.title,
        reference_code: doc.reference_code,
        file_url: doc.file_url,
        document_type_id: doc.document_type_id,
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
      return;
    }

    // Then update the documents table to mark as archived
    await supabase
      .from("documents")
      .update({ archived: true })
      .eq("id", id);

    // Update local state
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Section editor
  const handleEditSectionClick = (section: Section) => {
    setEditSection(section);
    setEditSectionCode(section.code);
    setEditSectionTitle(section.title);
    setEditSectionDescription(section.description || "");
    setEditSectionStandardId(section.standard_id || "");
    setEditSectionParentId(section.parent_section_id || "");
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

    // Validate parent-child relationship: prevent setting self as parent
    if (editSectionParentId === editSection.id) {
      setEditSectionError("A section cannot be its own parent.");
      return;
    }

    // Validate parent-child relationship: prevent circular references
    if (editSectionParentId) {
      const wouldCreateCircle = (parentId: string): boolean => {
        if (parentId === editSection.id) return true;
        const parent = sections.find(s => s.id === parentId);
        if (!parent || !parent.parent_section_id) return false;
        return wouldCreateCircle(parent.parent_section_id);
      };

      if (wouldCreateCircle(editSectionParentId)) {
        setEditSectionError("Cannot set this parent: it would create a circular reference.");
        return;
      }
    }

    setEditSectionError("");

    const { data: updateData, error } = await supabase
      .from("standard_sections")
      .update({
        code: editSectionCode.trim(),
        title: editSectionTitle.trim(),
        description: editSectionDescription,
        standard_id: editSectionStandardId || null,
        parent_section_id: editSectionParentId || null,
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

    // Refresh all data to ensure consistency
    await fetchAllData();
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
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Assignment dialog state
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignmentDocId, setAssignmentDocId] = useState<string | null>(null);
  const [assignmentDocTitle, setAssignmentDocTitle] = useState("");

  // Module link dialog state
  const [showModuleLinkDialog, setShowModuleLinkDialog] = useState(false);
  const [moduleLinkDocId, setModuleLinkDocId] = useState<string | null>(null);
  const [moduleLinkDocTitle, setModuleLinkDocTitle] = useState("");

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("documents");

  // CSV Import/Export state
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState<string | null>(null);

  // Handle CSV Download - Safari-optimized approach
  const handleDownloadCsv = useCallback(() => {
    try {
      // Define CSV headers
      const headers = [
        'id',
        'title',
        'reference_code',
        'location',
        'document_type_id',
        'document_type_name',
        'section_id',
        'section_code',
        'section_title',
        'standard_id',
        'standard_name',
        'file_url',
        'notes',
        'current_version',
        'review_period_months',
        'last_reviewed_at',
        'created_at',
        'archived'
      ];

      // Build CSV rows
      const rows = documents.map(doc => {
        const section = sections.find(s => s.id === doc.section_id);
        const standard = section?.standard_id ? standards.find(st => st.id === section.standard_id) : null;

        return [
          doc.id || '',
          `"${(doc.title || '').replace(/"/g, '""')}"`,
          doc.reference_code || '',
          doc.location || '',
          doc.document_type_id || '',
          `"${(doc.document_type_name || '').replace(/"/g, '""')}"`,
          doc.section_id || '',
          section?.code || '',
          `"${(section?.title || '').replace(/"/g, '""')}"`,
          section?.standard_id || '',
          `"${(standard?.name || '').replace(/"/g, '""')}"`,
          doc.file_url || '',
          `"${(doc.notes || '').replace(/"/g, '""')}"`,
          doc.current_version || '',
          doc.review_period_months || '',
          doc.last_reviewed_at || '',
          doc.created_at || '',
          doc.archived ? 'true' : 'false'
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const BOM = '\uFEFF'; // UTF-8 BOM for proper encoding
      const csvData = BOM + csvContent;
      const filename = `documents_export_${new Date().toISOString().slice(0, 10)}.csv`;

      // Detect Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isSafari) {
        // Safari-specific approach: Use data URL directly
        const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`;
        
        // Create and trigger download link
        const link = document.createElement('a');
        link.setAttribute('href', dataUrl);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        
        // Must be in document for Safari
        document.body.appendChild(link);
        
        // Trigger download with proper Safari event handling
        setTimeout(() => {
          link.click();
          document.body.removeChild(link);
        }, 100);
        
      } else {
        // Non-Safari browsers: Use blob approach
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      
      // Ultimate fallback: Show data in new window for manual save
      try {
        const headers = ['id', 'title', 'reference_code', 'location', 'document_type_id', 'document_type_name',
                        'section_id', 'section_code', 'section_title', 'standard_id', 'standard_name',
                        'file_url', 'notes', 'current_version', 'review_period_months',
                        'last_reviewed_at', 'created_at', 'archived'];

        const rows = documents.map(doc => {
          const section = sections.find(s => s.id === doc.section_id);
          const standard = section?.standard_id ? standards.find(st => st.id === section.standard_id) : null;
          return [
            doc.id || '', `"${(doc.title || '').replace(/"/g, '""')}"`,
            doc.reference_code || '', doc.location || '', doc.document_type_id || '',
            `"${(doc.document_type_name || '').replace(/"/g, '""')}"`,
            doc.section_id || '', section?.code || '',
            `"${(section?.title || '').replace(/"/g, '""')}"`,
            section?.standard_id || '', `"${(standard?.name || '').replace(/"/g, '""')}"`,
            doc.file_url || '', `"${(doc.notes || '').replace(/"/g, '""')}"`,
            doc.current_version || '', doc.review_period_months || '',
            doc.last_reviewed_at || '', doc.created_at || '',
            doc.archived ? 'true' : 'false'
          ].join(',');
        });
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const newWindow = window.open('', '_blank');
        
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>Documents Export - Copy and Save as CSV</title></head>
              <body style="font-family: monospace; padding: 20px;">
                <h3>Copy the text below and save as a .csv file:</h3>
                <textarea style="width: 100%; height: 400px; font-family: monospace;">${csvContent}</textarea>
                <p><em>Select all text above, copy it, and paste into a text editor. Save with .csv extension.</em></p>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          alert('Download failed and popup blocked. Please allow popups or try a different browser.');
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
        alert('Download failed completely. Please try refreshing the page or use a different browser.');
      }
    }
  }, [documents, sections, standards]);

  // Handle CSV Upload
  const handleCsvUpload = useCallback(async () => {
    if (!csvFile) {
      setCsvImportError('Please select a CSV file');
      return;
    }

    setCsvImportLoading(true);
    setCsvImportError(null);
    setCsvImportSuccess(null);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setCsvImportError('CSV file is empty or invalid');
        setCsvImportLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredFields = ['title', 'document_type_id'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));

      if (missingFields.length > 0) {
        setCsvImportError(`Missing required columns: ${missingFields.join(', ')}`);
        setCsvImportLoading(false);
        return;
      }

      // Parse CSV rows
      const updates: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV parser (handles quoted fields)
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        const row: any = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          // Remove quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          row[header] = value;
        });

        // Validate required fields
        if (!row.title || !row.document_type_id) {
          console.warn(`Skipping row ${i}: missing required fields (title, document_type_id)`);
          continue;
        }

        // Build update object with only the fields that exist in documents table
        const update: any = {
          title: row.title,
          document_type_id: row.document_type_id,
          reference_code: row.reference_code || null,
          location: row.location || null,
          section_id: row.section_id || null,
          file_url: row.file_url || null,
          notes: row.notes || null,
          current_version: row.current_version ? parseInt(row.current_version) : 1,
          review_period_months: row.review_period_months ? parseInt(row.review_period_months) : 12,
          last_reviewed_at: row.last_reviewed_at || null,
          archived: row.archived === 'true' || row.archived === '1',
        };

        // Only include id if it exists (for updates), otherwise database will auto-generate it (for inserts)
        if (row.id && row.id.trim()) {
          update.id = row.id.trim();
        }

        updates.push(update);
      }

      if (updates.length === 0) {
        setCsvImportError('No valid rows found in CSV');
        setCsvImportLoading(false);
        return;
      }

      // Update documents in database
      const { error } = await supabase
        .from('documents')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        setCsvImportError(`Database error: ${error.message}`);
        setCsvImportLoading(false);
        return;
      }

      setCsvImportSuccess(`Successfully imported ${updates.length} document(s)`);
      setCsvImportLoading(false);

      // Refresh data after 1.5 seconds
      setTimeout(() => {
        fetchAllData();
        setShowCsvUploadModal(false);
        setCsvFile(null);
        setCsvImportSuccess(null);
      }, 1500);

    } catch (error: any) {
      setCsvImportError(`Error parsing CSV: ${error.message}`);
      setCsvImportLoading(false);
    }
  }, [csvFile, fetchAllData]);

  // Define tabs
  const tabs: Tab[] = [
    {
      key: "summary",
      label: "Summary",
      icon: <FiList />,
      tooltip: "View complete document hierarchy",
    },
    {
      key: "documents",
      label: "Documents",
      icon: <FiFileText />,
      tooltip: "Manage documents",
    },
    {
      key: "archived",
      label: "Archived",
      icon: <FiArchive />,
      tooltip: "View archived documents",
    },
    {
      key: "sections",
      label: "Sections",
      icon: <FiLayers />,
      tooltip: "Manage standard sections",
    },
    {
      key: "standards",
      label: "Standards",
      icon: <FiBookOpen />,
      tooltip: "Manage compliance standards",
    },
  ];

  return (
    <>
      {loading ? (
        <p className="neon-text text-center p-8">Loading…</p>
      ) : (
        <div className="folder-container">
          <FolderTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="folder-content">
            {activeTab === "summary" && (
              <SummaryTabContent
                documents={documents}
                sections={sections}
                standards={standards}
                documentTypes={documentTypes}
                sectionsById={sectionsById}
                onRefresh={fetchAllData}
              />
            )}

            {activeTab === "documents" && (
              <DocumentsTabContent
                documents={documents}
                sections={sections}
                standards={standards}
                documentTypes={documentTypes}
                search={search}
                setSearch={setSearch}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStandard={filterStandard}
                setFilterStandard={setFilterStandard}
                filterSection={filterSection}
                setFilterSection={setFilterSection}
                loading={loading}
                buttonLoading={buttonLoading}
                setViewMode={setViewMode}
                setActiveDocId={setActiveDocId}
                fetchAllData={fetchAllData}
                filtered={filtered}
                pageSize={pageSize}
                setPageSize={setPageSize}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                handlePageSizeChange={handlePageSizeChange}
                handlePrevPage={handlePrevPage}
                handleNextPage={handleNextPage}
                paginatedData={paginatedData}
                columnWidths={columnWidths}
                handleColumnResize={handleColumnResize}
                setEditStageDocId={setEditStageDocId}
                setShowEditStageModal={setShowEditStageModal}
                sectionsById={sectionsById}
                handleEditSectionClick={handleEditSectionClick}
                handleDownloadCsv={handleDownloadCsv}
                setShowCsvUploadModal={setShowCsvUploadModal}
                showAssignmentDialog={showAssignmentDialog}
                setShowAssignmentDialog={setShowAssignmentDialog}
                assignmentDocId={assignmentDocId}
                setAssignmentDocId={setAssignmentDocId}
                assignmentDocTitle={assignmentDocTitle}
                setAssignmentDocTitle={setAssignmentDocTitle}
                showModuleLinkDialog={showModuleLinkDialog}
                setShowModuleLinkDialog={setShowModuleLinkDialog}
                moduleLinkDocId={moduleLinkDocId}
                setModuleLinkDocId={setModuleLinkDocId}
                moduleLinkDocTitle={moduleLinkDocTitle}
                setModuleLinkDocTitle={setModuleLinkDocTitle}
              />
            )}

            {activeTab === "archived" && (
              <ArchivedDocuments
                onRestore={(restored) => {
                  setDocuments((prev) => [restored, ...prev]);
                }}
              />
            )}

            {activeTab === "sections" && (
              <SectionsTabContent
                sections={sections}
                standards={standards}
                loading={loading}
                handleEditSectionClick={handleEditSectionClick}
                fetchAllData={fetchAllData}
              />
            )}

            {activeTab === "standards" && (
              <StandardsTabContent
                standards={standards}
                loading={loading}
                fetchAllData={fetchAllData}
              />
            )}
          </div>
        </div>
      )}

      {/* ===== CSV Upload Modal ===== */}
      <OverlayDialog showCloseButton={true}
        open={showCsvUploadModal}
        onClose={() => {
          setShowCsvUploadModal(false);
          setCsvFile(null);
          setCsvImportError(null);
          setCsvImportSuccess(null);
        }}
      >
        <div className="p-4" style={{ minWidth: '500px' }}>
          <h3 className="neon-heading mb-4">Upload Documents CSV</h3>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="csv-file">
              Select CSV File
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              className="neon-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCsvFile(file);
                  setCsvImportError(null);
                  setCsvImportSuccess(null);
                }
              }}
              disabled={csvImportLoading}
            />
            <p className="mt-2" style={{ opacity: 0.6 }}>
              CSV must include columns: id, title, document_type_id
            </p>
          </div>

          {csvImportError && (
            <div className="neon-error mb-4">
              {csvImportError}
            </div>
          )}

          {csvImportSuccess && (
            <div className="neon-success mb-4">
              {csvImportSuccess}
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <CustomTooltip text="Cancel upload">
              <TextIconButton
                variant="cancel"
                label="Cancel"
                onClick={() => {
                  setShowCsvUploadModal(false);
                  setCsvFile(null);
                  setCsvImportError(null);
                  setCsvImportSuccess(null);
                }}
                disabled={csvImportLoading}
              />
            </CustomTooltip>
            <CustomTooltip text="Upload and process CSV file">
              <TextIconButton
                variant="upload"
                label={csvImportLoading ? 'Importing...' : 'Import CSV'}
                onClick={handleCsvUpload}
                disabled={!csvFile || csvImportLoading}
              />
            </CustomTooltip>
          </div>
        </div>
      </OverlayDialog>

      {/* ===== Archive confirmation dialog ===== */}
      <OverlayDialog showCloseButton={true}
        open={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setArchiveDocId(null);
          setChangeSummary("");
          setButtonLoading(null);
        }}
      >
        <div className="p-6" style={{ minWidth: 380, maxWidth: 480 }}>
          <div className="flex items-center gap-2 mb-4">
            <FiArchive style={{ color: "var(--accent)", width: "24px", height: "24px" }} />
            <h2 className="neon-heading m-0">
              Archive Document
            </h2>
          </div>
          <p className="neon-text mb-4">
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
          >
            <label className="neon-label" htmlFor="changeSummary">
              Change Summary <span className="danger-text">*</span>
            </label>
            <textarea
              id="changeSummary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="neon-input mb-2 w-full"
              placeholder="Describe why this document is being archived…"
              required
              rows={3}
            />
            {archiveErrorMsg && <p className="neon-text danger-text mb-2">{archiveErrorMsg}</p>}
          </NeonForm>
        </div>
      </OverlayDialog>

      {/* ===== Add/Edit Document Sheet ===== */}
      <OverlayDialog showCloseButton={true}
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

      {/* ===== Edit Section Dialog ===== */}
      <OverlayDialog showCloseButton={true}
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
          <label className="neon-label" htmlFor="editSectionStandard">Standard</label>
          <select
            id="editSectionStandard"
            className="neon-input mb-2"
            value={editSectionStandardId}
            onChange={(e) => setEditSectionStandardId(e.target.value)}
          >
            <option value="">-- No Standard --</option>
            {standards.map((std) => (
              <option key={std.id} value={std.id}>
                {std.name}
              </option>
            ))}
          </select>
          <label className="neon-label" htmlFor="editSectionParent">Parent Section</label>
          <select
            id="editSectionParent"
            className="neon-input mb-2"
            value={editSectionParentId}
            onChange={(e) => setEditSectionParentId(e.target.value)}
          >
            <option value="">-- No Parent (Top Level) --</option>
            {sections
              .filter((s) =>
                s.id !== editSection?.id && // Cannot be its own parent
                !s.parent_section_id // Only top-level sections can be parents
              )
              .sort((a, b) => a.code.localeCompare(b.code))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code} – {sec.title}
                </option>
              ))}
          </select>
          {editSectionError && <p className="neon-text danger-text mb-2">{editSectionError}</p>}
        </NeonForm>
      </OverlayDialog>

      {/* ===== Edit Stage Modal ===== */}
      <OverlayDialog showCloseButton={true}
        open={showEditStageModal}
        onClose={() => {
          setShowEditStageModal(false);
          setEditStageDocId(null);
          setEditStage(null);
        }}
      >
        <div className="flex flex-col items-stretch" style={{ minWidth: 340, maxWidth: '100vw', width: 850 }}>
          {editStage === "archive" ? (
            <>
              <h2 className="neon-heading mb-4">Archive Document</h2>
              <p className="neon-text mb-4">
                Are you sure you want to archive this document? This action cannot be undone.<br />
                Please provide a change summary below.
              </p>
              <NeonForm
                title=""
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
                  setSuccessMessage("Document archived.");
                  setShowSuccessModal(true);
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
                  className="neon-input mb-2 w-full"
                  placeholder="Describe why this document is being archived…"
                  required
                  rows={3}
                />
                {archiveErrorMsg && <p className="neon-text danger-text mb-2">{archiveErrorMsg}</p>}
              </NeonForm>
            </>
          ) : editStage === "review" ? (
            <>
              <h2 className="neon-heading mb-4">Review Document</h2>
              <p className="neon-text mb-4">
                You confirm that there are no changes to be made to this document.<br />
                The review date will be updated.
              </p>
              <NeonForm
                title=""
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editStageDocId) return;
                  await supabase
                    .from("documents")
                    .update({ last_reviewed_at: new Date().toISOString() })
                    .eq("id", editStageDocId);
                  setShowEditStageModal(false);
                  setEditStage(null);
                  // Refresh the data to show updated review date
                  fetchAllData();
                  setSuccessMessage("Review date updated.");
                  setShowSuccessModal(true);
                }}
                submitLabel="Confirm Review"
                onCancel={() => {
                  setEditStage(null);
                }}
              >
                <></>
              </NeonForm>
            </>
          ) : editStage === "amend" ? (
            <>
              <h2 className="neon-heading mb-4">Amend Document Details</h2>
              <p className="neon-text mb-4">
                You can amend document details without changing the version, created date, or review date.
              </p>
              {editStageDocId && (
                <AmendDocumentForm
                  id={editStageDocId}
                  sections={sections}
                  onCancel={() => {
                    setEditStage(null);
                  }}
                  onSaved={() => {
                    setShowEditStageModal(false);
                    setEditStage(null);
                    setEditStageDocId(null);
                    fetchAllData();
                    setSuccessMessage("Document details updated.");
                    setShowSuccessModal(true);
                  }}
                />
              )}
            </>
          ) : (
            <>
              <h2 className="neon-heading mb-4">Edit Document</h2>
              <p className="text-center mb-4" style={{ maxWidth: 800, margin: '0 auto 16px auto' }}>
                Would you like to perform a <strong>Review</strong> (update last reviewed date), create a <strong>New Version</strong>, <strong>Amend Details</strong> (edit without changing dates/version), or <strong>Archive</strong> this document?
              </p>
              <div className="flex gap-4 w-full">
                <CustomTooltip text="Review (update last reviewed date)">
                  <TextIconButton
                    variant="refresh"
                    className="neon-btn-review"
                    label="Review"
                    aria-label="Review"
                    onClick={() => {
                      setEditStage("review");
                    }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Create New Version">
                  <TextIconButton
                    variant="edit"
                    className="neon-btn-pen-tool"
                    label="New Version"
                    aria-label="Create New Version"
                    onClick={() => {
                      setShowEditStageModal(false);
                      setActiveDocId(editStageDocId);
                      setViewMode("edit");
                    }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Amend Details (no date/version change)">
                  <TextIconButton
                    variant="list"
                    className="neon-btn-amend"
                    label="Amend Details"
                    aria-label="Amend Details"
                    onClick={() => {
                      setEditStage("amend");
                    }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Archive document">
                  <TextIconButton
                    variant="archive"
                    label="Archive"
                    aria-label="Archive document"
                    className="neon-btn-archive"
                    onClick={() => {
                      setEditStage("archive");
                    }}
                  />
                </CustomTooltip>
              </div>
            </>
          )}
        </div>
      </OverlayDialog>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
      />
    </>
  );
}

/* =========================
   Tab Content Components
   ========================= */

function SummaryTabContent({
  documents,
  sections,
  standards,
  documentTypes,
  sectionsById,
  onRefresh,
}: {
  documents: Document[];
  sections: Section[];
  standards: Standard[];
  documentTypes: DocumentType[];
  sectionsById: Record<string, Section>;
  onRefresh: () => void;
}) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  // Create lookup maps for efficient data joining
  const standardsById = useMemo(() => {
    const map: Record<string, Standard> = {};
    standards.forEach(s => { map[s.id] = s; });
    return map;
  }, [standards]);

  const typesById = useMemo(() => {
    const map: Record<string, DocumentType> = {};
    documentTypes.forEach(t => { map[t.id] = t; });
    return map;
  }, [documentTypes]);

  // Join all data together
  const summaryData = useMemo(() => {
    console.log('Summary Debug - Total documents:', documents.length);
    console.log('Summary Debug - Total sections:', sections.length);
    console.log('Summary Debug - Total standards:', standards.length);
    console.log('Summary Debug - Total document types:', documentTypes.length);

    return documents.map(doc => {
      const section = doc.section_id ? sectionsById[doc.section_id] : null;
      const standard = section?.standard_id ? standardsById[section.standard_id] : null;
      const docType = doc.document_type_id ? typesById[doc.document_type_id] : null;

      // Log missing data
      if (!section && doc.section_id) {
        console.warn('Section not found for document:', doc.title, 'section_id:', doc.section_id);
      }
      if (!docType && doc.document_type_id) {
        console.warn('Document type not found for document:', doc.title, 'document_type_id:', doc.document_type_id);
      }
      if (!doc.section_id) {
        console.warn('Document has no section_id:', doc.title);
      }
      if (!doc.document_type_id) {
        console.warn('Document has no document_type_id:', doc.title);
      }

      // Calculate review due date
      // Use last_reviewed_at if available, otherwise use created_at
      let reviewDue = '—';
      const baseDate = doc.last_reviewed_at || doc.created_at;
      if (baseDate && doc.review_period_months) {
        const reviewDate = new Date(baseDate);
        reviewDate.setMonth(reviewDate.getMonth() + doc.review_period_months);
        reviewDue = reviewDate.toLocaleDateString();
      }

      return {
        id: doc.id,
        standard_name: standard?.name || '—',
        section_code: section?.code || '—',
        section_title: section?.title || '—',
        document_reference: doc.reference_code || '—',
        document_title: doc.title,
        document_type: docType?.name || '—',
        version: doc.current_version || '—',
        last_reviewed: doc.last_reviewed_at
          ? new Date(doc.last_reviewed_at).toLocaleDateString()
          : '—',
        review_due: reviewDue,
        created_at: doc.created_at
          ? new Date(doc.created_at).toLocaleDateString()
          : '—',
        has_complete_data: !!(section && docType && standard),
      };
    });
  }, [documents, sectionsById, standardsById, typesById, sections, standards, documentTypes]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStandard, setFilterStandard] = useState("");
  const [filterType, setFilterType] = useState("");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort summary data
  const filteredSummary = useMemo(() => {
    let filtered = summaryData.filter(item => {
      const matchesSearch = !searchTerm ||
        item.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.document_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section_title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStandard = !filterStandard || item.standard_name === filterStandard;
      const matchesType = !filterType || item.document_type === filterType;

      return matchesSearch && matchesStandard && matchesType;
    });

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn as keyof typeof a];
        let bVal = b[sortColumn as keyof typeof b];

        // Handle null/undefined/dash values
        if (aVal === '—' || aVal === null || aVal === undefined) aVal = '';
        if (bVal === '—' || bVal === null || bVal === undefined) bVal = '';

        // Convert to strings for natural alphanumeric comparison
        const aStr = String(aVal);
        const bStr = String(bVal);

        // Use localeCompare with numeric option for proper alphanumeric sorting
        const result = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  }, [summaryData, searchTerm, filterStandard, filterType, sortColumn, sortDirection]);

  // Count documents with incomplete data
  const incompleteCount = useMemo(() => {
    return summaryData.filter(item => !item.has_complete_data).length;
  }, [summaryData]);

  // Handle edit start
  const handleEditStart = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const section = doc.section_id ? sectionsById[doc.section_id] : null;

    setEditValues({
      id: doc.id,
      title: doc.title,
      reference_code: doc.reference_code || '',
      document_type_id: doc.document_type_id,
      section_id: doc.section_id || '',
      standard_id: section?.standard_id || '',
    });
    setEditingRow(docId);
  };

  // Handle save
  const handleSave = async () => {
    if (!editingRow) return;

    setSaving(true);
    try {
      // Update document
      const { error: docError } = await supabase
        .from('documents')
        .update({
          title: editValues.title,
          reference_code: editValues.reference_code,
          document_type_id: editValues.document_type_id,
          section_id: editValues.section_id || null,
        })
        .eq('id', editValues.id);

      if (docError) {
        console.error('Error updating document:', docError);
        alert(`Failed to update document: ${docError.message}`);
        setSaving(false);
        return;
      }

      // Show success modal
      setSuccessMessage(`Successfully updated document "${editValues.title}"`);
      setShowSuccessModal(true);

      // Reset editing state
      setEditingRow(null);
      setEditValues({});
      setSaving(false);

      // Refresh data after a short delay to show success message
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`Failed to save: ${error.message}`);
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingRow(null);
    setEditValues({});
  };

  // Filter sections based on selected standard in edit mode
  const filteredEditSections = useMemo(() => {
    if (!editValues.standard_id) return [];
    return sections.filter(s => s.standard_id === editValues.standard_id);
  }, [sections, editValues.standard_id]);

  const hasActiveFilters = searchTerm || filterStandard || filterType;
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStandard('');
    setFilterType('');
  };

  return (
    <div>
      {incompleteCount > 0 && (
        <div className="p-3 mb-4 text-sm" style={{
          background: 'rgba(255, 170, 0, 0.1)',
          border: '1px solid rgba(255, 170, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <strong>⚠️ Incomplete Data Warning:</strong> {incompleteCount} of {summaryData.length} documents are missing standard, section, or type information.
        </div>
      )}

      {/* Compact Toolbar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 160px 140px auto 1fr auto auto',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '1rem 0.75rem',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0 0 8px 8px',
        marginTop: '0',
        marginBottom: '1rem',
        minHeight: '72px'
      }}>
        {/* Search */}
        <input
          id="summary-search"
          type="text"
          className="neon-input"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '200px' }}
        />

        {/* Filters */}
        <select
          id="summary-standard-filter"
          className="neon-input"
          value={filterStandard}
          onChange={(e) => setFilterStandard(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="">All Standards</option>
          {standards.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select
          id="summary-type-filter"
          className="neon-input"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ width: '140px' }}
        >
          <option value="">All Types</option>
          {documentTypes.map(t => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <CustomTooltip text="Clear all filters">
            <TextIconButton
              variant="cancel"
              label="Clear"
              onClick={clearFilters}
            />
          </CustomTooltip>
        )}

        {/* Empty cell when no Clear button */}
        {!hasActiveFilters && <div />}

        {/* Spacer column - takes remaining space */}
        <div />

        {/* Result Count */}
        <span style={{ opacity: 0.7, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
          {filteredSummary.length} of {summaryData.length}
        </span>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <CustomTooltip text="Refresh">
            <TextIconButton
              variant="refresh"
              label="Refresh"
              aria-label="Refresh data"
              onClick={onRefresh}
            />
          </CustomTooltip>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="p-4" style={{
          background: 'rgba(0, 255, 170, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 170, 0.2)'
        }}>
          <div className="mb-1" style={{ opacity: 0.6 }}>
            Total Documents
          </div>
          <div className="text-xl font-bold">
            {filteredSummary.length}
          </div>
        </div>

        <div className="p-4" style={{
          background: 'rgba(0, 200, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 200, 255, 0.2)'
        }}>
          <div className="mb-1" style={{ opacity: 0.6 }}>
            Standards
          </div>
          <div className="text-xl font-bold">
            {standards.length}
          </div>
        </div>

        <div className="p-4" style={{
          background: 'rgba(255, 170, 0, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 170, 0, 0.2)'
        }}>
          <div className="mb-1" style={{ opacity: 0.6 }}>
            Sections
          </div>
          <div className="text-xl font-bold">
            {sections.length}
          </div>
        </div>

        <div className="p-4" style={{
          background: 'rgba(170, 0, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(170, 0, 255, 0.2)'
        }}>
          <div className="mb-1" style={{ opacity: 0.6 }}>
            Document Types
          </div>
          <div className="text-xl font-bold">
            {documentTypes.length}
          </div>
        </div>
      </div>

      {/* Editable Summary Table */}
      <div className="overflow-x-auto">
        <table className="neon-table w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative'
                }}
                onClick={() => handleSort('standard_name')}
              >
                <div className="flex items-center gap-2">
                  Standard
                  {sortColumn === 'standard_name' && (
                    <span>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('section_code')}
              >
                <div className="flex items-center justify-center gap-2">
                  Section
                  {sortColumn === 'section_code' && (
                    <span>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('document_reference')}
              >
                <div className="flex items-center gap-2">
                  Doc Ref
                  {sortColumn === 'document_reference' && (
                    <span>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('document_title')}
              >
                <div className="flex items-center gap-2">
                  Document Title
                  {sortColumn === 'document_title' && (
                    <span>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('document_type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  {sortColumn === 'document_type' && (
                    <span>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('review_due')}
              >
                <div className="flex items-center justify-center gap-2">
                  Review Due
                  {sortColumn === 'review_due' && (
                    <span>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid rgba(0, 255, 170, 0.2)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSummary.map((item) => {
              const isEditing = editingRow === item.id;
              const doc = documents.find(d => d.id === item.id);
              const currentSection = doc?.section_id ? sectionsById[doc.section_id] : null;

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(0, 255, 170, 0.1)' }}>
                  {/* Standard */}
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        className="neon-input"
                        style={{ padding: '0.25rem 0.5rem' }}
                        value={editValues.standard_id || ''}
                        onChange={(e) => {
                          setEditValues({
                            ...editValues,
                            standard_id: e.target.value,
                            section_id: '', // Reset section when standard changes
                          });
                        }}
                      >
                        <option value="">Select Standard</option>
                        {standards.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        {item.standard_name}
                      </div>
                    )}
                  </td>

                  {/* Section */}
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        className="neon-input"
                        style={{ padding: '0.25rem 0.5rem' }}
                        value={editValues.section_id || ''}
                        onChange={(e) => setEditValues({ ...editValues, section_id: e.target.value })}
                        disabled={!editValues.standard_id}
                      >
                        <option value="">Select Section</option>
                        {filteredEditSections
                          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.code} – {s.title}</option>
                          ))
                        }
                      </select>
                    ) : (
                      <div>
                        <div className="text-center">{item.section_code}</div>
                        <div style={{ textAlign: 'center', opacity: 0.6 }}>{item.section_title}</div>
                      </div>
                    )}
                  </td>

                  {/* Document Reference */}
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="text"
                        className="neon-input"
                        style={{ padding: '0.25rem 0.5rem', fontFamily: 'monospace' }}
                        value={editValues.reference_code || ''}
                        onChange={(e) => setEditValues({ ...editValues, reference_code: e.target.value })}
                      />
                    ) : (
                      <div style={{ fontFamily: 'monospace' }}>
                        {item.document_reference}
                      </div>
                    )}
                  </td>

                  {/* Document Title */}
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="text"
                        className="neon-input"
                        style={{ padding: '0.25rem 0.5rem' }}
                        value={editValues.title || ''}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                      />
                    ) : (
                      <div>{item.document_title}</div>
                    )}
                  </td>

                  {/* Document Type */}
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        className="neon-input"
                        style={{ padding: '0.25rem 0.5rem' }}
                        value={editValues.document_type_id || ''}
                        onChange={(e) => setEditValues({ ...editValues, document_type_id: e.target.value })}
                      >
                        <option value="">Select Type</option>
                        {documentTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(170, 0, 255, 0.1)',
                        border: '1px solid rgba(170, 0, 255, 0.3)',
                        borderRadius: '4px'
                      }}>
                        {item.document_type}
                      </div>
                    )}
                  </td>

                  {/* Review Due */}
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div>{item.review_due}</div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <CustomTooltip text="Save changes">
                          <TextIconButton
                            variant="save"
                            label="Save"
                            aria-label="Save"
                            onClick={handleSave}
                            disabled={saving}
                          />
                        </CustomTooltip>
                        <CustomTooltip text="Cancel editing">
                          <TextIconButton
                            variant="cancel"
                            label="Cancel"
                            aria-label="Cancel"
                            onClick={handleCancel}
                            disabled={saving}
                          />
                        </CustomTooltip>
                      </div>
                    ) : (
                      <CustomTooltip text="Edit document">
                        <TextIconButton
                          variant="edit"
                          label="Edit"
                          aria-label="Edit"
                          onClick={() => handleEditStart(item.id)}
                        />
                      </CustomTooltip>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredSummary.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          opacity: 0.6
        }}>
          No documents found matching the current filters.
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
      />
    </div>
  );
}

function DocumentsTabContent({
  documents,
  sections,
  standards,
  documentTypes,
  search,
  setSearch,
  filterType,
  setFilterType,
  filterStandard,
  setFilterStandard,
  filterSection,
  setFilterSection,
  loading,
  buttonLoading,
  setViewMode,
  setActiveDocId,
  fetchAllData,
  filtered,
  pageSize,
  currentPage,
  totalPages,
  handlePageSizeChange,
  handlePrevPage,
  handleNextPage,
  paginatedData,
  columnWidths,
  handleColumnResize,
  setEditStageDocId,
  setShowEditStageModal,
  sectionsById,
  handleEditSectionClick,
  handleDownloadCsv,
  setShowCsvUploadModal,
  showAssignmentDialog,
  setShowAssignmentDialog,
  assignmentDocId,
  setAssignmentDocId,
  assignmentDocTitle,
  setAssignmentDocTitle,
  showModuleLinkDialog,
  setShowModuleLinkDialog,
  moduleLinkDocId,
  setModuleLinkDocId,
  moduleLinkDocTitle,
  setModuleLinkDocTitle,
}: any) {
  // Filter sections based on selected standard
  const filteredSections = useMemo(() => {
    if (!filterStandard) return sections;
    return sections.filter((s: Section) => s.standard_id === filterStandard);
  }, [sections, filterStandard]);

  // Clear section filter when standard changes
  useEffect(() => {
    if (filterStandard && filterSection) {
      const sectionStillValid = filteredSections.some((s: Section) => s.id === filterSection);
      if (!sectionStillValid) {
        setFilterSection("");
      }
    }
  }, [filterStandard, filterSection, filteredSections, setFilterSection]);

  const hasActiveFilters = filterType || filterStandard || filterSection || search;

  const clearAllFilters = () => {
    setFilterType("");
    setFilterStandard("");
    setFilterSection("");
    setSearch("");
  };

  return (
    <>
      {/* Compact Toolbar */}
      <div className="document-section-table-wrapper">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr auto auto auto',
          gridTemplateRows: 'auto auto',
          gap: '0.75rem',
          alignItems: 'center',
          padding: '1rem 0.75rem',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0 0 8px 8px',
          marginTop: '0',
          marginBottom: '1rem'
        }}>
          {/* Row 1: Search, Result Count, Action Buttons, Pagination */}
          {/* Search */}
          <input
            id="table-search"
            className="neon-input"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '200px' }}
          />

          {/* Result Count */}
          <span style={{ opacity: 0.7, fontSize: '0.875rem', whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {filtered.length} of {documents.length}
          </span>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <CustomTooltip text="Download CSV">
              <TextIconButton
                variant="download"
                label="Download CSV"
                aria-label="Download CSV"
                onClick={handleDownloadCsv}
                disabled={documents.length === 0}
              />
            </CustomTooltip>
            <CustomTooltip text="Upload CSV">
              <TextIconButton
                variant="upload"
                label="Upload CSV"
                aria-label="Upload CSV"
                onClick={() => setShowCsvUploadModal(true)}
              />
            </CustomTooltip>
            <CustomTooltip
              text={
                filterSection
                  ? `Edit section: ${
                      sections.find((s: Section) => s.id === filterSection)?.code || ""
                    } – ${
                      sections.find((s: Section) => s.id === filterSection)?.title || ""
                    }`
                  : "Select a section to edit"
              }
            >
              <TextIconButton
                variant="edit"
                label="Edit Section"
                aria-label="Edit selected section"
                onClick={() => {
                  const section = sections.find((s: Section) => s.id === filterSection);
                  if (section) handleEditSectionClick(section);
                }}
                disabled={!filterSection}
              />
            </CustomTooltip>
            <CustomTooltip text="Add Document">
              <TextIconButton
                variant="add"
                label="Add Document"
                aria-label="Add Document"
                onClick={() => { setActiveDocId(null); setViewMode("add"); }}
                disabled={!!buttonLoading}
              />
            </CustomTooltip>
            <CustomTooltip text="Refresh">
              <TextIconButton
                variant="refresh"
                label="Refresh"
                aria-label="Refresh data"
                onClick={fetchAllData}
                disabled={loading}
              />
            </CustomTooltip>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="neon-input"
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ width: '90px' }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <CustomTooltip text="Previous page">
                <TextIconButton
                  variant="back"
                  label="Previous"
                  aria-label="Previous page"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                />
              </CustomTooltip>
              <span style={{ padding: '0 0.5rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                {currentPage}/{totalPages}
              </span>
              <CustomTooltip text="Next page">
                <TextIconButton
                  variant="next"
                  label="Next"
                  aria-label="Next page"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                />
              </CustomTooltip>
            </div>
          </div>

          {/* Row 2: Filters */}
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="neon-input"
              style={{ width: '140px' }}
            >
              <option value="">All Types</option>
              {documentTypes.map((dt: DocumentType) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>

            <select
              id="filterStandard"
              value={filterStandard}
              onChange={(e) => {
                setFilterStandard(e.target.value);
                if (e.target.value !== filterStandard) {
                  setFilterSection("");
                }
              }}
              className="neon-input"
              style={{ width: '160px' }}
            >
              <option value="">All Standards</option>
              {standards.map((std: Standard) => (
                <option key={std.id} value={std.id}>{std.name}</option>
              ))}
            </select>

            <select
              id="filterSection"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="neon-input"
              disabled={!filterStandard}
              style={{ width: '200px' }}
            >
              <option value="">{filterStandard ? "All Sections" : "Select standard first"}</option>
              {filteredSections
                .slice()
                .sort((a: Section, b: Section) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                .map((s: Section) => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.title}
                  </option>
                ))}
            </select>

            {hasActiveFilters && (
              <CustomTooltip text="Clear all filters">
                <TextIconButton
                  variant="cancel"
                  label="Clear"
                  onClick={clearAllFilters}
                />
              </CustomTooltip>
            )}
          </div>
        </div>

        <NeonTable
          columns={[
            { header: "Doc Ref", accessor: "reference_code", width: columnWidths.reference_code },
            { header: "Title", accessor: "title", width: columnWidths.title },
            { header: "Type", accessor: "document_type", width: columnWidths.document_type },
            { header: "Section", accessor: "section", width: columnWidths.section },
            { header: "Created", accessor: "created", width: columnWidths.created },
            { header: "Review Due", accessor: "review_due", width: 95 },
            { header: "Version", accessor: "version", width: columnWidths.version },
            { header: "View", accessor: "view", width: 60 },
            { header: "Users", accessor: "users", width: 70 },
            { header: "Modules", accessor: "modules", width: 80 },
            { header: "Edit", accessor: "edit", width: columnWidths.edit },
          ]}
          data={paginatedData
            .filter(
              (doc: Document) =>
                isValidUUID(doc.id) &&
                (!doc.section_id || isValidUUID(doc.section_id)),
            )
            .map((doc: Document) => {
              const section = doc.section_id ? sectionsById[doc.section_id] : undefined;
              return {
                reference_code: doc.reference_code || "—",
                title: doc.title,
                document_type: (
                  <div className="document-type-cell">
                    {doc.document_type_name || "—"}
                  </div>
                ),
                section: section ? `${section.code} – ${section.title}` : "—",
                created: doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-GB") : "—",
                review_due: (() => {
                  let reviewDue = "—";
                  // Use last_reviewed_at if available, otherwise use created_at
                  const baseDate = doc.last_reviewed_at || doc.created_at;
                  if (baseDate && doc.review_period_months) {
                    const d = new Date(baseDate);
                    d.setMonth(d.getMonth() + doc.review_period_months);
                    reviewDue = d.toLocaleDateString("en-GB");
                  }
                  return <div className="document-review-due-cell">{reviewDue}</div>;
                })(),
                version: <div className="document-version-cell">{doc.current_version || "—"}</div>,
                view: (
                  <div className="document-view-cell">
                    <CustomTooltip text="View document">
                      <TextIconButton
                        variant="view"
                        label="View"
                        aria-label="View document"
                        title=""
                        onClick={() => {
                          if (doc.file_url) {
                            window.open(doc.file_url, '_blank');
                          } else {
                            alert('No file URL available for this document');
                          }
                        }}
                        disabled={!doc.file_url}
                      />
                    </CustomTooltip>
                  </div>
                ),
                users: (
                  <div className="document-users-cell">
                    <CustomTooltip text="View assigned users">
                      <TextIconButton
                        variant="addUser"
                        label="Users"
                        aria-label="View assigned users"
                        title=""
                        onClick={() => {
                          setAssignmentDocId(doc.id);
                          setAssignmentDocTitle(doc.title);
                          setShowAssignmentDialog(true);
                        }}
                      />
                    </CustomTooltip>
                  </div>
                ),
                modules: (
                  <div className="document-modules-cell">
                    <CustomTooltip text="Link training modules">
                      <TextIconButton
                        variant="list"
                        label="Modules"
                        aria-label="Link training modules"
                        title=""
                        onClick={() => {
                          setModuleLinkDocId(doc.id);
                          setModuleLinkDocTitle(doc.title);
                          setShowModuleLinkDialog(true);
                        }}
                      />
                    </CustomTooltip>
                  </div>
                ),
                edit: (
                  <div className="document-edit-cell">
                    <CustomTooltip text="Edit document">
                      <TextIconButton
                        variant="edit"
                        label="Edit"
                        aria-label="Edit document"
                        title=""
                        onClick={() => {
                          setEditStageDocId(doc.id);
                          setShowEditStageModal(true);
                        }}
                      />
                    </CustomTooltip>
                  </div>
                ),
              };
            })}
          onColumnResize={handleColumnResize}
        />
      </div>

      {/* Document Assignment Dialog */}
      {assignmentDocId && (
        <DocumentAssignmentDialog
          open={showAssignmentDialog}
          onClose={() => {
            setShowAssignmentDialog(false);
            setAssignmentDocId(null);
            setAssignmentDocTitle("");
          }}
          documentId={assignmentDocId}
          documentTitle={assignmentDocTitle}
        />
      )}

      {/* Document Module Link Dialog */}
      {moduleLinkDocId && (
        <DocumentModuleLinkDialog
          open={showModuleLinkDialog}
          onClose={() => {
            setShowModuleLinkDialog(false);
            setModuleLinkDocId(null);
            setModuleLinkDocTitle("");
          }}
          documentId={moduleLinkDocId}
          documentTitle={moduleLinkDocTitle}
        />
      )}
    </>
  );
}

function SectionsTabContent({
  sections,
  standards,
  loading,
  handleEditSectionClick,
  fetchAllData,
}: {
  sections: Section[];
  standards: Standard[];
  loading: boolean;
  handleEditSectionClick: (section: Section) => void;
  fetchAllData: () => void;
}) {
  const [searchSection, setSearchSection] = useState("");
  const [filterType, setFilterType] = useState<"all" | "parent" | "child">("all");
  const [filterStandard, setFilterStandard] = useState("");

  // Add Section modal state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionCode, setNewSectionCode] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newSectionStandardId, setNewSectionStandardId] = useState<string>('');
  const [addSectionError, setAddSectionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter and search sections
  const filteredSections = useMemo(() => {
    const searchLower = searchSection.trim().toLowerCase();

    return sections.filter(section => {
      // Standard filter
      if (filterStandard && section.standard_id !== filterStandard) return false;

      // Type filter
      if (filterType === "parent" && section.parent_section_id) return false;
      if (filterType === "child" && !section.parent_section_id) return false;

      // Search filter
      if (searchLower) {
        const matchesCode = section.code.toLowerCase().includes(searchLower);
        const matchesTitle = section.title.toLowerCase().includes(searchLower);
        const matchesDescription = section.description?.toLowerCase().includes(searchLower);
        return matchesCode || matchesTitle || matchesDescription;
      }

      return true;
    });
  }, [sections, searchSection, filterType, filterStandard]);

  // Separate parent sections from child sections
  const parentSections = filteredSections.filter(s => !s.parent_section_id);
  const childSections = filteredSections.filter(s => s.parent_section_id);

  const hasActiveFilters = searchSection || filterStandard || filterType !== "all";

  const clearAllFilters = () => {
    setSearchSection("");
    setFilterStandard("");
    setFilterType("all");
  };

  // Handle add section
  const handleAddSectionClick = () => {
    setNewSectionCode('');
    setNewSectionTitle('');
    setNewSectionDescription('');
    setNewSectionStandardId('');
    setAddSectionError('');
    setShowAddSectionModal(true);
  };

  const handleAddSectionSubmit = async () => {
    if (!newSectionCode.trim()) {
      setAddSectionError('Section code is required');
      return;
    }
    if (!newSectionTitle.trim()) {
      setAddSectionError('Section title is required');
      return;
    }
    if (!newSectionStandardId) {
      setAddSectionError('Please select a standard');
      return;
    }

    setSaving(true);
    setAddSectionError('');

    try {
      const { data: newSection, error } = await supabase
        .from('standard_sections')
        .insert({
          code: newSectionCode.trim(),
          title: newSectionTitle.trim(),
          description: newSectionDescription.trim() || null,
          standard_id: newSectionStandardId,
          parent_section_id: null,
        })
        .select()
        .single();

      if (error) {
        setAddSectionError(error.message);
        setSaving(false);
        return;
      }

      // Close modal and refresh data
      setShowAddSectionModal(false);
      setSaving(false);
      fetchAllData();

      setSuccessMessage(`Successfully created section "${newSectionCode} - ${newSectionTitle}"`);
      setShowSuccessModal(true);
    } catch (error: any) {
      setAddSectionError(error.message);
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Compact Toolbar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0 0 8px 8px',
        marginTop: '0',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <input
          id="section-search"
          className="neon-input"
          placeholder="Search sections..."
          value={searchSection}
          onChange={(e) => setSearchSection(e.target.value)}
          style={{ width: '200px' }}
        />

        {/* Filters */}
        <select
          id="section-standard-filter"
          value={filterStandard}
          onChange={(e) => setFilterStandard(e.target.value)}
          className="neon-input"
          style={{ width: '160px' }}
        >
          <option value="">All Standards</option>
          {standards.map((std) => (
            <option key={std.id} value={std.id}>{std.name}</option>
          ))}
        </select>

        <select
          id="section-type-filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "parent" | "child")}
          className="neon-input"
          style={{ width: '160px' }}
        >
          <option value="all">All Sections</option>
          <option value="parent">Parent Only</option>
          <option value="child">Child Only</option>
        </select>

        {hasActiveFilters && (
          <CustomTooltip text="Clear all filters">
            <TextIconButton
              variant="cancel"
              label="Clear"
              onClick={clearAllFilters}
            />
          </CustomTooltip>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: '20px' }} />

        {/* Result Count */}
        <span style={{ opacity: 0.7, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
          {filteredSections.length} of {sections.length}
        </span>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <CustomTooltip text="Add Section">
            <TextIconButton
              variant="add"
              label="Add Section"
              aria-label="Add section"
              onClick={handleAddSectionClick}
            />
          </CustomTooltip>
          <CustomTooltip text="Refresh">
            <TextIconButton
              variant="refresh"
              label="Refresh"
              aria-label="Refresh sections"
              onClick={fetchAllData}
              disabled={loading}
            />
          </CustomTooltip>
        </div>
      </div>

      {loading ? (
        <p className="neon-text text-center p-8">Loading sections…</p>
      ) : filteredSections.length === 0 ? (
        <p className="neon-text text-center p-8" style={{ opacity: 0.6 }}>
          No sections found matching your filters.
        </p>
      ) : (
        <>
          {(filterType === "all" || filterType === "parent") && parentSections.length > 0 && (
            <div className="mb-8">
              <h4 className="neon-label" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                Parent Sections ({parentSections.length})
              </h4>
              <NeonTable
                columns={[
                  { header: "Code", accessor: "code", width: 100 },
                  { header: "Title", accessor: "title", width: 300 },
                  { header: "Description", accessor: "description", width: 400 },
                  { header: "Edit", accessor: "edit", width: 80 },
                ]}
                data={parentSections
                  .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                  .map(section => ({
                    code: section.code,
                    title: section.title,
                    description: section.description || "—",
                    edit: (
                      <CustomTooltip text="Edit section">
                        <TextIconButton
                          variant="edit"
                          label="Edit"
                          aria-label="Edit section"
                          onClick={() => handleEditSectionClick(section)}
                        />
                      </CustomTooltip>
                    ),
                  }))}
              />
            </div>
          )}

          {(filterType === "all" || filterType === "child") && childSections.length > 0 && (
            <div>
              <h4 className="neon-label" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                Child Sections ({childSections.length})
              </h4>
              <NeonTable
                columns={[
                  { header: "Code", accessor: "code", width: 100 },
                  { header: "Title", accessor: "title", width: 300 },
                  { header: "Description", accessor: "description", width: 400 },
                  { header: "Edit", accessor: "edit", width: 80 },
                ]}
                data={childSections
                  .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                  .map(section => ({
                    code: section.code,
                    title: section.title,
                    description: section.description || "—",
                    edit: (
                      <CustomTooltip text="Edit section">
                        <TextIconButton
                          variant="edit"
                          label="Edit"
                          aria-label="Edit section"
                          onClick={() => handleEditSectionClick(section)}
                        />
                      </CustomTooltip>
                    ),
                  }))}
              />
            </div>
          )}
        </>
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
      />

      {/* Add Section Modal */}
      <OverlayDialog showCloseButton={true}
        open={showAddSectionModal}
        onClose={() => {
          setShowAddSectionModal(false);
          setNewSectionCode('');
          setNewSectionTitle('');
          setNewSectionDescription('');
          setNewSectionStandardId('');
          setAddSectionError('');
        }}
      >
        <div className="p-6" style={{ minWidth: '500px' }}>
          <h3 className="neon-heading mb-4">
            Add New Section
          </h3>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="new-section-standard">
              Standard *
            </label>
            <select
              id="new-section-standard"
              className="neon-input"
              value={newSectionStandardId}
              onChange={(e) => {
                setNewSectionStandardId(e.target.value);
                setAddSectionError('');
              }}
              disabled={saving}
            >
              <option value="">Select Standard</option>
              {standards.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="new-section-code">
              Section Code *
            </label>
            <input
              id="new-section-code"
              type="text"
              className="neon-input"
              placeholder="e.g., 1.1, 2.3, HSE-10"
              value={newSectionCode}
              onChange={(e) => {
                setNewSectionCode(e.target.value);
                setAddSectionError('');
              }}
              disabled={saving}
            />
          </div>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="new-section-title">
              Section Title *
            </label>
            <input
              id="new-section-title"
              type="text"
              className="neon-input"
              placeholder="e.g., Product Design and Development"
              value={newSectionTitle}
              onChange={(e) => {
                setNewSectionTitle(e.target.value);
                setAddSectionError('');
              }}
              disabled={saving}
            />
          </div>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="new-section-description">
              Description (Optional)
            </label>
            <textarea
              id="new-section-description"
              className="neon-input"
              placeholder="Additional details about this section..."
              value={newSectionDescription}
              onChange={(e) => setNewSectionDescription(e.target.value)}
              disabled={saving}
              rows={3}
            />
          </div>

          {addSectionError && (
            <div className="neon-error mb-4">
              {addSectionError}
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <CustomTooltip text="Cancel">
              <TextIconButton
                variant="cancel"
                label="Cancel"
                onClick={() => {
                  setShowAddSectionModal(false);
                  setNewSectionCode('');
                  setNewSectionTitle('');
                  setNewSectionDescription('');
                  setNewSectionStandardId('');
                  setAddSectionError('');
                }}
                disabled={saving}
              />
            </CustomTooltip>
            <CustomTooltip text="Create section">
              <TextIconButton
                variant="save"
                label={saving ? 'Creating...' : 'Create Section'}
                onClick={handleAddSectionSubmit}
                disabled={!newSectionCode.trim() || !newSectionTitle.trim() || !newSectionStandardId || saving}
              />
            </CustomTooltip>
          </div>
        </div>
      </OverlayDialog>
    </div>
  );
}

function StandardsTabContent({
  standards,
  loading,
  fetchAllData,
}: {
  standards: Standard[];
  loading: boolean;
  fetchAllData: () => void;
}) {
  const [searchStandard, setSearchStandard] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);
  const [standardName, setStandardName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter standards
  const filteredStandards = useMemo(() => {
    const searchLower = searchStandard.trim().toLowerCase();
    if (!searchLower) return standards;
    return standards.filter(std => std.name.toLowerCase().includes(searchLower));
  }, [standards, searchStandard]);

  const handleAdd = async () => {
    if (!standardName.trim()) {
      setError("Standard name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("document_standard")
      .insert({ name: standardName.trim() });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setStandardName("");
    setShowAddModal(false);
    fetchAllData();
  };

  const handleEdit = async () => {
    if (!editingStandard || !standardName.trim()) {
      setError("Standard name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("document_standard")
      .update({ name: standardName.trim() })
      .eq("id", editingStandard.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setStandardName("");
    setEditingStandard(null);
    setShowEditModal(false);
    fetchAllData();
  };

  const handleDelete = async (standard: Standard) => {
    if (!confirm(`Are you sure you want to delete "${standard.name}"? This may affect associated sections and documents.`)) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("document_standard")
      .delete()
      .eq("id", standard.id);

    if (deleteError) {
      alert(`Error deleting standard: ${deleteError.message}`);
      return;
    }

    fetchAllData();
  };

  const openEditModal = (standard: Standard) => {
    setEditingStandard(standard);
    setStandardName(standard.name);
    setError(null);
    setShowEditModal(true);
  };

  return (
    <div>
      {/* Compact Toolbar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0 0 8px 8px',
        marginTop: '0',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <input
          id="standard-search"
          className="neon-input"
          placeholder="Search standards..."
          value={searchStandard}
          onChange={(e) => setSearchStandard(e.target.value)}
          style={{ width: '200px' }}
        />

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: '20px' }} />

        {/* Result Count */}
        <span style={{ opacity: 0.7, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
          {filteredStandards.length} of {standards.length}
        </span>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <CustomTooltip text="Add Standard">
            <TextIconButton
              variant="add"
              label="Add Standard"
              aria-label="Add standard"
              onClick={() => {
                setStandardName("");
                setError(null);
                setShowAddModal(true);
              }}
            />
          </CustomTooltip>
          <CustomTooltip text="Refresh">
            <TextIconButton
              variant="refresh"
              label="Refresh"
              aria-label="Refresh standards"
              onClick={fetchAllData}
              disabled={loading}
            />
          </CustomTooltip>
        </div>
      </div>

      {loading ? (
        <p className="neon-text text-center p-8">Loading standards…</p>
      ) : filteredStandards.length === 0 ? (
        <p className="neon-text text-center p-8" style={{ opacity: 0.6 }}>
          {searchStandard ? 'No standards found matching your search.' : 'No standards found. Add one to get started.'}
        </p>
      ) : (
        <NeonTable
          columns={[
            { header: "Standard Name", accessor: "name", width: 400 },
            { header: "Actions", accessor: "actions", width: 120 },
          ]}
          data={filteredStandards
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(standard => ({
              name: standard.name,
              actions: (
                <div className="flex gap-2 justify-center">
                  <CustomTooltip text="Edit standard">
                    <TextIconButton
                      variant="edit"
                      label="Edit"
                      aria-label="Edit standard"
                      onClick={() => openEditModal(standard)}
                    />
                  </CustomTooltip>
                  <CustomTooltip text="Delete standard">
                    <TextIconButton
                      variant="delete"
                      label="Delete"
                      aria-label="Delete standard"
                      onClick={() => handleDelete(standard)}
                    />
                  </CustomTooltip>
                </div>
              ),
            }))}
        />
      )}

      {/* Add Standard Modal */}
      <OverlayDialog showCloseButton={true}
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setStandardName("");
          setError(null);
        }}
      >
        <div className="p-4" style={{ minWidth: '400px' }}>
          <h3 className="neon-heading mb-4">Add New Standard</h3>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="new-standard-name">
              Standard Name *
            </label>
            <input
              id="new-standard-name"
              type="text"
              className="neon-input"
              placeholder="e.g., ISO 9001, OHSAS 18001"
              value={standardName}
              onChange={(e) => {
                setStandardName(e.target.value);
                setError(null);
              }}
              disabled={saving}
              autoFocus
            />
          </div>

          {error && (
            <div className="neon-error mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <CustomTooltip text="Cancel">
              <TextIconButton
                variant="cancel"
                label="Cancel"
                onClick={() => {
                  setShowAddModal(false);
                  setStandardName("");
                  setError(null);
                }}
                disabled={saving}
              />
            </CustomTooltip>
            <CustomTooltip text="Add standard">
              <TextIconButton
                variant="save"
                label={saving ? 'Adding...' : 'Add Standard'}
                onClick={handleAdd}
                disabled={!standardName.trim() || saving}
              />
            </CustomTooltip>
          </div>
        </div>
      </OverlayDialog>

      {/* Edit Standard Modal */}
      <OverlayDialog showCloseButton={true}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStandard(null);
          setStandardName("");
          setError(null);
        }}
      >
        <div className="p-4" style={{ minWidth: '400px' }}>
          <h3 className="neon-heading mb-4">Edit Standard</h3>

          <div className="neon-form-row mb-4">
            <label className="neon-label" htmlFor="edit-standard-name">
              Standard Name *
            </label>
            <input
              id="edit-standard-name"
              type="text"
              className="neon-input"
              placeholder="e.g., ISO 9001, OHSAS 18001"
              value={standardName}
              onChange={(e) => {
                setStandardName(e.target.value);
                setError(null);
              }}
              disabled={saving}
              autoFocus
            />
          </div>

          {error && (
            <div className="neon-error mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <CustomTooltip text="Cancel">
              <TextIconButton
                variant="cancel"
                label="Cancel"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStandard(null);
                  setStandardName("");
                  setError(null);
                }}
                disabled={saving}
              />
            </CustomTooltip>
            <CustomTooltip text="Save changes">
              <TextIconButton
                variant="save"
                label={saving ? 'Saving...' : 'Save Changes'}
                onClick={handleEdit}
                disabled={!standardName.trim() || saving}
              />
            </CustomTooltip>
          </div>
        </div>
      </OverlayDialog>
    </div>
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
  const { user } = useUser(); // Get current user for location
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardId, setStandardId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [referenceCode, setReferenceCode] = useState("");
  const [referencePrefix, setReferencePrefix] = useState("");
  const [referenceSuffix, setReferenceSuffix] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewPeriodMonths, setReviewPeriodMonths] = useState<number>(12); // default 12 months
  const [lastReviewAt, setLastReviewAt] = useState<string>("");
  const [showFileBrowser, setShowFileBrowser] = useState(false);

  // Reference code validation states
  const [existingReferenceCodes, setExistingReferenceCodes] = useState<string[]>([]);
  const [referenceCodeExists, setReferenceCodeExists] = useState(false);
  const [suggestedReferenceCodes, setSuggestedReferenceCodes] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter sections based on selected standard (only parent sections)
  const filteredSections = useMemo(() => {
    if (!standardId) return [];
    return sections.filter(s => s.standard_id === standardId && !s.parent_section_id);
  }, [sections, standardId]);

  // Fetch all existing reference codes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("reference_code")
        .eq("archived", false)
        .not("reference_code", "is", null);

      if (!cancelled && data) {
        const codes = data.map(d => d.reference_code).filter(Boolean) as string[];
        setExistingReferenceCodes(codes);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Build reference code progressively as user selects each field (only for new documents)
  useEffect(() => {
    if (id) return; // Don't auto-generate for existing documents

    // Collect all the parts independently
    const locationCode = location ? LOCATION_REF_CODES[location] || '' : '';

    const selectedDocType = documentTypeId ? documentTypes.find(dt => dt.id === documentTypeId) : null;
    const typeCode = selectedDocType?.ref_code || '';

    const selectedSection = sectionId ? sections.find(s => s.id === sectionId) : null;
    const sectionCode = selectedSection?.ref_code || selectedSection?.code || '';

    // Build the prefix progressively based on what's available
    let buildingPrefix = '';

    if (locationCode) {
      buildingPrefix = locationCode;

      if (typeCode) {
        buildingPrefix += `-${typeCode}`;

        if (sectionCode) {
          buildingPrefix += `-${sectionCode}`;
        }
      }
    }

    setReferencePrefix(buildingPrefix);
  }, [location, documentTypeId, sectionId, documentTypes, sections, id, existingReferenceCodes]);

  // Update the full reference code when prefix or suffix changes
  useEffect(() => {
    if (referencePrefix && referenceSuffix) {
      setReferenceCode(`${referencePrefix}-${referenceSuffix}`);
    } else if (referencePrefix) {
      // Just show the prefix if suffix is not entered yet
      setReferenceCode(referencePrefix);
    } else {
      setReferenceCode('');
    }
  }, [referencePrefix, referenceSuffix]);

  // Check for duplicate reference code in real-time
  useEffect(() => {
    // Only check if we have both prefix and suffix (for new documents)
    if (id || !referencePrefix || !referenceSuffix) {
      setReferenceCodeExists(false);
      setSuggestedReferenceCodes([]);
      setShowSuggestions(false);
      return;
    }

    const fullCode = `${referencePrefix}-${referenceSuffix}`;
    const isDuplicate = existingReferenceCodes.includes(fullCode);
    setReferenceCodeExists(isDuplicate);

    // Generate smart suggestions if duplicate
    if (isDuplicate && referenceSuffix.length > 0) {
      const suggestions = generateReferenceSuggestions(fullCode, existingReferenceCodes);
      setSuggestedReferenceCodes(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSuggestedReferenceCodes([]);
      setShowSuggestions(false);
    }
  }, [referencePrefix, referenceSuffix, existingReferenceCodes, id, documentTypeId, documentTypes]);

  // Generate smart reference code suggestions (composite prefix-aware)
  const generateReferenceSuggestions = (input: string, existing: string[]): string[] => {
    const suggestions: string[] = [];

    // Build composite prefix if all parts are available
    if (location && documentTypeId && sectionId) {
      const locationCode = LOCATION_REF_CODES[location] || '';
      const selectedDocType = documentTypes.find(dt => dt.id === documentTypeId);
      const typeCode = selectedDocType?.ref_code || '';
      const selectedSection = sections.find(s => s.id === sectionId);
      const sectionCode = selectedSection?.code || '';

      if (locationCode && typeCode && sectionCode) {
        const compositePrefix = `${locationCode}${typeCode}${sectionCode}`;

        // If input starts with composite prefix, suggest next sequential numbers
        if (input.startsWith(compositePrefix + '-')) {
          const existingWithPrefix = existing.filter(code => code.startsWith(compositePrefix + '-'));

          const existingNumbers = existingWithPrefix
            .map(code => {
              const match = code.match(/-(\d+)$/);
              return match ? parseInt(match[1]) : null;
            })
            .filter((n): n is number => n !== null)
            .sort((a, b) => b - a);

          const maxNum = existingNumbers.length > 0 ? existingNumbers[0] : 0;
          for (let i = 1; i <= 5; i++) {
            const suggestion = `${compositePrefix}-${String(maxNum + i).padStart(3, '0')}`;
            if (!existing.includes(suggestion)) {
              suggestions.push(suggestion);
            }
          }
        }
      }
    }

    return suggestions.slice(0, 5);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch document types for dropdown
      const { data: docTypes, error: docTypesErr } = await supabase
        .from("document_types")
        .select("id, name, ref_code");
      if (!cancelled && docTypes) setDocumentTypes(docTypes);

      // Fetch standards
      const { data: stds, error: stdsErr } = await supabase
        .from("document_standard")
        .select("id, name")
        .order("name", { ascending: true });
      if (!cancelled && stds) setStandards(stds);

      if (!id) {
        setReviewPeriodMonths(12);
        setLastReviewAt(new Date().toISOString().slice(0, 10));
        return;
      }
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setTitle(data.title || "");
      setDocumentTypeId(data.document_type_id || "");
      setSectionId(data.section_id || "");
      setReferenceCode(data.reference_code || "");
      setFileUrl(data.file_url || "");
      setNotes(data.notes || "");
      setReviewPeriodMonths(data.review_period_months ?? 12);
      setLastReviewAt(data.last_reviewed_at ? data.last_reviewed_at.slice(0, 10) : new Date().toISOString().slice(0, 10));

      // Set standard based on section
      if (data.section_id) {
        const section = sections.find(s => s.id === data.section_id);
        if (section?.standard_id) {
          setStandardId(section.standard_id);
        }
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!documentTypeId) { setError("Document type is required"); return; }
    if (!referenceCode.trim()) { setError("Reference code is required"); return; }

    // Check for duplicate reference code when creating new document
    if (!id && referenceCodeExists) {
      setError("This reference code already exists. Please use a different code or select one from the suggestions below.");
      return;
    }

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
          document_type_id: documentTypeId,
          section_id: sectionId || null,
          reference_code: referenceCode.trim(),
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
          document_type_id: previousDoc.document_type_id,
          notes: previousDoc.notes || null,
          section_id: previousDoc.section_id || null,
          created_at: previousDoc.created_at || null,
          change_summary: "Auto-archived due to new version added.",
          change_date: new Date().toISOString(),
          archived_by_auth_id: null, // Optionally set user auth_id if available
        });
        await supabase.from("documents").update({ archived: true }).eq("id", previousDoc.id);
      }
      // Double-check for duplicates before inserting
      const { data: duplicateCheck } = await supabase
        .from("documents")
        .select("id")
        .eq("reference_code", referenceCode.trim())
        .eq("archived", false)
        .maybeSingle();

      if (duplicateCheck) {
        setLoading(false);
        setError("This reference code already exists. Please use a different code.");
        return;
      }

      // Now insert new document
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: title.trim(),
          document_type_id: documentTypeId,
          section_id: sectionId || null,
          reference_code: referenceCode.trim(),
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

  if (loading) return <p className="neon-text text-center p-8">Loading…</p>;

  return (
    <NeonForm
      title={id ? "Edit Document" : "Add Document"}
      onSubmit={handleSubmit}
      submitLabel={id ? "Save Changes" : "Create Document"}
      onCancel={onCancel}
    >
      {error && <p className="neon-text danger-text mb-2">{error}</p>}

      <label className="neon-label" htmlFor="docTitle">Title</label>
      <input id="docTitle" className="neon-input mb-2" value={title} onChange={e=>setTitle(e.target.value)} required />

      <label className="neon-label" htmlFor="docType">Type</label>
      <select id="docType" className="neon-select mb-2" value={documentTypeId} onChange={e=>setDocumentTypeId(e.target.value)} required>
        <option value="">— Select Type —</option>
        {documentTypes.map(dt => (
          <option key={dt.id} value={dt.id}>{dt.name}</option>
        ))}
      </select>

      <label className="neon-label" htmlFor="docLocation">Location</label>
      <select id="docLocation" className="neon-select mb-2" value={location} onChange={e=>setLocation(e.target.value)} required>
        <option value="">— Select Location —</option>
        <option value="England">England</option>
        <option value="Wales">Wales</option>
        <option value="Poland">Poland</option>
        <option value="Group">Group</option>
      </select>

      <label className="neon-label" htmlFor="docStandard">Standard</label>
      <select id="docStandard" className="neon-select mb-2" value={standardId} onChange={e=>{setStandardId(e.target.value); setSectionId("");}}>
        <option value="">— Select Standard —</option>
        {standards.map(std => (
          <option key={std.id} value={std.id}>{std.name}</option>
        ))}
      </select>

      <label className="neon-label" htmlFor="docSection">Section</label>
      <select id="docSection" className="neon-select mb-2" value={sectionId} onChange={e=>setSectionId(e.target.value)} disabled={!standardId}>
        <option value="">{standardId ? "— Select Section —" : "— Select Standard First —"}</option>
        {filteredSections
          .slice()
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map(s => <option key={s.id} value={s.id}>{s.code} – {s.title}</option>)
        }
      </select>

      <label className="neon-label" htmlFor="referenceCode">
        Reference Code <span className="danger-text">*</span>
      </label>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
        <input
          type="text"
          className="neon-input"
          value={referencePrefix}
          readOnly
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            cursor: 'not-allowed',
            opacity: 0.7
          }}
          placeholder="Select location, type & section"
        />
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>-</span>
        <input
          id="referenceCode"
          type="text"
          className="neon-input"
          value={referenceSuffix}
          onChange={(e) => setReferenceSuffix(e.target.value.toUpperCase())}
          style={{
            width: '150px',
            borderColor: referenceCodeExists ? '#ff4d4f' : undefined
          }}
          placeholder="Enter code"
          required
        />
      </div>

      {/* Real-time validation feedback */}
      {!id && referencePrefix && referenceSuffix && (
        <div className="mb-2">
          {referenceCodeExists ? (
            <div style={{
              padding: '0.5rem',
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#ff4444'
            }}>
              ⚠️ Reference code {referenceCode} already exists
            </div>
          ) : (
            <div style={{
              padding: '0.5rem',
              background: 'rgba(0, 255, 170, 0.1)',
              border: '1px solid rgba(0, 255, 170, 0.3)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#00ffaa'
            }}>
              ✓ Reference code {referenceCode} is available
            </div>
          )}
        </div>
      )}

      {/* Smart suggestions */}
      {!id && showSuggestions && suggestedReferenceCodes.length > 0 && (
        <div className="mb-2">
          <div style={{
            fontSize: '0.875rem',
            opacity: 0.7,
            marginBottom: '0.25rem'
          }}>
            Available suggestions:
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {suggestedReferenceCodes.map((suggestion, idx) => (
              <TextIconButton
                key={idx}
                variant="list"
                label={suggestion}
                onClick={() => {
                  setReferenceCode(suggestion);
                  setShowSuggestions(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <label className="neon-label" htmlFor="fileUrl">File URL</label>
      <div className="flex gap-2 mb-2">
        <input
          id="fileUrl"
          className="neon-input flex-1"
          value={fileUrl}
          onChange={e=>setFileUrl(e.target.value)}
        />
        <CustomTooltip text="Browse storage files">
          <TextIconButton
            variant="search"
            label="Browse Files"
            onClick={() => setShowFileBrowser(true)}
          />
        </CustomTooltip>
      </div>

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

      {showFileBrowser && (
        <StorageFileBrowser
          bucket={STORAGE_BUCKETS.DOCUMENTS}
          onSelectFile={(url, fileName) => {
            setFileUrl(url);
            setShowFileBrowser(false);
          }}
          onClose={() => setShowFileBrowser(false)}
        />
      )}
    </NeonForm>
  );
}

function AmendDocumentForm({
  id,
  sections,
  onSaved,
  onCancel,
}: {
  id: string;
  sections: Section[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { user } = useUser(); // Get current user for location
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardId, setStandardId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [referenceCode, setReferenceCode] = useState("");
  const [referencePrefix, setReferencePrefix] = useState("");
  const [referenceSuffix, setReferenceSuffix] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showFileBrowser, setShowFileBrowser] = useState(false);

  // Filter sections based on selected standard (only parent sections)
  const filteredSections = useMemo(() => {
    if (!standardId) return [];
    return sections.filter(s => s.standard_id === standardId && !s.parent_section_id);
  }, [sections, standardId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch document types for dropdown
      const { data: docTypes, error: docTypesErr } = await supabase
        .from("document_types")
        .select("id, name, ref_code");
      if (!cancelled && docTypes) setDocumentTypes(docTypes);

      // Fetch standards
      const { data: stds, error: stdsErr } = await supabase
        .from("document_standard")
        .select("id, name")
        .order("name", { ascending: true });
      if (!cancelled && stds) setStandards(stds);

      // Fetch the document to edit
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      setTitle(data.title || "");
      setDocumentTypeId(data.document_type_id || "");
      setSectionId(data.section_id || "");
      setLocation(data.location || "");

      // Split reference code into prefix and suffix
      const refCode = data.reference_code || "";
      setReferenceCode(refCode);
      if (refCode) {
        const lastDashIndex = refCode.lastIndexOf('-');
        if (lastDashIndex !== -1) {
          setReferencePrefix(refCode.substring(0, lastDashIndex));
          setReferenceSuffix(refCode.substring(lastDashIndex + 1));
        }
      }

      setFileUrl(data.file_url || "");
      setNotes(data.notes || "");

      // Set standard based on section
      if (data.section_id) {
        const section = sections.find(s => s.id === data.section_id);
        if (section?.standard_id) {
          setStandardId(section.standard_id);
        }
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, sections]);

  // Rebuild prefix when location/type/section changes (for AmendDocumentForm)
  useEffect(() => {
    // Collect all the parts independently
    const locationCode = location ? LOCATION_REF_CODES[location] || '' : '';
    const selectedDocType = documentTypeId ? documentTypes.find(dt => dt.id === documentTypeId) : null;
    const typeCode = selectedDocType?.ref_code || '';
    const selectedSection = sectionId ? sections.find(s => s.id === sectionId) : null;
    const sectionCode = selectedSection?.ref_code || selectedSection?.code || '';

    // Build the prefix progressively based on what's available
    let buildingPrefix = '';

    if (locationCode) {
      buildingPrefix = locationCode;

      if (typeCode) {
        buildingPrefix += `-${typeCode}`;

        if (sectionCode) {
          buildingPrefix += `-${sectionCode}`;
        }
      }
    }

    setReferencePrefix(buildingPrefix);
  }, [location, documentTypeId, sectionId, documentTypes, sections]);

  // Update the full reference code when prefix or suffix changes (for AmendDocumentForm)
  useEffect(() => {
    if (referencePrefix && referenceSuffix) {
      setReferenceCode(`${referencePrefix}-${referenceSuffix}`);
    } else if (referencePrefix) {
      // Just show the prefix if suffix is not entered yet
      setReferenceCode(referencePrefix);
    } else {
      setReferenceCode('');
    }
  }, [referencePrefix, referenceSuffix]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!documentTypeId) { setError("Document type is required"); return; }
    setLoading(true);

    // Update document WITHOUT changing version, created_at, last_reviewed_at, or review_period_months
    const { data, error } = await supabase
      .from("documents")
      .update({
        title: title.trim(),
        document_type_id: documentTypeId,
        section_id: sectionId || null,
        reference_code: referenceCode || null,
        file_url: fileUrl || null,
        notes: notes || null,
      })
      .eq("id", id)
      .select()
      .single();
    setLoading(false);
    if (error || !data) { setError(error?.message || "Update failed"); return; }
    onSaved();
  };

  if (loading) return <p className="neon-text text-center p-8">Loading…</p>;

  return (
    <NeonForm
      title=""
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      onCancel={onCancel}
    >
      {error && <p className="neon-text danger-text mb-2">{error}</p>}

      <label className="neon-label" htmlFor="amendDocTitle">Title</label>
      <input id="amendDocTitle" className="neon-input mb-2" value={title} onChange={e=>setTitle(e.target.value)} required />

      <label className="neon-label" htmlFor="amendDocType">Type</label>
      <select id="amendDocType" className="neon-select mb-2" value={documentTypeId} onChange={e=>setDocumentTypeId(e.target.value)} required>
        <option value="">— Select Type —</option>
        {documentTypes.map(dt => (
          <option key={dt.id} value={dt.id}>{dt.name}</option>
        ))}
      </select>

      <label className="neon-label" htmlFor="amendDocLocation">Location</label>
      <select id="amendDocLocation" className="neon-select mb-2" value={location} onChange={e=>setLocation(e.target.value)} required>
        <option value="">— Select Location —</option>
        <option value="England">England</option>
        <option value="Wales">Wales</option>
        <option value="Poland">Poland</option>
        <option value="Group">Group</option>
      </select>

      <label className="neon-label" htmlFor="amendDocStandard">Standard</label>
      <select id="amendDocStandard" className="neon-select mb-2" value={standardId} onChange={e=>{setStandardId(e.target.value); setSectionId("");}}>
        <option value="">— Select Standard —</option>
        {standards.map(std => (
          <option key={std.id} value={std.id}>{std.name}</option>
        ))}
      </select>

      <label className="neon-label" htmlFor="amendDocSection">Section</label>
      <select id="amendDocSection" className="neon-select mb-2" value={sectionId} onChange={e=>setSectionId(e.target.value)} disabled={!standardId}>
        <option value="">{standardId ? "— Select Section —" : "— Select Standard First —"}</option>
        {filteredSections
          .slice()
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map(s => <option key={s.id} value={s.id}>{s.code} – {s.title}</option>)
        }
      </select>

      <label className="neon-label" htmlFor="amendReferenceCode">Reference Code</label>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <input
          type="text"
          className="neon-input"
          value={referencePrefix}
          readOnly
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            cursor: 'not-allowed',
            opacity: 0.7
          }}
          placeholder="Select location, type & section"
        />
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>-</span>
        <input
          id="amendReferenceCode"
          type="text"
          className="neon-input"
          value={referenceSuffix}
          onChange={(e) => setReferenceSuffix(e.target.value.toUpperCase())}
          style={{
            width: '150px'
          }}
          placeholder="Enter code"
        />
      </div>

      <label className="neon-label" htmlFor="amendFileUrl">File URL</label>
      <div className="flex gap-2 mb-2">
        <input
          id="amendFileUrl"
          className="neon-input flex-1"
          value={fileUrl}
          onChange={e=>setFileUrl(e.target.value)}
        />
        <CustomTooltip text="Browse storage files">
          <TextIconButton
            variant="search"
            label="Browse Files"
            onClick={() => setShowFileBrowser(true)}
          />
        </CustomTooltip>
      </div>

      <label className="neon-label" htmlFor="amendNotes">Notes</label>
      <textarea id="amendNotes" className="neon-input mb-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />

      <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '1rem', fontStyle: 'italic' }}>
        Note: Version number, created date, and review date will NOT be changed.
      </p>

      {showFileBrowser && (
        <StorageFileBrowser
          bucket={STORAGE_BUCKETS.DOCUMENTS}
          onSelectFile={(url) => {
            setFileUrl(url);
            setShowFileBrowser(false);
          }}
          onClose={() => setShowFileBrowser(false)}
        />
      )}
    </NeonForm>
  );
}

function ArchivedDocuments({ onRestore }: { onRestore: (doc: Document) => void }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_archive")
      .select("*")
      .order("change_date", { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const searchLower = searchTerm.toLowerCase();
    return rows.filter(r => r.title?.toLowerCase().includes(searchLower));
  }, [rows, searchTerm]);

  const restore = async (archiveRow: any) => {
    const { data, error } = await supabase
      .from("documents")
      .update({ archived: false })
      .eq("id", archiveRow.document_id)
      .select()
      .single();
    if (error || !data) { alert(error?.message || "Restore failed"); return; }
    onRestore(data as Document);
    // Refresh the archived list to remove the restored document
    fetchData();
    alert("Document restored successfully.");
  };

  if (loading) return <p className="neon-text text-center p-8">Loading archived…</p>;
  if (error) return <p className="neon-text danger-text">{error}</p>;

  return (
    <div>
      {/* Compact Toolbar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0 0 8px 8px',
        marginTop: '0',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <input
          className="neon-input"
          placeholder="Search archived documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '200px' }}
        />

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: '20px' }} />

        {/* Result Count */}
        <span style={{ opacity: 0.7, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
          {filteredRows.length} of {rows.length}
        </span>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <CustomTooltip text="Refresh">
            <TextIconButton
              variant="refresh"
              label="Refresh"
              aria-label="Refresh"
              onClick={fetchData}
            />
          </CustomTooltip>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="neon-text text-center p-8" style={{ opacity: 0.6 }}>
          {searchTerm ? 'No archived documents found matching your search.' : 'No archived documents.'}
        </p>
      ) : (
        <NeonTable
          columns={[
            { header: "Reference", accessor: "reference", width: 120 },
            { header: "Title", accessor: "title", width: 300 },
            { header: "Version", accessor: "version", width: 80 },
            { header: "Archived Date", accessor: "archived_date", width: 150 },
            { header: "Change Summary", accessor: "change_summary", width: 300 },
            { header: "Restore", accessor: "restore", width: 80 },
          ]}
          data={filteredRows.map((r) => ({
            reference: r.reference_code || "—",
            title: r.title,
            version: `v${r.archived_version}`,
            archived_date: new Date(r.change_date).toLocaleDateString("en-GB"),
            change_summary: r.change_summary || "—",
            restore: (
              <CustomTooltip text="Restore document">
                <TextIconButton
                  variant="refresh"
                  label="Restore document"
                  aria-label="Restore"
                  onClick={() => restore(r)}
                />
              </CustomTooltip>
            ),
          }))}
        />
      )}
    </div>
  );
}
