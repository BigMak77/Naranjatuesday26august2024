// RotaByDepartment.tsx - Table of users grouped by shift within a single department
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import SuccessModal from "@/components/ui/SuccessModal";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id?: string;
  shift_id?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
}

export default function RotaByDepartment({ departmentId }: { departmentId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDeptId, setFilterDeptId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: userRows, error }, { data: deptRows }, { data: shiftRows }] = await Promise.all([
        supabase
          .from("users")
          .select("id, first_name, last_name, email, department_id, shift_id")
          .eq("is_archived", false),
        supabase.from("departments").select("id, name"),
        supabase.from("shift_patterns").select("id, name"),
      ]);
      setDepartments(deptRows || []);
      setShifts(shiftRows || []);
      setUsers(userRows || []);
      setLoading(false);
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase user fetch error:", error);
      }
    };
    fetchData();
  }, []);

  // Determine which department to show (filtered or all)
  const currentDeptId = filterDeptId || departmentId;
  const currentDepartment = departments.find(d => d.id === currentDeptId) || null;

  // Filter users by department if filter is set, otherwise show all
  const filteredUsers = filterDeptId
    ? users.filter(u => u.department_id === filterDeptId)
    : users;

  // Group users by shift
  const grouped: Record<string, User[]> = {};
  filteredUsers.forEach(u => {
    const shiftId = u.shift_id || "none";
    if (!grouped[shiftId]) grouped[shiftId] = [];
    grouped[shiftId].push(u);
  });

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <NeonPanel className="neon-panel-lg">
        <div style={{ width: 1300 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(200px, 260px) auto',
              alignItems: 'center',
              gap: 12,
              width: '100%',
            }}
          >
            <label htmlFor="department-select" style={{ margin: 0, padding: 0, font: 'inherit' }}>
              Select department to filter
            </label>
            <select
              id="department-select"
              value={filterDeptId}
              onChange={e => setFilterDeptId(e.target.value)}
              className="neon-input"
              style={{ minWidth: 200, font: 'inherit' }}
            >
              <option value="">All</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <CustomTooltip text="Return to reports page">
              <NeonIconButton
                variant="back"
                aria-label="Back"
                onClick={() => window.location.href = "/reports"}
                style={{ justifySelf: 'end' }}
              />
            </CustomTooltip>
          </div>
          <h2 className="neon-panel-title" style={{ marginBottom: 16 }}>
            {currentDepartment ? currentDepartment.name : "All Departments"}
          </h2>
          {loading ? (
            <div className="neon-loading">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="neon-label">No users found{filterDeptId ? " in this department." : "."}</div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 32,
                flexWrap: "wrap",
                overflowX: "auto",
                paddingBottom: 8,
              }}
            >
              {shifts.map(shift => (
                <div key={shift.id} style={{ minWidth: 140, maxWidth: 220, flex: "1 1 180px" }}>
                  <h3 style={{ margin: "8px 0 4px 0", fontWeight: 600 }}>
                    {shift.name} <span style={{ fontWeight: 400, color: '#888' }}>({grouped[shift.id]?.length || 0})</span>
                  </h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {(grouped[shift.id] || []).map(u => (
                      <li key={u.id} style={{ padding: "2px 0" }}>{`${u.first_name} ${u.last_name}`.trim()}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {/* Optionally, show users with no shift */}
              {grouped["none"] && grouped["none"].length > 0 && (
                <div key="none" style={{ minWidth: 140, maxWidth: 220, flex: "1 1 180px" }}>
                  <h3 style={{ margin: "8px 0 4px 0", fontWeight: 600 }}>
                    No Shift <span style={{ fontWeight: 400, color: '#888' }}>({grouped["none"].length})</span>
                  </h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {grouped["none"].map(u => (
                      <li key={u.id} style={{ padding: "2px 0" }}>{`${u.first_name} ${u.last_name}`.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </NeonPanel>
    </div>
  );
}
