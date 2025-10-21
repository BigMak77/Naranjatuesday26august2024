"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiEdit, FiTrash2, FiUserPlus } from "react-icons/fi";

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
        setError(`No department assigned. User: ${user.first_name} ${user.last_name}, ID: ${user.id}`);
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
          .order("first_name");

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
    <div className="neon-card neon-form-padding">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="neon-heading">My Team</h2>
          {department && (
            <p className="text-gray-400 mt-1">
              Department: <span className="text-white">{department.name}</span>
            </p>
          )}
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No team members found in this department.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="neon-table w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Email</th>
                <th className="text-left">Access Level</th>
                <th className="text-left">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">
                    {`${member.first_name || ""} ${member.last_name || ""}`.trim() || "—"}
                  </td>
                  <td>{member.email || "—"}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      member.access_level?.toLowerCase() === 'manager' 
                        ? 'bg-orange-500 text-white'
                        : member.access_level?.toLowerCase() === 'admin'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-600 text-gray-200'
                    }`}>
                      {member.access_level || "User"}
                    </span>
                  </td>
                  <td>{member.start_date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-400">
        Total team members: {teamMembers.length}
      </div>
    </div>
  );
}
