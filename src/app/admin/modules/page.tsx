"use client";

import TrainingModuleManager from "@/components/modules/TrainingModuleManager";
import MainHeader from "@/components/ui/MainHeader";

export default function ModuleViewPage() {
  return (
    <>
      <MainHeader title="Training Module Manager" subtitle="Add, view, assign, and archive training modules" />
      <section className="neon-panel">
        <TrainingModuleManager />
      </section>
    </>
  );
}
