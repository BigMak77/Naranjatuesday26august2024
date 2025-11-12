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
    const accessLevel = user.access_level?.toLowerCase();
    // Super Admin, Admin, Dept. Manager, Manager, HR Admin, H&S Admin can assign issues
    return (
      accessLevel === "super admin" ||
      accessLevel === "admin" ||
      accessLevel === "dept. manager" ||
      accessLevel === "manager" ||
      accessLevel === "hr admin" ||
      accessLevel === "h&s admin" ||
      // Legacy numeric levels
      accessLevel === "5" ||
      accessLevel === "4"
    );
  };

  // Check if user can assign a specific issue (for managers - only their department)
  const canAssignSpecificIssue = (issue: Issue) => {
    if (!user) return false;
    const accessLevel = user.access_level?.toLowerCase();

    // Super Admin and Admin can assign any issue
    if (accessLevel === "super admin" || accessLevel === "admin" || accessLevel === "5") {
      return true;
    }

    // Dept. Manager, Manager, HR Admin, H&S Admin can assign department issues
    if (
      accessLevel === "dept. manager" ||
      accessLevel === "manager" ||
      accessLevel === "hr admin" ||
      accessLevel === "h&s admin" ||
      accessLevel === "4"
    ) {
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

    const accessLevel = user.access_level?.toLowerCase();
    let query = supabase
      .from("issues")
      .select("id, title, status, priority, created_at, assigned_at, assigned_to, department_id, assigned_user:users(id, first_name, last_name)");

    // Super Admin and Admin can see all issues
    if (accessLevel === "super admin" || accessLevel === "admin" || accessLevel === "5") {
      // Admin sees all issues - no filter needed
    } else if (
      accessLevel === "dept. manager" ||
      accessLevel === "manager" ||
      accessLevel === "hr admin" ||
      accessLevel === "h&s admin" ||
      accessLevel === "4"
    ) {
      // Manager/HR/H&S sees only their department issues
      query = query.eq("department_id", user.department_id);
    } else {
      // Users (basic level) cannot manage issues
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

  // Check if user has permission to view issue management
  if (!user) {
    return (
      <div className="neon-issue-manager-container">
        <div className="neon-loading-center">
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  // Allow users with level 3 (or "User") to view read-only
  const accessLevel = user?.access_level?.toLowerCase();
  const canViewReadOnly = accessLevel === "3" || accessLevel === "user";

  if (!canAssignIssues() && !canViewReadOnly) {
    return (
      <div className="neon-issue-manager-container">
        <div className="neon-access-denied">
          <p className="neon-access-denied-title">
            Access Denied: You do not have permission to manage issues.
          </p>
          <p className="neon-access-denied-subtitle">
            Only managers and administrators can access issue management.
          </p>
        </div>
      </div>
    );
  }

  // For regular users (level 3), show read-only view
  const isReadOnly = user.access_level === "3";

  return (
    <div className="neon-issue-manager-container">
      {isReadOnly && (
        <div className="neon-readonly-notice">
          <p className="neon-readonly-text">
            <strong>Read-Only View:</strong> You can view issues but cannot assign them. Contact your manager for issue assignments.
          </p>
        </div>
      )}

      {/* Compliance summary */}
      <div className="neon-compliance-summary">
        <span>Compliance: <span className={`neon-compliance-percent ${compliance.percent >= 80 ? 'neon-compliance-good' : 'neon-compliance-warning'}`}>{compliance.percent}%</span></span>
        <span className="neon-compliance-stat">Completed: {compliance.completed}</span>
        <span className="neon-compliance-stat">Assigned (In Progress): {compliance.assigned}</span>
        <span className="neon-compliance-stat">Total: {compliance.total}</span>
      </div>
      <div className="neon-issue-grid">
        {/* Column 1: Unassigned */}
        <div className="neon-issue-column">
          <h3 className="neon-section-title">Unassigned</h3>
          <NeonTable
            columns={unassignedCols}
            data={issues.filter(i => !i.assigned_to && i.status !== "completed").map(toUnassignedRow)}
          />
        </div>
        {/* Column 2: Assigned (In Progress) */}
        <div className="neon-issue-column">
          <h3 className="neon-section-title">Assigned (In Progress)</h3>
          <NeonTable
            columns={assignedCols}
            data={issues.filter(i => i.assigned_to && i.status !== "completed").map(toAssignedRow)}
          />
        </div>
        {/* Column 3: Completed list (no box) */}
        <div className="neon-issue-column">
          <h3 className="neon-section-title">Completed</h3>
          <ul className="neon-completed-list">
            {issues.filter(i => i.status === "completed").map(i => (
              <li key={i.id} className="neon-completed-item">{i.title}</li>
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
