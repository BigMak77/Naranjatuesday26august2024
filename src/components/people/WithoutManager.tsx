// Show departments without a manager or admin
"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  department_id?: string;
  access_level?: string;
  first_name?: string;
  last_name?: string;
}

export default function WithoutManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentsWithoutManager, setDepartmentsWithoutManager] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch all users, including those with null/empty department_id
      const [{ data: deptRows }, { data: userRows }] = await Promise.all([
        supabase.from("departments").select("id, name"),
        supabase.from("users").select("id, department_id, access_level, first_name, last_name")
      ]);
      setDepartments(deptRows || []);
      setUsers(userRows || []);
      setLoading(false);
      // Find departments with no manager or admin
      const managerDepts = new Set(
        (userRows || [])
          .filter(
            (u) =>
              (u.access_level === "Manager" || u.access_level === "Admin") &&
              u.department_id && typeof u.department_id === "string" && u.department_id.length > 0
          )
          .map((u) => u.department_id)
      );
      const withoutManager = (deptRows || []).filter((d) => !managerDepts.has(d.id));
      setDepartmentsWithoutManager(withoutManager);
    };
    fetchData();
  }, []);

  const reloadDepartments = async () => {
    setLoading(true);
    const [{ data: deptRows }, { data: userRows }] = await Promise.all([
      supabase.from("departments").select("id, name"),
      supabase.from("users").select("id, department_id, access_level, first_name, last_name")
    ]);
    setDepartments(deptRows || []);
    setUsers(userRows || []);
    setLoading(false);
    const managerDepts = new Set(
      (userRows || [])
        .filter(
          (u) =>
            (u.access_level === "Manager" || u.access_level === "Admin") &&
            u.department_id && typeof u.department_id === "string" && u.department_id.length > 0
        )
        .map((u) => u.department_id)
    );
    const withoutManager = (deptRows || []).filter((d) => !managerDepts.has(d.id));
    setDepartmentsWithoutManager(withoutManager);
  };

  // Handler to set user as manager
  const handleSetManager = async (userId: string) => {
    setUpdatingUserId(userId);
    setError(null);
    const { error } = await supabase
      .from("users")
      .update({ access_level: "Manager" })
      .eq("id", userId);
    setUpdatingUserId(null);
    if (error) {
      setError("Failed to update user: " + error.message);
    } else {
      setShowOverlay(false);
      setShowSuccess(true);
      setTimeout(async () => {
        setShowSuccess(false);
        await reloadDepartments();
      }, 1500);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Departments Without a Manager or Admin</h2>
      {departmentsWithoutManager.length === 0 ? (
        <p>All departments have a manager or admin.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {departmentsWithoutManager.map((d) => (
            <li key={d.id} style={{ marginBottom: 24 }}>
              <button
                style={{ fontWeight: 600, fontSize: 18, background: "none", border: "none", color: "#39ff14", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => { setSelectedDept(d); setShowOverlay(true); }}
              >
                {d.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {showOverlay && selectedDept && (
        <OverlayDialog showCloseButton={true} open={showOverlay} onClose={() => setShowOverlay(false)}>
          <div style={{ minWidth: 320 }}>
            <h3 style={{ marginBottom: 12 }}>{selectedDept.name} - Users</h3>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <ul style={{ listStyle: "none", padding: 0 }}>
              {users.filter(u => u.department_id === selectedDept.id).length === 0 ? (
                <li style={{ color: '#aaa' }}>(No users)</li>
              ) : (
                users.filter(u => u.department_id === selectedDept.id).map(u => (
                  <li key={u.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{u.first_name || ''}{u.first_name && u.last_name ? ' ' : ''}{u.last_name || ''}</span>
                    <input
                      type="checkbox"
                      checked={u.access_level === "Manager"}
                      disabled={u.access_level === "Manager" || updatingUserId === u.id}
                      onChange={() => handleSetManager(u.id)}
                      style={{ marginLeft: 8 }}
                    />
                    <span style={{ fontSize: 13, color: '#39ff14' }}>Set as manager</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </OverlayDialog>
      )}
      {showSuccess && (
        <SuccessModal open={showSuccess} message="User set as manager successfully!" onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}
