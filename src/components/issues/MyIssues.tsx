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
    <div className="w-full max-w-full mx-auto lg:max-w-4xl">
      <NeonPanel className="neon-form-padding">
        <h2 className="neon-form-title">My Issues</h2>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem'
          }}>Loading...</div>
        ) : issues.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem'
          }}>
            No issues found.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {issues.map((issue) => (
              <li key={issue.id} className="my-issues-list-item" style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1rem',
                marginBottom: '0.5rem',
                background: 'rgba(64, 224, 208, 0.05)',
                border: '1px solid rgba(64, 224, 208, 0.2)',
                borderRadius: '8px',
                flexDirection: 'row'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="my-issues-title" style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    wordWrap: 'break-word'
                  }}>{issue.title}</div>
                  <div className="my-issues-meta" style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}>
                    Priority: {issue.priority} · Status: {issue.status} ·{" "}
                    {new Date(issue.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <NeonIconButton
                    variant="view"
                    title="View Issue"
                    onClick={() =>
                      (window.location.href = `/turkus/issues/${issue.id}`)
                    }
                  >
                    View
                  </NeonIconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </NeonPanel>
      <style>{`
        @media (max-width: 640px) {
          .my-issues-list-item {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .my-issues-title {
            font-size: 0.9rem !important;
          }
          .my-issues-meta {
            font-size: 0.8rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .my-issues-title {
            font-size: 0.85rem !important;
          }
          .my-issues-meta {
            font-size: 0.75rem !important;
          }
          .my-issues-list-item {
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
