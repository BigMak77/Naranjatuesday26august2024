// Custom tooltips added to all buttons
"use client";

import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import FolderTabs from "@/components/FolderTabs";
import { supabase } from "@/lib/supabase-client";
import {
  FiClipboard,
  FiPlus,
  FiArchive,
  FiEdit,
  FiRotateCcw,
  FiFileText,
  FiUsers,
  FiEye,
  FiUser,
  FiUpload,
} from "react-icons/fi";

import AddModuleTab from "@/components/modules/AddModuleTab";
import EditModuleTab from "@/components/modules/EditModuleTab";
import TestBuilder from "@/components/training/TestBuilder";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { getFileIcon } from "@/lib/file-utils";
import RoleModuleDocumentAssignment from "@/components/roles/RoleModuleDocumentAssignment";
import DepartmentModuleAssignment from "@/components/departments/DepartmentModuleAssignment";
import ViewRoleAssignments from "@/components/roles/ViewRoleAssignments";
import ViewModuleAssignments from "@/components/modules/ViewModuleAssignments";
import BulkModuleAssignment from "@/components/modules/BulkModuleAssignment";

// Define Module type inline
interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  is_archived: boolean;
  ref_code?: string;
  categories?: string[];
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  requires_follow_up?: boolean;
  review_period?: string;
  follow_up_period?: string;
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
    "add" | "view" | "archive" | "tests" | "roletraining" | "depttraining" | "viewroletraining" | "viewmoduleassignments"
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
  const [paginationControls, setPaginationControls] = useState<React.ReactNode>(null);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; name: string; error: string }>;
  } | null>(null);
  const [showUploadResults, setShowUploadResults] = useState(false);
  const [bulkAssignModuleId, setBulkAssignModuleId] = useState<string | null>(null);

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
      key: "viewmoduleassignments",
      label: "View Module Assignments",
      icon: <FiClipboard />,
      tooltip: "Search modules and view which roles/departments are assigned",
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
  const exportToCSV = async () => {
    const dataToExport = activeTab === "archive" ? archiveTabModules : viewTabModules;

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    // Fetch categories to get their names
    const { data: categories } = await supabase
      .from('module_categories')
      .select('id, name');

    const categoryIdToName = new Map(
      (categories || []).map(c => [c.id, c.name])
    );

    // Define CSV headers
    const headers = [
      "Name",
      "Category",
      "Ref Code",
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
    const rows = dataToExport.map(module => {
      // Get category name from first category ID
      const categoryName = module.categories && module.categories.length > 0
        ? categoryIdToName.get(module.categories[0]) || ""
        : "";

      return [
        module.name,
        categoryName,
        module.ref_code || "",
        module.description,
        module.version,
        module.learning_objectives || "",
        module.estimated_duration || "",
        module.delivery_format || "",
        module.target_audience || "",
        (module.prerequisites || []).join("; "),
        (module.tags || []).join("; "),
        module.requires_follow_up ? "Yes" : "No",
        module.follow_up_period || module.review_period || "",
        module.is_archived ? "Archived" : "Active",
        module.created_at || "",
        module.updated_at || ""
      ];
    });

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

  // Handle CSV file upload for bulk module creation
  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      await processCSV(text);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Process CSV content and bulk insert modules
  const processCSV = async (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file is empty or has no data rows');
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Validate required columns
    const nameIndex = headers.indexOf('name');
    const refCodeIndex = headers.indexOf('ref_code') >= 0 ? headers.indexOf('ref_code') : headers.indexOf('ref code');
    const categoryIndex = headers.indexOf('category');

    if (nameIndex === -1) {
      alert('CSV must contain a "name" column');
      return;
    }

    // Get existing modules to check for duplicates
    const { data: existingModules } = await supabase
      .from('modules')
      .select('id, ref_code');

    const existingRefCodes = new Set(
      (existingModules || [])
        .map(m => m.ref_code?.toLowerCase())
        .filter(Boolean)
    );

    // Get all categories with their prefixes for auto-assignment
    const { data: categories } = await supabase
      .from('module_categories')
      .select('id, name, prefix')
      .eq('archived', false);

    // Map category name -> category data (id and prefix)
    const categoryNameMap = new Map(
      (categories || []).map(c => [c.name.toLowerCase(), { id: c.id, prefix: c.prefix }])
    );

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; name: string; error: string }>
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (handle quoted values)
        const values = parseCSVLine(line);

        const name = values[nameIndex]?.trim();
        if (!name) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            name: 'Unknown',
            error: 'Missing required field: name'
          });
          continue;
        }

        // Get category from CSV (if provided)
        const categoryName = categoryIndex >= 0 ? values[categoryIndex]?.trim() : '';
        let categoryId: string | null = null;
        let categoryPrefix: string | null = null;

        if (categoryName) {
          const categoryData = categoryNameMap.get(categoryName.toLowerCase());
          if (categoryData) {
            categoryId = categoryData.id;
            categoryPrefix = categoryData.prefix;
          } else {
            results.failed++;
            results.errors.push({
              row: i + 1,
              name,
              error: `Category "${categoryName}" not found`
            });
            continue;
          }
        }

        // Get or generate ref_code
        let refCode = refCodeIndex >= 0 ? values[refCodeIndex]?.trim() : '';

        // If no ref_code but category has prefix, we could auto-generate (optional)
        // For now, just use the provided ref_code or empty string

        // Check for duplicate ref_code (only if ref_code is provided)
        if (refCode && existingRefCodes.has(refCode.toLowerCase())) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            name,
            error: `Duplicate ref_code: ${refCode} already exists`
          });
          continue;
        }

        // Validate ref_code matches category prefix (if both are provided)
        if (refCode && categoryPrefix) {
          const refCodePrefix = refCode.match(/^([A-Z]+)-/)?.[1];
          if (refCodePrefix && refCodePrefix.toUpperCase() !== categoryPrefix.toUpperCase()) {
            results.failed++;
            results.errors.push({
              row: i + 1,
              name,
              error: `Ref code "${refCode}" doesn't match category prefix "${categoryPrefix}"`
            });
            continue;
          }
        }

        // Get tags from CSV or generate from module name
        let tags = parseArrayField(getCSVValue(values, headers, 'tags'));

        // If no tags provided, auto-generate from module name
        if (tags.length === 0) {
          // Extract meaningful words from the module name (ignore common words)
          const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
          const words = name
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/) // Split by whitespace
            .filter(word => word.length > 2 && !commonWords.includes(word)); // Filter out short and common words

          // Use the first 3-5 meaningful words as tags
          tags = words.slice(0, 5);
        }

        // Build module object with defaults
        const moduleData: any = {
          name,
          ref_code: refCode || null,
          description: getCSVValue(values, headers, 'description') || '',
          version: parseInt(getCSVValue(values, headers, 'version')) || 1,
          estimated_duration: parseInt(getCSVValue(values, headers, 'estimated_duration') || getCSVValue(values, headers, 'estimated duration')) || 60,
          delivery_format: getCSVValue(values, headers, 'delivery_format') || getCSVValue(values, headers, 'delivery format') || '',
          prerequisites: parseArrayField(getCSVValue(values, headers, 'prerequisites')),
          tags: tags,
          requires_follow_up: parseBooleanField(getCSVValue(values, headers, 'requires_follow_up') || getCSVValue(values, headers, 'requires follow up')),
          follow_up_period: getCSVValue(values, headers, 'review_period') || getCSVValue(values, headers, 'review period') || '12',
          attachments: [],
          categories: categoryId ? [categoryId] : [],
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert module
        const { error } = await supabase
          .from('modules')
          .insert([moduleData]);

        if (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            name,
            error: error.message
          });
        } else {
          results.success++;
          // Add to existing ref codes to check for duplicates within the same CSV
          if (refCode) {
            existingRefCodes.add(refCode.toLowerCase());
          }
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          name: 'Error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Show results
    setUploadResults(results);
    setShowUploadResults(true);

    // Refresh modules list
    await refreshModules();
  };

  // Helper function to parse CSV line with quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map(v => v.trim());
  };

  // Helper to get CSV value by column name
  const getCSVValue = (values: string[], headers: string[], columnName: string): string => {
    const index = headers.indexOf(columnName.toLowerCase());
    return index >= 0 ? values[index]?.trim() || '' : '';
  };

  // Helper to parse array fields (semicolon-separated)
  const parseArrayField = (value: string): string[] => {
    if (!value) return [];
    return value.split(';').map(v => v.trim()).filter(Boolean);
  };

  // Helper to parse boolean fields
  const parseBooleanField = (value: string): boolean => {
    const normalized = value?.toLowerCase().trim();
    return normalized === 'yes' || normalized === 'true' || normalized === '1';
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
            (activeTab === "view" || activeTab === "archive" || activeTab === "add") ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                  {activeTab !== "add" && (
                    <CustomTooltip text="Search modules by name or description">
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="neon-input"
                        style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
                      />
                    </CustomTooltip>
                  )}
                  {activeTab === "add" ? (
                    <CustomTooltip text="Upload CSV file to bulk create modules">
                      <label htmlFor="csv-upload" style={{ display: 'inline-block' }}>
                        <input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleUploadCSV}
                          style={{ display: 'none' }}
                        />
                        <TextIconButton
                          variant="add"
                          icon={<FiUpload />}
                          label="Upload CSV"
                          onClick={() => document.getElementById('csv-upload')?.click()}
                        />
                      </label>
                    </CustomTooltip>
                  ) : (
                    <CustomTooltip text="Export current view to CSV">
                      <TextIconButton
                        variant="download"
                        label="Export CSV"
                        onClick={exportToCSV}
                      />
                    </CustomTooltip>
                  )}
                </div>
                {(activeTab === "view" || activeTab === "archive") && paginationControls && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {paginationControls}
                  </div>
                )}
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
            paginationPosition="toolbar"
            onPaginationChange={setPaginationControls}
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Ref Code", accessor: "ref_code", width: 120 },
              { header: "Description", accessor: "description" },
              { header: "Version", accessor: "version", width: 80 },
              { header: "Files", accessor: "files", width: 120 },
              { header: "Status", accessor: "status", width: 100 },
              { header: "Actions", accessor: "actions", width: 240 },
            ]}
            data={filteredModules
              .filter((m) => !m.is_archived) // Only show non-archived modules in view tab
              .map((m) => ({
              ...m,
              ref_code: m.ref_code || <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>,
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
                  <CustomTooltip text="Bulk assign to roles or departments">
                    <TextIconButton
                      variant="next"
                      icon={<FiUsers />}
                      label="Bulk Assign"
                      onClick={() => setBulkAssignModuleId(m.id)}
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
      {activeTab === "roletraining" && (
        <RoleModuleDocumentAssignment onSaved={refreshModules} skipRoleCreation={true} />
      )}
      {activeTab === "viewroletraining" && (
        <ViewRoleAssignments />
      )}
      {activeTab === "viewmoduleassignments" && (
        <ViewModuleAssignments />
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
            paginationPosition="toolbar"
            onPaginationChange={setPaginationControls}
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Ref Code", accessor: "ref_code", width: 120 },
              { header: "Description", accessor: "description" },
              { header: "Version", accessor: "version", width: 80 },
              { header: "Files", accessor: "files", width: 120 },
              { header: "Actions", accessor: "actions", width: 120 },
            ]}
            data={filteredModules
              .filter((m) => m.is_archived)
              .map((m) => ({
                ...m,
                ref_code: m.ref_code || <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>,
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

      {/* Upload Results Dialog */}
      {showUploadResults && uploadResults && (
        <OverlayDialog
          open={true}
          onClose={() => {
            setShowUploadResults(false);
            setUploadResults(null);
          }}
          showCloseButton={true}
          width={800}
        >
          <div style={{ padding: 24 }}>
            <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.5rem", marginBottom: 16 }}>
              Bulk Upload Results
            </h2>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>Successfully Created</p>
                  <p style={{ color: "var(--success)", fontSize: "2rem", fontWeight: 600 }}>{uploadResults.success}</p>
                </div>
                <div style={{ flex: 1, padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>Failed</p>
                  <p style={{ color: "var(--danger)", fontSize: "2rem", fontWeight: 600 }}>{uploadResults.failed}</p>
                </div>
              </div>

              {uploadResults.errors.length > 0 && (
                <>
                  <h3 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 12 }}>
                    Errors ({uploadResults.errors.length})
                  </h3>
                  <div style={{ maxHeight: 400, overflowY: "auto", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
                          <th style={{ padding: 12, textAlign: "left", color: "var(--accent)", fontWeight: 600, width: 80 }}>Row</th>
                          <th style={{ padding: 12, textAlign: "left", color: "var(--accent)", fontWeight: 600 }}>Module Name</th>
                          <th style={{ padding: 12, textAlign: "left", color: "var(--accent)", fontWeight: 600 }}>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResults.errors.map((error, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < uploadResults.errors.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <td style={{ padding: 12, color: "var(--text-secondary)" }}>{error.row}</td>
                            <td style={{ padding: 12, color: "var(--text)" }}>{error.name}</td>
                            <td style={{ padding: 12, color: "var(--danger)", fontSize: "0.875rem" }}>{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="save"
                label="Close"
                onClick={() => {
                  setShowUploadResults(false);
                  setUploadResults(null);
                }}
              />
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Bulk Assign Dialog */}
      {bulkAssignModuleId && (
        <OverlayDialog
          open={true}
          onClose={() => setBulkAssignModuleId(null)}
          showCloseButton={true}
          width={900}
        >
          <BulkModuleAssignment
            preSelectedModuleId={bulkAssignModuleId}
            onClose={() => setBulkAssignModuleId(null)}
          />
        </OverlayDialog>
      )}
    </>
  );
}
