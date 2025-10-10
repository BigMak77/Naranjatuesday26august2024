"use client";
import React, { useState, useEffect } from "react";
import FolderTabs, { Tab } from "@/components/FolderTabs";
import Link from "next/link";
import { FiUserPlus, FiUser, FiEdit, FiTrash2, FiUsers, FiShield, FiToggleLeft, FiToggleRight, FiDownload } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import RoleStructure from "@/components/structure/RoleStructure";
import ManagerStructure from "@/components/structure/ManagerStructure";
import RotaByDepartment from "@/components/people/RotaByDepartment";
import Rota from "@/components/people/Rota";
import NeonIconButton from "@/components/ui/NeonIconButton";

const tabs: Tab[] = [
  { key: "users", label: "Users", icon: <FiUsers /> },
  { key: "roles", label: "Roles", icon: <FiShield /> },
  { key: "departments", label: "Structures", icon: <FiUserPlus /> },
  { key: "shifts", label: "Shifts", icon: <FiEdit /> },
  { key: "permissions", label: "Permissions", icon: <FiUser /> },
  { key: "startdate", label: "Users by Start Date", icon: <FiToggleRight /> },
];

const UserManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: deptRows }, { data: userRows }] = await Promise.all([
        supabase.from("departments").select("id, name"),
        supabase.from("users").select("id, department_id, access_level, first_name, last_name, start_date")
      ]);
      setDepartments(deptRows || []);
      setUsers(userRows || []);
      setLoading(false);
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

  return (
    <section className="neon-card neon-form-padding user-manager-section">
      <div className="user-manager-header">
        <h2 className="neon-heading">User Manager</h2>
      </div>
      <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="user-manager-content">
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
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutManager.length === 0 ? (
                      <tr><td colSpan={2} className="user-manager-empty">All users have a manager</td></tr>
                    ) : (
                      usersWithoutManager.map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{getManagedDepartments(user.id)}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutDepartment.length === 0 ? (
                      <tr><td colSpan={1} className="user-manager-empty">All users have a department</td></tr>
                    ) : (
                      usersWithoutDepartment.map((user) => (
                        <tr key={user.id}>
                          <td className="user-manager-name">{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="user-manager-select">
                    <option value="">All</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </label>
                <label className="user-manager-label">
                  Start Date From:
                  <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="user-manager-input" />
                </label>
                <label className="user-manager-label">
                  To:
                  <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="user-manager-input" />
                </label>
                <div className="user-manager-download">
                  <NeonIconButton
                    variant="download"
                    title="Download filtered users as CSV"
                    className="neon-btn-upload"
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
                  >
                    Download CSV
                  </NeonIconButton>
                </div>
              </div>
              <table className="neon-table user-manager-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={3} className="user-manager-empty">No users found</td></tr>
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
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
        {activeTab === "roles" && (
          <div className="user-manager-placeholder">Roles tab placeholder</div>
        )}
        {activeTab === "departments" && (
          <div className="user-manager-structure">
            <div className="user-manager-structure-toggle" onClick={() => setStructureView(v => v === 'role' ? 'manager' : 'role')} aria-label="Toggle structure view">
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
            {structureView === 'role' ? <RoleStructure /> : <ManagerStructure />}
          </div>
        )}
        {activeTab === "shifts" && (
          <div className="user-manager-placeholder">
            <ShiftToggleContent />
          </div>
        )}
        {activeTab === "permissions" && (
          <div className="user-manager-placeholder">Permissions tab placeholder</div>
        )}
      </div>
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

export default UserManager;
