"use client";

import TrainingModuleManager from "@/components/modules/TrainingModuleManager";
import ContentHeader from "@/components/ui/ContentHeader";

export default function ModuleViewPage() {
  return (
    <>
      <ContentHeader
        title="Training Modules"
        description="Manage training modules and content"
      />
      <TrainingModuleManager />
    </>
  );
}
