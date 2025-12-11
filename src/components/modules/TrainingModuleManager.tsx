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
  FiUsers,
  FiEye,
  FiUser,
} from "react-icons/fi";

import AddModuleTab from "@/components/modules/AddModuleTab";
import EditModuleTab from "@/components/modules/EditModuleTab";
import AssignModuleTab from "@/components/modules/AssignModuleTab";
import TestBuilder from "@/components/training/TestBuilder";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { getFileIcon } from "@/lib/file-utils";
import RoleModuleDocumentAssignment from "@/components/roles/RoleModuleDocumentAssignment";
import DepartmentModuleAssignment from "@/components/departments/DepartmentModuleAssignment";
import ViewRoleAssignments from "@/components/roles/ViewRoleAssignments";

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
    "add" | "view" | "assign" | "archive" | "tests" | "roletraining" | "depttraining" | "viewroletraining"
  >("view");
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleToArchive, setModuleToArchive] = useState<Module | null>(null);
  const [moduleToRestore, setModuleToRestore] = useState<Module | null>(null);
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null);
  const [search, setSearch] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [trainedUsersModule, setTrainedUsersModule] = useState<Module | null>(null);
  const [trainedUsers, setTrainedUsers] = useState<any[]>([]);
  const [loadingTrainedUsers, setLoadingTrainedUsers] = useState(false);

  // Helper function to refresh modules data
  const refreshModules = async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("name", { ascending: true });

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
      key: "roletraining",
      label: "Amend Role Training",
      icon: <FiEdit />,
      tooltip: "Assign training modules and documents to roles",
    },
    {
      key: "viewroletraining",
      label: "View Role Training",
      icon: <FiEye />,
      tooltip: "View training modules and documents assigned to roles",
    },
    {
      key: "depttraining",
      label: "Department Training",
      icon: <FiUsers />,
      tooltip: "Assign training modules and documents to departments",
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

  // CSV export function
  const exportToCSV = () => {
    const dataToExport = activeTab === "archive" ? archiveTabModules : viewTabModules;

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "Name",
      "Description",
      "Version",
      "Learning Objectives",
      "Estimated Duration",
      "Delivery Format",
      "Target Audience",
      "Prerequisites",
      "Tags",
      "Requires Follow-up",
      "Review Period",
      "Status",
      "Created At",
      "Updated At"
    ];

    // Convert data to CSV rows
    const rows = dataToExport.map(module => [
      module.name,
      module.description,
      module.version,
      module.learning_objectives || "",
      module.estimated_duration || "",
      module.delivery_format || "",
      module.target_audience || "",
      (module.prerequisites || []).join("; "),
      (module.tags || []).join("; "),
      module.requires_follow_up ? "Yes" : "No",
      module.review_period || "",
      module.is_archived ? "Archived" : "Active",
      module.created_at || "",
      module.updated_at || ""
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `training-modules-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch trained users for a module
  const fetchTrainedUsers = async (moduleId: string) => {
    setLoadingTrainedUsers(true);

    // Fetch from user_assignments table (completed assignments only)
    const { data, error } = await supabase
      .from("user_assignments")
      .select(`
        id,
        completed_at,
        users (
          id,
          first_name,
          last_name
        )
      `)
      .eq("item_id", moduleId)
      .eq("item_type", "module")
      .not("completed_at", "is", null);

    if (error) {
      console.error("Error fetching trained users:", error);
      setTrainedUsers([]);
    } else {
      // Sort by last name, then first name
      const sortedData = (data || []).sort((a, b) => {
        // Handle users being an array (Supabase returns it as single-item array)
        const userA = Array.isArray(a.users) ? a.users[0] : a.users;
        const userB = Array.isArray(b.users) ? b.users[0] : b.users;

        const lastNameCompare = (userA?.last_name || "").localeCompare(
          userB?.last_name || "",
          undefined,
          { sensitivity: 'base' }
        );
        if (lastNameCompare !== 0) return lastNameCompare;
        return (userA?.first_name || "").localeCompare(
          userB?.first_name || "",
          undefined,
          { sensitivity: 'base' }
        );
      });
      setTrainedUsers(sortedData);
    }

    setLoadingTrainedUsers(false);
  };

  // Handle opening trained users dialog
  const handleViewTrainedUsers = async (module: Module) => {
    setTrainedUsersModule(module);
    await fetchTrainedUsers(module.id);
  };

  // Export trained users to CSV
  const exportTrainedUsersCSV = () => {
    if (!trainedUsersModule || trainedUsers.length === 0) {
      alert("No trained users data to export");
      return;
    }

    const headers = ["Name", "Date Trained", "Version Trained"];

    const rows = trainedUsers.map(log => {
      const user = Array.isArray(log.users) ? log.users[0] : log.users;
      const fullName = user ? `${user.last_name}, ${user.first_name}` : "N/A";

      return [
        fullName,
        log.completed_at ? new Date(log.completed_at).toLocaleDateString() : "",
        trainedUsersModule?.version || ""
      ];
    });

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trained-users-${trainedUsersModule.name}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            (activeTab === "view" || activeTab === "archive") ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                <CustomTooltip text="Search modules by name or description">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search modules..."
                    className="neon-input"
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Export current view to CSV">
                  <TextIconButton
                    variant="download"
                    label="Export CSV"
                    onClick={exportToCSV}
                  />
                </CustomTooltip>
              </div>
            ) : undefined
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
          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Description", accessor: "description" },
              { header: "Version", accessor: "version", width: 80 },
              { header: "Files", accessor: "files", width: 120 },
              { header: "Status", accessor: "status", width: 100 },
              { header: "Actions", accessor: "actions", width: 180 },
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
                  <CustomTooltip text="View trained users">
                    <TextIconButton
                      variant="view"
                      icon={<FiUser />}
                      label="Trained Users"
                      onClick={() => handleViewTrainedUsers(m)}
                    />
                  </CustomTooltip>
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
      {activeTab === "roletraining" && (
        <RoleModuleDocumentAssignment onSaved={refreshModules} skipRoleCreation={true} />
      )}
      {activeTab === "viewroletraining" && (
        <ViewRoleAssignments />
      )}
      {activeTab === "depttraining" && (
        <DepartmentModuleAssignment onSaved={refreshModules} />
      )}
      {activeTab === "archive" && (
        <>
          <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
            Archived Training Modules
          </h2>
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

      {/* Trained Users Dialog */}
      {trainedUsersModule && (
        <OverlayDialog
          open={true}
          onClose={() => {
            setTrainedUsersModule(null);
            setTrainedUsers([]);
          }}
          showCloseButton={true}
          width={900}
        >
          <div style={{ padding: 24 }}>
            <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.5rem", marginBottom: 8 }}>
              Trained Users
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Module: <span style={{ color: "var(--neon)", fontWeight: 600 }}>{trainedUsersModule.name}</span>
            </p>

            {loadingTrainedUsers ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p>Loading trained users...</p>
              </div>
            ) : trainedUsers.length > 0 ? (
              <>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Total: {trainedUsers.length} user{trainedUsers.length !== 1 ? "s" : ""}
                  </p>
                  <CustomTooltip text="Export trained users to CSV">
                    <TextIconButton
                      variant="download"
                      label="Export CSV"
                      onClick={exportTrainedUsersCSV}
                    />
                  </CustomTooltip>
                </div>
                <NeonTable
                  columns={[
                    { header: "Name", accessor: "name", width: "50%" },
                    { header: "Date Trained", accessor: "date_trained", width: "30%" },
                    { header: "Version Trained", accessor: "version_trained", width: "20%" },
                  ]}
                  data={trainedUsers.map(log => {
                    const user = Array.isArray(log.users) ? log.users[0] : log.users;
                    const fullName = user ? `${user.last_name}, ${user.first_name}` : "N/A";

                    return {
                      name: fullName,
                      date_trained: log.completed_at
                        ? new Date(log.completed_at).toLocaleDateString()
                        : "N/A",
                      version_trained: trainedUsersModule?.version || "N/A",
                    };
                  })}
                />
              </>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", padding: "40px 0" }}>
                No users have completed this training module yet.
              </p>
            )}
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
