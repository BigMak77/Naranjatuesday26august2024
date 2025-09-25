"use client";

import React, { useEffect, useState } from "react";
import { getChildDepartments } from "@/lib/getChildDepartments";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase-client";
import { FiUsers, FiClipboard, FiAlertCircle, FiActivity } from "react-icons/fi";
import NeonFeatureCard from "@/components/NeonFeatureCard";
import UserTrainingDashboard from "@/components/training/UserTrainingDashboard";
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "@/components/ui/NeonIconButton";
import MyTasks from "@/components/tasks/MyTasks";
import IssueManager from "@/components/manager/IssueManager";

type AppUser = {
  id: string;
  first_name: string;
  last_name: string;
  department?: { name?: string } | null;
  role?: { title?: string } | null;
  access_level?: string | number;
  auth_id?: string;
  department_id?: string;
};

type Issue = {
  id: string;
  title: string;
  status: string;
  created_at?: string;
  assigned_to?: string | null;
};

export default function ManagerDashboard() {
  const { user } = useUser() as { user?: AppUser };
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; status: string; due_date?: string }>>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [teamCompliance, setTeamCompliance] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);

  const allowed =
    !!user &&
    typeof (user as any).access_level !== "undefined" &&
    ["manager", "admin"].includes(String(user?.access_level).toLowerCase());

  useEffect(() => {
    if (!allowed || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Team
        let visibleDepartments: string[] = [];
        if (user.department_id) {
          visibleDepartments = await getChildDepartments(user.department_id);
        }
        const { data: teamData, error: teamError } = await supabase
          .from("users")
          .select(
            "id, first_name, last_name, department:departments(name), roles!users_role_id_fkey(title), access_level"
          )
          .in("department_id", visibleDepartments)
          .gt("access_level", user.access_level as any);

        if (teamError) throw teamError;

        setUsers(
          (teamData || []).map((u: any) => ({
            ...u,
            department: Array.isArray(u.department) ? u.department[0] : u.department,
            role: Array.isArray(u.roles) ? u.roles[0] : u.roles,
          }))
        );

        // Tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("task")
          .select("id, title, status, due_date")
          .eq("assigned_to", user.auth_id);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Issues
        const { data: issuesData, error: issuesError } = await supabase
          .from("issues")
          .select("id, title, status, created_at, assigned_to")
          .eq("assigned_to", user.auth_id);
        if (issuesError) throw issuesError;
        setIssues(issuesData || []);
      } catch (err) {
        console.error("ManagerDashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowed, user]);

  useEffect(() => {
    if (!allowed || !user?.department_id) return;

    const fetchTeamCompliance = async () => {
      try {
        const { data: team, error: teamError } = await supabase
          .from("users")
          .select("id, first_name, last_name")
          .eq("department_id", user.department_id);

        if (teamError || !team) {
          setTeamCompliance([]);
          return;
        }

        const rows = await Promise.all(
          team.map(async (member: any) => {
            const { data: assignments, error: assignError } = await supabase
              .from("user_assignments")
              .select("completed_at")
              .eq("auth_id", member.id);

            if (assignError || !assignments) {
              return {
                name: `${member.first_name} ${member.last_name}`,
                completed: 0,
                incomplete: 0,
                compliance: "0%",
              };
            }

            const total = assignments.length;
            const completed = assignments.filter((a: any) => !!a.completed_at).length;
            const incomplete = total - completed;
            const compliance = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";

            return { name: `${member.first_name} ${member.last_name}`, completed, incomplete, compliance };
          })
        );

        setTeamCompliance(rows);
      } catch {
        setTeamCompliance([]);
      }
    };

    fetchTeamCompliance();
  }, [allowed, user]);

  // Loading guards
  if (typeof user === "undefined") {
    return (
      <main className="after-hero">
        <div className="global-content">
          <p className="manager-dashboard-loading">Loading user...</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="after-hero">
        <div className="global-content">
          <p className="manager-dashboard-error">Access denied.</p>
        </div>
      </main>
    );
  }

  // Styles (no Tailwind)
  const rowStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 24 };
  const sectionHeaderStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
  const spacerStyle: React.CSSProperties = { height: 8 };

  return (
    <main className="after-hero">
      <div className="global-content manager-dashboard-cards" style={rowStyle}>
        {loading ? (
          <p className="manager-dashboard-loading">Loading...</p>
        ) : error ? (
          <p className="manager-dashboard-error">{error}</p>
        ) : (
          <>
            {/* Team */}
            <NeonFeatureCard title="My Team" icon={<FiUsers />} text="Your direct reports and team members.">
              <NeonTable
                columns={[
                  { header: "Name", accessor: "name" },
                  { header: "Department", accessor: "department" },
                  { header: "Role", accessor: "role" },
                ]}
                data={users.map((u) => ({
                  name: `${u.first_name} ${u.last_name}`,
                  department: u.department?.name || "—",
                  role: u.role?.title || "—",
                }))}
              />
            </NeonFeatureCard>

            {/* Compliance */}
            <NeonFeatureCard title="My Team Compliance" icon={<FiUsers />} text="Training completion status.">
              {teamCompliance.length === 0 ? (
                <p>No team members found.</p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    <div>
                      <strong>Team Members:</strong> {teamCompliance.length}
                    </div>
                    <div>
                      <strong>Total Completed:</strong>{" "}
                      {teamCompliance.reduce((sum, r) => sum + (r.completed || 0), 0)}
                    </div>
                    <div>
                      <strong>Total Incomplete:</strong>{" "}
                      {teamCompliance.reduce((sum, r) => sum + (r.incomplete || 0), 0)}
                    </div>
                    <div>
                      <strong>Average Compliance:</strong>{" "}
                      {teamCompliance.length > 0
                        ? `${Math.round(
                            teamCompliance.reduce((sum, r) => sum + parseInt(r.compliance, 10), 0) /
                              teamCompliance.length
                          )}%`
                        : "0%"}
                    </div>
                  </div>
                  <NeonIconButton
                    as="button"
                    variant="view"
                    title="View Details"
                    className="neon-btn-view"
                    style={{ marginLeft: 8 }}
                    onClick={() => setShowComplianceDialog(true)}
                  />
                </div>
              )}

              {showComplianceDialog && (
                <div className="neon-modal-overlay" onClick={() => setShowComplianceDialog(false)}>
                  <div
                    className="neon-modal"
                    style={{ minWidth: 400, maxWidth: 700 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="neon-modal-header">
                      <span className="neon-modal-title">Team Compliance Details</span>
                      <button className="neon-btn neon-btn-close" onClick={() => setShowComplianceDialog(false)}>
                        &times;
                      </button>
                    </div>
                    <div className="neon-modal-content">
                      <NeonTable
                        columns={[
                          { header: "Name", accessor: "name" },
                          { header: "Completed", accessor: "completed" },
                          { header: "Incomplete", accessor: "incomplete" },
                          { header: "Compliance %", accessor: "compliance" },
                        ]}
                        data={teamCompliance}
                      />
                    </div>
                  </div>
                </div>
              )}
            </NeonFeatureCard>

            {/* Tasks */}
            <NeonFeatureCard title="My Tasks" icon={<FiClipboard />} text="Your assigned tasks and deadlines.">
              <MyTasks />
            </NeonFeatureCard>

            {/* Issues */}
            <NeonFeatureCard title="My Issues" icon={<FiAlertCircle />} text="Your open issues and tickets.">
              {/* IMPORTANT: keep this wrapper simple; no max-width constraints */}
              <div style={{ width: "100%", overflowX: "auto" }}>
                <IssueManager />
              </div>
            </NeonFeatureCard>

            {/* Training */}
            <NeonFeatureCard title="My Training" icon={<FiActivity />} text="Your training modules.">
              <UserTrainingDashboard authId={user.auth_id as string} completedDropdown />
            </NeonFeatureCard>

            <div style={spacerStyle} />
          </>
        )}
      </div>
    </main>
  );
}
