// Custom tooltips added to all buttons for faster, more responsive tooltips
"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import TextIconButton from "@/components/ui/TextIconButtons";
import {
  FiSave,
  FiEdit,
  FiUserPlus,
  FiDownload,
  FiUpload,
  FiCheck,
  FiX,
  FiPlus,
  FiArchive,
  FiChevronLeft,
  FiChevronRight,
  FiUserX,
  FiKey,
  FiUsers
} from "react-icons/fi";
import { useUser } from "@/lib/useUser";
import OverlayDialog from "@/components/ui/OverlayDialog";
import nationalities from "@/lib/nationalities.json";
import UserPermissionsManager from "@/components/user/UserPermissionsManager";
import { PERMISSIONS, PermissionKey } from "@/types/userPermissions";
import SuccessModal from "../ui/SuccessModal";
import UserCSVImport from "./UserCSVImport";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import DepartmentRoleManager from "./DepartmentRoleManager";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department_id?: string;
  role_id?: string;
  access_level?: string;
  phone?: string;
  created_at?: string;
  department_name?: string;
  role_title?: string;
  status?: string;
  nationality?: string;
  document_path?: string;
  is_archived?: boolean;
  last_updated_at?: string;
  is_anonymous?: boolean;
  auth_id?: string;
  start_date?: string;
  is_first_aid?: boolean;
  avatar_url?: string;
  is_trainer?: boolean;
  shift_id?: string;
  shift_name?: string;
  is_leaver?: boolean;
  leaver_date?: string;
  leaver_reason?: string;
  receive_notifications?: boolean;
  employee_number?: string;
}

