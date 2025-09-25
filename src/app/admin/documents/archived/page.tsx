"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import { FiFileText, FiClipboard, FiBookOpen } from "react-icons/fi";

type ArchivedDocument = {
  id: string;
  document_id: string;
  title: string;
  archived_version: string;
  file_url: string;
  document_type_id: string;
  document_type_name?: string;
  document_type_icon?: string | null;
  change_date: string;
  archived_by_auth_id: string;
};

export default function ArchivedDocumentsPage() {
  const [archivedDocs, setArchivedDocs] = useState<ArchivedDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ id: string; name: string; icon?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchived = async () => {
      // Fetch document types for lookup
      const { data: docTypes } = await supabase
        .from("document_types")
        .select("id, name, icon");
      setDocumentTypes(docTypes || []);
      // Fetch archived docs with join to document_types
      const { data, error } = await supabase
        .from("document_archive")
        .select(`
          id, document_id, title, archived_version, file_url, document_type_id, change_date, archived_by_auth_id,
          document_types:document_type_id (id, name, icon)
        `)
        .order("change_date", { ascending: false });
      if (error) {
        setArchivedDocs([]);
      } else {
        setArchivedDocs(
          (data || []).map((doc: any) => ({
            ...doc,
            document_type_name: doc.document_types?.name || "—",
            document_type_icon: doc.document_types?.icon || null,
          }))
        );
      }
      setLoading(false);
    };
    fetchArchived();
  }, []);

  return (
    <main className="archived-documents-main">
      <div className="archived-documents-header">
        <h1 className="archived-documents-title">Archived Documents</h1>
        <p className="archived-documents-subtitle">
          View all archived document versions
        </p>
      </div>
      <div className="archived-documents-header-spacer" />
      <div className="archived-documents-content">
        <button
          onClick={() => window.history.back()}
          className="archived-documents-back-btn"
        >
          {/* Use a semantic/global class for the icon if needed */}
          <span className="archived-documents-back-icon" />
          <span>Back</span>
        </button>
        {loading ? (
          <p className="archived-documents-loading">Loading...</p>
        ) : (
          <NeonTable
            columns={[
              { header: "Title", accessor: "title" },
              { header: "Type", accessor: "document_type" },
              { header: "Version", accessor: "archived_version" },
              { header: "Date Archived", accessor: "change_date" },
              { header: "Archived By", accessor: "archived_by_auth_id" },
              { header: "File", accessor: "file_url" },
            ]}
            data={archivedDocs.map((doc) => {
              return {
                title: doc.title,
                document_type: (
                  <div className="archived-documents-type-cell">
                    {doc.document_type_icon && (
                      <span className="doc-type-icon" dangerouslySetInnerHTML={{ __html: doc.document_type_icon }} style={{ marginRight: 6 }} />
                    )}
                    {doc.document_type_name || "—"}
                  </div>
                ),
                archived_version: doc.archived_version,
                change_date: doc.change_date
                  ? new Date(doc.change_date).toLocaleString("en-GB")
                  : "—",
                archived_by_auth_id: doc.archived_by_auth_id || "—",
                file_url: doc.file_url ? (
                  <a
                    href={doc.file_url}
                    rel="noopener noreferrer"
                    className="archived-documents-file-link"
                  >
                    View PDF
                  </a>
                ) : (
                  "—"
                ),
              };
            })}
          />
        )}
      </div>
    </main>
  );
}
