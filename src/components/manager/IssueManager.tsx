"use client";

import React, { useState, useEffect } from "react";
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "@/components/ui/NeonIconButton";
import AssignIssue from "@/components/issues/AssignIssue";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiUserPlus } from "react-icons/fi";

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
  const [assigningIssue, setAssigningIssue] = useState<string | null>(null);
  const { user } = useUser();

  // Check if user can assign issues
  const canAssignIssues = () => {
    if (!user) return false;
    const accessLevel = user.access_level;
    // Admin (level 5) can assign any issues, Managers (level 4) can assign department issues
    return accessLevel === "5" || accessLevel === "4";
  };

  // Check if user can assign a specific issue (for managers - only their department)
  const canAssignSpecificIssue = (issue: Issue) => {
    if (!user) return false;
    const accessLevel = user.access_level;
    
    // Admin can assign any issue
    if (accessLevel === "5") return true;
    
    // Managers can only assign issues from their department
    if (accessLevel === "4") {
      // The issue should be from the same department as the user
      return true; // We'll validate this in the fetchIssues function
    }
    
    // Users cannot assign issues
    return false;
  };

  useEffect(() => {
    if (user) {
      fetchIssues();
    }
  }, [user]);

  async function fetchIssues() {
    setLoading(true);
    
    if (!user) {
      setIssues([]);
      setCompliance({ percent: 0, completed: 0, assigned: 0, total: 0 });
      setLoading(false);
      return;
    }

    const accessLevel = user.access_level;
    let query = supabase
      .from("issues")
      .select("id, title, status, priority, created_at, assigned_at, assigned_to, department_id, assigned_user:users(id, first_name, last_name)");

    // Admin (level 5) can see all issues, Managers (level 4) see only their department
    if (accessLevel === "5") {
      // Admin sees all issues - no filter needed
    } else if (accessLevel === "4") {
      // Manager sees only their department issues
      query = query.eq("department_id", user.department_id);
    } else {
      // Users (level 3 and below) cannot manage issues
      setIssues([]);
      setCompliance({ percent: 0, completed: 0, assigned: 0, total: 0 });
      setLoading(false);
      return;
    }

    const { data, error } = await query;
    
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
  function toUnassignedRow(issue: any) {
    const showAssignButton = canAssignIssues() && canAssignSpecificIssue(issue);
    
    const assignButton = showAssignButton ? (
      <NeonIconButton
        icon={<FiUserPlus />}
        variant="assign"
        title="Assign Issue"
        onClick={() => setAssigningIssue(issue.id)}
      />
    ) : "—";

    return {
      ...issue,
      actions: assignButton,
      created_at: issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "—",
    };
  }

  function toAssignedRow(issue: any) {
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
      actions: "—",
      assigned_to_name,
      assigned_at: issue.assigned_at || "—",
      total_days: totalDays,
    };
  }

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

  // Check if user has permission to view issue management
  if (!user) {
    return (
      <div style={outerStyle}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!canAssignIssues() && user.access_level !== "3") {
    return (
      <div style={outerStyle}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--text)", marginBottom: "1rem" }}>
            Access Denied: You do not have permission to manage issues.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Only managers and administrators can access issue management.
          </p>
        </div>
      </div>
    );
  }

  // For regular users (level 3), show read-only view
  const isReadOnly = user.access_level === "3";

  return (
    <div style={outerStyle}>
      {isReadOnly && (
        <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
            <strong>Read-Only View:</strong> You can view issues but cannot assign them. Contact your manager for issue assignments.
          </p>
        </div>
      )}

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
            data={issues.filter(i => !i.assigned_to && i.status !== "completed").map(toUnassignedRow)}
          />
        </div>
        {/* Column 2: Assigned (In Progress) */}
        <div style={colStyle}>
          <h3 className="neon-section-title" style={h3Style}>Assigned (In Progress)</h3>
          <NeonTable
            columns={assignedCols}
            data={issues.filter(i => i.assigned_to && i.status !== "completed").map(toAssignedRow)}
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

      {/* Assignment Modal */}
      {assigningIssue && (
        <AssignIssue
          issueId={assigningIssue}
          onClose={() => {
            setAssigningIssue(null);
            // Refresh the issues list after assignment
            fetchIssues();
          }}
        />
      )}
    </div>
  );
}
