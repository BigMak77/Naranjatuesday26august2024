"use client";
import React, { useState, useEffect } from "react";
import FolderTabs, { Tab } from "@/components/FolderTabs";
import { FiUserPlus, FiUser, FiEdit, FiTrash2, FiUsers, FiShield, FiToggleLeft, FiToggleRight, FiDownload } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import RoleStructure from "@/components/structure/RoleStructure";
import ManagerStructure from "@/components/structure/ManagerStructure";
import RotaByDepartment from "@/components/people/RotaByDepartment";
import Rota from "@/components/people/Rota";
import NeonIconButton from "@/components/ui/NeonIconButton";
import RoleModuleDocumentAssignment from "@/components/roles/RoleModuleDocumentAssignment";
import UserPermissionsManager from "@/components/admin/UserPermissionsManager";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";
import UserManagementPanel from "@/components/user/UserManagementPanel";
import { sendWelcomeEmail } from "@/lib/email-service";

const tabs: Tab[] = [
  { key: "people", label: "People" },
  { key: "users", label: "Users" },
  { key: "newstarters", label: "New Starters" },
  { key: "roles", label: "Roles" },
  { key: "departments", label: "Structures" },
  { key: "shifts", label: "Shifts" },
  { key: "permissions", label: "Permissions" },
  { key: "startdate", label: "Users by Start Date" },
];

const UserManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("people");
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [structureView, setStructureView] = useState<'role' | 'manager'>('role');
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");

  // New Starters state
  const [newStarters, setNewStarters] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<any>(null);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Dialog and Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: deptRows, error: deptError },
          { data: userRows, error: userError },
          { data: startersRows, error: startersError }
        ] = await Promise.all([
          supabase.from("departments").select("id, name"),
          supabase.from("users").select("id, department_id, access_level, first_name, last_name, start_date"),
          supabase.from("people_personal_information").select("*").is("user_id", null).order("created_at", { ascending: false })
        ]);

        if (deptError) console.error("Error fetching departments:", deptError);
        if (userError) console.error("Error fetching users:", userError);
        if (startersError) {
          console.error("Error fetching new starters:", startersError);
          setError(`Failed to fetch new starters: ${startersError.message}`);
        }

        setDepartments(deptRows || []);
        setUsers(userRows || []);
        setNewStarters(startersRows || []);

        console.log("New starters fetched:", startersRows?.length || 0);
      } catch (error: any) {
        console.error("Error in fetchData:", error);
        setError(error.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: find users without a manager in their department
  const usersWithoutDepartment = users.filter(u => !u.department_id);
  const usersWithoutManager = users.filter(u => {
    if (!u.department_id) return false;
    // Find a manager in the same department (access_level === 'manager', case-insensitive)
    return !users.some(
      (other) =>
        other.id !== u.id &&
        typeof other.access_level === 'string' &&
        other.access_level.toLowerCase() === 'manager' &&
        other.department_id === u.department_id
    );
  });

  // Helper: get department name for a user
  const getDepartmentName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : '—';
  };

  // Helper: get department(s) managed by a user
  const getManagedDepartments = (userId: string) => {
    // Find departments where this user is a manager
    const managedDepts = departments.filter(dept =>
      users.some(u =>
        u.id === userId &&
        typeof u.access_level === 'string' &&
        u.access_level.toLowerCase() === 'manager' &&
        u.department_id === dept.id
      )
    );
    return managedDepts.map(d => d.name).join(', ') || '—';
  };

  // Dialog handlers
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      department_id: '',
      access_level: 'user',
      start_date: ''
    });
    setIsAddMode(true);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
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
      
      // Refresh users data
      const { data: userRows } = await supabase.from("users").select("id, department_id, access_level, first_name, last_name, start_date");
      setUsers(userRows || []);
      
      setDialogOpen(false);
      setShowSuccess(true);
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

      // Refresh users data
      const { data: userRows } = await supabase.from("users").select("id, department_id, access_level, first_name, last_name, start_date");
      setUsers(userRows || []);

      setSuccessMessage("User deleted successfully!");
      setShowSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning new starter to users table
  const handleAssignUser = async () => {
    if (!selectedStarter || !employeeNumber.trim()) {
      setError("Please enter an employee number");
      return;
    }

    try {
      setAssignLoading(true);
      setError("");

      // Create the user record in the users table
      const newUser = {
        employee_number: employeeNumber.trim(),
        first_name: selectedStarter.first_name,
        last_name: selectedStarter.last_name,
        email: selectedStarter.email,
        start_date: selectedStarter.start_date,
        access_level: "user",
        department_id: null, // Can be set later by manager
      };

      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert([newUser])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update people_personal_information to link to the new user
      const { error: updateError } = await supabase
        .from("people_personal_information")
        .update({
          user_id: insertedUser.id,
          status: "processed",
          processed_at: new Date().toISOString(),
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

      // Refresh data
      const [{ data: userRows }, { data: startersRows }] = await Promise.all([
        supabase.from("users").select("id, department_id, access_level, first_name, last_name, start_date"),
        supabase.from("people_personal_information").select("*").is("user_id", null).order("created_at", { ascending: false })
      ]);
      setUsers(userRows || []);
      setNewStarters(startersRows || []);

      setAssignDialogOpen(false);
      setSelectedStarter(null);
      setEmployeeNumber("");

      if (emailResult.success) {
        setSuccessMessage(`User assigned successfully! Welcome email sent to ${selectedStarter.email}`);
      } else {
        setSuccessMessage(`User assigned successfully! Note: Welcome email failed - ${emailResult.error}`);
      }
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Error assigning user:", error);
      setError(error.message || "Failed to assign user");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <section className="user-manager-section">
      <div className="user-manager-header">
        <h2 className="neon-heading">User Manager</h2>
      </div>
      <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="user-manager-content">
        {activeTab === "people" && (
          <UserManagementPanel />
        )}
        {activeTab === "users" && (
          loading ? (
            <div className="user-manager-loading">Loading users...</div>
          ) : error ? (
            <div className="user-manager-error">{error}</div>
          ) : (
            <div className="user-manager-grid">
              <div>
                <h3 className="neon-heading user-manager-subheading">Users Without Manager</h3>
                <table className="neon-table user-manager-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Manages Department(s)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutManager.length === 0 ? (
                      <tr><td colSpan={3} className="user-manager-empty">All users have a manager</td></tr>
                    ) : (
                      usersWithoutManager.map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{getManagedDepartments(user.id)}</td>
                          <td>
                            <div className="user-manager-actions-cell">
                              <NeonIconButton
                                variant="edit"
                                onClick={() => handleEditUser(user)}
                                title="Edit User"
                              />
                              <NeonIconButton
                                variant="delete"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="neon-heading user-manager-subheading">Users Without Department</h3>
                <table className="neon-table user-manager-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutDepartment.length === 0 ? (
                      <tr><td colSpan={2} className="user-manager-empty">All users have a department</td></tr>
                    ) : (
                      usersWithoutDepartment.map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>
                            <div className="user-manager-actions-cell">
                              <NeonIconButton
                                variant="edit"
                                onClick={() => handleEditUser(user)}
                                title="Edit User"
                              />
                              <NeonIconButton
                                variant="delete"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
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
              <div style={{ marginBottom: "1rem" }}>
                <h3 className="neon-heading user-manager-subheading">
                  Pending New Starters ({newStarters.length})
                </h3>
                <p style={{ color: "#40e0d0", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                  These people have submitted their information but haven't been assigned to the users table yet.
                </p>
                {newStarters.length === 0 && (
                  <p style={{ color: "#ffa500", fontSize: "0.875rem", marginTop: "0.5rem", fontStyle: "italic" }}>
                    Note: New starters will appear here after they fill out the form at /new-starter.
                    If you're expecting data and see nothing, check the browser console for errors.
                  </p>
                )}
              </div>
              <table className="neon-table user-manager-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Start Date</th>
                    <th>Submitted</th>
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
                        <td>{starter.start_date || "—"}</td>
                        <td>{new Date(starter.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="user-manager-actions-cell">
                            <NeonIconButton
                              variant="add"
                              onClick={() => {
                                setSelectedStarter(starter);
                                setEmployeeNumber("");
                                setAssignDialogOpen(true);
                              }}
                              title="Assign to Users Table"
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
              <div className="user-manager-filters">
                <label className="user-manager-label">
                  Department:
                  <select 
                    value={filterDept} 
                    onChange={e => setFilterDept(e.target.value)} 
                    className="user-manager-select"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </label>
                <label className="user-manager-label">
                  Start Date From:
                  <input 
                    type="date" 
                    value={filterStart} 
                    onChange={e => setFilterStart(e.target.value)} 
                    className="user-manager-input"
                  />
                </label>
                <label className="user-manager-label">
                  Start Date To:
                  <input 
                    type="date" 
                    value={filterEnd} 
                    onChange={e => setFilterEnd(e.target.value)} 
                    className="user-manager-input"
                  />
                </label>
                <div className="user-manager-download">
                  <NeonIconButton
                    variant="refresh"
                    title="Clear filters"
                    onClick={() => {
                      setFilterDept("");
                      setFilterStart("");
                      setFilterEnd("");
                    }}
                  />
                  <NeonIconButton
                    variant="download"
                    title="Download filtered users as CSV"
                    onClick={() => {
                      const filtered = [...users]
                        .filter(u => u.start_date)
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
                </div>
              </div>
              <table className="neon-table user-manager-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date</th>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={4} className="user-manager-empty">No users found</td></tr>
                  ) : (
                    [...users]
                      .filter(u => u.start_date)
                      .filter(u => !filterDept || u.department_id === filterDept)
                      .filter(u => {
                        if (!filterStart && !filterEnd) return true;
                        const date = u.start_date;
                        if (!date) return false;
                        if (filterStart && date < filterStart) return false;
                        if (filterEnd && date > filterEnd) return false;
                        return true;
                      })
                      .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""))
                      .map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{user.start_date || "—"}</td>
                          <td>{getDepartmentName(user.department_id)}</td>
                          <td>
                            <div className="user-manager-actions-cell">
                              <NeonIconButton
                                variant="edit"
                                onClick={() => handleEditUser(user)}
                                title="Edit User"
                              />
                              <NeonIconButton
                                variant="delete"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
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
        {activeTab === "roles" && (
          <RoleModuleDocumentAssignment />
        )}
        {activeTab === "departments" && (
          <div className="user-manager-structure-toggle" onClick={() => setStructureView(v => v === 'role' ? 'manager' : 'role')}>
            <span className={`user-manager-structure-label ${structureView === 'role' ? 'active' : ''}`}>
              Role Structure
            </span>
            <div className={`user-manager-structure-switch ${structureView === 'role' ? 'active' : ''}`}>
              <div className="user-manager-structure-switch-handle" />
            </div>
            <span className={`user-manager-structure-label ${structureView === 'manager' ? 'active' : ''}`}>
              Manager Structure
            </span>
          </div>
        )}
        {activeTab === "departments" && (
          structureView === 'role' ? <RoleStructure /> : <ManagerStructure />
        )}
        {activeTab === "shifts" && (
          <div className="user-manager-placeholder">
            <ShiftToggleContent />
          </div>
        )}
        {activeTab === "permissions" && (
          <UserPermissionsManager />
        )}
      </div>

      {/* User Edit/Add Dialog */}
      <OverlayDialog open={dialogOpen} onClose={handleCloseDialog} ariaLabelledby="user-editor-title">
        <div className="neon-form-title user-manager-dialog-title" id="user-editor-title">
          {isAddMode ? "Add User" : "Edit User"}
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
            onCancel={handleCloseDialog}
            isAddMode={isAddMode}
          />
        )}
      </OverlayDialog>

      {/* Assign User Dialog */}
      <OverlayDialog
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
          Assign to Users Table
        </div>

        {error && (
          <div className="neon-error-message user-manager-dialog-error">
            {error}
          </div>
        )}

        {selectedStarter && (
          <div className="user-manager-form">
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(64, 224, 208, 0.1)", borderRadius: "8px" }}>
              <h4 style={{ color: "#40e0d0", marginBottom: "0.5rem" }}>New Starter Information</h4>
              <p style={{ margin: "0.25rem 0" }}><strong>Name:</strong> {selectedStarter.first_name} {selectedStarter.last_name}</p>
              <p style={{ margin: "0.25rem 0" }}><strong>Email:</strong> {selectedStarter.email}</p>
              <p style={{ margin: "0.25rem 0" }}><strong>Start Date:</strong> {selectedStarter.start_date}</p>
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
              <small style={{ color: "#40e0d0", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                This will create a user account and send a welcome email with login instructions.
              </small>
            </div>

            <div className="user-manager-form-actions">
              <button
                type="button"
                className="neon-btn-secondary"
                onClick={() => {
                  setAssignDialogOpen(false);
                  setSelectedStarter(null);
                  setEmployeeNumber("");
                  setError("");
                }}
                disabled={assignLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="neon-btn-primary"
                onClick={handleAssignUser}
                disabled={assignLoading || !employeeNumber.trim()}
              >
                {assignLoading ? "Assigning..." : "Assign & Send Welcome Email"}
              </button>
            </div>
          </div>
        )}
      </OverlayDialog>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
        autoCloseMs={2000}
      />
    </section>
  );
};

function ShiftToggleContent() {
  const [view, setView] = React.useState<'department' | 'user'>('department');
  return (
    <>
      <div className="shift-toggle" onClick={() => setView(v => v === 'department' ? 'user' : 'department')} aria-label="Toggle shift view">
        <span className={`shift-toggle-label ${view === 'department' ? 'active' : ''}`}>
          By Department
        </span>
        <div className={`shift-toggle-switch ${view === 'department' ? 'active' : ''}`}>
          <div className="shift-toggle-switch-handle" />
        </div>
        <span className={`shift-toggle-label ${view === 'user' ? 'active' : ''}`}>
          By User
        </span>
      </div>
      {view === 'department' ? <RotaByDepartment departmentId="" /> : <Rota />}
    </>
  );
}

interface UserEditFormProps {
  user: any;
  departments: any[];
  onSave: (userData: any) => void;
  onCancel: () => void;
  isAddMode: boolean;
}

function UserEditForm({ user, departments, onSave, onCancel, isAddMode }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    department_id: user.department_id || '',
    access_level: user.access_level || 'user',
    start_date: user.start_date || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        <button type="button" className="neon-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="neon-btn-primary">
          {isAddMode ? 'Add User' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default UserManager;
