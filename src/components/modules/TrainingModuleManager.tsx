// Custom tooltips added to all buttons
"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import ModuleDocumentLinkDialog from "@/components/modules/ModuleDocumentLinkDialog";
import GroupTraining from "@/components/training/GroupTraining";
import TrainingUpload from "@/components/training/TrainingUpload";

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
    "add" | "view" | "archive" | "training"
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
  const [createTestModuleId, setCreateTestModuleId] = useState<string | null>(null);
  const [viewTestsModuleId, setViewTestsModuleId] = useState<string | null>(null);
  const [moduleTests, setModuleTests] = useState<any[]>([]);
  const [loadingModuleTests, setLoadingModuleTests] = useState(false);
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false);
  const [showAddTestDialog, setShowAddTestDialog] = useState(false);
  const [showAllTestsDialog, setShowAllTestsDialog] = useState(false);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [loadingAllTests, setLoadingAllTests] = useState(false);
  const [editTestId, setEditTestId] = useState<string | null>(null);
  const [showRoleTrainingDialog, setShowRoleTrainingDialog] = useState(false);
  const [showViewRoleAssignmentsDialog, setShowViewRoleAssignmentsDialog] = useState(false);
  const [showDepartmentTrainingDialog, setShowDepartmentTrainingDialog] = useState(false);
  const [showViewModuleAssignmentsDialog, setShowViewModuleAssignmentsDialog] = useState(false);
  const [linkDocumentsModule, setLinkDocumentsModule] = useState<Module | null>(null);
  const [showGroupTrainingDialog, setShowGroupTrainingDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);

  // Function to fetch all tests
  const fetchAllTests = async () => {
    setLoadingAllTests(true);
    try {
      const { data: tests, error } = await supabase
        .from("question_packs")
        .select(`
          id,
          title,
          description,
          pass_mark,
          time_limit_minutes,
          is_active,
          is_archived,
          module_id,
          document_id,
          created_at,
          modules (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all tests:", error);
        setAllTests([]);
      } else {
        setAllTests(tests || []);
      }
    } catch (error) {
      console.error("Error fetching all tests:", error);
      setAllTests([]);
    } finally {
      setLoadingAllTests(false);
    }
  };

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
      label: "+ Module or Test",
      tooltip: "Add new training module",
    },
    {
      key: "view",
      label: "View Module or Test",
      tooltip: "View and edit training modules",
    },
    {
      key: "training",
      label: "Training",
      tooltip: "Training dashboard and management",
    },
    {
      key: "archive",
      label: "Archive",
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

  // Handle opening module tests dialog
  const handleViewModuleTests = async (module: Module) => {
    setViewTestsModuleId(module.id);
    await fetchModuleTests(module.id);
  };

  // Fetch tests for a module
  const fetchModuleTests = async (moduleId: string) => {
    setLoadingModuleTests(true);

    try {
      const { data, error } = await supabase
        .from("question_packs")
        .select(`
          id,
          title,
          description,
          pass_mark,
          time_limit_minutes,
          is_active,
          is_archived,
          created_at,
          updated_at
        `)
        .eq("module_id", moduleId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching module tests:", error);
        setModuleTests([]);
      } else {
        setModuleTests(data || []);
      }
    } catch (err) {
      console.error("Exception fetching module tests:", err);
      setModuleTests([]);
    }

    setLoadingModuleTests(false);
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
          tabs={tabList}
          activeTab={activeTab}
          onChange={(tabKey) => {
            setActiveTab(tabKey as typeof activeTab);
            // Clear all dialog states when switching tabs
            setModuleToArchive(null);
            setModuleToRestore(null);
            setModuleToEdit(null);
            setBulkAssignModuleId(null);
            setCreateTestModuleId(null);
            setViewTestsModuleId(null);
            setEditTestId(null);
            setShowRoleTrainingDialog(false);
            setShowViewRoleAssignmentsDialog(false);
            setShowDepartmentTrainingDialog(false);
            setShowViewModuleAssignmentsDialog(false);
            setLinkDocumentsModule(null);
            setShowGroupTrainingDialog(false);
            setShowBulkUploadDialog(false);
          }}
          toolbar={
            (activeTab === "view" || activeTab === "archive" || activeTab === "add" || activeTab === "training") ? (
              <div className="training-module-toolbar" style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'center', 
                width: '100%', 
                justifyContent: 'space-between',
                minHeight: '52px',
                maxHeight: '52px',
                padding: '10px 0',
                overflow: 'visible'
              }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  alignItems: 'center', 
                  flex: 1, 
                  height: '32px',
                  overflow: 'visible'
                }}>
                  {activeTab !== "add" && activeTab !== "training" && (
                    <CustomTooltip text="Search modules by name or description">
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="neon-input"
                        style={{ flex: 1, minWidth: '200px', maxWidth: '300px', height: '32px' }}
                      />
                    </CustomTooltip>
                  )}
                  {activeTab === "add" ? (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', height: '32px' }}>
                      <CustomTooltip text="Create new training module">
                        <TextIconButton
                          variant="add"
                          icon={<FiPlus />}
                          label="Create Module"
                          onClick={() => setShowAddModuleDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Create new test">
                        <TextIconButton
                          variant="add"
                          icon={<FiFileText />}
                          label="Create Test"
                          onClick={() => setShowAddTestDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Upload CSV file to bulk create modules">
                        <label htmlFor="csv-upload" style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center',
                          height: '32px'
                        }}>
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
                    </div>
                  ) : activeTab === "training" ? (
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      height: '32px',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      whiteSpace: 'nowrap',
                      scrollbarWidth: 'thin',
                      WebkitOverflowScrolling: 'touch'
                    }}>
                      <CustomTooltip text="Create new test">
                        <TextIconButton
                          variant="add"
                          icon={<FiFileText />}
                          label="Add Test"
                          onClick={() => setShowAddTestDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="View and manage all tests">
                        <TextIconButton
                          variant="view"
                          icon={<FiEye />}
                          label="Manage Tests"
                          onClick={() => {
                            fetchAllTests();
                            setShowAllTestsDialog(true);
                          }}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Go to view modules">
                        <TextIconButton
                          variant="view"
                          icon={<FiClipboard />}
                          label="View Modules"
                          onClick={() => setActiveTab("view")}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Assign training modules to roles">
                        <TextIconButton
                          variant="next"
                          icon={<FiUsers />}
                          label="Role Training"
                          onClick={() => setShowRoleTrainingDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="View role training assignments">
                        <TextIconButton
                          variant="view"
                          icon={<FiEye />}
                          label="View Role Assignments"
                          onClick={() => setShowViewRoleAssignmentsDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Assign training to departments">
                        <TextIconButton
                          variant="next"
                          icon={<FiUsers />}
                          label="Department Training"
                          onClick={() => setShowDepartmentTrainingDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="View module assignments">
                        <TextIconButton
                          variant="view"
                          icon={<FiEye />}
                          label="View Module Assignments"
                          onClick={() => setShowViewModuleAssignmentsDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Assign training to groups">
                        <TextIconButton
                          variant="next"
                          icon={<FiUsers />}
                          label="Group Training"
                          onClick={() => setShowGroupTrainingDialog(true)}
                        />
                      </CustomTooltip>
                      <CustomTooltip text="Bulk upload training completions via CSV">
                        <TextIconButton
                          variant="upload"
                          icon={<FiUpload />}
                          label="Bulk Upload"
                          onClick={() => setShowBulkUploadDialog(true)}
                        />
                      </CustomTooltip>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', height: '32px' }}>
                      <CustomTooltip text="View all tests">
                        <TextIconButton
                          variant="view"
                          icon={<FiEye />}
                          label="View Tests"
                          onClick={() => {
                            fetchAllTests();
                            setShowAllTestsDialog(true);
                          }}
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
                  )}
                </div>
                {(activeTab === "view" || activeTab === "archive") && paginationControls && (
                  <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                    {paginationControls}
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
      {activeTab === "view" && (
        <>
          <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
            Browse and edit your training modules
          </h2>
          <NeonTable
            paginationPosition="toolbar"
            onPaginationChange={setPaginationControls}
            columns={[
              { header: "Name", accessor: "name", align: "center" },
              { header: "Ref Code", accessor: "ref_code", width: 120, align: "center" },
              { header: "Description", accessor: "description", align: "center" },
              { header: "Version", accessor: "version", width: 80, align: "center" },
              { header: "Files", accessor: "files", width: 120, align: "center" },
              { header: "Status", accessor: "status", width: 100, align: "center" },
              { header: "Actions", accessor: "actions", width: 300, align: "center" },
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
                  <CustomTooltip text="Link documents to this module">
                    <TextIconButton
                      variant="next"
                      icon={<FiFileText />}
                      label="Link Documents"
                      onClick={() => setLinkDocumentsModule(m)}
                    />
                  </CustomTooltip>
                  <CustomTooltip text="View tests for this module">
                    <TextIconButton
                      variant="view"
                      icon={<FiEye />}
                      label="View Tests"
                      onClick={() => handleViewModuleTests(m)}
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
      {activeTab === "training" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 0 }}>
            Training Dashboard & Management
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Module Statistics Card */}
            <div className="neon-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1rem", marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiClipboard />
                Module Statistics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Active Modules:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {modules.filter(m => !m.is_archived).length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Archived Modules:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {modules.filter(m => m.is_archived).length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total Tests:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {allTests.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="neon-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1rem", marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUsers />
                Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div>• Training modules created this week: <span style={{ color: 'var(--accent)' }}>-</span></div>
                <div>• Tests completed today: <span style={{ color: 'var(--accent)' }}>-</span></div>
                <div>• Active assignments: <span style={{ color: 'var(--accent)' }}>-</span></div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  * Activity tracking coming soon
                </div>
              </div>
            </div>


          </div>
        </div>
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
              { header: "Name", accessor: "name", align: "center" },
              { header: "Ref Code", accessor: "ref_code", width: 120, align: "center" },
              { header: "Description", accessor: "description", align: "center" },
              { header: "Version", accessor: "version", width: 80, align: "center" },
              { header: "Files", accessor: "files", width: 120, align: "center" },
              { header: "Actions", accessor: "actions", width: 120, align: "center" },
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
                    { header: "Name", accessor: "name", width: "50%", align: "center" },
                    { header: "Date Trained", accessor: "date_trained", width: "30%", align: "center" },
                    { header: "Version Trained", accessor: "version_trained", width: "20%", align: "center" },
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

      {/* Create Test Dialog */}
      {createTestModuleId && (
        <OverlayDialog
          open={true}
          onClose={() => setCreateTestModuleId(null)}
          showCloseButton={true}
          width={1200}
        >
          <TestBuilder
            preSelectedModuleId={createTestModuleId}
            onTestCreated={() => {
              setCreateTestModuleId(null);
            }}
          />
        </OverlayDialog>
      )}

      {/* View Module Tests Dialog */}
      {viewTestsModuleId && (
        <OverlayDialog
          open={true}
          onClose={() => {
            setViewTestsModuleId(null);
            setModuleTests([]);
          }}
          showCloseButton={true}
          width={1000}
        >
          <div style={{ padding: 24 }}>
            <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.5rem", marginBottom: 8 }}>
              Module Tests
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Tests for: <span style={{ color: "var(--neon)", fontWeight: 600 }}>
                {modules.find(m => m.id === viewTestsModuleId)?.name || "Selected Module"}
              </span>
            </p>

            {loadingModuleTests ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p>Loading tests...</p>
              </div>
            ) : moduleTests.length > 0 ? (
              <>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Total: {moduleTests.length} test{moduleTests.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <NeonTable
                  columns={[
                    { header: "Title", accessor: "title", width: "40%", align: "center" },
                    { header: "Pass Mark", accessor: "pass_mark", width: "15%", align: "center" },
                    { header: "Time Limit", accessor: "time_limit", width: "15%", align: "center" },
                    { header: "Status", accessor: "status", width: "15%", align: "center" },
                    { header: "Created", accessor: "created_at", width: "15%", align: "center" },
                  ]}
                  data={moduleTests.map(test => ({
                    id: test.id,
                    title: test.title,
                    pass_mark: `${test.pass_mark}%`,
                    time_limit: test.time_limit_minutes 
                      ? `${test.time_limit_minutes} min` 
                      : <span style={{ color: "var(--text-secondary)" }}>No limit</span>,
                    status: (
                      <span style={{ 
                        color: test.is_archived ? "var(--danger)" : test.is_active ? "var(--success)" : "var(--warning)",
                        fontWeight: 600 
                      }}>
                        {test.is_archived ? "Archived" : test.is_active ? "Active" : "Inactive"}
                      </span>
                    ),
                    created_at: test.created_at 
                      ? new Date(test.created_at).toLocaleDateString()
                      : "N/A",
                  }))}
                />
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 16 }}>
                  No tests found for this module.
                </p>
                <TextIconButton
                  variant="add"
                  icon={<FiPlus />}
                  label="Create First Test"
                  onClick={() => {
                    setViewTestsModuleId(null);
                    setCreateTestModuleId(viewTestsModuleId);
                  }}
                />
              </div>
            )}
          </div>
        </OverlayDialog>
      )}

      {/* Add Test Dialog */}
      {showAddTestDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowAddTestDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <TestBuilder
            onTestCreated={() => {
              setShowAddTestDialog(false);
            }}
          />
        </OverlayDialog>
      )}

      {/* Add Module Dialog */}
      {showAddModuleDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowAddModuleDialog(false)}
          showCloseButton={true}
          width={1000}
        >
          <AddModuleTab 
            onSuccess={() => {
              setShowAddModuleDialog(false);
              refreshModules(); // Refresh the list when a new module is added
            }} 
          />
        </OverlayDialog>
      )}

      {/* All Tests Dialog */}
      {showAllTestsDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowAllTestsDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <div style={{ padding: "24px" }}>
            <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>
              All Tests
            </h2>
            {loadingAllTests ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p>Loading tests...</p>
              </div>
            ) : allTests.length > 0 ? (
              <>
                <div style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
                  Found {allTests.length} test{allTests.length !== 1 ? "s" : ""}
                </div>
                <NeonTable
                  columns={[
                    { header: "Test Title", accessor: "title", width: "20%", align: "center" },
                    { header: "Module", accessor: "module_name", width: "15%", align: "center" },
                    { 
                      header: "Description", 
                      accessor: "description", 
                      width: "25%",
                      align: "center",
                      render: (value: unknown) => (
                        <div style={{ 
                          whiteSpace: "normal", 
                          wordWrap: "break-word",
                          maxWidth: "300px",
                          lineHeight: "1.4"
                        }}>
                          {value as string}
                        </div>
                      )
                    },
                    { header: "Pass Mark (%)", accessor: "pass_mark", width: "10%", align: "center" },
                    { header: "Time Limit", accessor: "time_limit", width: "10%", align: "center" },
                    { header: "Status", accessor: "status", width: "8%", align: "center" },
                    { header: "Actions", accessor: "actions", width: "12%", align: "center" },
                  ]}
                  data={allTests.map((test) => ({
                    id: test.id,
                    title: test.title || "Untitled Test",
                    module_name: test.modules?.name || (test.module_id ? "Unknown Module" : "No Module"),
                    description: test.description || "No description available",
                    pass_mark: test.pass_mark ? `${test.pass_mark}%` : "Not set",
                    time_limit: test.time_limit_minutes 
                      ? `${test.time_limit_minutes} min${test.time_limit_minutes !== 1 ? "s" : ""}`
                      : "No limit",
                    status: (
                      <span style={{
                        color: test.is_archived 
                          ? "var(--danger)" 
                          : test.is_active === false 
                            ? "var(--warning)" 
                            : "var(--success)",
                        fontWeight: 600,
                        fontSize: "0.875rem"
                      }}>
                        {test.is_archived 
                          ? "Archived" 
                          : test.is_active === false 
                            ? "Inactive" 
                            : "Active"}
                      </span>
                    ),
                    actions: (
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <CustomTooltip text="Edit this test">
                          <TextIconButton
                            variant="edit"
                            icon={<FiEdit />}
                            label="Edit"
                            onClick={() => {
                              setShowAllTestsDialog(false);
                              setEditTestId(test.id);
                            }}
                          />
                        </CustomTooltip>
                        {!test.is_archived && (
                          <CustomTooltip text="Archive this test">
                            <TextIconButton
                              variant="archive"
                              icon={<FiArchive />}
                              label="Archive"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to archive the test "${test.title}"?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from("question_packs")
                                      .update({ 
                                        is_archived: true,
                                        updated_at: new Date().toISOString()
                                      })
                                      .eq("id", test.id);

                                    if (error) {
                                      console.error("Error archiving test:", error);
                                      alert(`Failed to archive test: ${error.message}`);
                                    } else {
                                      console.log("Test archived successfully");
                                      // Refresh the tests list
                                      await fetchAllTests();
                                    }
                                  } catch (err) {
                                    console.error("Exception archiving test:", err);
                                    alert("An error occurred while archiving the test");
                                  }
                                }
                              }}
                            />
                          </CustomTooltip>
                        )}
                        {test.is_archived && (
                          <CustomTooltip text="Restore this test">
                            <TextIconButton
                              variant="save"
                              icon={<FiRotateCcw />}
                              label="Restore"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to restore the test "${test.title}"?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from("question_packs")
                                      .update({ 
                                        is_archived: false,
                                        updated_at: new Date().toISOString()
                                      })
                                      .eq("id", test.id);

                                    if (error) {
                                      console.error("Error restoring test:", error);
                                      alert(`Failed to restore test: ${error.message}`);
                                    } else {
                                      console.log("Test restored successfully");
                                      // Refresh the tests list
                                      await fetchAllTests();
                                    }
                                  } catch (err) {
                                    console.error("Exception restoring test:", err);
                                    alert("An error occurred while restoring the test");
                                  }
                                }
                              }}
                            />
                          </CustomTooltip>
                        )}
                      </div>
                    ),
                  }))}
                />
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 16 }}>
                  No tests found.
                </p>
                <TextIconButton
                  variant="add"
                  icon={<FiPlus />}
                  label="Create First Test"
                  onClick={() => {
                    setShowAllTestsDialog(false);
                    setShowAddTestDialog(true);
                  }}
                />
              </div>
            )}
          </div>
        </OverlayDialog>
      )}

      {/* Edit Test Dialog */}
      {editTestId && (
        <OverlayDialog
          open={true}
          onClose={() => setEditTestId(null)}
          showCloseButton={true}
          width={1200}
        >
          <TestBuilder
            editTestId={editTestId}
            onTestCreated={() => {
              setEditTestId(null);
              // Refresh all tests if the dialog is still open
              if (showAllTestsDialog) {
                fetchAllTests();
              }
            }}
          />
        </OverlayDialog>
      )}

      {/* Role Training Dialog */}
      {showRoleTrainingDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowRoleTrainingDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <RoleModuleDocumentAssignment 
            onSaved={() => {
              refreshModules();
              setShowRoleTrainingDialog(false);
            }} 
            skipRoleCreation={true} 
          />
        </OverlayDialog>
      )}

      {/* View Role Assignments Dialog */}
      {showViewRoleAssignmentsDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowViewRoleAssignmentsDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <ViewRoleAssignments />
        </OverlayDialog>
      )}

      {/* Department Training Dialog */}
      {showDepartmentTrainingDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowDepartmentTrainingDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <DepartmentModuleAssignment 
            onSaved={() => {
              refreshModules();
              setShowDepartmentTrainingDialog(false);
            }} 
          />
        </OverlayDialog>
      )}

      {/* View Module Assignments Dialog */}
      {showViewModuleAssignmentsDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowViewModuleAssignmentsDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <ViewModuleAssignments />
        </OverlayDialog>
      )}

      {/* Link Documents to Module Dialog */}
      {linkDocumentsModule && (
        <ModuleDocumentLinkDialog
          open={true}
          onClose={() => setLinkDocumentsModule(null)}
          moduleId={linkDocumentsModule.id}
          moduleName={linkDocumentsModule.name}
        />
      )}

      {/* Group Training Dialog */}
      {showGroupTrainingDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowGroupTrainingDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <GroupTraining />
        </OverlayDialog>
      )}

      {/* Bulk Upload Dialog */}
      {showBulkUploadDialog && (
        <OverlayDialog
          open={true}
          onClose={() => setShowBulkUploadDialog(false)}
          showCloseButton={true}
          width={1200}
        >
          <TrainingUpload />
        </OverlayDialog>
      )}
    </>
  );
}
