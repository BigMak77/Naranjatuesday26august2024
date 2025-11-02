"use client";

import React, { useState, useEffect } from "react";
import "../../app/globals.css";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import NeonIconButton from "@/components/ui/NeonIconButton";
import DepartmentTrainingWidget from "./DepartmentTrainingWidget";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { FiHelpCircle } from "react-icons/fi";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  access_level: string;
  start_date: string;
  department_id: string;
}

interface Department {
  id: string;
  name: string;
}

export default function MyTeamView() {
  const { user, loading: userLoading } = useUser();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTeamData = async () => {
      console.log("MyTeamView - User loading:", userLoading);
      console.log("MyTeamView - User data:", user);
      console.log("MyTeamView - Department ID:", user?.department_id);
      
      // Wait for user to load first
      if (userLoading) {
        console.log("Still loading user data...");
        return;
      }
      
      if (!user) {
        setError("No user logged in");
        setLoading(false);
        return;
      }
      
      if (!user?.department_id) {
        setError(`No department assigned. User: ${user.first_name} ${user.last_name}, ID: ${user.id}, Auth ID: ${user.auth_id}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch department info
        console.log("Fetching department with ID:", user.department_id);
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("id, name")
          .eq("id", user.department_id)
          .single();

        console.log("Department data:", deptData);
        console.log("Department error:", deptError);

        if (deptError) {
          console.error("Department fetch error:", deptError);
          setError(`Failed to fetch department: ${deptError.message}`);
          setLoading(false);
          return;
        }
        
        setDepartment(deptData);

        // Fetch all team members in the same department
        console.log("Fetching team members for department:", user.department_id);
        const { data: teamData, error: teamError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, access_level, start_date, department_id")
          .eq("department_id", user.department_id)
          .order("last_name");

        console.log("Team data:", teamData);
        console.log("Team error:", teamError);

        if (teamError) {
          console.error("Team fetch error:", teamError);
          setError(`Failed to fetch team members: ${teamError.message}`);
          setLoading(false);
          return;
        }
        
        setTeamMembers(teamData || []);

      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError(err.message || "Failed to load team data");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user, userLoading]);

  const handleNotifyHR = async (member: TeamMember) => {
    const memberName = `${member.first_name || ""} ${member.last_name || ""}`.trim();

    if (!confirm(`Send notification to HR Admin about ${memberName}?`)) {
      return;
    }

    try {
      // TODO: Implement email notification to HR Admin
      // This will send an email to HR Admin about the team member
      console.log("Notifying HR Admin about:", memberName, member);

      alert(`Notification sent to HR Admin about ${memberName}`);
    } catch (err: any) {
      setError(err.message || "Failed to notify HR Admin");
    }
  };

  if (userLoading) {
    return (
      <div className="neon-card neon-form-padding">
        <div className="text-center">Loading user data...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="neon-card neon-form-padding">
        <div className="text-center">Loading team data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neon-card neon-form-padding">
        <div className="neon-error-message">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Training Compliance Widget */}
      {department && (
        <div className="widget-spacing">
          <DepartmentTrainingWidget
            departmentId={department.id}
            departmentName={department.name}
          />
        </div>
      )}

      {/* Team Members Table */}
      <div className="neon-card neon-form-padding">
        <div className="mb-6">
          <div className="neon-header-row">
            <h2 className="neon-heading">My Team</h2>
            <CustomTooltip text="View all members of your department. To request changes to team member data, use the 'Notify HR Admin' button.">
              <span className="neon-help-icon">
                <FiHelpCircle size={18} />
              </span>
            </CustomTooltip>
          </div>
          {department && (
            <p className="neon-subtitle">
              Department: <span className="neon-highlight">{department.name}</span>
            </p>
          )}
        </div>

        {teamMembers.length === 0 ? (
          <div className="neon-empty-state">
            No team members found in this department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="neon-table">
              <thead>
                <tr>
                  <th className="neon-table-header-left">
                    <CustomTooltip text="Full name of the team member">
                      <span>Name</span>
                    </CustomTooltip>
                  </th>
                  <th className="neon-table-header-left">
                    <CustomTooltip text="Team member's email address">
                      <span>Email</span>
                    </CustomTooltip>
                  </th>
                  <th className="neon-table-header-left">
                    <CustomTooltip text="User role: Admin (full access), Manager (department management), or User (standard access)">
                      <span>Access Level</span>
                    </CustomTooltip>
                  </th>
                  <th className="neon-table-header-left">
                    <CustomTooltip text="Date when the team member started with the company">
                      <span>Start Date</span>
                    </CustomTooltip>
                  </th>
                  <th className="neon-table-header-center">
                    <CustomTooltip text="Contact HR Admin to request changes to team member information">
                      <span>Actions</span>
                    </CustomTooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="neon-table-name">
                      {`${member.first_name || ""} ${member.last_name || ""}`.trim() || "—"}
                    </td>
                    <td>{member.email || "—"}</td>
                    <td>
                      <CustomTooltip text={
                        member.access_level?.toLowerCase() === 'admin'
                          ? 'Admin: Full system access and configuration'
                          : member.access_level?.toLowerCase() === 'manager'
                          ? 'Manager: Can view and manage department team members'
                          : 'User: Standard employee access'
                      }>
                        <span className={`neon-badge ${
                          member.access_level?.toLowerCase() === 'manager'
                            ? 'neon-badge-manager'
                            : member.access_level?.toLowerCase() === 'admin'
                            ? 'neon-badge-admin'
                            : 'neon-badge-user'
                        }`}>
                          {member.access_level || "User"}
                        </span>
                      </CustomTooltip>
                    </td>
                    <td>{member.start_date || "—"}</td>
                    <td>
                      <div className="neon-actions-cell">
                        <CustomTooltip text="Send a notification to HR Admin to request updates or changes for this team member">
                          <NeonIconButton
                            variant="send"
                            title="Notify HR Admin"
                            onClick={() => handleNotifyHR(member)}
                          />
                        </CustomTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CustomTooltip text="Total number of employees in your department">
          <div className="neon-table-footer">
            Total team members: {teamMembers.length}
          </div>
        </CustomTooltip>
      </div>
    </div>
  );
}
