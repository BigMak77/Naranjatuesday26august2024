// components/role-profiles/widgets/DocumentSelectorWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import React from "react";
import NeonDualListbox from "@/components/ui/NeonDualListbox";

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
  const [typeFilter, setTypeFilter] = useState<DocumentType>("all");
  const [showDocuments, setShowDocuments] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, document_type");
      if (error) console.error("Error fetching documents:", error);
      else setDocuments(data);
    };
    fetchDocuments();
  }, []);

  // Filtered and mapped for NeonDualListbox
  const filteredDocs = documents.filter((doc) => {
    const docTitle = doc.title || "";
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
    return matchesType;
  });
  const dualListItems = filteredDocs.map((doc) => ({
    id: doc.id,
    label: `${doc.title} (${doc.document_type})`,
  }));

  return (
    <NeonPanel>
      {showDocuments && (
        <div className="neon-flex-col gap-4">
          <div className="neon-flex gap-3 mb-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType)}
              className="neon-input neon-duallistbox-type-filter"
            >
              <option value="all">All Types</option>
              <option value="policy">Policy</option>
              <option value="ssow">Safe System of Work</option>
              <option value="work_instruction">Work Instruction</option>
            </select>
          </div>
          <NeonDualListbox
            items={dualListItems}
            selected={selectedDocuments}
            onChange={onChange}
            titleLeft="Available Documents"
            titleRight="Attached Documents"
          />
        </div>
      )}
    </NeonPanel>
  );
}
