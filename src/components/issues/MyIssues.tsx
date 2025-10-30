"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";

interface Issue {
  id: number;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
}

export default function MyIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchMyAssignedIssues = async () => {
      if (!user?.id) {
        setIssues([]);
        setLoading(false);
        return;
      }
      
      // Fetch issues assigned to the current user
      const { data } = await supabase
        .from("issues")
        .select("id, title, priority, status, created_at, assigned_to")
        .eq("assigned_to", user.id);
        
      setIssues(
        (data || []).map((issue) => ({
          id: Number(issue.id),
          title: issue.title ?? "",
          priority: issue.priority ?? "",
          status: issue.status ?? "",
          created_at: issue.created_at ?? "",
          assigned_to: issue.assigned_to ?? null,
        })),
      );
      setLoading(false);
    };
    
    fetchMyAssignedIssues();
  }, [user]);
  return (
    <NeonPanel className="neon-form-padding max-w-2xl mx-auto">
      <h2 className="neon-form-title">My Issues</h2>
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
                  {new Date(issue.created_at).toLocaleDateString()}
                </div>
              </div>
              <NeonIconButton
                variant="view"
                title="View Issue"
                onClick={() =>
                  (window.location.href = `/turkus/issues/${issue.id}`)
                }
              >
                View
              </NeonIconButton>
            </li>
          ))}
        </ul>
      )}
    </NeonPanel>
  );
}
