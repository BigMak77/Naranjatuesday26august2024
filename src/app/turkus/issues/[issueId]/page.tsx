"use client";
import NeonFeatureCard from "@/components/NeonFeatureCard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiAlertCircle } from "react-icons/fi";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function IssueDetailsPage() {
  const params = useParams();
  const issueId = params?.issueId as string;
  type Issue = {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    created_at: string;
    departments: { name: string } | { name: string }[] | null;
  };

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!issueId) return;
    console.log("IssueDetailsPage: issueId", issueId);
    supabase
      .from("issues")
      .select(
        "id, title, description, priority, status, created_at, departments (name)",
      )
      .eq("id", issueId)
      .single()
      .then(({ data }) => {
        console.log("IssueDetailsPage: fetched data", data);
        setIssue(data);
        setLoading(false);
      });
  }, [issueId]);

  if (loading) return <div className="neon-panel">Loading...</div>;
  if (!issue) return <div className="neon-panel">Issue not found.</div>;

  return (
    <div className="ui-dialog-overlay">
      <div className="ui-dialog-content neon-panel" style={{ maxWidth: 600 }}>
        <NeonPanel>
          <h1 className="font-title accent-text" style={{ marginBottom: 8 }}>{issue.title}</h1>
          <div className="neon-label" style={{ marginBottom: 12 }}>
            <strong>Priority:</strong> {issue.priority} &nbsp;|&nbsp;
            <strong>Status:</strong> {issue.status} &nbsp;|&nbsp;
            <strong>Created:</strong> {new Date(issue.created_at).toLocaleDateString()} &nbsp;|&nbsp;
            <strong>Department:</strong> {Array.isArray(issue.departments) ? issue.departments[0]?.name : issue.departments?.name || "N/A"}
          </div>
          <div className="neon-label" style={{ marginBottom: 16 }}>
            <strong>Description:</strong>
            <div style={{ marginTop: 4 }}>{issue.description || "No description provided."}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <NeonIconButton
              variant="close"
              title="Close"
              className="neon-btn-close"
              onClick={() => window.history.back()}
            />
            <NeonIconButton
              variant="delete"
              title="Delete"
              className="neon-btn-delete"
              onClick={() => {/* TODO: handle delete logic */}}
            />
            <NeonIconButton
              variant="assign"
              title="Assign"
              className="neon-btn-assign"
              onClick={() => {/* TODO: open assign modal or handle assign logic */}}
            />
          </div>
        </NeonPanel>
      </div>
    </div>
  );
}
