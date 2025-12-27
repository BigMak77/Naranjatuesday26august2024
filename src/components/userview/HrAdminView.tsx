"use client";
import React, { useState, useEffect } from "react";
import FolderTabs, { Tab } from "@/components/FolderTabs";
import { FiUserPlus, FiUser, FiEdit, FiTrash2, FiUsers, FiShield, FiToggleLeft, FiToggleRight, FiDownload, FiUpload, FiUserX } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import jsPDF from "jspdf";
import RoleStructure from "@/components/structure/RoleStructure";
import ManagerStructure from "@/components/structure/ManagerStructure";
import {
  AmendDepartmentButton,
  RoleAmendButton,
  AddDepartmentButton as RoleAddDepartmentButton,
  AddRoleButton
} from "@/components/structure/RoleStructure";
import {
  ChangeManagerButton,
  AssignManagerButton
} from "@/components/structure/ManagerStructure";
import RotaByDepartment from "@/components/people/RotaByDepartment";
import TextIconButton from "@/components/ui/TextIconButtons";
import UserPermissionsManager from "@/components/admin/UserPermissionsManager";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";
import UserManagementPanel from "@/components/user/UserManagementPanel";
import SimpleRoleAssignment from "@/components/user/SimpleRoleAssignment";
import { sendWelcomeEmail } from "@/lib/email-service";
import UserRoleHistory from "@/components/roles/UserRoleHistory";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

const tabs: Tab[] = [
  { key: "people", label: "People" },
  { key: "users", label: "User - Without Dept./Role" },
  { key: "newstarters", label: "New Starters" },
  { key: "leavers", label: "Leavers" },
  { key: "rolehistory", label: "Role History" },
  { key: "departments", label: "Structures" },
  { key: "shifts", label: "Shifts" },
  { key: "permissions", label: "Permissions" },
  { key: "startdate", label: "Users by Start Date" },
];

