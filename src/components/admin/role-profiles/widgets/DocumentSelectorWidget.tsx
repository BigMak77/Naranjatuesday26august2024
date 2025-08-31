// components/role-profiles/widgets/DocumentSelectorWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import React from "react";

type Document = {
  id: string;
  title: string;
  document_type: string;
};

type Props = {
  selectedDocuments: string[];
  onChange: (ids: string[]) => void;
};

type DocumentType = "all" | "policy" | "ssow" | "work_instruction";

export default function DocumentSelectorWidget({
  selectedDocuments,
  onChange,
}: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType>("all");
  const [showDocuments, setShowDocuments] = useState(true);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedAttached, setSelectedAttached] = useState<string[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, document_type"); // changed 'name' to 'title'
      if (error) console.error("Error fetching documents:", error);
      else setDocuments(data);
    };
    fetchDocuments();
  }, []);

  // Split documents into available and attached
  const availableDocs = documents.filter(
    (doc) => !selectedDocuments.includes(doc.id),
  );
  const attachedDocs = documents.filter((doc) =>
    selectedDocuments.includes(doc.id),
  );

  // Filter available docs by search and type
  const filteredAvailable = availableDocs.filter((doc) => {
    // Defensive: fallback to title if name is missing (now always use title)
    const docTitle = (doc as any).title || "";
    const matchesSearch = docTitle.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      typeFilter === "all" || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Add selected available docs to attached
  const handleAdd = () => {
    onChange([...selectedDocuments, ...selectedAvailable]);
    setSelectedAvailable([]);
  };

  // Remove selected attached docs
  const handleRemove = () => {
    onChange(selectedDocuments.filter((id) => !selectedAttached.includes(id)));
    setSelectedAttached([]);
  };

  return (
    <NeonPanel>
      <button
        type="button"
        className="neon-btn neon-section-toggle"
        data-tooltip={showDocuments ? "Hide Documents" : "Show Documents"}
        onClick={() => setShowDocuments((v) => !v)}
        aria-label={showDocuments ? "Hide Documents" : "Show Documents"}
      >
        {showDocuments ? (
          <svg className="neon-icon" viewBox="0 0 24 24">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        ) : (
          <svg className="neon-icon" viewBox="0 0 24 24">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
          </svg>
        )}
      </button>
      {showDocuments && (
        <div className="neon-flex-col gap-4">
          <div className="neon-flex gap-3 mb-2">
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neon-input"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType)}
              className="neon-input"
            >
              <option value="all">All Types</option>
              <option value="policy">Policy</option>
              <option value="ssow">Safe System of Work</option>
              <option value="work_instruction">Work Instruction</option>
            </select>
          </div>
          <div className="neon-flex gap-6 w-full">
            {/* Available Documents */}
            <div className="flex-1">
              <div className="neon-label mb-1">Available Documents</div>
              <select
                multiple
                className="neon-input h-48 w-full"
                value={selectedAvailable}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  );
                  setSelectedAvailable(options);
                }}
              >
                {filteredAvailable.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {(doc as any).title || "Untitled"} ({doc.document_type})
                  </option>
                ))}
              </select>
            </div>
            {/* Add/Remove Buttons */}
            <div className="neon-flex-col justify-center gap-2">
              <button
                type="button"
                className="neon-btn"
                onClick={handleAdd}
                disabled={selectedAvailable.length === 0}
                aria-label="Add selected documents"
              >
                Add &rarr;
              </button>
              <button
                type="button"
                className="neon-btn neon-btn-danger"
                onClick={handleRemove}
                disabled={selectedAttached.length === 0}
                aria-label="Remove selected documents"
              >
                &larr; Remove
              </button>
            </div>
            {/* Attached Documents */}
            <div className="flex-1">
              <div className="neon-label mb-1">Attached Documents</div>
              <select
                multiple
                className="neon-input h-48 w-full"
                value={selectedAttached}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  );
                  setSelectedAttached(options);
                }}
              >
                {attachedDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {(doc as any).title || "Untitled"} ({doc.document_type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </NeonPanel>
  );
}
