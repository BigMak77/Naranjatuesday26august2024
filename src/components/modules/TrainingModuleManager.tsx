// Custom tooltips added to all buttons
"use client";

import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import FolderTabs from "@/components/FolderTabs";
import { supabase } from "@/lib/supabase-client";
import {
  FiClipboard,
  FiPlus,
  FiSend,
  FiArchive,
  FiEdit,
  FiRotateCcw,
  FiFileText,
} from "react-icons/fi";

import AddModuleTab from "@/components/modules/AddModuleTab";
import EditModuleTab from "@/components/modules/EditModuleTab";
import AssignModuleTab from "@/components/modules/AssignModuleTab";
import TestBuilder from "@/components/training/TestBuilder";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { getFileIcon } from "@/lib/file-utils";

// Define Module type inline
interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  is_archived: boolean;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  requires_follow_up?: boolean;
  review_period?: string;
  created_at?: string;
  updated_at?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
  }>;
}

export default function TrainingModuleManager() {
  const [activeTab, setActiveTab] = useState<
    "add" | "view" | "assign" | "archive" | "tests"
  >("view");
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleToArchive, setModuleToArchive] = useState<Module | null>(null);
  const [moduleToRestore, setModuleToRestore] = useState<Module | null>(null);
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null);
  const [search, setSearch] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Helper function to refresh modules data
  const refreshModules = async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      console.log("🔍 DEBUG: Raw modules data from database:", data);
      console.log("🔍 DEBUG: Modules with is_archived status:", data.map(m => ({ id: m.id, name: m.name, is_archived: m.is_archived })));
      
      const cleaned = data.map((m) => ({
        ...m,
        description: m.description ?? "",
        learning_objectives: m.learning_objectives ?? "",
        estimated_duration: m.estimated_duration ?? "",
        delivery_format: m.delivery_format ?? "",
        target_audience: m.target_audience ?? "",
        prerequisites: m.prerequisites ?? [],
        thumbnail_url: m.thumbnail_url ?? "",
        tags: m.tags ?? [],
        created_at: m.created_at ?? new Date().toISOString(),
        updated_at: m.updated_at ?? new Date().toISOString(),
        is_archived: m.is_archived ?? false, // Ensure is_archived defaults to false
      }));
      
      console.log("🔍 DEBUG: Cleaned modules data:", cleaned.map(m => ({ id: m.id, name: m.name, is_archived: m.is_archived })));
      setModules(cleaned);
    } else {
      console.error("🔍 DEBUG: Error fetching modules:", error);
      if (error) {
        console.error("🔍 DEBUG: Database error details:", error.message, error.code, error.details);
      }
    }
  };

  const tabList = [
    {
      key: "add",
      label: "Add Module",
      icon: <FiPlus />,
      tooltip: "Add new training module",
    },
    {
      key: "view",
      label: "View Modules",
      icon: <FiClipboard />,
      tooltip: "View and edit training modules",
    },
    {
      key: "tests",
      label: "Tests",
      icon: <FiFileText />,
      tooltip: "Create and manage tests",
    },
    {
      key: "assign",
      label: "Assign",
      icon: <FiSend />,
      tooltip: "Assign modules to users",
    },
    {
      key: "archive",
      label: "Archive",
      icon: <FiArchive />,
      tooltip: "View archived training modules",
    },
  ];

  useEffect(() => {
    refreshModules();
  }, []);

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()),
  );

  // Debug logging for tab-specific filtering
  const viewTabModules = filteredModules.filter((m) => !m.is_archived);
  const archiveTabModules = filteredModules.filter((m) => m.is_archived);
  
  console.log("🔍 DEBUG: Current activeTab:", activeTab);
  console.log("🔍 DEBUG: All filteredModules count:", filteredModules.length);
  console.log("🔍 DEBUG: View tab modules count:", viewTabModules.length);
  console.log("🔍 DEBUG: Archive tab modules count:", archiveTabModules.length);
  console.log("🔍 DEBUG: View tab modules:", viewTabModules.map(m => ({ id: m.id, name: m.name, is_archived: m.is_archived })));
  console.log("🔍 DEBUG: Archive tab modules:", archiveTabModules.map(m => ({ id: m.id, name: m.name, is_archived: m.is_archived })));

  return (
    <>
      <div className="folder-container">
        <FolderTabs
          tabs={tabList.map(tab => ({
            ...tab,
            icon: React.cloneElement(tab.icon, { className: undefined }) // Remove custom icon class
          }))}
          activeTab={activeTab}
          onChange={(tabKey) => {
            setActiveTab(tabKey as typeof activeTab);
            // Clear all dialog states when switching tabs
            setModuleToArchive(null);
            setModuleToRestore(null);
            setModuleToEdit(null);
          }}
          toolbar={
            <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>
              Training Module Management
            </div>
          }
        />
      </div>
      {activeTab === "add" && (
        <AddModuleTab onSuccess={() => {
          setActiveTab("view");
          refreshModules(); // Refresh the list when a new module is added
        }} />
      )}
      {activeTab === "view" && (
        <>
          <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
            Browse and edit your training modules
          </h2>
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
              { header: "Version", accessor: "version", width: 80 },
              { header: "Files", accessor: "files", width: 120 },
              { header: "Status", accessor: "status", width: 100 },
              { header: "Actions", accessor: "actions", width: 120 },
            ]}
            data={filteredModules
              .filter((m) => !m.is_archived) // Only show non-archived modules in view tab
              .map((m) => ({
              ...m,
              files: m.attachments && m.attachments.length > 0 ? (
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  {m.attachments.map((attachment, idx) => (
                    <CustomTooltip key={`${m.id}-${attachment.name}-${attachment.size}-${idx}`} text={attachment.name}>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        {getFileIcon(attachment.name, attachment.type, 16)}
                      </span>
                    </CustomTooltip>
                  ))}
                </div>
              ) : (
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No files</span>
              ),
              status: m.is_archived ? "Archived" : "Active",
              actions: (
                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                  <CustomTooltip text="Edit this training module">
                    <TextIconButton
                      variant="edit"
                      icon={<FiEdit />}
                      label="Edit Module"
                      onClick={() => setModuleToEdit(m)}
                    />
                  </CustomTooltip>
                  {!m.is_archived && (
                    <CustomTooltip text="Archive this training module">
                      <TextIconButton
                        variant="archive"
                        icon={<FiArchive />}
                        label="Archive"
                        onClick={() => {
                          console.log("🔍 DEBUG: Archive button clicked for module:", m.id, m.name, "is_archived:", m.is_archived);
                          setModuleToArchive(m);
                        }}
                      />
                    </CustomTooltip>
                  )}
                </div>
              ),
            }))}
          />
        </>
      )}
      {activeTab === "tests" && (
        <TestBuilder />
      )}
      {activeTab === "assign" && (
        <AssignModuleTab />
      )}
      {activeTab === "archive" && (
        <>
          <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
            Archived Training Modules
          </h2>
          <div style={{ marginBottom: 16 }}>
            <CustomTooltip text="Search archived modules">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search archived modules..."
                className="neon-input"
              />
            </CustomTooltip>
          </div>
          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Description", accessor: "description" },
              { header: "Version", accessor: "version", width: 80 },
              { header: "Files", accessor: "files", width: 120 },
              { header: "Actions", accessor: "actions", width: 120 },
            ]}
            data={filteredModules
              .filter((m) => m.is_archived)
              .map((m) => ({
                ...m,
                files: m.attachments && m.attachments.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    {m.attachments.map((attachment, idx) => (
                      <CustomTooltip key={`archived-${m.id}-${attachment.name}-${attachment.size}-${idx}`} text={attachment.name}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                          {getFileIcon(attachment.name, attachment.type, 16)}
                        </span>
                      </CustomTooltip>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No files</span>
                ),
                actions: (
                  <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                    <CustomTooltip text="View/edit this training module">
                      <TextIconButton
                        variant="edit"
                        icon={<FiEdit />}
                        label="Edit Module"
                        onClick={() => setModuleToEdit(m)}
                      />
                    </CustomTooltip>
                    <CustomTooltip text="Restore this training module">
                      <TextIconButton
                        variant="save"
                        icon={<FiRotateCcw />}
                        label="Restore"
                        onClick={() => setModuleToRestore(m)}
                      />
                    </CustomTooltip>
                  </div>
                ),
              }))}
          />
          {moduleToRestore && (
            <div style={{ marginTop: 24, padding: 16, border: "1px solid var(--neon)", borderRadius: 8 }}>
              <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                Confirm Restore
              </h3>
              <p style={{ marginBottom: 12 }}>
                Are you sure you want to restore{" "}
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {moduleToRestore.name}
                </span>
                ? This will make it available in the active modules list.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <CustomTooltip text={archiveLoading ? "Restoring module..." : "Confirm restore this module"}>
                  <TextIconButton
                    variant="save"
                    icon={<FiRotateCcw />}
                    label="Restore"
                    onClick={async () => {
                      setArchiveLoading(true);
                      try {
                        console.log("Restoring module:", moduleToRestore.id, moduleToRestore.name);
                        const { error } = await supabase
                          .from("modules")
                          .update({
                            is_archived: false,
                            updated_at: new Date().toISOString(),
                          })
                          .eq("id", moduleToRestore.id);
                        
                        if (error) {
                          console.error("Restore error:", error);
                          alert(`Failed to restore module: ${error.message}`);
                        } else {
                          console.log("Restore successful");
                          // Refresh the modules list
                          await refreshModules();
                        }
                      } catch (err) {
                        console.error("Restore exception:", err);
                        alert("An error occurred while restoring the module");
                      } finally {
                        setModuleToRestore(null);
                        setArchiveLoading(false);
                      }
                    }}
                    disabled={archiveLoading}
                  />
                </CustomTooltip>
                <CustomTooltip text="Cancel restore">
                  <TextIconButton
                    variant="cancel"
                    icon={<span style={{ fontSize: "1.2em" }}>✖</span>}
                    label="Cancel"
                    onClick={() => setModuleToRestore(null)}
                    disabled={archiveLoading}
                  />
                </CustomTooltip>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Edit Module Dialog */}
      {moduleToEdit && (
        <OverlayDialog
          open={true}
          onClose={() => setModuleToEdit(null)}
          showCloseButton={true}
          width={1000}
        >
          <EditModuleTab
            module={{
              ...moduleToEdit,
              version: Number(moduleToEdit.version)
            }}
            onSuccess={() => {
              // Refresh modules list after successful edit
              setModuleToEdit(null);
              refreshModules();
            }}
          />
        </OverlayDialog>
      )}

      {/* Archive Confirmation Dialog */}
      {moduleToArchive && (
        <OverlayDialog
          open={true}
          onClose={() => setModuleToArchive(null)}
          showCloseButton={true}
          width={500}
        >
          <div style={{ padding: 24 }}>
            <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.25rem", marginBottom: 16 }}>
              Confirm Archive
            </h3>
            <p style={{ marginBottom: 24, fontSize: "1rem", lineHeight: 1.5 }}>
              Are you sure you want to archive{" "}
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                {moduleToArchive.name}
              </span>
              ? This will remove it from the active modules list.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <CustomTooltip text={archiveLoading ? "Archiving module..." : "Confirm archive this module"}>
                <TextIconButton
                  variant="archive"
                  icon={<FiArchive />}
                  label="Archive"
                  onClick={async () => {
                    setArchiveLoading(true);
                    try {
                      console.log("🔍 Archiving module:", moduleToArchive.id, moduleToArchive.name);
                      const { error } = await supabase
                        .from("modules")
                        .update({
                          is_archived: true,
                          updated_at: new Date().toISOString(),
                        })
                        .eq("id", moduleToArchive.id);

                      if (error) {
                        console.error("❌ Archive error:", error);
                        alert(`Failed to archive module: ${error.message}`);
                      } else {
                        console.log("✅ Archive successful");
                        // Refresh the modules list
                        await refreshModules();
                        setModuleToArchive(null);
                      }
                    } catch (err) {
                      console.error("❌ Archive exception:", err);
                      alert("An error occurred while archiving the module");
                    } finally {
                      setArchiveLoading(false);
                    }
                  }}
                  disabled={archiveLoading}
                />
              </CustomTooltip>
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