// Helper to format date as dd/mm/yyyy
function formatDateUK(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}/${month}/${year}`;
}

// Styles for reassign dialog
const reassignStyles = `
  .reassign-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reassign-option {
    padding: 1rem;
    border: 1px solid rgba(64, 224, 208, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
  }

  .reassign-option:hover {
    background: rgba(64, 224, 208, 0.05);
  }

  .reassign-option.selected {
    background: rgba(64, 224, 208, 0.2);
    border-color: rgba(64, 224, 208, 0.6);
  }

  .reassign-option h4 {
    margin-bottom: 0.5rem;
  }

  .reassign-option p {
    margin: 0;
  }
`;

const UserManager: React.FC = () => {
  // Tab persistence using localStorage
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hrAdminActiveTab') || 'people';
    }
    return 'people';
  });

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [structureView, setStructureView] = useState<'role' | 'manager'>('role');
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");
  const [selectedShiftDept, setSelectedShiftDept] = useState<string>("");
  const [sortField, setSortField] = useState<'name' | 'start_date' | 'department'>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // UserManagementPanel controls
  const [userPanelControls, setUserPanelControls] = useState<{
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
    refreshData: () => void;
  } | null>(null);

  // Role History controls
  const [roleHistoryControls, setRoleHistoryControls] = useState<{
    roleHistoryCount: number;
    refreshData: () => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredCount: number;
  } | null>(null);

  // New Starters state
  const [newStarters, setNewStarters] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<any>(null);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Leavers state
  const [leavers, setLeavers] = useState<any[]>([]);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedLeaver, setSelectedLeaver] = useState<any>(null);
  const [reassignMode, setReassignMode] = useState<'previous' | 'new' | null>(null);

  // Dialog and Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isDepartmentOnlyMode, setIsDepartmentOnlyMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Invite User state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Role assignment state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleUser, setSelectedRoleUser] = useState<any>(null);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrAdminActiveTab', activeTab);
    }
  }, [activeTab]);

  // Fetch all data function (can be called to refresh)
  const fetchData = async () => {
    console.log("[HrAdminView] Starting data fetch...");
    setLoading(true);
    try {
      const [
        { data: deptRows, error: deptError },
        { data: userRows, error: userError },
        { data: rolesRows, error: rolesError },
        { data: startersRows, error: startersError },
        { data: leaversRows, error: leaversError },
        { data: shiftsRows, error: shiftsError }
      ] = await Promise.all([
        supabase.from("departments").select("id, name, parent_id, is_archived, level").order("name", { ascending: true }),
        supabase.from("users").select("id, auth_id, department_id, role_id, access_level, first_name, last_name, start_date, email, shift_id, is_leaver, employee_number, location").not("employee_number", "is", null),
        supabase.from("roles").select("id, title, department_id").order("title", { ascending: true }),
        supabase.from("users").select("id, first_name, last_name, email, phone, start_date, created_at, location").is("employee_number", null).eq("is_leaver", false).order("created_at", { ascending: false }),
        supabase.from("users").select("id, email, first_name, last_name, department_id, leaver_date, leaver_reason, start_date, location").eq("is_leaver", true).order("leaver_date", { ascending: false }),
        supabase.from("shift_patterns").select("id, name").order("name", { ascending: true })
      ]);

      if (deptError) console.error("Error fetching departments:", deptError);
      if (userError) console.error("Error fetching users:", userError);
      if (rolesError) console.error("Error fetching roles:", rolesError);
      if (startersError) {
        console.error("Error fetching new starters:", startersError);
        setError(`Failed to fetch new starters: ${startersError.message}`);
      }
      if (leaversError) {
        console.error("Error fetching leavers:", leaversError);
      }
      if (shiftsError) {
        console.error("Error fetching shifts:", shiftsError);
      }

      setDepartments(deptRows || []);
      setUsers(userRows || []);
      setRoles(rolesRows || []);
      setNewStarters(startersRows || []);
      setLeavers(leaversRows || []);
      setShifts(shiftsRows || []);

      console.log("[HrAdminView] Data updated - Users:", userRows?.length || 0);
      console.log("New starters fetched:", startersRows?.length || 0);

      // Also refresh UserManagementPanel if it's active
      if (activeTab === "people" && userPanelControls?.refreshData) {
        console.log("[HrAdminView] Calling UserManagementPanel refreshData...");
        userPanelControls.refreshData();
      }
    } catch (error: any) {
      console.error("Error in fetchData:", error);
      setError(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      console.log("[HrAdminView] Data fetch completed");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: build TreeNode structure from departments for AmendDepartmentButton
  const buildTreeNodes = (): any[] => {
    const deptMap = new Map();
    departments.forEach((d) => {
      deptMap.set(d.id, { id: d.id, name: d.name, children: [], roles: [] });
    });
    roles.forEach((r) => {
      const node = deptMap.get(r.department_id);
      if (node) {
        node.roles.push({ id: r.id, title: r.title });
      }
    });
    const tree: any[] = [];
    departments.forEach((d) => {
      const node = deptMap.get(d.id);
      if (d.parent_id) {
        const parent = deptMap.get(d.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });
    return tree;
  };

  // Helper: find users without a department
  const usersWithoutDepartment = users.filter(u => !u.department_id);

  // Helper: find users without a role
  const usersWithoutRole = users.filter(u => !u.role_id);

  // Helper: get department name for a user
  const getDepartmentName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : '—';
  };

  // Sort handler for start date tab
  const handleSort = (field: 'name' | 'start_date' | 'department') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Dialog handlers
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setIsDepartmentOnlyMode(false);
    setDialogOpen(true);
  };

  const handleAssignDepartment = (user: any) => {
    setSelectedRoleUser(user);
    setRoleDialogOpen(true);
  };

  const handleAssignRole = (user: any) => {
    setSelectedRoleUser(user);
    setRoleDialogOpen(true);
  };

  const handleRoleAssignmentSuccess = async () => {
    console.log("[HrAdminView] Handling role assignment success...");
    setRoleDialogOpen(false);
    setSelectedRoleUser(null);
    setSuccessMessage("Department and role updated successfully!");
    setShowSuccess(true);
    
    // Small delay to ensure database changes are committed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log("[HrAdminView] Calling fetchData to refresh all data...");
    await fetchData();
  };

  const handleAddUser = () => {
    setSelectedUser({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      department_id: '',
      access_level: 'user',
      start_date: '',
      location: ''
    });
    setIsAddMode(true);
    setIsDepartmentOnlyMode(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setIsDepartmentOnlyMode(false);
    setError("");
  };

  const handleSaveUser = async (userData: any) => {
    try {
      setLoading(true);
      if (isAddMode) {
        const { error } = await supabase.from('users').insert([userData]);
        if (error) throw error;
        setSuccessMessage("User added successfully!");
      } else {
        const { error } = await supabase.from('users').update(userData).eq('id', selectedUser.id);
        if (error) throw error;
        setSuccessMessage("User updated successfully!");
      }

      setDialogOpen(false);
      setShowSuccess(true);

      // Refresh all data to ensure everything is up to date
      await fetchData();
    } catch (error: any) {
      setError(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      setSuccessMessage("User deleted successfully!");
      setShowSuccess(true);

      // Refresh all data to ensure everything is up to date
      await fetchData();
    } catch (error: any) {
      setError(error.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning employee number to new starter
  const handleAssignUser = async () => {
    if (!selectedStarter || !employeeNumber.trim()) {
      setError("Please enter an employee number");
      return;
    }

    try {
      setAssignLoading(true);
      setError("");

      // Update the user record with employee number
      const { error: updateError } = await supabase
        .from("users")
        .update({
          employee_number: employeeNumber.trim(),
        })
        .eq("id", selectedStarter.id);

      if (updateError) throw updateError;

      // Send welcome email
      const emailResult = await sendWelcomeEmail({
        email: selectedStarter.email,
        firstName: selectedStarter.first_name,
        lastName: selectedStarter.last_name,
        employeeNumber: employeeNumber.trim(),
        startDate: selectedStarter.start_date,
      });

      setAssignDialogOpen(false);
      setSelectedStarter(null);
      setEmployeeNumber("");

      if (emailResult.success) {
        setSuccessMessage(`Employee number assigned successfully! Welcome email sent to ${selectedStarter.email}`);
      } else {
        setSuccessMessage(`Employee number assigned successfully! Note: Welcome email failed - ${emailResult.error}`);
      }
      setShowSuccess(true);

      // Refresh all data to ensure everything is up to date
      await fetchData();
    } catch (error: any) {
      console.error("Error assigning employee number:", error);
      setError(error.message || "Failed to assign employee number");
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle reassigning a leaver
  const handleReassignLeaver = async (leaver: any) => {
    setSelectedLeaver(leaver);
    setReassignMode(null);
    setReassignDialogOpen(true);
  };

  // Handle downloading training file PDF
  const handleDownloadTrainingPDF = async (leaver: any) => {
    try {
      setLoading(true);

      // First, get the user's auth_id from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", leaver.id)
        .single();

      if (userError) throw userError;

      // Fetch training records for this user using auth_id
      const { data: trainingRecords, error: trainingError } = await supabase
        .from("training_logs")
        .select("*")
        .eq("auth_id", userData.auth_id)
        .order("date", { ascending: false });

      if (trainingError) throw trainingError;

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Training Record", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Employee Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${leaver.first_name} ${leaver.last_name}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Email: ${leaver.email}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Department: ${getDepartmentName(leaver.department_id)}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Start Date: ${leaver.start_date || "—"}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Leave Date: ${leaver.leaver_date || "—"}`, margin, yPosition);
      yPosition += 15;

      // Training Records Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Training Records", margin, yPosition);
      yPosition += 10;

      if (!trainingRecords || trainingRecords.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No training records found.", margin, yPosition);
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        trainingRecords.forEach((record: any, index: number) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          const trainingTopic = record.topic || "Unknown";
          const trainingDate = record.date
            ? new Date(record.date).toLocaleDateString()
            : "—";
          const duration = record.duration_hours ? `${record.duration_hours} hours` : "—";
          const outcome = record.outcome || "—";

          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${trainingTopic}`, margin, yPosition);
          yPosition += 5;

          doc.setFont("helvetica", "normal");
          doc.text(`   Date: ${trainingDate}`, margin, yPosition);
          yPosition += 5;
          doc.text(`   Duration: ${duration}`, margin, yPosition);
          yPosition += 5;
          doc.text(`   Outcome: ${outcome}`, margin, yPosition);
          yPosition += 5;
          if (record.notes) {
            // Word wrap for notes
            const notesLines = doc.splitTextToSize(`   Notes: ${record.notes}`, pageWidth - (margin * 2));
            doc.text(notesLines, margin, yPosition);
            yPosition += notesLines.length * 5;
          }
          yPosition += 3;
        });
      }

      // Footer
      yPosition = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      // Save PDF
      const fileName = `${leaver.first_name}_${leaver.last_name}_Training_Record.pdf`.replace(/\s+/g, "_");
      doc.save(fileName);

      setSuccessMessage("Training record PDF downloaded successfully!");
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Error generating training PDF:", error);
      setError(error.message || "Failed to generate training PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleReassignWithPreviousDetails = async () => {
    if (!selectedLeaver) return;

    try {
      setLoading(true);
      setError("");

      // Update the user to remove leaver status and restore to active
      const { error: updateError } = await supabase
        .from("users")
        .update({
          is_leaver: false,
          leaver_date: null,
          leaver_reason: null,
        })
        .eq("id", selectedLeaver.id);

      if (updateError) throw updateError;

      setReassignDialogOpen(false);
      setSelectedLeaver(null);
      setReassignMode(null);

      setSuccessMessage(`${selectedLeaver.first_name} ${selectedLeaver.last_name} has been reassigned with their previous details.`);
      setShowSuccess(true);

      // Refresh all data to ensure everything is up to date
      await fetchData();
    } catch (error: any) {
      console.error("Error reassigning leaver:", error);
      setError(error.message || "Failed to reassign leaver");
    } finally {
      setLoading(false);
    }
  };

  const handleReassignWithNewDetails = async () => {
    if (!selectedLeaver) return;

    // Close reassign dialog and open edit dialog with the leaver's data
    setReassignDialogOpen(false);

    // First, reactivate the user
    try {
      setLoading(true);
      setError("");

      const { error: updateError } = await supabase
        .from("users")
        .update({
          is_leaver: false,
          leaver_date: null,
          leaver_reason: null,
        })
        .eq("id", selectedLeaver.id);

      if (updateError) throw updateError;

      // Refresh all data
      await fetchData();

      // Open edit dialog with the user data after refresh
      const reactivatedUser = users.find(u => u.id === selectedLeaver.id);
      if (reactivatedUser) {
        setSelectedUser(reactivatedUser);
        setIsAddMode(false);
        setIsDepartmentOnlyMode(false);
        setDialogOpen(true);
      }

      setSelectedLeaver(null);
      setReassignMode(null);
    } catch (error: any) {
      console.error("Error reactivating leaver:", error);
      setError(error.message || "Failed to reactivate leaver");
    } finally {
      setLoading(false);
    }
  };

  // Handle inviting a user via email
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !inviteFirstName.trim() || !inviteLastName.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setInviteLoading(true);
      setError("");

      // Send invitation email using Supabase auth
      const emailResult = await sendWelcomeEmail({
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim(),
        lastName: inviteLastName.trim(),
        employeeNumber: "", // No employee number yet for invited users
        startDate: "",
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");

      if (emailResult.success) {
        setSuccessMessage(`Invitation sent successfully to ${inviteEmail}!`);
      } else {
        setSuccessMessage(`Invitation sent, but email may have failed: ${emailResult.error}`);
      }
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Error inviting user:", error);
      setError(error.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: reassignStyles }} />

      <FolderTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        toolbar={
          <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%' }}>
            {activeTab === "people" && userPanelControls && (
              <>
                <input
                  type="search"
                  className="neon-input"
                  placeholder="Search users..."
                  value={userPanelControls.userSearch}
                  onChange={(e) => userPanelControls.setUserSearch(e.target.value)}
                  style={{
                    width: '200px',
                    height: '32px',
                    margin: 0
                  }}
                />
                <span style={{ opacity: 0.7, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                  {userPanelControls.filteredUsersCount} users
                </span>
                <div style={{ flex: 1 }} />
                <CustomTooltip text="Add a new user to the system">
                  <TextIconButton
                    variant="add"
                    icon={<FiUserPlus />}
                    label="Add User"
                    onClick={userPanelControls.handleAddUser}
                  />
                </CustomTooltip>
                <CustomTooltip text="Bulk assign departments, roles, or shifts to multiple users">
                  <TextIconButton
                    variant="edit"
                    icon={<FiEdit />}
                    label="Bulk Assign"
                    onClick={userPanelControls.handleBulkAssign}
                  />
                </CustomTooltip>
                <CustomTooltip text="Send joining instructions email to a new user">
                  <TextIconButton
                    variant="send"
                    label="Invite User"
                    onClick={() => setInviteDialogOpen(true)}
                  />
                </CustomTooltip>
                <CustomTooltip text="Export all users to CSV file">
                  <TextIconButton
                    icon={<FiDownload />}
                    variant="download"
                    label="Download CSV"
                    onClick={userPanelControls.handleExportUsers}
                  />
                </CustomTooltip>
                {userPanelControls.UserCSVImportComponent}
                <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Rows:
                  <select
                    value={userPanelControls.pageSize}
                    onChange={(e) => userPanelControls.setPageSize(Number(e.target.value))}
                    className="neon-input"
                    style={{ width: '60px', height: '32px', padding: '0 4px', margin: 0 }}
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <TextIconButton
                  variant="back"
                  label="Previous"
                  onClick={() => userPanelControls.setCurrentPage(Math.max(1, userPanelControls.currentPage - 1))}
                  disabled={userPanelControls.currentPage === 1}
                />
                <span style={{ fontSize: '0.875rem' }}>
                  {userPanelControls.currentPage} / {userPanelControls.totalPages}
                </span>
                <TextIconButton
                  variant="next"
                  label="Next"
                  onClick={() => userPanelControls.setCurrentPage(Math.min(userPanelControls.totalPages, userPanelControls.currentPage + 1))}
                  disabled={userPanelControls.currentPage === userPanelControls.totalPages}
                />
              </>
            )}
            {activeTab === "users" && (
              <>
                <div style={{ flex: 1 }} />
                <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  {usersWithoutDepartment.length} without department | {usersWithoutRole.length} without role
                </span>
              </>
            )}
            {activeTab === "newstarters" && (
              <>
                <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  {newStarters.length} pending new starters
                </span>
                <div style={{ flex: 1 }} />
                <TextIconButton
                  variant="refresh"
                  label="Refresh"
                  onClick={fetchData}
                />
              </>
            )}
            {activeTab === "leavers" && (
              <>
                <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  {leavers.length} employees who have left
                </span>
                <div style={{ flex: 1 }} />
                <TextIconButton
                  variant="download"
                  label="Download CSV"
                  onClick={() => {
                    const csvRows = [
                      ["Name", "Email", "Department", "Leave Date", "Leave Reason", "Start Date"],
                      ...leavers.map(l => [
                        `${l.first_name || ""} ${l.last_name || ""}`.trim(),
                        l.email || "—",
                        getDepartmentName(l.department_id),
                        l.leaver_date || "—",
                        l.leaver_reason || "—",
                        l.start_date || "—"
                      ])
                    ];
                    const csvContent = csvRows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `leavers-${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 100);
                  }}
                />
                <TextIconButton
                  variant="refresh"
                  label="Refresh"
                  onClick={fetchData}
                />
              </>
            )}
            {activeTab === "rolehistory" && roleHistoryControls && (
              <>
                <input
                  type="search"
                  className="neon-input"
                  placeholder="Search role history..."
                  value={roleHistoryControls.searchTerm}
                  onChange={(e) => roleHistoryControls.setSearchTerm(e.target.value)}
                  style={{
                    width: '250px',
                    height: '32px',
                    margin: 0
                  }}
                />
                <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  {roleHistoryControls.filteredCount} of {roleHistoryControls.roleHistoryCount} entries
                </span>
                <div style={{ flex: 1 }} />
                <TextIconButton
                  variant="refresh"
                  label="Refresh Data"
                  onClick={roleHistoryControls.refreshData}
                />
              </>
            )}
            {activeTab === "departments" && (
              <>
                <div
                  className="user-manager-structure-toggle"
                  onClick={() => setStructureView(v => v === 'role' ? 'manager' : 'role')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <span className={`user-manager-structure-label ${structureView === 'role' ? 'active' : ''}`}>
                    Role Structure
                  </span>
                  <div className={`user-manager-structure-switch ${structureView === 'manager' ? 'active' : ''}`}>
                    <div className="user-manager-structure-switch-handle" />
                  </div>
                  <span className={`user-manager-structure-label ${structureView === 'manager' ? 'active' : ''}`}>
                    Manager Structure
                  </span>
                </div>
                <div style={{ flex: 1 }} />
                {structureView === 'role' && (
                  <>
                    <RoleAddDepartmentButton onAdded={fetchData} />
                    <AddRoleButton departments={departments} onAdded={fetchData} />
                    <AmendDepartmentButton departments={buildTreeNodes()} />
                    <RoleAmendButton departments={departments} roles={roles} />
                  </>
                )}
                {structureView === 'manager' && (
                  <>
                    <ChangeManagerButton departments={departments} users={users} />
                    <AssignManagerButton departments={departments} users={users} onAdded={fetchData} />
                  </>
                )}
                <TextIconButton
                  variant="refresh"
                  label="Refresh"
                  onClick={() => {
                    fetchData();
                    // Also refresh the RoleStructure or ManagerStructure component if it's mounted
                    if (structureView === 'role' && (window as any).refreshRoleStructure) {
                      (window as any).refreshRoleStructure();
                    }
                    if (structureView === 'manager' && (window as any).refreshManagerStructure) {
                      (window as any).refreshManagerStructure();
                    }
                  }}
                />
              </>
            )}
            {activeTab === "shifts" && (
              <>
                <span style={{ fontSize: '0.875rem' }}>Department:</span>
                <select
                  value={selectedShiftDept}
                  onChange={e => setSelectedShiftDept(e.target.value)}
                  className="neon-input"
                  style={{ marginLeft: '0.5rem', width: '200px' }}
                >
                  <option value="">Select a department...</option>
                  {[...departments]
                    .filter(dept => dept.level !== 1)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
                <div style={{ flex: 1 }} />
                <TextIconButton
                  variant="download"
                  icon={<FiDownload />}
                  label="Download CSV"
                  onClick={() => {
                    if (!selectedShiftDept) {
                      alert("Please select a department first");
                      return;
                    }
                    const dept = departments.find(d => d.id === selectedShiftDept);
                    const deptUsers = users.filter(u => u.department_id === selectedShiftDept);

                    const csvRows = [
                      ["Name", "Email", "Shift"],
                      ...deptUsers.map(u => {
                        const shift = u.shift_id
                          ? shifts.find(s => s.id === u.shift_id)?.name || "Unknown shift"
                          : "No shift";
                        return [
                          `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                          u.email || "—",
                          shift
                        ];
                      })
                    ];
                    const csvContent = csvRows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${dept?.name || "department"}-shifts-${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 100);
                  }}
                  disabled={!selectedShiftDept}
                />
              </>
            )}
            {activeTab === "permissions" && (
              <>
                <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  User Permissions
                </span>
              </>
            )}
            {activeTab === "startdate" && (
              <>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="neon-input"
                  style={{ width: '180px', height: '32px', margin: 0 }}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Select date between</span>
                <input
                  type="date"
                  value={filterStart}
                  onChange={e => setFilterStart(e.target.value)}
                  placeholder="From date"
                  className="neon-input"
                  style={{ width: '150px', height: '32px', margin: 0 }}
                />
                <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>and</span>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={e => setFilterEnd(e.target.value)}
                  placeholder="To date"
                  className="neon-input"
                  style={{ width: '150px', height: '32px', margin: 0 }}
                />
                <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>:</span>
                <TextIconButton
                  variant="refresh"
                  label="Clear"
                  onClick={() => {
                    setFilterDept("");
                    setFilterStart("");
                    setFilterEnd("");
                  }}
                />
                <TextIconButton
                  variant="download"
                  label="Download CSV"
                  onClick={() => {
                    const filtered = [...users]
                      .filter(u => u.start_date)
                      .filter(u => !u.is_leaver)
                      .filter(u => !filterDept || u.department_id === filterDept)
                      .filter(u => {
                        if (!filterStart && !filterEnd) return true;
                        const date = u.start_date;
                        if (!date) return false;
                        if (filterStart && date < filterStart) return false;
                        if (filterEnd && date > filterEnd) return false;
                        return true;
                      });
                    const csvRows = [
                      ["Name", "Start Date", "Department"],
                      ...filtered.map(u => [
                        `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                        u.start_date || "—",
                        getDepartmentName(u.department_id)
                      ])
                    ];
                    const csvContent = csvRows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `users-by-start-date-${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 100);
                  }}
                />
                <div style={{ flex: 1 }} />
                <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  {users.filter(u => u.start_date && !u.is_leaver && (!filterDept || u.department_id === filterDept) &&
                    (!filterStart || u.start_date >= filterStart) &&
                    (!filterEnd || u.start_date <= filterEnd)).length} of {users.filter(u => u.start_date && !u.is_leaver).length} users
                </span>
              </>
            )}
          </div>
        }
      />
      {activeTab === "people" && (
          <UserManagementPanel
            onControlsReady={setUserPanelControls}
            onDataChange={fetchData}
          />
        )}
        {activeTab === "users" && (
          loading ? (
            <div className="user-manager-loading">Loading users...</div>
          ) : error ? (
            <div className="user-manager-error">{error}</div>
          ) : (
            <div>
              {/* Users Without Department */}
              <div>
                <h3>Users Without Department ({usersWithoutDepartment.length})</h3>
                <table className="neon-table user-manager-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th className="neon-table-header-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutDepartment.length === 0 ? (
                      <tr><td colSpan={3} className="user-manager-empty">All users have a department</td></tr>
                    ) : (
                      usersWithoutDepartment.map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{user.email}</td>
                          <td>
                            <div className="user-manager-actions-cell">
                              <TextIconButton
                                variant="assign"
                                label="Assign Department"
                                onClick={() => handleAssignDepartment(user)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users Without Role */}
              <div>
                <h3>Users Without Role ({usersWithoutRole.length})</h3>
                <table className="neon-table user-manager-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee Number</th>
                      <th className="neon-table-header-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutRole.length === 0 ? (
                      <tr><td colSpan={3} className="user-manager-empty">All users have a role</td></tr>
                    ) : (
                      usersWithoutRole.map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{user.employee_number || "—"}</td>
                          <td>
                            <div className="user-manager-actions-cell">
                              <TextIconButton
                                variant="assign"
                                label="Assign Role"
                                onClick={() => handleAssignRole(user)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
        {activeTab === "leavers" && (
          loading ? (
            <div className="user-manager-loading">Loading leavers...</div>
          ) : error ? (
            <div className="user-manager-error">{error}</div>
          ) : (
            <div>
              <table className="neon-table user-manager-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Start Date</th>
                    <th>Leave Date</th>
                    <th>Leave Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leavers.length === 0 ? (
                    <tr><td colSpan={7} className="user-manager-empty">No employees have left</td></tr>
                  ) : (
                    leavers.map((leaver) => (
                      <tr key={leaver.id}>
                        <td className="user-manager-name">{`${leaver.first_name || ""} ${leaver.last_name || ""}`.trim()}</td>
                        <td>{leaver.email}</td>
                        <td>{getDepartmentName(leaver.department_id)}</td>
                        <td>{formatDateUK(leaver.start_date)}</td>
                        <td>{formatDateUK(leaver.leaver_date)}</td>
                        <td>{leaver.leaver_reason || "—"}</td>
                        <td>
                          <div className="user-manager-actions-cell">
                            <TextIconButton
                              variant="download"
                              icon={<FiDownload />}
                              label="Training File"
                              onClick={() => handleDownloadTrainingPDF(leaver)}
                            />
                            <TextIconButton
                              variant="assign"
                              label="Reassign"
                              onClick={() => handleReassignLeaver(leaver)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
        {activeTab === "newstarters" && (
          loading ? (
            <div className="user-manager-loading">Loading new starters...</div>
          ) : error ? (
            <div className="user-manager-error">
              <p>{error}</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                Check the browser console for more details.
              </p>
            </div>
          ) : (
            <div>
              <table className="neon-table user-manager-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Start Date</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newStarters.length === 0 ? (
                    <tr><td colSpan={6} className="user-manager-empty">No pending new starters</td></tr>
                  ) : (
                    newStarters.map((starter) => (
                      <tr key={starter.id}>
                        <td className="user-manager-name">{`${starter.first_name || ""} ${starter.last_name || ""}`.trim()}</td>
                        <td>{starter.email}</td>
                        <td>{starter.phone}</td>
                        <td>{formatDateUK(starter.start_date)}</td>
                        <td>{formatDateUK(starter.created_at)}</td>
                        <td>
                          <div className="user-manager-actions-cell">
                            <TextIconButton
                              variant="assign"
                              label="Assign"
                              onClick={() => {
                                setSelectedStarter(starter);
                                setEmployeeNumber("");
                                setAssignDialogOpen(true);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
        {activeTab === "startdate" && (
          loading ? (
            <div className="user-manager-loading">Loading users...</div>
          ) : error ? (
            <div className="user-manager-error">{error}</div>
          ) : (
            <div>
              <table className="neon-table user-manager-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('start_date')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Start Date {sortField === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('department')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={3} className="user-manager-empty">No users found</td></tr>
                  ) : (
                    [...users]
                      .filter(u => u.start_date)
                      .filter(u => !u.is_leaver)
                      .filter(u => !filterDept || u.department_id === filterDept)
                      .filter(u => {
                        if (!filterStart && !filterEnd) return true;
                        const date = u.start_date;
                        if (!date) return false;
                        if (filterStart && date < filterStart) return false;
                        if (filterEnd && date > filterEnd) return false;
                        return true;
                      })
                      .sort((a, b) => {
                        let comparison = 0;
                        if (sortField === 'name') {
                          const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase();
                          const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase();
                          comparison = nameA.localeCompare(nameB);
                        } else if (sortField === 'start_date') {
                          comparison = (a.start_date || "").localeCompare(b.start_date || "");
                        } else if (sortField === 'department') {
                          const deptA = getDepartmentName(a.department_id).toLowerCase();
                          const deptB = getDepartmentName(b.department_id).toLowerCase();
                          comparison = deptA.localeCompare(deptB);
                        }
                        return sortDirection === 'asc' ? comparison : -comparison;
                      })
                      .map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{formatDateUK(user.start_date)}</td>
                          <td>{getDepartmentName(user.department_id)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
        {activeTab === "rolehistory" && (
          <UserRoleHistory onControlsReady={setRoleHistoryControls} />
        )}
        {activeTab === "departments" && (
          structureView === 'role' ? <RoleStructure /> : <ManagerStructure />
        )}
        {activeTab === "shifts" && (
          <div className="user-manager-placeholder">
            <ShiftToggleContent selectedDepartment={selectedShiftDept} />
          </div>
        )}
        {activeTab === "permissions" && (
          <UserPermissionsManager />
        )}

      {/* User Edit/Add Dialog */}
      <OverlayDialog showCloseButton={true} open={dialogOpen} onClose={handleCloseDialog} ariaLabelledby="user-editor-title" closeOnOutsideClick={false} closeOnEscape={false}>
        <div className="neon-form-title user-manager-dialog-title" id="user-editor-title">
          {isDepartmentOnlyMode ? "Assign to Department" : isAddMode ? "Add User" : "Edit User"}
        </div>

        {error && (
          <div className="neon-error-message user-manager-dialog-error">
            {error}
          </div>
        )}

        {selectedUser && (
          <UserEditForm
            user={selectedUser}
            departments={departments}
            onSave={handleSaveUser}
            isAddMode={isAddMode}
            isDepartmentOnlyMode={isDepartmentOnlyMode}
          />
        )}
      </OverlayDialog>

      {/* Assign User Dialog */}
      <OverlayDialog showCloseButton={true}
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedStarter(null);
          setEmployeeNumber("");
          setError("");
        }}
        ariaLabelledby="assign-user-title"
      >
        <div className="neon-form-title user-manager-dialog-title" id="assign-user-title">
          Assign Employee Number
        </div>

        {error && (
          <div className="neon-error-message user-manager-dialog-error">
            {error}
          </div>
        )}

        {selectedStarter && (
          <div className="user-manager-form">
            <div className="info-box">
              <h4 className="neon-heading">New Starter Information</h4>
              <p className="neon-text"><strong>Name:</strong> {selectedStarter.first_name} {selectedStarter.last_name}</p>
              <p className="neon-text"><strong>Email:</strong> {selectedStarter.email}</p>
              <p className="neon-text"><strong>Start Date:</strong> {selectedStarter.start_date || "—"}</p>
            </div>

            <div className="user-manager-form-field">
              <label htmlFor="employee_number">Employee Number *</label>
              <input
                id="employee_number"
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="Enter employee number"
                autoFocus
              />
              <small className="neon-help-text">
                This will assign the employee number and send a welcome email with login instructions.
              </small>
            </div>

            <div className="user-manager-form-actions">
              <TextIconButton
                variant="send"
                label={assignLoading ? "Assigning..." : "Assign & Send Welcome Email"}
                onClick={handleAssignUser}
                disabled={assignLoading || !employeeNumber.trim()}
              />
            </div>
          </div>
        )}
      </OverlayDialog>

      {/* Reassign Leaver Dialog */}
      <OverlayDialog
        showCloseButton={true}
        open={reassignDialogOpen}
        onClose={() => {
          setReassignDialogOpen(false);
          setSelectedLeaver(null);
          setReassignMode(null);
          setError("");
        }}
        ariaLabelledby="reassign-leaver-title"
      >
        <div className="neon-form-title user-manager-dialog-title" id="reassign-leaver-title">
          Reassign Employee
        </div>

        {error && (
          <div className="neon-error-message user-manager-dialog-error">
            {error}
          </div>
        )}

        {selectedLeaver && (
          <div className="user-manager-form">
            <div className="info-box">
              <h4 className="neon-heading" style={{ marginBottom: "0.5rem" }}>Employee Information</h4>
              <p className="neon-text"><strong>Name:</strong> {selectedLeaver.first_name} {selectedLeaver.last_name}</p>
              <p className="neon-text"><strong>Email:</strong> {selectedLeaver.email}</p>
              <p className="neon-text"><strong>Previous Department:</strong> {getDepartmentName(selectedLeaver.department_id)}</p>
              <p className="neon-text"><strong>Leave Date:</strong> {selectedLeaver.leaver_date || "—"}</p>
            </div>

            <div className="spacer-4" />

            <p className="neon-text" style={{ marginBottom: "1rem" }}>
              Choose how to reassign this employee:
            </p>

            <div className="reassign-options">
              <div
                className={`reassign-option ${reassignMode === 'previous' ? 'selected' : ''}`}
                onClick={() => setReassignMode('previous')}
              >
                <h4 className="neon-heading">
                  Option 1: Reassign with Previous Details
                </h4>
                <p className="neon-help-text">
                  Restore employee with their previous employee number, department, and role.
                </p>
              </div>

              <div
                className={`reassign-option ${reassignMode === 'new' ? 'selected' : ''}`}
                onClick={() => setReassignMode('new')}
              >
                <h4 className="neon-heading">
                  Option 2: Add with New Details
                </h4>
                <p className="neon-help-text">
                  Reactivate employee and update with new department, role, or other details.
                </p>
              </div>
            </div>

            <div className="spacer-4" />

            <div className="user-manager-form-actions">
              <TextIconButton
                variant="primary"
                label={loading ? "Processing..." : "Continue"}
                onClick={() => {
                  if (reassignMode === 'previous') {
                    handleReassignWithPreviousDetails();
                  } else if (reassignMode === 'new') {
                    handleReassignWithNewDetails();
                  } else {
                    setError("Please select an option");
                  }
                }}
                disabled={loading || !reassignMode}
              />
            </div>
          </div>
        )}
      </OverlayDialog>

      {/* Invite User Dialog */}
      <OverlayDialog
        showCloseButton={true}
        open={inviteDialogOpen}
        onClose={() => {
          setInviteDialogOpen(false);
          setInviteEmail("");
          setInviteFirstName("");
          setInviteLastName("");
          setError("");
        }}
        ariaLabelledby="invite-user-title"
      >
        <div className="neon-form-title user-manager-dialog-title" id="invite-user-title">
          Invite User
        </div>

        {error && (
          <div className="neon-error-message user-manager-dialog-error">
            {error}
          </div>
        )}

        <div className="user-manager-form">
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(64, 224, 208, 0.1)", borderRadius: "8px" }}>
            <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
              Send a joining instructions email to invite a new user to the system. They will receive an email with a link to set up their account.
            </p>
          </div>

          <div className="user-manager-form-field">
            <label htmlFor="invite_first_name">First Name *</label>
            <input
              id="invite_first_name"
              type="text"
              value={inviteFirstName}
              onChange={(e) => setInviteFirstName(e.target.value)}
              placeholder="Enter first name"
              autoFocus
            />
          </div>

          <div className="user-manager-form-field">
            <label htmlFor="invite_last_name">Last Name *</label>
            <input
              id="invite_last_name"
              type="text"
              value={inviteLastName}
              onChange={(e) => setInviteLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>

          <div className="user-manager-form-field">
            <label htmlFor="invite_email">Email Address *</label>
            <input
              id="invite_email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
            />
            <small style={{ color: "#40e0d0", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
              An invitation email with joining instructions will be sent to this address.
            </small>
          </div>

          <div className="user-manager-form-actions">
            <TextIconButton
              variant="primary"
              label={inviteLoading ? "Sending..." : "Send Invitation"}
              onClick={handleInviteUser}
              disabled={inviteLoading || !inviteEmail.trim() || !inviteFirstName.trim() || !inviteLastName.trim()}
            />
          </div>
        </div>
      </OverlayDialog>

      {/* Role Assignment Dialog */}
      {roleDialogOpen && selectedRoleUser && (
        <OverlayDialog
          showCloseButton={true}
          open={roleDialogOpen}
          onClose={() => {
            setRoleDialogOpen(false);
            setSelectedRoleUser(null);
          }}
          ariaLabelledby="role-assignment-title"
          compactHeight={true}
        >
          <SimpleRoleAssignment
            user={selectedRoleUser}
            onClose={() => {
              setRoleDialogOpen(false);
              setSelectedRoleUser(null);
            }}
            onSuccess={handleRoleAssignmentSuccess}
          />
        </OverlayDialog>
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
        autoCloseMs={2000}
      />
    </>
  );
};

function ShiftToggleContent({ selectedDepartment }: { selectedDepartment: string }) {
  return <RotaByDepartment departmentId={selectedDepartment} />;
}

interface UserEditFormProps {
  user: any;
  departments: any[];
  onSave: (userData: any) => void;
  isAddMode: boolean;
  isDepartmentOnlyMode?: boolean;
}

function UserEditForm({ user, departments, onSave, isAddMode, isDepartmentOnlyMode }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    department_id: user.department_id || '',
    access_level: user.access_level || 'user',
    start_date: user.start_date || '',
    location: user.location || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If department only mode, only send department_id
    if (isDepartmentOnlyMode) {
      onSave({ department_id: formData.department_id });
    } else {
      onSave(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Department only mode - show simplified form
  if (isDepartmentOnlyMode) {
    return (
      <form onSubmit={handleSubmit} className="user-manager-form">
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(64, 224, 208, 0.1)", borderRadius: "8px" }}>
          <p style={{ margin: "0.25rem 0" }}><strong>Name:</strong> {user.first_name} {user.last_name}</p>
          <p style={{ margin: "0.25rem 0" }}><strong>Email:</strong> {user.email}</p>
        </div>

        <div className="user-manager-form-field">
          <label>Department *</label>
          <select
            value={formData.department_id}
            onChange={(e) => handleChange('department_id', e.target.value)}
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="user-manager-form-actions">
          <TextIconButton
            variant="primary"
            label="Assign Department"
            type="submit"
          />
        </div>
      </form>
    );
  }

  // Full form for add/edit mode
  return (
    <form onSubmit={handleSubmit} className="user-manager-form">
      <div className="user-manager-form-row">
        <div className="user-manager-form-field">
          <label>First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            required
          />
        </div>
        <div className="user-manager-form-field">
          <label>Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="user-manager-form-field">
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
      </div>

      <div className="user-manager-form-field">
        <label>Location</label>
        <select
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
        >
          <option value="">Select Location</option>
          <option value="England">England</option>
          <option value="Wales">Wales</option>
          <option value="Poland">Poland</option>
          <option value="Group">Group</option>
        </select>
      </div>

      <div className="user-manager-form-row">
        <div className="user-manager-form-field">
          <label>Department</label>
          <select
            value={formData.department_id}
            onChange={(e) => handleChange('department_id', e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="user-manager-form-field">
          <label>Access Level</label>
          <select
            value={formData.access_level}
            onChange={(e) => handleChange('access_level', e.target.value)}
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="user-manager-form-field">
        <label>Start Date</label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => handleChange('start_date', e.target.value)}
        />
      </div>

      <div className="user-manager-form-actions">
        <TextIconButton
          variant="primary"
          label={isAddMode ? 'Add User' : 'Save Changes'}
          type="submit"
        />
      </div>
    </form>
  );
}

export default UserManager;