// Helper to format date as UK style dd/mm/yy
function formatDateUK(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

interface UserManagementPanelProps {
  onControlsReady?: (controls: {
    userSearch: string;
    setUserSearch: (val: string) => void;
    filteredUsersCount: number;
    pageSize: number;
    setPageSize: (val: number) => void;
    currentPage: number;
    setCurrentPage: (val: number) => void;
    totalPages: number;
    handleBulkAssign: () => void;
    handleAddUser: (e: any) => void;
    handleExportUsers: () => void;
    showLeavers: boolean;
    setShowLeavers: (val: boolean) => void;
    UserCSVImportComponent: React.ReactNode;
    refreshData: () => void; // Add refresh function to controls
  }) => void;
  onDataChange?: () => void; // Callback when data is modified
}

// ---------------------- Main component ----------------------
export default function UserManagementPanel({ onControlsReady, onDataChange }: UserManagementPanelProps) {
  useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string; department_id: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [shiftPatterns, setShiftPatterns] = useState<{ id: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignStep, setBulkAssignStep] = useState(1); // Start at select users step
  const [bulkAssignType, setBulkAssignType] = useState(""); // "role", "shift", "first_aid", "trainer"
  const [bulkDeptId, setBulkDeptId] = useState("");
  const [bulkRoleId, setBulkRoleId] = useState("");
  const [bulkShiftId, setBulkShiftId] = useState("");
  const [bulkFirstAid, setBulkFirstAid] = useState(false);
  const [bulkTrainer, setBulkTrainer] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkSelectedUserIds, setBulkSelectedUserIds] = useState<string[]>([]);
  const [showLeavers, setShowLeavers] = useState(false);

  const [showBulkSelectColumn, setShowBulkSelectColumn] = useState(false);

  const bulkSelectBoxRef = useRef<HTMLDivElement | null>(null);

  // store the element that opened the dialog (e.g. clicked name) to restore focus
  const openerRef = useRef<HTMLElement | null>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [bulkDeptFilter, setBulkDeptFilter] = useState("");
  const [bulkShiftFilter, setBulkShiftFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);

  // Department/Role Manager state
  const [deptRoleDialogOpen, setDeptRoleDialogOpen] = useState(false);
  const [deptRoleUser, setDeptRoleUser] = useState<User | null>(null);

  // Helper to open permissions dialog and fetch permissions
  const handleOpenPermissions = async (user: User) => {
    setPermissionsUser(user);
    setPermissionsDialogOpen(true);
    // Fetch permissions from Supabase
    const { data, error } = await supabase
      .from("users")
      .select("permissions")
      .eq("id", user.id)
      .single();
    if (!error && data && Array.isArray(data.permissions)) {
      setPermissions(data.permissions as PermissionKey[]);
    } else {
      setPermissions([]);
    }
  };

  // Helper to open department/role manager
  const handleOpenDeptRoleManager = (user: User) => {
    setDeptRoleUser(user);
    setDeptRoleDialogOpen(true);
  };

  // Handler for successful dept/role change
  const handleDeptRoleSuccess = async () => {
    // Refresh all data to get updated users, departments, roles, and shifts
    await refreshAllData();
    // Also update selectedUser if it's still open
    if (selectedUser && deptRoleUser && selectedUser.id === deptRoleUser.id) {
      const updatedUser = await supabase
        .from("users")
        .select("*")
        .eq("id", selectedUser.id)
        .single();
      if (updatedUser.data) {
        setSelectedUser({ ...selectedUser, ...updatedUser.data });
      }
    }
    // Notify parent component of data change
    onDataChange?.();
  };

  // Debug: log users and search value
  console.log("UserManagementPanel: users", users);
  console.log("UserManagementPanel: userSearch", userSearch);
  console.log("UserManagementPanel: bulkDeptFilter", bulkDeptFilter);
  console.log("UserManagementPanel: bulkShiftFilter", bulkShiftFilter);

  // Filter users based on search and leaver status
  const filteredUsers = users.filter((u) => {
    // First check leaver status
    const leaverCheck = showLeavers ? true : !u.is_leaver;
    if (!leaverCheck) return false;

    // Check department filter (only when in bulk select mode)
    if (bulkDeptFilter) {
      const department = departments.find((d) => d.id === u.department_id)?.name || "";
      if (!department.toLowerCase().includes(bulkDeptFilter.toLowerCase())) {
        return false;
      }
    }

    // Check shift filter (only when in bulk select mode)
    if (bulkShiftFilter) {
      const shift = u.shift_name || "";
      if (!shift.toLowerCase().includes(bulkShiftFilter.toLowerCase())) {
        return false;
      }
    }

    // Check text search across all fields
    const search = userSearch.trim().toLowerCase();
    if (!search) return true; // If no search term, show all that passed previous filters

    const department = departments.find((d) => d.id === u.department_id)?.name || "";
    const role = roles.find((r) => r.id === u.role_id)?.title || "";
    const shift = u.shift_name || "";
    const employeeNumber = u.employee_number || "";

    return (
      (u.first_name || "").toLowerCase().includes(search) ||
      (u.last_name || "").toLowerCase().includes(search) ||
      department.toLowerCase().includes(search) ||
      role.toLowerCase().includes(search) ||
      shift.toLowerCase().includes(search) ||
      employeeNumber.toLowerCase().includes(search)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    // Reset to first page if filter/search changes
    setCurrentPage(1);
  }, [userSearch, showLeavers, pageSize, bulkDeptFilter, bulkShiftFilter]);

  // Centralized function to refresh all data
  const refreshAllData = async () => {
    try {
      const [
        { data: u, error: userErr },
        { data: d, error: deptErr },
        { data: r, error: roleErr },
        { data: s, error: shiftErr }
      ] = await Promise.all([
        supabase.from("users").select("*, shift_id"),
        supabase.from("departments").select("id, name"),
        supabase.from("roles").select("id, title, department_id"),
        supabase.from("shift_patterns").select("id, name")
      ]);
      if (userErr || deptErr || roleErr || shiftErr) {
        setErrorMsg("Failed to load data. Please check your connection and try again.");
        return;
      }
      // Ensure access_level is always a string and present
      const usersWithNames = (u || []).map((user) => {
        const role = r?.find((role) => role.id === user.role_id);
        const department = d?.find((dept) => dept.id === user.department_id);
        return {
          ...user,
          access_level: typeof user.access_level === "string" ? user.access_level : String(user.access_level ?? "User"),
          shift_name: s?.find((sp) => sp.id === user.shift_id)?.name || "",
          shift_id: user.shift_id || "",
          role_title: role ? role.title : "—",
          department_name: department ? department.name : "—",
          receive_notifications: user.receive_notifications === true
        };
      });
      setUsers(usersWithNames);
      setDepartments(d || []);
      setRoles(r || []);
      setShiftPatterns(s || []);
    } catch (err) {
      setErrorMsg("Unexpected error loading users.");
      console.error("[UserManagementPanel] Unexpected error loading users:", err);
    }
  };

  // Expose controls to parent component
  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        userSearch,
        setUserSearch,
        filteredUsersCount: filteredUsers.length,
        pageSize,
        setPageSize,
        currentPage,
        setCurrentPage,
        totalPages,
        handleBulkAssign: () => {
          setShowBulkSelectColumn(true);
          setBulkAssignOpen(false);
          setBulkAssignStep(1);
          setBulkAssignType("");
          setBulkDeptId("");
          setBulkRoleId("");
          setBulkShiftId("");
          setBulkFirstAid(false);
          setBulkTrainer(false);
          setBulkSelectedUserIds([]);
          setUserSearch("");
          setBulkDeptFilter("");
          setBulkShiftFilter("");
        },
        handleAddUser: (e: any) => {
          handleOpenDialog(
            {
              id: "",
              email: "",
              first_name: "",
              last_name: "",
              department_id: "",
              role_id: "",
              access_level: "User",
              phone: "",
              nationality: "",
              is_first_aid: false,
              is_trainer: false,
              start_date: "",
              receive_notifications: false
            },
            true,
            (e?.currentTarget as HTMLElement) ?? null
          );
        },
        handleExportUsers: handleExportUsers,
        showLeavers,
        setShowLeavers,
        UserCSVImportComponent: (
          <UserCSVImport
            onImport={async (usersToImport: User[]) => {
              const validUsers = usersToImport
                .map(cleanUserFields)
                .filter(validateUser);
              if (validUsers.length === 0) {
                setErrorMsg("No valid users to import. Please check your CSV.");
                return;
              }
              try {
                await supabase.from("users").upsert(validUsers, { onConflict: "id" });
                await refreshAllData();
                // Notify parent component of data change
                onDataChange?.();
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 1000);
                if (validUsers.length < usersToImport.length) {
                  setErrorMsg(`Imported ${validUsers.length} users. ${usersToImport.length - validUsers.length} were skipped due to missing required fields.`);
                } else {
                  setErrorMsg("");
                }
              } catch (err: any) {
                setErrorMsg("Failed to import users. " + (err.message || ""));
              }
            }}
            onError={setErrorMsg}
          />
        ),
        refreshData: refreshAllData
      });
    }
  }, [userSearch, filteredUsers.length, pageSize, currentPage, totalPages, showLeavers, onControlsReady]);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      await refreshAllData();
      setLoading(false);
    };
    load();
  }, []);

  const handleOpenDialog = (user: User, addMode = false, opener?: HTMLElement | null) => {
    openerRef.current = opener || null;
    setSelectedUser(user);
    setIsAddMode(addMode);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setIsAddMode(false);
    setErrorMsg("");
    // focus restore handled by Modal
  };

  const handleBulkAssignStart = () => {
    setBulkAssignStep(2); // Start at config step
    setBulkAssignType("");
    setBulkDeptId("");
    setBulkRoleId("");
    setBulkShiftId("");
    setBulkFirstAid(false);
    setBulkTrainer(false);
    setBulkSelectedUserIds([]);
    setBulkAssignOpen(true);
  };

  const handleBulkAssignNext = () => {
    setBulkAssignStep((step) => step + 1);
  };
  const handleBulkAssignBack = () => {
    setBulkAssignStep((step) => step - 1);
  };
  const handleBulkAssignCancel = () => {
    setBulkAssignOpen(false);
  };

  const handleBulkAssignConfirm = async () => {
    if (bulkSelectedUserIds.length === 0) return;
    setBulkAssignLoading(true);
    let updateObj: any = {};
    if (bulkAssignType === "role") {
      if (!bulkDeptId || !bulkRoleId) return;
      updateObj = { department_id: bulkDeptId, role_id: bulkRoleId };
    } else if (bulkAssignType === "shift") {
      if (!bulkShiftId) return;
      updateObj = { shift_id: bulkShiftId };
    } else if (bulkAssignType === "first_aid") {
      updateObj = { is_first_aid: bulkFirstAid };
    } else if (bulkAssignType === "trainer") {
      updateObj = { is_trainer: bulkTrainer };
    }
    // Optimistically update table before supabase call
    setUsers((prevUsers) =>
      prevUsers.map((u) => (bulkSelectedUserIds.includes(u.id) ? { ...u, ...updateObj } : u))
    );
    await supabase.from("users").update(updateObj).in("id", bulkSelectedUserIds);
    // Immediately refresh all data from supabase for consistency
    await refreshAllData();
    // Notify parent component of data change
    onDataChange?.();
    setShowSuccess(true);
    setBulkAssignOpen(false);
    setBulkAssignLoading(false);
    setTimeout(() => {
      setShowSuccess(false);
      // Optionally, scroll to top or focus table
    }, 800);
  };

  const handleBulkAssignApply = async () => {
    if (bulkSelectedUserIds.length === 0) return;
    setBulkAssignLoading(true);
    let updateFields: Record<string, any> = {};
    if (bulkAssignType === "role") {
      if (!bulkDeptId || !bulkRoleId) return;
      updateFields = { department_id: bulkDeptId, role_id: bulkRoleId };
    } else if (bulkAssignType === "shift") {
      if (!bulkShiftId) return;
      updateFields = { shift_id: bulkShiftId };
    } else if (bulkAssignType === "first_aid") {
      updateFields = { is_first_aid: bulkFirstAid };
    } else if (bulkAssignType === "trainer") {
      updateFields = { is_trainer: bulkTrainer };
    }

    // For role changes, capture original roles before updating
    const originalUserRoles = bulkAssignType === "role" 
      ? users.filter(u => bulkSelectedUserIds.includes(u.id))
          .map(u => ({ user_id: u.id, old_role_id: u.role_id }))
      : [];

    // Optimistically update table before supabase call
    setUsers((prevUsers) =>
      prevUsers.map((u) => (bulkSelectedUserIds.includes(u.id) ? { ...u, ...updateFields } : u))
    );
    await supabase.from("users").update(updateFields).in("id", bulkSelectedUserIds);
    // Immediately refresh users from supabase for consistency
    const { data: refreshedUsers } = await supabase.from("users").select("*");
    setUsers(refreshedUsers || []);
    
    // Assignment syncing for bulk role changes
    if (bulkAssignType === "role" && originalUserRoles.length > 0) {
      // Process each user's role change individually for proper logging
      for (const userRole of originalUserRoles) {
        try {
          const syncResponse = await fetch("/api/update-user-role-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              user_id: userRole.user_id,
              new_role_id: bulkRoleId,
              old_role_id: userRole.old_role_id
            }),
          });
          if (!syncResponse.ok) {
            console.warn(`Failed to sync role assignments for user ${userRole.user_id}:`, await syncResponse.text());
          } else {
            const syncResult = await syncResponse.json();
            console.log(`Role assignments synced for user ${userRole.user_id}:`, syncResult);
          }
        } catch (syncErr) {
          console.warn(`Error syncing role assignments for user ${userRole.user_id}:`, syncErr);
        }
      }
    }
    setShowSuccess(true);
    setBulkAssignOpen(false);
    setBulkAssignLoading(false);
    setBulkAssignStep(2); // Reset to config step
    setBulkAssignType("");
    setBulkDeptId("");
    setBulkRoleId("");
    setBulkShiftId("");
    setBulkFirstAid(false);
    setBulkTrainer(false);
    setBulkSelectedUserIds([]);
    setTimeout(() => {
      setShowSuccess(false);
    }, 800);
  };

  const allowedAccessLevels = [
    "Super Admin",
    "Admin", 
    "HR Admin",
    "H&S Admin",
    "Dept. Manager",
    "Manager",
    "Trainer",
    "User"
  ];
  const cleanUserFields = (user: User): User => ({
    ...user,
    department_id: user.department_id || undefined,
    role_id: user.role_id || undefined,
    shift_id: user.shift_id || undefined,
    access_level: allowedAccessLevels.includes((user.access_level || "").trim())
      ? (user.access_level || "").trim()
      : "User"
  });

  const validateUser = (user: User) => {
    if (!user.email?.trim() || !user.first_name?.trim() || !user.last_name?.trim()) {
      setErrorMsg("Email, First Name, and Last Name are required.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleSave = async () => {
    if (!selectedUser) {
      setErrorMsg("No user selected.");
      return;
    }
    if (!validateUser(selectedUser)) {
      // move focus to first missing
      if (!selectedUser.first_name?.trim()) firstNameRef.current?.focus();
      return;
    }
    setSaving(true);
    const cleanedUser = cleanUserFields(selectedUser);
    
    // Detect role change for existing users
    const originalUser = users.find(u => u.id === cleanedUser.id);
    const roleChanged = !isAddMode && originalUser && originalUser.role_id !== cleanedUser.role_id;
    
    try {
      if (isAddMode) {
        const { error: userErr, data: newUser } = await supabase
          .from("users")
          .insert({
            first_name: cleanedUser.first_name,
            last_name: cleanedUser.last_name,
            email: cleanedUser.email,
            department_id: cleanedUser.department_id,
            role_id: cleanedUser.role_id,
            access_level: cleanedUser.access_level,
            phone: cleanedUser.phone,
            shift_id: cleanedUser.shift_id,
            nationality: cleanedUser.nationality,
            is_first_aid: cleanedUser.is_first_aid ?? false,
            is_trainer: cleanedUser.is_trainer ?? false,
            start_date: cleanedUser.start_date,
            is_leaver: cleanedUser.is_leaver ?? false,
            leaver_date: cleanedUser.leaver_date || null,
            leaver_reason: cleanedUser.leaver_reason || null,
            receive_notifications: cleanedUser.receive_notifications ?? false
          })
          .select()
          .single();
        if (userErr) {
          setErrorMsg("Failed to add user: " + userErr.message);
          setSaving(false);
          return;
        }
        setUsers([...users, newUser as User]);
        
        // For new users with a role, sync their training assignments
        if (cleanedUser.role_id && newUser?.id) {
          try {
            const syncResponse = await fetch("/api/update-user-role-assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                user_id: newUser.id,
                new_role_id: cleanedUser.role_id,
                old_role_id: null // No old role for new users
              }),
            });
            if (!syncResponse.ok) {
              console.warn("Failed to sync role assignments for new user:", await syncResponse.text());
            }
          } catch (syncErr) {
            console.warn("Error syncing role assignments for new user:", syncErr);
          }
        }
      } else {
        // For existing users, exclude department_id and role_id from updates
        // (those should only be changed via DepartmentRoleManager)
        const { error: userErr } = await supabase
          .from("users")
          .update({
            first_name: cleanedUser.first_name,
            last_name: cleanedUser.last_name,
            email: cleanedUser.email,
            access_level: cleanedUser.access_level,
            phone: cleanedUser.phone,
            shift_id: cleanedUser.shift_id,
            nationality: cleanedUser.nationality,
            is_first_aid: cleanedUser.is_first_aid ?? false,
            is_trainer: cleanedUser.is_trainer ?? false,
            start_date: cleanedUser.start_date,
            is_leaver: cleanedUser.is_leaver ?? false,
            leaver_date: cleanedUser.leaver_date || null,
            leaver_reason: cleanedUser.leaver_reason || null,
            receive_notifications: cleanedUser.receive_notifications ?? false
          })
          .eq("id", cleanedUser.id);
        if (userErr) {
          setErrorMsg("Failed to update user: " + userErr.message);
          setSaving(false);
          return;
        }
        setUsers(users.map((u) => (u.id === cleanedUser.id ? { ...u, ...cleanedUser } : u)));

        // Note: Role changes are now handled exclusively via DepartmentRoleManager
        // This ensures proper history tracking and assignment syncing
      }
      setShowSuccess(true);
      // Immediately refresh all data from supabase after save
      await refreshAllData();
      // Notify parent component of data change
      onDataChange?.();
      setTimeout(() => {
        setShowSuccess(false);
        handleCloseDialog();
      }, 800);
    } catch (err: any) {
      setErrorMsg("Unexpected error saving user." + (err?.message ? ` ${err.message}` : ""));
      console.error("[handleSave] Unexpected error:", err);
    } finally {
      setSaving(false);
    }
  };

  // CSV Export handler (unchanged)
  const handleExportUsers = () => {
    if (!users.length) return;
    const csvRows = users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      department_id: u.department_id || "",
      role_id: u.role_id || "",
      access_level: u.access_level || "",
      phone: u.phone || "",
      nationality: u.nationality || "",
      is_first_aid: u.is_first_aid ? "true" : "false",
      is_trainer: u.is_trainer ? "true" : "false",
      start_date: u.start_date || "",
      receive_notifications: u.receive_notifications ? "true" : "false"
    }));
    const csv = [
      "id,email,first_name,last_name,department_id,role_id,access_level,phone,nationality,is_first_aid,is_trainer,start_date,receive_notifications",
      ...csvRows
        .map((row) => Object.values(row).map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Table columns: only show Select column if bulk assign is active
  const userTableColumns = [
    ...(showBulkSelectColumn
      ? [
          {
            header: "Select",
            accessor: "select",
            render: (_: any, row: any) => (
              <input
                type="checkbox"
                checked={bulkSelectedUserIds.includes(row.id)}
                onChange={(e) => {
                  console.log("Checkbox changed for user:", row.id, "checked:", e.target.checked);
                  if (e.target.checked) {
                    setBulkSelectedUserIds((prev) => [...prev, row.id]);
                  } else {
                    setBulkSelectedUserIds((prev) => prev.filter((id) => id !== row.id));
                  }
                }}
                aria-label={`Select user ${row.name}`}
              />
            ),
            width: 40
          }
        ]
      : []),
    { header: "Emp#", accessor: "employee_number", width: 80 },
    { header: "Name", accessor: "name", width: 120 },
    { header: "Department", accessor: "department_name", width: 120 },
    { header: "Role", accessor: "role_title", width: 120 },
    { header: "Access", accessor: "access_level", width: 80 },
    { header: "Shift", accessor: "shift_name", width: 80 },
    { header: "Email", accessor: "email", width: 140 },
    { header: "Start Date", accessor: "start_date", width: 120 },
    { header: "First Aid", accessor: "is_first_aid", width: 40 },
    { header: "Trainer", accessor: "is_trainer", width: 80 }
  ];

  if (loading)
    return (
      <div className="neon-loading" style={{ textAlign: "center", margin: "2rem" }}>
        Loading users...
      </div>
    );
  if (errorMsg && !dialogOpen)
    return (
      <div className="neon-error" style={{ color: "#ea1c1c", textAlign: "center", margin: "2rem" }}>
        {errorMsg}
      </div>
    );

  return (
    <>
      {/* Success Modal Overlay (replaced with shared SuccessModal) */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="User saved successfully!"
        autoCloseMs={1800}
      />

      {/* Bulk Select Panel - Fixed at top when active */}
      {showBulkSelectColumn && !bulkAssignOpen && (
        <div
          ref={bulkSelectBoxRef}
          style={{
            position: "fixed",
            top: "calc(var(--header-height) + var(--toolbar-height))",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 4rem)",
            maxWidth: "1400px",
            zIndex: 1000,
            background: "var(--panel)",
            border: "2px solid #fa7a20",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            padding: "1.5rem 2rem",
            animation: "slideDown 0.3s ease-out"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div className="neon-form-title" style={{ marginBottom: "0.5rem", fontSize: "var(--font-size-header)" }}>
                  Bulk User Selection Mode
                </div>
                <div style={{ fontSize: "var(--font-size-base)", color: "var(--text-white)", opacity: 0.8 }}>
                  Filter and select users for bulk assignment
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkSelectColumn(false);
                  setBulkSelectedUserIds([]);
                  setUserSearch("");
                  setBulkDeptFilter("");
                  setBulkShiftFilter("");
                }}
                aria-label="Close bulk selection mode"
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  margin: '0',
                  boxSizing: 'border-box',
                  opacity: 0.7,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block' }}
                >
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end" }}>
              {/* Department and Shift filters */}
              <div style={{ flex: 1 }}>
                <label className="neon-label" htmlFor="bulk-filter-dept-top" style={{ fontSize: "var(--font-size-base)", marginBottom: "0.25rem", display: "block" }}>
                  Filter by Department
                </label>
                <select
                  id="bulk-filter-dept-top"
                  className="neon-input"
                  style={{ width: "100%", fontSize: "var(--font-size-base)" }}
                  value={bulkDeptFilter}
                  onChange={(e) => {
                    console.log("Department filter changed:", e.target.value);
                    setBulkDeptFilter(e.target.value);
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="neon-label" htmlFor="bulk-filter-shift-top" style={{ fontSize: "var(--font-size-base)", marginBottom: "0.25rem", display: "block" }}>
                  Filter by Shift
                </label>
                <select
                  id="bulk-filter-shift-top"
                  className="neon-input"
                  style={{ width: "100%", fontSize: "var(--font-size-base)" }}
                  value={bulkShiftFilter}
                  onChange={(e) => {
                    console.log("Shift filter changed:", e.target.value);
                    setBulkShiftFilter(e.target.value);
                  }}
                >
                  <option value="">All Shifts</option>
                  {shiftPatterns.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick selection buttons */}
              <div style={{ flex: 1, display: "flex", gap: "0.5rem" }}>
                <TextIconButton
                  variant="assign"
                  label={`Select All (${filteredUsers.length})`}
                  onClick={() => {
                    // Select all currently visible (filtered) users
                    const visibleUserIds = filteredUsers.map(u => u.id);
                    setBulkSelectedUserIds(prev => {
                      const combined = [...new Set([...prev, ...visibleUserIds])];
                      return combined;
                    });
                  }}
                />
                <TextIconButton
                  variant="delete"
                  label="Deselect Visible"
                  onClick={() => {
                    // Deselect all currently visible (filtered) users
                    const visibleUserIds = filteredUsers.map(u => u.id);
                    setBulkSelectedUserIds(prev => prev.filter(id => !visibleUserIds.includes(id)));
                  }}
                />
              </div>

              {/* Clear filters + Selection summary + Next */}
              <div style={{ flex: 1, display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                {(userSearch || bulkDeptFilter || bulkShiftFilter) && (
                  <TextIconButton
                    variant="refresh"
                    label="Clear Filters"
                    onClick={() => {
                      setUserSearch("");
                      setBulkDeptFilter("");
                      setBulkShiftFilter("");
                    }}
                  />
                )}

                <div style={{
                  padding: "0.6rem 1rem",
                  background: "rgba(64, 224, 208, 0.1)",
                  borderRadius: "4px",
                  border: "1px solid var(--neon)",
                  color: "var(--neon)",
                  fontWeight: "var(--font-weight-header)",
                  fontFamily: "var(--font-family)",
                  fontSize: "var(--font-size-base)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center"
                }}>
                  {bulkSelectedUserIds.length} Selected
                </div>

                <TextIconButton
                  variant="primary"
                  label="Next →"
                  disabled={bulkSelectedUserIds.length === 0}
                  onClick={() => {
                    setBulkAssignOpen(true);
                    setShowBulkSelectColumn(false);
                    setBulkAssignStep(2);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="neon-table-panel container" style={{ justifyContent: "flex-start", display: "flex" }}>
        <div style={{ position: "relative", width: "100%" }}>
          {/* Table - all controls are now in parent FolderTabs toolbar */}
          <div className="neon-table-scroll" style={{ justifyContent: "flex-start", display: "flex", position: "relative" }}>
            <div id="bulk-select-table" style={{ width: "100%" }}>
              <NeonTable
                columns={userTableColumns.map((col) => {
                  if (col.header === "Select" && !showBulkSelectColumn) return { ...col, width: 0, render: () => null };
                  // Set explicit column widths for key columns
                  if (col.header === "Name") return { ...col, width: 180 };
                  if (col.header === "Department") return { ...col, width: 140 };
                  if (col.header === "Role") return { ...col, width: 140 };
                  if (col.header === "Access") return { ...col, width: 80 };
                  if (col.header === "Shift") return { ...col, width: 80 };
                  if (col.header === "Email") return { ...col, width: 200 };
                  if (col.header === "Start Date") return { ...col, width: 120 };
                  if (col.header === "First Aid") return { ...col, width: 40 };
                  if (col.header === "Trainer") return { ...col, width: 80 };
                  return col;
                })}
                data={pagedUsers.map((user) => {
                  const department = departments.find((d) => d.id === user.department_id);
                  const role = roles.find((r) => r.id === user.role_id);
                  return {
                    employee_number: user.employee_number || "—",
                    id: user.id,
                    name: (
                      <span
                        className="neon-link neon-user-name-selectable"
                        tabIndex={0}
                        role="button"
                        style={{ cursor: "pointer", color: "var(--neon)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(user, false, e.currentTarget as HTMLElement);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenDialog(user, false, e.currentTarget as HTMLElement);
                          }
                        }}
                        aria-label={`Edit user: ${user.first_name || ""} ${user.last_name || ""}`}
                      >
                        {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "—"}
                      </span>
                    ),
                    department_name: department ? department.name : "—",
                    role_title: role ? role.title : "—",
                    status: user.status || "—",
                    access_level: user.access_level,
                    shift_name: user.shift_name || "—",
                    email: user.email,
                    start_date: formatDateUK(user.start_date),
                    is_first_aid: user.is_first_aid ? (
                      <FiCheck className="neon-table-icon" color="#39ff14" size={18} style={{ verticalAlign: "middle" }} />
                    ) : (
                      <FiX className="neon-table-icon" color="#ea1c1c" size={18} style={{ verticalAlign: "middle" }} />
                    ),
                    is_trainer: user.is_trainer ? (
                      <FiCheck className="neon-table-icon" color="#39ff14" size={18} style={{ verticalAlign: "middle" }} />
                    ) : (
                      <FiX className="neon-table-icon" color="#ea1c1c" size={18} style={{ verticalAlign: "middle" }} />
                    ),
                    actions: (
                      <CustomTooltip text="Edit this user's details">
                        <TextIconButton
                          icon={<FiEdit />}
                          label="Edit User"
                          variant="edit"
                          onClick={(e: any) => {
                            handleOpenDialog(user, false, (e?.currentTarget as HTMLElement) ?? null);
                          }}
                        />
                      </CustomTooltip>
                    )
                  };
                })}
              />
            </div>
          </div>

          {/* Overlaid dialog rendered via portal */}
          <OverlayDialog showCloseButton={true} open={dialogOpen} onClose={handleCloseDialog} ariaLabelledby="user-editor-title">
            <div className="neon-form-title" id="user-editor-title" style={{ marginBottom: "1.25rem" }}>
              {isAddMode ? "Add User" : "Edit User"}
            </div>

            {errorMsg && (
              <div id="user-editor-error" className="neon-error" style={{ color: "#ea1c1c", marginBottom: "1rem" }}>
                {errorMsg}
              </div>
            )}

{selectedUser && (
              <>
                {/* PERSONAL DETAILS SECTION */}
                <div style={{ marginBottom: "2rem" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#40e0d0",
                      marginBottom: "1rem",
                      fontSize: "1.1rem",
                      borderBottom: "2px solid rgba(64, 224, 208, 0.3)",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    Personal Details
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "1.5rem"
                    }}
                  >
                    {/* first_name */}
                    <div>
                      <label className="neon-label" htmlFor="first-name-input">
                        First Name
                      </label>
                      <input
                        id="first-name-input"
                        ref={firstNameRef}
                        className="neon-input"
                        value={selectedUser.first_name || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            first_name: e.target.value
                          })
                        }
                        placeholder="First Name"
                      />
                    </div>
                    {/* last_name */}
                    <div>
                      <label className="neon-label" htmlFor="last-name-input">
                        Last Name
                      </label>
                      <input
                        id="last-name-input"
                        className="neon-input"
                        value={selectedUser.last_name || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            last_name: e.target.value
                          })
                        }
                        placeholder="Last Name"
                      />
                    </div>
                    {/* email */}
                    <div>
                      <label className="neon-label" htmlFor="email-input">
                        Email
                      </label>
                      <input
                        id="email-input"
                        className="neon-input"
                        value={selectedUser.email || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            email: e.target.value
                          })
                        }
                        placeholder="Email"
                        inputMode="email"
                        autoComplete="email"
                      />
                    </div>
                    {/* phone */}
                    <div>
                      <label className="neon-label" htmlFor="phone-input">
                        Phone
                      </label>
                      <input
                        id="phone-input"
                        className="neon-input"
                        value={selectedUser.phone || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            phone: e.target.value
                          })
                        }
                        placeholder="Phone"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                    {/* nationality */}
                    <div>
                      <label className="neon-label" htmlFor="nationality-select">
                        Nationality
                      </label>
                      <select
                        id="nationality-select"
                        className="neon-input"
                        value={selectedUser.nationality || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            nationality: e.target.value
                          })
                        }
                      >
                        <option value="">Select Nationality</option>
                        {nationalities.map((nat: { name: string; flag: string }) => (
                          <option key={nat.name} value={nat.name}>
                            {nat.flag} {nat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* start_date */}
                    <div>
                      <label className="neon-label" htmlFor="startdate-input">
                        Start Date
                      </label>
                      <input
                        id="startdate-input"
                        className="neon-input"
                        type="date"
                        value={selectedUser.start_date || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            start_date: e.target.value
                          })
                        }
                        placeholder="Start Date"
                      />
                    </div>
                  </div>
                </div>

                {/* ROLE & ACCESS SECTION */}
                <div style={{ marginBottom: "2rem" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#ffa500",
                      marginBottom: "1rem",
                      fontSize: "1.1rem",
                      borderBottom: "2px solid rgba(255, 165, 0, 0.3)",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    Role & Access
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "1.5rem"
                    }}
                  >
                    {/* department_id */}
                    <div>
                      <label className="neon-label" htmlFor="dept-select">
                        Department {!isAddMode && "(read-only)"}
                      </label>
                      <select
                        id="dept-select"
                        className="neon-input"
                        value={selectedUser.department_id || ""}
                        onChange={(e) => {
                          setSelectedUser({
                            ...selectedUser,
                            department_id: e.target.value,
                            role_id: "" // Reset role when department changes
                          });
                        }}
                        disabled={!isAddMode}
                        style={{
                          opacity: !isAddMode ? 0.6 : 1,
                          cursor: !isAddMode ? "not-allowed" : "default"
                        }}
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {!isAddMode && (
                        <div style={{ fontSize: "0.85rem", color: "#ffa500", marginTop: "0.5rem" }}>
                          Use "Change Dept/Role" button to modify
                        </div>
                      )}
                    </div>
                    {/* role_id */}
                    <div>
                      <label className="neon-label" htmlFor="role-select">
                        Role {!isAddMode && "(read-only)"}
                      </label>
                      <select
                        id="role-select"
                        className="neon-input"
                        value={selectedUser.role_id || ""}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            role_id: e.target.value
                          })
                        }
                        disabled={!isAddMode || !selectedUser.department_id}
                        style={{
                          opacity: !isAddMode ? 0.6 : 1,
                          cursor: !isAddMode ? "not-allowed" : "default"
                        }}
                      >
                        <option value="">Select Role</option>
                        {roles
                          .filter((r) => r.department_id === selectedUser.department_id)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                      </select>
                      {!isAddMode && (
                        <div style={{ fontSize: "0.85rem", color: "#ffa500", marginTop: "0.5rem" }}>
                          Use "Change Dept/Role" button to modify
                        </div>
                      )}
                    </div>
                    {/* access_level */}
                    <div>
                      <label className="neon-label" htmlFor="access-select">
                        Access Level
                      </label>
                      <select
                        id="access-select"
                        className="neon-input"
                        value={selectedUser.access_level || "User"}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            access_level: e.target.value
                          })
                        }
                      >
                        <option value="Super Admin">Super Admin - System owners, full access</option>
                        <option value="Admin">Admin - IT administrators</option>
                        <option value="HR Admin">HR Admin - Human Resources team</option>
                        <option value="H&S Admin">H&S Admin - Health & Safety officers</option>
                        <option value="Dept. Manager">Dept. Manager - Department managers (see all shifts)</option>
                        <option value="Manager">Manager - Shift managers (see only their shift)</option>
                        <option value="Trainer">Trainer - Training coordinators</option>
                        <option value="User">User - Regular employees</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* WORK DETAILS SECTION */}
                <div style={{ marginBottom: "2rem" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#39ff14",
                      marginBottom: "1rem",
                      fontSize: "1.1rem",
                      borderBottom: "2px solid rgba(57, 255, 20, 0.3)",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    Work Details
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: "1.5rem"
                    }}
                  >
                    {/* shift_id */}
                    <div>
                      <label className="neon-label" htmlFor="shift-select">
                        Shift
                      </label>
                      <select
                        id="shift-select"
                        className="neon-input"
                        value={selectedUser.shift_id || ""}
                        onChange={(e) => {
                          const selectedPattern = shiftPatterns?.find((s) => s.id === e.target.value);
                          setSelectedUser({
                            ...selectedUser,
                            shift_id: e.target.value,
                            shift_name: selectedPattern ? selectedPattern.name : ""
                          });
                        }}
                      >
                        <option value="">Select Shift</option>
                        {shiftPatterns?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* is_first_aid */}
                    <div>
                      <label className="neon-label" htmlFor="firstaid-select">
                        First Aid
                      </label>
                      <select
                        id="firstaid-select"
                        className="neon-input"
                        value={selectedUser.is_first_aid ? "true" : "false"}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            is_first_aid: e.target.value === "true"
                          })
                        }
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    {/* is_trainer */}
                    <div>
                      <label className="neon-label" htmlFor="trainer-select">
                        Trainer
                      </label>
                      <select
                        id="trainer-select"
                        className="neon-input"
                        value={selectedUser.is_trainer ? "true" : "false"}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            is_trainer: e.target.value === "true"
                          })
                        }
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    {/* receive_notifications */}
                    <div>
                      <label
                        className="neon-label"
                        htmlFor="receive-notifications-select"
                      >
                        Receive Notifications
                      </label>
                      <select
                        id="receive-notifications-select"
                        className="neon-input"
                        value={selectedUser.receive_notifications === true ? "true" : "false"}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            receive_notifications: e.target.value === "true"
                          })
                        }
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* LEAVER INFORMATION SECTION - Only show if is_leaver is true */}
                {selectedUser.is_leaver && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#ea1c1c",
                        marginBottom: "1rem",
                        fontSize: "1.1rem",
                        borderBottom: "2px solid rgba(234, 28, 28, 0.3)",
                        paddingBottom: "0.5rem"
                      }}
                    >
                      Leaver Information
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: "1.5rem"
                      }}
                    >
                      {/* is_leaver */}
                      <div>
                        <label className="neon-label" htmlFor="leaver-select">
                          Is Leaver
                        </label>
                        <select
                          id="leaver-select"
                          className="neon-input"
                          value={selectedUser.is_leaver ? "true" : "false"}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              is_leaver: e.target.value === "true"
                            })
                          }
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      {/* leaver_date */}
                      <div>
                        <label className="neon-label" htmlFor="leaver-date-input">
                          Leaver Date
                        </label>
                        <input
                          id="leaver-date-input"
                          className="neon-input"
                          type="date"
                          value={selectedUser.leaver_date || ""}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              leaver_date: e.target.value
                            })
                          }
                          placeholder="Leaver Date"
                        />
                        <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.8 }}>
                          {formatDateUK(selectedUser.leaver_date)}
                        </div>
                      </div>
                      {/* leaver_reason */}
                      <div>
                        <label className="neon-label" htmlFor="leaver-reason-select">
                          Leaver Reason
                        </label>
                        <select
                          id="leaver-reason-select"
                          className="neon-input"
                          value={selectedUser.leaver_reason || ""}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              leaver_reason: e.target.value
                            })
                          }
                        >
                          <option value="">Select Reason</option>
                          <option value="Resignation">Resignation</option>
                          <option value="Termination">Termination</option>
                          <option value="Retirement">Retirement</option>
                          <option value="End of Contract">End of Contract</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

