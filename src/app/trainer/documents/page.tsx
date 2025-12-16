"use client";

import TrainerDocumentView from "@/components/documents/TrainerDocumentView";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function TrainerDocumentsPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Trainer", "Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to view training documents."
    >
      <ContentHeader
        title="Training Documents"
        description="View training document information and content"
      />
      <TrainerDocumentView />
    </AccessControlWrapper>
  );
}
