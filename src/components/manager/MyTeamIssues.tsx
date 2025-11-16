"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import NeonPanel from "@/components/NeonPanel";
import TextIconButton from "@/components/ui/TextIconButtons";
import AssignIssue from "@/components/issues/AssignIssue";
import IssuesWidget from "@/components/issues/IssuesWidget";
import { FiPlus, FiClock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  category: string;
  department_id: string;
  assigned_to: string | null;
  reported_by: string;
  created_at: string;
  assigned_user?: {
    first_name: string;
    last_name: string;
  } | null;
  reported_by_user?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface TeamMember {
  auth_id: string;
  first_name: string;
  last_name: string;
  role_id: string;
}

export default function MyTeamIssues() {
  const { user } = useUser();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningIssue, setAssigningIssue] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned" | "my-team">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !user.department_id) return;

    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch team members from manager's department
        const { data: teamData, error: teamError } = await supabase
          .from("users")
          .select("auth_id, first_name, last_name, role_id")
          .eq("department_id", user.department_id);

        if (teamError) {
          console.error("Error fetching team members:", teamError);
        } else {
          setTeamMembers(teamData || []);
        }

        // Fetch issues for the department
        const { data: issuesData, error: issuesError } = await supabase
          .from("issues")
          .select(`
            id,
            title,
            description,
            priority,
            status,
            category,
            department_id,
            assigned_to,
            reported_by,
            created_at
          `)
          .eq("department_id", user.department_id)
          .order("created_at", { ascending: false });

        if (issuesError) {
          console.error("Error fetching issues:", issuesError);
        } else {
          // Fetch user details for assigned and reported by users
          const issuesWithUserDetails = await Promise.all(
            (issuesData || []).map(async (issue: any) => {
              let assigned_user = null;
              let reported_by_user = null;

              // Fetch assigned user details if assigned_to exists
              if (issue.assigned_to) {
                const { data: assignedUserData } = await supabase
                  .from("users")
                  .select("first_name, last_name")
                  .eq("id", issue.assigned_to)
                  .single();
                assigned_user = assignedUserData;
              }

              // Fetch reported by user details if reported_by exists
              if (issue.reported_by) {
                const { data: reportedByUserData } = await supabase
                  .from("users")
                  .select("first_name, last_name")
                  .eq("auth_id", issue.reported_by)
                  .single();
                reported_by_user = reportedByUserData;
              }

              return {
                ...issue,
                assigned_user,
                reported_by_user,
              };
            })
          );

          setIssues(issuesWithUserDetails);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredIssues = issues.filter((issue) => {
    // Filter by assignment status
    if (filter === "assigned" && !issue.assigned_to) return false;
    if (filter === "unassigned" && issue.assigned_to) return false;
    if (filter === "my-team" && !teamMembers.some(member => member.auth_id === issue.assigned_to)) return false;

    // Filter by status
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;

    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "#e74c3c";
      case "High": return "#e67e22";
      case "Medium": return "#f39c12";
      case "Low": return "#27ae60";
      default: return "#95a5a6";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "#e74c3c";
      case "In Progress": return "#f39c12";
      case "Resolved": return "#27ae60";
      case "Closed": return "#95a5a6";
      default: return "#95a5a6";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open": return <FiAlertCircle />;
      case "In Progress": return <FiClock />;
      case "Resolved": return <FiCheckCircle />;
      case "Closed": return <FiCheckCircle />;
      default: return <FiAlertCircle />;
    }
  };

  if (loading) {
    return (
      <NeonPanel>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading team issues...</p>
        </div>
      </NeonPanel>
    );
  }

  return (
    <NeonPanel>
      {/* Department Issues Widget */}
      <div style={{ marginBottom: 24 }}>
        <h3 className="neon-heading" style={{ fontSize: "1.2rem", marginBottom: 16 }}>Department Issues Overview</h3>
        <IssuesWidget />
      </div>
      
      <hr className="issues-widget-separator" style={{ margin: "24px 0" }} />
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="neon-heading">My Team Issues</h2>
          <TextIconButton
            icon={<FiPlus />}
            variant="add"
            label="Raise New Issue"
            onClick={() => window.location.href = "/turkus/issues/add"}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 14, color: "#ccc" }}>Assignment:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="neon-input"
              style={{ minWidth: 120 }}
            >
              <option value="all">All Issues</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="my-team">My Team Only</option>
            </select>
          </div>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 14, color: "#ccc" }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neon-input"
              style={{ minWidth: 120 }}
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 12px", background: "#2a2a2a", borderRadius: 4, fontSize: 12 }}>
            <strong>Total Issues:</strong> {filteredIssues.length}
          </div>
          <div style={{ padding: "8px 12px", background: "#2a2a2a", borderRadius: 4, fontSize: 12 }}>
            <strong>Assigned to Team:</strong> {issues.filter(i => teamMembers.some(m => m.auth_id === i.assigned_to)).length}
          </div>
          <div style={{ padding: "8px 12px", background: "#2a2a2a", borderRadius: 4, fontSize: 12 }}>
            <strong>Unassigned:</strong> {issues.filter(i => !i.assigned_to).length}
          </div>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#ccc" }}>
          {filter === "my-team" 
            ? "No issues assigned to your team members."
            : "No issues found matching the current filters."
          }
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                border: "1px solid #444",
                borderRadius: 8,
                padding: 16,
                background: "#1a1a1a",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, marginBottom: 4, color: "#fff", fontSize: 16 }}>
                    {issue.title}
                  </h3>
                  <p style={{ margin: 0, marginBottom: 8, color: "#ccc", fontSize: 14, lineHeight: 1.4 }}>
                    {issue.description}
                  </p>
                </div>
                
                <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                  <TextIconButton
                    variant="assign"
                    label="Assign Issue"
                    onClick={() => setAssigningIssue(issue.id)}
                  />
                  <TextIconButton
                    variant="view"
                    label="View Details"
                    onClick={() => window.location.href = `/turkus/issues/${issue.id}`}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {getStatusIcon(issue.status)}
                  <span style={{ color: getStatusColor(issue.status), fontWeight: "bold" }}>
                    {issue.status}
                  </span>
                </div>
                
                <div style={{ 
                  padding: "2px 8px", 
                  borderRadius: 4, 
                  background: getPriorityColor(issue.priority),
                  color: "#fff",
                  fontWeight: "bold"
                }}>
                  {issue.priority}
                </div>
                
                <div style={{ color: "#ccc" }}>
                  <strong>Category:</strong> {issue.category}
                </div>
                
                {issue.assigned_user ? (
                  <div style={{ color: "#27ae60" }}>
                    <strong>Assigned to:</strong> {issue.assigned_user.first_name} {issue.assigned_user.last_name}
                  </div>
                ) : (
                  <div style={{ color: "#e74c3c" }}>
                    <strong>Unassigned</strong>
                  </div>
                )}
                
                <div style={{ color: "#ccc" }}>
                  <strong>Reported by:</strong> {issue.reported_by_user 
                    ? `${issue.reported_by_user.first_name} ${issue.reported_by_user.last_name}`
                    : "Unknown"
                  }
                </div>
                
                <div style={{ color: "#999" }}>
                  {new Date(issue.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {assigningIssue && (
        <AssignIssue
          issueId={assigningIssue}
          onClose={() => {
            setAssigningIssue(null);
            // Refresh the issues list after assignment
            window.location.reload();
          }}
        />
      )}
    </NeonPanel>
  );
}
