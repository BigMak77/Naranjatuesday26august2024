"use client";

import React, { useState, useEffect } from "react";
import NeonTable from "@/components/NeonTable";
import { supabase } from "@/lib/supabase-client";

type Issue = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  created_at?: string;
  assigned_at?: string | null;
  assigned_to?: string | null;
  assigned_user?: { id: string; first_name?: string; last_name?: string }[] | null;
};

export default function IssueManager() {
  // --- Fetch issues from Supabase ---
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState<{ percent: number; completed: number; assigned: number; total: number }>({ percent: 0, completed: 0, assigned: 0, total: 0 });

  useEffect(() => {
    async function fetchIssues() {
      setLoading(true);
      // Get current user's department
      const userRes = await supabase.auth.getUser();
      const user = userRes.data?.user;
      let deptId: string | undefined = undefined;
      if (user) {
        // Fetch user profile to get department_id
        const { data: userProfile } = await supabase
          .from("users")
          .select("department_id")
          .eq("id", user.id)
          .single();
        deptId = userProfile?.department_id;
      }
      if (!deptId) {
        setIssues([]);
        setCompliance({ percent: 0, completed: 0, assigned: 0, total: 0 });
        setLoading(false);
        return;
      }
      // Fetch issues for department only, including assigned user info
      const { data, error } = await supabase
        .from("issues")
        .select("id, title, status, priority, created_at, assigned_at, assigned_to, department_id, assigned_user:users(id, first_name, last_name)")
        .eq("department_id", deptId);
      if (!error && Array.isArray(data)) {
        setIssues(data as Issue[]);
        // --- Compliance calculation ---
        const total = data.length;
        const completed = data.filter(i => i.status && i.status.toLowerCase() === "completed").length;
        const assigned = data.filter(i => i.assigned_to && (!i.status || i.status.toLowerCase() !== "completed")).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        setCompliance({ percent, completed, assigned, total });
      }
      setLoading(false);
    }
    fetchIssues();
  }, []);

  // Column definitions
  const unassignedCols = [
    { header: "Title", accessor: "title" },
    { header: "Priority", accessor: "priority" },
    { header: "Created", accessor: "created_at" },
    { header: "Actions", accessor: "actions" },
  ];

  const assignedCols = [
    { header: "Title", accessor: "title" },
    { header: "Assigned To", accessor: "assigned_to_name" },
    { header: "Total Days", accessor: "total_days" },
    { header: "Actions", accessor: "actions" },
  ];

  // Row mapper
  function toRow(issue: any) {
    let totalDays = "—";
    if (issue.assigned_at) {
      const ms = new Date(issue.assigned_at).getTime();
      if (Number.isFinite(ms)) {
        totalDays = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24)).toString();
      }
    }
    let assigned_to_name = "—";
    // Handle both array and object for assigned_user
    if (Array.isArray(issue.assigned_user) && issue.assigned_user.length > 0) {
      const userObj = issue.assigned_user[0];
      assigned_to_name = [userObj.first_name, userObj.last_name].filter(Boolean).join(" ") || "—";
    } else if (issue.assigned_user && typeof issue.assigned_user === "object") {
      assigned_to_name = [issue.assigned_user.first_name, issue.assigned_user.last_name].filter(Boolean).join(" ") || "—";
    } else if (issue.assigned_to) {
      assigned_to_name = issue.assigned_to;
    }
    return {
      ...issue,
      actions: "...",
      assigned_to_name,
      assigned_at: issue.assigned_at || "—",
      total_days: totalDays,
    };
  }

  // --- Layout (no per-table containers/panels) ---
  const outerStyle: React.CSSProperties = { width: "100%", overflowX: "auto", padding: 0, margin: 0 };
  const stripStyle: React.CSSProperties = {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "minmax(320px, 1fr)", // reduced min width for each column
    gap: "16px",
    alignItems: "start",
    minHeight: 320,
    background: "none",
    border: "none",
    boxShadow: "none",
    padding: 0,
    margin: 0,
  };
  const colStyle: React.CSSProperties = { minWidth: 320, background: "none", border: "none", boxShadow: "none", padding: 0, margin: 0 };
  const h3Style: React.CSSProperties = { margin: "0 0 8px 0" };

  return (
    <div style={outerStyle}>
      {/* Compliance summary */}
      <div style={{ marginBottom: 16, fontWeight: 500 }}>
        <span>Compliance: <span style={{ color: compliance.percent >= 80 ? '#2ecc40' : '#ff851b' }}>{compliance.percent}%</span></span>
        <span style={{ marginLeft: 24 }}>Completed: {compliance.completed}</span>
        <span style={{ marginLeft: 24 }}>Assigned (In Progress): {compliance.assigned}</span>
        <span style={{ marginLeft: 24 }}>Total: {compliance.total}</span>
      </div>
      <div style={stripStyle}>
        {/* Column 1: Unassigned */}
        <div style={colStyle}>
          <h3 className="neon-section-title" style={h3Style}>Unassigned</h3>
          <NeonTable
            columns={unassignedCols}
            data={issues.filter(i => !i.assigned_to && i.status !== "completed").map(toRow)}
          />
        </div>
        {/* Column 2: Assigned (In Progress) */}
        <div style={colStyle}>
          <h3 className="neon-section-title" style={h3Style}>Assigned (In Progress)</h3>
          <NeonTable
            columns={assignedCols}
            data={issues.filter(i => i.assigned_to && i.status !== "completed").map(toRow)}
          />
        </div>
        {/* Column 3: Completed list (no box) */}
        <div style={colStyle}>
          <h3 className="neon-section-title" style={h3Style}>Completed</h3>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {issues.filter(i => i.status === "completed").map(i => (
              <li key={i.id} style={{ lineHeight: 1.6 }}>{i.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
