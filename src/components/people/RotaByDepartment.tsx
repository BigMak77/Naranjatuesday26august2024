// RotaByDepartment.tsx - Table of users grouped by shift within a single department
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

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
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Get current department
  const currentDepartment = departments.find(d => d.id === departmentId) || null;

  // Filter users by department - only show data when a department is selected
  const filteredUsers = departmentId
    ? users.filter(u => u.department_id === departmentId)
    : [];

  // Group users by shift
  const grouped: Record<string, User[]> = {};
  filteredUsers.forEach(u => {
    const shiftId = u.shift_id || "none";
    if (!grouped[shiftId]) grouped[shiftId] = [];
    grouped[shiftId].push(u);
  });

  return (
    <div>
      {!departmentId ? (
        <div className="neon-label">Please select a department to view shifts.</div>
      ) : (
        <>
          {loading ? (
            <div className="neon-loading">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="neon-label">No users found in this department.</div>
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
        </>
      )}
    </div>
  );
}
