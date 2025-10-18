// Custom tooltips added to all buttons
"use client";

import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import FolderTabs from "@/components/FolderTabs";
import { supabase } from "@/lib/supabase-client";
import {
  FiClipboard,
  FiHelpCircle,
  FiPlus,
  FiSend,
  FiArchive,
  FiEdit,
} from "react-icons/fi";

import AddModuleTab from "@/components/modules/AddModuleTab";
import { ViewModuleTab } from "@/components/modules/ViewModuleTab";
import AssignModuleTab from "@/components/modules/AssignModuleTab";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

import "@/components/folder-tabs-equal-width.css";

// Define Module type inline
interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  is_archived: boolean;
  group_id: string;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export default function TrainingModuleManager() {
  const [activeTab, setActiveTab] = useState<
    "add" | "view" | "assign" | "archive"
  >("view");
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [search, setSearch] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);

  const tabList = [
    {
      key: "add",
      label: "",
      icon: <FiPlus />,
      tooltip: "Add new training module",
    },
    {
      key: "view",
      label: "",
      icon: <FiClipboard />,
      tooltip: "View and edit training modules",
    },
    {
      key: "assign",
      label: "",
      icon: <FiSend />,
      tooltip: "Assign modules to users",
    },
    {
      key: "archive",
      label: "",
      icon: <FiHelpCircle />,
      tooltip: "Archive training modules",
    },
  ];

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return;
      }

      const cleaned = (data || []).map((m) => ({
        ...m,
        learning_objectives: m.learning_objectives ?? "",
        estimated_duration: m.estimated_duration ?? "",
        delivery_format: m.delivery_format ?? "",
        target_audience: m.target_audience ?? "",
        prerequisites: m.prerequisites ?? [],
        thumbnail_url: m.thumbnail_url ?? "",
        tags: m.tags ?? [],
        created_at: m.created_at ?? new Date().toISOString(),
        updated_at: m.updated_at ?? new Date().toISOString(),
      }));
      setModules(cleaned);
    };

    fetchModules();
  }, []);

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()),
  );

  // Fix: convert version to number for ViewModuleTab
  const selectedModuleForView = selectedModule
    ? { ...selectedModule, version: Number(selectedModule.version) }
    : null;

  return (
    <>
      <FolderTabs
        tabs={tabList.map(tab => ({
          ...tab,
          icon: React.cloneElement(tab.icon, { className: undefined }) // Remove custom icon class
        }))}
        activeTab={activeTab}
        onChange={(tabKey) => {
          setActiveTab(tabKey as typeof activeTab);
          setSelectedModule(null);
        }}
      />
      {/* Spacer for visual separation */}
      <div style={{ height: 24 }} />
      {activeTab === "add" && (
        <div>
          <AddModuleTab onSuccess={() => setActiveTab("view")} />
        </div>
      )}
      {activeTab === "view" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <CustomTooltip text="Search modules by name or description">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="neon-input"
              />
            </CustomTooltip>
          </div>
          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Description", accessor: "description" },
              { header: "Version", accessor: "version" },
              { header: "Status", accessor: "status" },
              { header: "Actions", accessor: "actions" },
            ]}
            data={filteredModules.map((m) => ({
              ...m,
              status: m.is_archived ? "Archived" : "Active",
              actions: (
                <CustomTooltip text="Edit this training module">
                  <NeonIconButton
                    variant="edit"
                    icon={<FiEdit />}
                    title="Edit Module"
                    onClick={() =>
                      (window.location.href = `/admin/modules/edit/${m.id}`)
                    }
                  />
                </CustomTooltip>
              ),
            }))}
          />
          {selectedModuleForView && (
            <ViewModuleTab module={selectedModuleForView} />
          )}
        </div>
      )}
      {activeTab === "assign" && (
        <div>
          <AssignModuleTab />
        </div>
      )}
      {activeTab === "archive" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <CustomTooltip text="Search for modules to archive">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules to archive..."
                className="neon-input"
              />
            </CustomTooltip>
          </div>
          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Description", accessor: "description" },
              { header: "Version", accessor: "version" },
              { header: "Archive", accessor: "archive" },
            ]}
            data={modules
              .filter((m) => !m.is_archived)
              .map((m) => ({
                ...m,
                archive: (
                  <CustomTooltip text="Archive this training module">
                    <NeonIconButton
                      variant="archive"
                      icon={<FiArchive />}
                      title="Archive Module"
                      onClick={() => setSelectedModule(m)}
                    />
                  </CustomTooltip>
                ),
              }))}
          />
          {selectedModule && (
            <div>
              <h2 style={{ color: "var(--neon)", fontWeight: 700, fontSize: "1.25rem" }}>
                Archive Module
              </h2>
              <p style={{ marginBottom: 12 }}>
                Are you sure you want to archive{" "}
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {selectedModule.name}
                </span>
                ? This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <CustomTooltip text={archiveLoading ? "Archiving module..." : "Confirm archive this module"}>
                  <NeonIconButton
                    variant="archive"
                    icon={
                      <FiArchive />
                    }
                    title="Archive"
                    onClick={async () => {
                      setArchiveLoading(true);
                      await supabase
                        .from("modules")
                        .update({
                          is_archived: true,
                          updated_at: new Date().toISOString(),
                        })
                        .eq("id", selectedModule.id);
                      setModules((modules) =>
                        modules.map((mod) =>
                          mod.id === selectedModule.id
                            ? { ...mod, is_archived: true }
                            : mod,
                        ),
                      );
                      setSelectedModule(null);
                      setArchiveLoading(false);
                    }}
                    disabled={archiveLoading}
                  />
                </CustomTooltip>
                <CustomTooltip text="Cancel archiving">
                  <NeonIconButton
                    variant="cancel"
                    icon={<span style={{ fontSize: "1.2em" }}>✖</span>}
                    title="Cancel"
                    onClick={() => setSelectedModule(null)}
                    disabled={archiveLoading}
                  />
                </CustomTooltip>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
