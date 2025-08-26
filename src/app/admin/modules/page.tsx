"use client";

import TrainingModuleManager from "@/components/modules/TrainingModuleManager";

export default function ModuleViewPage() {
  return (
    <div className="neon-container neon-panel" style={{ maxWidth: "1100px", margin: "2rem auto", padding: "2rem" }}>
      <h1 className="neon-section-title">Training Modules</h1>
      <p className="neon-section-desc">View, manage, and assign training modules for your organization.</p>
      <TrainingModuleManager />
    </div>
  );
}
