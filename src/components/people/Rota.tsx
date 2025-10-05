// Rota.tsx - Table of users grouped by department and shift, with filters
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id?: string;
  shift_id?: string;
}

export default function Rota() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>("all");
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
        supabase.from("shift_patterns").select("id, name")
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

  // Filter users by selected shift
  const filteredUsers = selectedShift === "all"
    ? users
    : users.filter(u => u.shift_id === selectedShift);

  // Group filtered users by department
  const grouped: Record<string, User[]> = {};
  filteredUsers.forEach(u => {
    const deptId = u.department_id || "none";
    if (!grouped[deptId]) grouped[deptId] = [];
    grouped[deptId].push(u);
  });

  return (
    <div>
      <h2 style={{
        fontWeight: 700,
        fontSize: 24,
        margin: '0 0 12px 0',
        borderBottom: '3px solid #fa7a20',
        paddingBottom: 4,
        width: '100%',
        display: 'block',
      }}>
        Staff Rota
      </h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Shift:
          <select
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
            className="neon-input"
            style={{ marginLeft: 8 }}
          >
            <option value="all">All</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <div className="neon-loading">Loading users…</div>
      ) : filteredUsers.length === 0 ? (
        <div className="neon-label">No users found.</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}>
          {Object.entries(grouped)
            .sort(([deptIdA], [deptIdB]) => {
              const nameA = deptIdA === "none"
                ? "No Department"
                : departments.find(d => d.id === deptIdA)?.name || "Unknown Department";
              const nameB = deptIdB === "none"
                ? "No Department"
                : departments.find(d => d.id === deptIdB)?.name || "Unknown Department";
              return nameA.localeCompare(nameB);
            })
            .map(([deptId, deptUsers]) => {
              const deptName =
                deptId === "none"
                  ? "No Department"
                  : departments.find(d => d.id === deptId)?.name || "Unknown Department";
              // Prepare data for NeonTable
              const tableData = deptUsers.map(u => ({
                id: u.id,
                name: `${u.first_name} ${u.last_name}`.trim(),
                shift: shifts.find(s => s.id === u.shift_id)?.name || "-",
              }));
              return (
                <div key={deptId} style={{ marginBottom: 0 }}>
                  <h3 style={{ margin: "8px 0 4px 0", fontWeight: 600 }}>
                    {deptName} <span style={{ fontWeight: 400, color: '#888', fontSize: 14 }}>({deptUsers.length})</span>
                  </h3>
                  <NeonTable
                    columns={[
                      { header: "Name", accessor: "name" },
                      { header: "Shift", accessor: "shift" },
                    ]}
                    data={tableData}
                    // Reduce cell padding via style override
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}