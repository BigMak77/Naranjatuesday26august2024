"use client";
import React, { useState, useEffect } from "react";
import FolderTabs, { Tab } from "@/components/FolderTabs";
import Link from "next/link";
import { FiUserPlus, FiUser, FiEdit, FiTrash2, FiUsers, FiShield, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import RoleStructure from "@/components/structure/RoleStructure";
import ManagerStructure from "@/components/structure/ManagerStructure";
import RotaByDepartment from "@/components/people/RotaByDepartment";
import Rota from "@/components/people/Rota";

const tabs: Tab[] = [
  { key: "users", label: "Users", icon: <FiUsers /> },
  { key: "roles", label: "Roles", icon: <FiShield /> },
  { key: "departments", label: "Structures", icon: <FiUserPlus /> },
  { key: "shifts", label: "Shifts", icon: <FiEdit /> },
  { key: "permissions", label: "Permissions", icon: <FiUser /> },
];

const UserManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [structureView, setStructureView] = useState<'role' | 'manager'>('role');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: deptRows }, { data: userRows }] = await Promise.all([
        supabase.from("departments").select("id, name"),
        supabase.from("users").select("id, department_id, access_level, first_name, last_name")
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
    <section className="neon-card neon-form-padding">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="neon-heading">User Manager</h2>
      </div>
      <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div style={{ marginTop: 24 }}>
        {activeTab === "users" && (
          loading ? (
            <div style={{ color: "var(--neon)", textAlign: "center", padding: 32 }}>Loading users...</div>
          ) : error ? (
            <div style={{ color: "#e74c3c", textAlign: "center", padding: 32 }}>{error}</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div>
                <h3 className="neon-heading" style={{ fontSize: 16, marginBottom: 12 }}>Users Without Manager</h3>
                <table className="neon-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Manages Department(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutManager.length === 0 ? (
                      <tr><td colSpan={2} style={{ textAlign: "center", color: "var(--neon)" }}>All users have a manager</td></tr>
                    ) : (
                      usersWithoutManager.map((user) => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: 700, color: "var(--neon)" }}>{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                          <td>{getManagedDepartments(user.id)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="neon-heading" style={{ fontSize: 16, marginBottom: 12 }}>Users Without Department</h3>
                <table className="neon-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutDepartment.length === 0 ? (
                      <tr><td colSpan={1} style={{ textAlign: "center", color: "var(--neon)" }}>All users have a department</td></tr>
                    ) : (
                      usersWithoutDepartment.map((user) => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: 700, color: "var(--neon)" }}>{`${user.first_name || ""} ${user.last_name || ""}`.trim()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
        {activeTab === "roles" && (
          <div style={{ color: "var(--text)", fontSize: 14, padding: 16 }}>Roles tab placeholder</div>
        )}
        {activeTab === "departments" && (
          <div style={{ color: "var(--text)", fontSize: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, padding: "12px 0" }}>
              <span style={{ fontWeight: 600, color: "var(--neon)", paddingRight: 8 }}>
                
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => setStructureView(v => v === 'role' ? 'manager' : 'role')}
                aria-label="Toggle structure view"
              >
                <span style={{ fontSize: 15, color: structureView === 'role' ? "var(--neon)" : "var(--text)", marginRight: 8 }}>
                  Role Structure
                </span>
                <div
                  style={{
                    width: 54,
                    height: 32,
                    borderRadius: 20,
                    background: structureView === 'role' ? '#6fdc6f' : '#ccc',
                    position: 'relative',
                    transition: 'background 0.2s',
                    boxShadow: '0 1px 6px #0002',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: structureView === 'role' ? 4 : 26,
                      top: 4,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 2px 6px #0002',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
                <span style={{ fontSize: 15, color: structureView === 'manager' ? "var(--neon)" : "var(--text)", marginLeft: 8 }}>
                  Manager Structure
                </span>
              </div>
            </div>
            {structureView === 'role' ? <RoleStructure /> : <ManagerStructure />}
          </div>
        )}
        {activeTab === "shifts" && (
          <div style={{ color: "var(--text)", fontSize: 14, padding: 16 }}>
            <ShiftToggleContent />
          </div>
        )}
        {activeTab === "permissions" && (
          <div style={{ color: "var(--text)", fontSize: 14, padding: 16 }}>Permissions tab placeholder</div>
        )}
      </div>
    </section>
  );
};

function ShiftToggle() {
  const [view, setView] = React.useState<'department' | 'user'>('department');
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => setView(v => v === 'department' ? 'user' : 'department')}
      aria-label="Toggle shift view"
    >
      <span style={{ fontSize: 15, color: view === 'department' ? "var(--neon)" : "var(--text)", marginRight: 8 }}>
        By Department
      </span>
      <div
        style={{
          width: 54,
          height: 32,
          borderRadius: 20,
          background: view === 'department' ? '#6fdc6f' : '#ccc',
          position: 'relative',
          transition: 'background 0.2s',
          boxShadow: '0 1px 6px #0002',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: view === 'department' ? 4 : 26,
            top: 4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px #0002',
            transition: 'left 0.2s',
          }}
        />
      </div>
      <span style={{ fontSize: 15, color: view === 'user' ? "var(--neon)" : "var(--text)", marginLeft: 8 }}>
        By User
      </span>
    </div>
  );
}

function ShiftToggleContent() {
  const [view, setView] = React.useState<'department' | 'user'>('department');
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
          userSelect: "none",
          marginBottom: 24,
        }}
        onClick={() => setView(v => v === 'department' ? 'user' : 'department')}
        aria-label="Toggle shift view"
      >
        <span style={{ fontSize: 15, color: view === 'department' ? "var(--neon)" : "var(--text)", marginRight: 8 }}>
          By Department
        </span>
        <div
          style={{
            width: 54,
            height: 32,
            borderRadius: 20,
            background: view === 'department' ? '#6fdc6f' : '#ccc',
            position: 'relative',
            transition: 'background 0.2s',
            boxShadow: '0 1px 6px #0002',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: view === 'department' ? 4 : 26,
              top: 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 6px #0002',
              transition: 'left 0.2s',
            }}
          />
        </div>
        <span style={{ fontSize: 15, color: view === 'user' ? "var(--neon)" : "var(--text)", marginLeft: 8 }}>
          By User
        </span>
      </div>
      {view === 'department' ? <RotaByDepartment departmentId="" /> : <Rota />}
    </>
  );
}

export default UserManager;
