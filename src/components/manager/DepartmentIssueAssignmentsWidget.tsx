"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiUserPlus } from "react-icons/fi";
import NeonTable from "@/components/NeonTable";
import AccessControlWrapper from "@/components/AccessControlWrapper";

interface Assignment {
  id: string;
  title: string;
  created_at: string;
}

export default function DepartmentIssueAssignmentsWidget() {
  const { user } = useUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);

      // Only fetch unassigned issues for the department
      const { data, error } = await supabase
        .from("issues")
        .select("id, title, created_at")
        .eq("department_id", user.department_id)
        .is("assigned_to", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading unassigned issues:", error);
        setError("Failed to load unassigned issues.");
      } else {
        setAssignments(data || []);
      }
      setLoading(false);
    };

    fetchAssignments();

    const interval = setInterval(fetchAssignments, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <AccessControlWrapper requiredRoles={["Manager", "Admin"]} hideIfNoAccess={true}>
      <h2 className="neon-section-title mb-4 flex items-center gap-2">
        <FiUserPlus /> Unassigned Department Issues
      </h2>
      {loading ? (
        <p className="neon-info">Loading...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : assignments.length === 0 ? (
        <p className="neon-info">
          No unassigned issues found for your department.
        </p>
      ) : (
        <NeonTable
          columns={[
            { header: "Title", accessor: "title" },
            { header: "Created At", accessor: "created_at", render: (_v, row) => typeof row.created_at === "string" ? new Date(row.created_at).toLocaleDateString("en-GB") : "—" },
          ]}
          data={assignments.map(a => ({ title: a.title, created_at: a.created_at }))}
        />
      )}
    </AccessControlWrapper>
  );
}
