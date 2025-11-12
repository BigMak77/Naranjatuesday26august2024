"use client";

import DocumentManager from "@/components/documents/DocumentSectionManager";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function AdminDocumentsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to manage documents."
    >
      <ContentHeader
        title="Document Management"
        description="Manage documents and document sections"
      />
      <DocumentManager />
    </AccessControlWrapper>
  );
}
