"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "@/components/ui/NeonIconButton";
import AssignIssue from "./components/AssignIssue";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from "@/components/ui/dialog";
import MainHeader from "@/components/ui/MainHeader";

type Issue = {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  description?: string;
  departments?: {
    name: string;
  };
};

export default function IssuesListPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignIssueId, setAssignIssueId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      const { data, error } = await supabase
        .from("issues")
        .select(
          "id, title, priority, status, created_at, description, department_id, departments (id, name)",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching issues:", error);
      } else {
        setIssues(
          (data || []).map((issue) => {
            let departmentObj: { name: string } | undefined = undefined;
            if (
              Array.isArray(issue.departments) &&
              issue.departments.length > 0
            ) {
              departmentObj = {
                name: String(issue.departments[0]?.name ?? "—"),
              };
            } else if (
              issue.departments &&
              typeof issue.departments === "object" &&
              "name" in issue.departments
            ) {
              departmentObj = {
                name: String(
                  (issue.departments as { name?: unknown }).name ?? "—",
                ),
              };
            } else {
              departmentObj = { name: "—" };
            }
            return {
              ...issue,
              departments: departmentObj,
            };
          }),
        );
      }

      setLoading(false);
    };

    fetchIssues();
  }, []);

  return (
    <div className="centered-content">
      <MainHeader title="Issues" subtitle="View and manage all issues" />
      <div className="issues-list-container">
        {loading ? (
          <p className="neon-success">Loading issues...</p>
        ) : (
          <NeonTable
            columns={[
              { header: "Title", accessor: "title" },
              { header: "Priority", accessor: "priority" },
              { header: "Status", accessor: "status" },
              { header: "Created", accessor: "created_at" },
              { header: "Department", accessor: "department" },
              { header: "", accessor: "actions" },
            ]}
            data={issues.map((issue) => ({
              title: issue.title,
              priority: issue.priority,
              status: issue.status,
              created_at: issue.created_at
                ? new Date(issue.created_at).toLocaleDateString("en-GB")
                : "—",
              description: issue.description,
              department: issue.departments?.name || "—",
              actions: (
                <div className="neon-btn-group">
                  <NeonIconButton
                    variant="assign"
                    title="Assign"
                    className="neon-btn-assign"
                    onClick={() => {
                      setAssignIssueId(issue.id);
                      setAssignModalOpen(true);
                    }}
                  />
                  <NeonIconButton
                    variant="view"
                    title="View Issue"
                    className="neon-btn-view"
                    as="a"
                    href={`/turkus/issues/${issue.id}`}
                  />
                  <NeonIconButton
                    variant="delete"
                    title="Delete Issue"
                    className="neon-btn-delete"
                    onClick={() => {/* TODO: handle delete logic */}}
                  />
                </div>
              ),
            }))}
          />
        )}
      </div>
      {/* Assign Issue Modal */}
      {assignModalOpen && assignIssueId && (
        <Dialog open onOpenChange={setAssignModalOpen}>
          <DialogPortal>
            {/* Only one overlay and content, with correct stacking and no duplicate overlays */}
            <DialogOverlay />
            <DialogContent style={{ zIndex: 10001, position: 'relative' }}>
              <AssignIssue issueId={assignIssueId} />
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}
    </div>
  );
}
