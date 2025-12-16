"use client";

import TrainerModuleView from "@/components/modules/TrainerModuleView";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function TrainerModulesPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Trainer", "Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to view training modules."
    >
      <ContentHeader
        title="Training Modules"
        description="View training module information and content"
      />
      <TrainerModuleView />
    </AccessControlWrapper>
  );
}
