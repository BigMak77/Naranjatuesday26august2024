"use client";

import DocumentSectionManager from "@/components/documents/DocumentSectionManager";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function DocumentsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin", "H&S Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access Turkus documents."
    >
      <DocumentSectionManager />
    </AccessControlWrapper>
  );
}
