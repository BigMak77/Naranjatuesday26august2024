"use client";

import TrainingModuleManager from "@/components/modules/TrainingModuleManager";

export default function ModuleViewPage() {
  return (
    <section className="neon-panel">
      <h1 className="neon-section-title">Training Modules</h1>
      <p className="neon-section-desc">View, manage, and assign training modules for your organization.</p>
      <TrainingModuleManager />
    </section>
  );
}
