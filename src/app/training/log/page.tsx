"use client";

import React, { useEffect, useState, useCallback } from "react";
import ModuleSelect, {
  fetchActiveModules,
  Module,
} from "@/components/ModuleSelect";
import ArchiveModuleTab from "@/components/modules/ArchiveModuleTab";
import ContentHeader from "@/components/ui/ContentHeader";

export default function TrainingLogPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;

  const load = useCallback(async () => {
    const list = await fetchActiveModules();
    setModules(list);
    // keep selection valid
    if (selectedModuleId && !list.some((m) => m.id === selectedModuleId)) {
      setSelectedModuleId(null);
    }
  }, [selectedModuleId]);

  useEffect(() => {
    // initial fetch
    load().catch(console.error);
  }, [load]);

  const handleArchived = (archived: Module) => {
    // Optimistically remove from local list
    setModules((prev) => prev.filter((m) => m.id !== archived.id));
    if (selectedModuleId === archived.id) setSelectedModuleId(null);
    // Optionally re-fetch to be 100% in sync
    // load().catch(console.error);
  };

  return (
    <>
      <ContentHeader
        title="Training Log"
        description="Record and manage training completions"
      />
      <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="neon-form-title">Training Log</h2>
        <div className="space-y-4">
          <label className="block font-medium">Module</label>
          <ModuleSelect
            value={selectedModuleId}
            onChange={setSelectedModuleId}
            modules={modules}
          />
          {/* …rest of your training log form… */}
        </div>
      </div>

      <div>
        <ArchiveModuleTab
          module={selectedModule}
          onArchive={handleArchived}
          useServerRoute={false} // set true if you created the API route
        />
      </div>
    </div>
    </>
  );
}
