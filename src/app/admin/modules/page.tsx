"use client";

import TrainingModuleManager from "@/components/modules/TrainingModuleManager";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function ModuleViewPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to manage training modules."
    >
      <ContentHeader
        title="Training Modules"
        description="Manage training modules and content"
      />
      <TrainingModuleManager />
    </AccessControlWrapper>
  );
}
