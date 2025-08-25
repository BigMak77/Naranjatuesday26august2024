"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiUserPlus } from "react-icons/fi"; // Add Fi icon import
import NeonTable from "@/components/NeonTable";

interface Assignment {
  id: string;
  title: string;
  assigned_to: string;
  assigned_at: string;
  users?: {
    auth_id: string;
    first_name: string;
    last_name: string;
  };
}

interface RawAssignment {
  id: string;
  title: string;
  assigned_to: string;
  assigned_at: string;
  users:
    | { auth_id: string; first_name: string; last_name: string }[]
    | { auth_id: string; first_name: string; last_name: string };
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

      const { data, error } = await supabase
        .from("issues")
        .select(
          `
          id,
          title,
          assigned_to,
          assigned_at,
          users:assigned_to (
            auth_id,
            first_name,
            last_name
          )
        `,
        )
        .eq("department_id", user.department_id)
        .not("assigned_to", "is", null)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error loading assignments:", error);
        setError("Failed to load assignments.");
      } else {
        const mapped = (data || []).map((a: RawAssignment) => ({
          id: a.id,
          title: a.title,
          assigned_to: a.assigned_to,
          assigned_at: a.assigned_at,
          users: Array.isArray(a.users) ? a.users[0] : a.users,
        }));
        setAssignments(mapped);
      }

      setLoading(false);
    };

    fetchAssignments();

    // Add a refresh interval
    const interval = setInterval(fetchAssignments, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Removed unused handleAssignUser function

  if (!user) return null;

  return (
    <>
      <h2 className="neon-section-title mb-4 flex items-center gap-2">
        <FiUserPlus /> Issue Assignments
      </h2>

      {loading ? (
        <p className="neon-info">Loading...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : assignments.length === 0 ? (
        <p className="neon-info">
          No assigned issues found for your department.
        </p>
      ) : (
        <NeonTable
          columns={[
            { header: "Issue", accessor: "issue" },
            { header: "Assigned To", accessor: "assigned_to" },
            { header: "Assigned At", accessor: "assigned_at" },
          ]}
          data={assignments.map((a) => ({
            issue: a.title,
            assigned_to: a.users
              ? `${a.users.first_name ?? ""} ${a.users.last_name ?? ""}`.trim() ||
                a.assigned_to
              : a.assigned_to,
            assigned_at: a.assigned_at
              ? new Date(a.assigned_at).toLocaleDateString("en-GB")
              : "",
          }))}
        />
      )}
    </>
  );
}
