"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiAlertCircle, FiPlus } from "react-icons/fi"; // Add Fi icon import
import NeonIconButton from "@/components/ui/NeonIconButton"; // Import NeonIconButton

interface Department {
  name: string;
}

interface Issue {
  id: number;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  departments?: Department[] | Department | null;
  department?: Department | null;
}

export default function MyIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // TODO: Replace with your actual auth logic
      const authData = { user: { user_metadata: { department_id: undefined } } };
      if (!authData?.user || !authData.user.user_metadata?.department_id) {
        setIssues([]);
        setLoading(false);
        return;
      }
      // Fetch issues for user's department
      const { data } = await supabase
        .from("issues")
        .select("id, title, priority, status, created_at, departments (name)")
        .eq("department_id", authData.user.user_metadata.department_id);
      setIssues(
        (data || []).map((issue) => ({
          id: Number(issue.id),
          title: issue.title ?? "",
          priority: issue.priority ?? "",
          status: issue.status ?? "",
          created_at: issue.created_at ?? "",
          departments: issue.departments ?? null,
          department: Array.isArray(issue?.departments)
            ? issue.departments[0]
            : (issue?.departments ?? null),
        })),
      );
      setLoading(false);
    };
    fetch();
  }, []);
  return (
    <div>
      <h1 className="dashboard-section-title">My Issues</h1>
      {loading ? (
        <div>Loading...</div>
      ) : issues.length === 0 ? (
        <div className="flex items-center">
        
          No issues found.
        </div>
      ) : (
        <ul>
          {issues.map((issue) => (
            <li key={issue.id} className="my-issues-list-item">
              <div>
                <div className="my-issues-title">{issue.title}</div>
                <div className="my-issues-meta">
                  Priority: {issue.priority} · Status: {issue.status} ·{" "}
                  {new Date(issue.created_at).toLocaleDateString()} ·
                  Department: {issue.department?.name || "N/A"}
                </div>
              </div>
              <button
                className="my-issues-view-btn"
                onClick={() =>
                  (window.location.href = `/turkus/issues/${issue.id}`)
                }
              >
                View Issue
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