<div
              className="neon-panel-actions"
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "2rem"
              }}
            >
              {/* Register as Leaver button, only if editing (not adding) and not already a leaver */}
              {!isAddMode && !selectedUser?.is_leaver && (
                <CustomTooltip text="Mark this user as having left the company">
                  <TextIconButton
                    variant="archive"
                    icon={<FiArchive />}
                    label="Register as Leaver"
                    onClick={() => {
                      setSelectedUser({
                        ...selectedUser!,
                        is_leaver: true,
                        leaver_date: new Date().toISOString().slice(0, 10)
                      });
                    }}
                  />
                </CustomTooltip>
              )}
              {!isAddMode && selectedUser && (
                <>
                  <CustomTooltip text="Change user's department and role with history tracking">
                    <TextIconButton
                      variant="edit"
                      icon={<FiUsers />}
                      label="Change Dept/Role"
                      onClick={() => handleOpenDeptRoleManager(selectedUser)}
                    />
                  </CustomTooltip>
                  <CustomTooltip text="Manage user's system permissions and access levels">
                    <TextIconButton
                      variant="edit"
                      icon={<FiKey />}
                      label="Manage Permissions"
                      onClick={() => handleOpenPermissions(selectedUser)}
                    />
                  </CustomTooltip>
                </>
              )}
              <CustomTooltip text={saving ? "Saving user changes..." : "Save all changes to this user"}>
                <TextIconButton
                  variant="save"
                  icon={saving ? <span className="neon-spinner" style={{ marginRight: 8 }} /> : <FiSave />}
                  label={saving ? "Saving..." : "Save Changes"}
                  onClick={handleSave}
                  disabled={saving}
                />
              </CustomTooltip>
            </div>
          </OverlayDialog>

          {/* Permissions Manager Dialog */}
          <OverlayDialog showCloseButton={true}
            open={permissionsDialogOpen}
            onClose={() => setPermissionsDialogOpen(false)}
            ariaLabelledby="permissions-manager-title"
          >
            <div className="neon-form-title" id="permissions-manager-title" style={{ marginBottom: "1.25rem" }}>
              Manage Permissions
            </div>
            {permissionsUser && (
              <UserPermissionsManager
                users={[
                  {
                    id: permissionsUser.id,
                    email: permissionsUser.email,
                    full_name: `${permissionsUser.first_name || ""} ${permissionsUser.last_name || ""}`.trim(),
                    permissions: permissions
                  }
                ]}
              />
            )}
          </OverlayDialog>

          {/* Department/Role Manager Dialog */}
          {deptRoleUser && (
            <OverlayDialog
              showCloseButton={true}
              open={deptRoleDialogOpen}
              onClose={() => setDeptRoleDialogOpen(false)}
              ariaLabelledby="dept-role-manager-title"
              compactHeight={true}
            >
              <DepartmentRoleManager
                user={deptRoleUser}
                onClose={() => setDeptRoleDialogOpen(false)}
                onSuccess={handleDeptRoleSuccess}
              />
            </OverlayDialog>
          )}

          {/* Staged Bulk Assign Overlay */}
          {bulkAssignOpen && (
            <OverlayDialog showCloseButton={true} open={bulkAssignOpen} onClose={handleBulkAssignCancel} ariaLabelledby="bulk-assign-title">
              <div className="neon-form-title" id="bulk-assign-title" style={{ marginBottom: "1.25rem" }}>
                Bulk Assign
              </div>
              {/* Step 2: Configure assignment (now first step in modal) */}
              {bulkAssignStep === 2 && (
                <div className="neon-form-content">
                  <div className="neon-form-section">
                    <div className="neon-label">
                      What would you like to bulk assign?
                    </div>
                    <div className="neon-radio-group">
                      <div className="neon-radio-option">
                        <input
                          type="radio"
                          id="bulk-type-role"
                          name="bulkAssignType"
                          value="role"
                          checked={bulkAssignType === "role"}
                          onChange={(e) => setBulkAssignType(e.target.value)}
                          className="neon-radio"
                        />
                        <label htmlFor="bulk-type-role" className="neon-radio-label">
                          <CustomTooltip text="Assign department and role to selected users">
                            <span>Department/Role</span>
                          </CustomTooltip>
                        </label>
                      </div>
                      <div className="neon-radio-option">
                        <input
                          type="radio"
                          id="bulk-type-shift"
                          name="bulkAssignType"
                          value="shift"
                          checked={bulkAssignType === "shift"}
                          onChange={(e) => setBulkAssignType(e.target.value)}
                          className="neon-radio"
                        />
                        <label htmlFor="bulk-type-shift" className="neon-radio-label">
                          <CustomTooltip text="Assign shift pattern to selected users">
                            <span>Shift</span>
                          </CustomTooltip>
                        </label>
                      </div>
                      <div className="neon-radio-option">
                        <input
                          type="radio"
                          id="bulk-type-first-aid"
                          name="bulkAssignType"
                          value="first_aid"
                          checked={bulkAssignType === "first_aid"}
                          onChange={(e) => setBulkAssignType(e.target.value)}
                          className="neon-radio"
                        />
                        <label htmlFor="bulk-type-first-aid" className="neon-radio-label">
                          <CustomTooltip text="Set first aid status for selected users">
                            <span>First Aid</span>
                          </CustomTooltip>
                        </label>
                      </div>
                      <div className="neon-radio-option">
                        <input
                          type="radio"
                          id="bulk-type-trainer"
                          name="bulkAssignType"
                          value="trainer"
                          checked={bulkAssignType === "trainer"}
                          onChange={(e) => setBulkAssignType(e.target.value)}
                          className="neon-radio"
                        />
                        <label htmlFor="bulk-type-trainer" className="neon-radio-label">
                          <CustomTooltip text="Set trainer status for selected users">
                            <span>Trainer</span>
                          </CustomTooltip>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="neon-dialog-actions">
                    <CustomTooltip text="Proceed to configure selected assignment type">
                      <TextIconButton
                        variant="next"
                        icon={<FiChevronRight />}
                        label="Next"
                        onClick={() => setBulkAssignStep(3)}
                        disabled={!bulkAssignType}
                      />
                    </CustomTooltip>
                  </div>
                </div>
              )}
              {/* Step 3: Assignment config */}
              {bulkAssignStep === 3 && (
                <div className="neon-form-content">
                  <div className="neon-form-section">
                    <div className="neon-label">
                      {bulkAssignType === "role" && "You are bulk assigning to Department/Role."}
                      {bulkAssignType === "shift" && "You are bulk assigning to Shift."}
                      {bulkAssignType === "first_aid" && "You are bulk assigning First Aid status."}
                      {bulkAssignType === "trainer" && "You are bulk assigning Trainer status."}
                    </div>
                    {/* Show summary of selected users */}
                    <div className="neon-form-info">
                      <strong>Selected users:</strong> {bulkSelectedUserIds.length}
                      {bulkSelectedUserIds.length > 0 && (
                        <ul className="neon-user-list">
                          {users
                            .filter((u) => bulkSelectedUserIds.includes(u.id))
                            .slice(0, 5)
                            .map((u) => (
                              <li key={u.id}>{`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}</li>
                            ))}
                          {bulkSelectedUserIds.length > 5 && <li>...and {bulkSelectedUserIds.length - 5} more</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                  {bulkAssignType === "role" && (
                    <div className="neon-form-grid">
                      <div className="neon-form-field">
                        <label className="neon-label" htmlFor="bulk-dept-select">
                          Department
                        </label>
                        <select
                          id="bulk-dept-select"
                          className="neon-input"
                          value={bulkDeptId}
                          onChange={(e) => {
                            setBulkDeptId(e.target.value);
                            setBulkRoleId("");
                          }}
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="neon-form-field">
                        <label className="neon-label" htmlFor="bulk-role-select">
                          Role
                        </label>
                        <select
                          id="bulk-role-select"
                          className="neon-input"
                          value={bulkRoleId}
                          onChange={(e) => setBulkRoleId(e.target.value)}
                          disabled={!bulkDeptId}
                        >
                          <option value="">Select Role</option>
                          {roles
                            .filter((r) => r.department_id === bulkDeptId)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {bulkAssignType === "shift" && (
                    <div className="neon-form-field">
                      <label className="neon-label" htmlFor="bulk-shift-select">
                        Shift
                      </label>
                      <select
                        id="bulk-shift-select"
                        className="neon-input"
                        value={bulkShiftId}
                        onChange={(e) => setBulkShiftId(e.target.value)}
                      >
                        <option value="">Select Shift</option>
                        {shiftPatterns.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {bulkAssignType === "first_aid" && (
                    <div className="neon-form-field">
                      <label className="neon-label" htmlFor="bulk-firstaid-select">
                        First Aid
                      </label>
                      <select
                        id="bulk-firstaid-select"
                        className="neon-input"
                        value={bulkFirstAid ? "true" : "false"}
                        onChange={(e) => setBulkFirstAid(e.target.value === "true")}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  )}
                  {bulkAssignType === "trainer" && (
                    <div className="neon-form-field">
                      <label className="neon-label" htmlFor="bulk-trainer-select">
                        Trainer
                      </label>
                      <select
                        id="bulk-trainer-select"
                        className="neon-input"
                        value={bulkTrainer ? "true" : "false"}
                        onChange={(e) => setBulkTrainer(e.target.value === "true")}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  )}
                  <div className="neon-dialog-actions">
                    <CustomTooltip text="Go back to assignment type selection">
                      <TextIconButton
                        variant="back"
                        icon={<FiChevronLeft />}
                        label="Back"
                        onClick={() => setBulkAssignStep(2)}
                      />
                    </CustomTooltip>
                    <CustomTooltip text="Proceed to confirmation screen">
                      <TextIconButton
                        variant="next"
                        icon={<FiChevronRight />}
                        label="Next"
                        onClick={() => setBulkAssignStep(4)}
                        disabled={(bulkAssignType === "role" && (!bulkDeptId || !bulkRoleId)) || (bulkAssignType === "shift" && !bulkShiftId)}
                      />
                    </CustomTooltip>
                  </div>
                </div>
              )}
              {/* Step 4: Confirm bulk assignment */}
              {bulkAssignStep === 4 && (
                <div className="neon-form-content">
                  <div className="neon-form-section">
                    <div className="neon-label">
                      Confirm bulk assignment:
                    </div>
                    <div className="neon-form-info">
                      <strong>Assignment:</strong>{" "}
                      {bulkAssignType === "role"
                        ? `Department: ${departments.find((d) => d.id === bulkDeptId)?.name || "—"}, Role: ${
                            roles.find((r) => r.id === bulkRoleId)?.title || "—"
                          }`
                        : bulkAssignType === "shift"
                        ? `Shift: ${shiftPatterns.find((s) => s.id === bulkShiftId)?.name || "—"}`
                        : bulkAssignType === "first_aid"
                        ? `First Aid: ${bulkFirstAid ? "Yes" : "No"}`
                        : bulkAssignType === "trainer"
                        ? `Trainer: ${bulkTrainer ? "Yes" : "No"}`
                        : "—"}
                    </div>
                    <div className="neon-form-info">
                      <strong>Users:</strong> {bulkSelectedUserIds.length}
                      {bulkSelectedUserIds.length > 0 && (
                        <ul className="neon-user-list">
                          {users
                            .filter((u) => bulkSelectedUserIds.includes(u.id))
                            .slice(0, 5)
                            .map((u) => (
                              <li key={u.id}>{`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}</li>
                            ))}
                          {bulkSelectedUserIds.length > 5 && <li>...and {bulkSelectedUserIds.length - 5} more</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="neon-dialog-actions">
                    <CustomTooltip text={bulkAssignLoading ? "Processing bulk assignments..." : "Apply these assignments to all selected users"}>
                      <TextIconButton
                        variant="save"
                        icon={bulkAssignLoading ? <span className="neon-spinner" style={{ marginRight: 8 }} /> : <FiSave />}
                        label={bulkAssignLoading ? "Assigning..." : "Confirm & Assign"}
                        onClick={handleBulkAssignConfirm}
                        disabled={bulkAssignLoading}
                      />
                    </CustomTooltip>
                  </div>
                </div>
              )}
            </OverlayDialog>
          )}
        </div>
      </div>
    </>
  );
}