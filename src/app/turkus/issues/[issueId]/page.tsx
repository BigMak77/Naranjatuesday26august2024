"use client";
import NeonFeatureCard from "@/components/NeonFeatureCard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import AssignIssue from "../components/AssignIssue";
import { FiAlertCircle } from "react-icons/fi";

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
    supabase
      .from("issues")
      .select(
        "id, title, description, priority, status, created_at, departments (name)",
      )
      .eq("id", issueId)
      .single()
      .then(({ data }) => {
        setIssue(data);
        setLoading(false);
      });
  }, [issueId]);

  if (loading) return <div className="neon-panel">Loading...</div>;
  if (!issue) return <div className="neon-panel">Issue not found.</div>;

  return (
    <div className="ui-dialog-overlay">
      <div className="ui-dialog-content neon-panel" style={{ maxWidth: 600 }}>
        <NeonFeatureCard
          icon={<FiAlertCircle />}
          title={issue.title}
          text={`Priority: ${issue.priority} · Status: ${issue.status} · ${new Date(issue.created_at).toLocaleDateString()} · Department: ${Array.isArray(issue.departments) ? issue.departments[0]?.name : issue.departments?.name || "N/A"}`}
          href="#"
        />
        <AssignIssue issueId={issue.id} />
      </div>
    </div>
  );
}
