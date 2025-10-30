"use client";

import DocumentManager from "@/components/documents/DocumentSectionManager";
import ContentHeader from "@/components/ui/ContentHeader";

export default function AdminDocumentsPage() {
  return (
    <>
      <ContentHeader
        title="Document Management"
        description="Manage documents and document sections"
      />
      <DocumentManager />
    </>
  );
}
