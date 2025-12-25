// components/SubmissionsTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import { FiSearch } from "react-icons/fi";

type SubmissionRow = {
  assignment_id: string;
  status: string; // 'in_progress' | 'submitted' | others if you add
  submitted_at: string | null;
};

type EnrichedRow = {
  id: string;
  audit_title: string;
  user_name: string;
  department: string;
  status: string;
  submitted_at: string | null; // ISO
  submitted_at_display: string; // pretty
  due_at_display: string | null; // pretty or null
};

export default function SubmissionsTab() {
  const [rows, setRows] = useState<EnrichedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "submitted" | "in_progress"
  >("All");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Base submissions (latest first)
      const { data: subs, error } = await supabase
        .from("audit_submissions")
        .select("assignment_id, status, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(200);

      if (!alive) return;

      if (error) {
        console.error("Error loading submissions:", error.message);
        setErr(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const base: SubmissionRow[] = (subs ?? []) as SubmissionRow[];

      // 2) Collect assignment IDs
      const assignIds = Array.from(
        new Set(base.map((b) => b.assignment_id).filter(Boolean)),
      ) as string[];

      // 3) Fetch assignment info to get audit IDs, due dates, and user IDs
      const assignmentMap = new Map<string, {
        audit_id: string;
        due_at: string | null;
        auth_id: string;
      }>(); // assignment_id -> { audit_id, due_at, auth_id }
      if (assignIds.length) {
        try {
          const { data: assigns } = await supabase
            .from("user_assignments")
            .select("id, item_id, due_at, auth_id")
            .eq("item_type", "audit")
            .in("id", assignIds);
          (assigns ?? []).forEach(
            (a: { id: string; item_id?: string; due_at?: string | null; auth_id?: string }) => {
              if (a.item_id && a.auth_id) {
                assignmentMap.set(a.id, {
                  audit_id: a.item_id,
                  due_at: a.due_at ?? null,
                  auth_id: a.auth_id,
                });
              }
            },
          );
        } catch {
          // table or RLS might block; leave assignmentMap empty
        }
      }

      // Collect user IDs from assignments
      const userIds = Array.from(new Set(Array.from(assignmentMap.values()).map(v => v.auth_id)));

      // 4) Fetch audit titles (if table exists)
      const auditIds = Array.from(new Set(Array.from(assignmentMap.values()).map(v => v.audit_id)));
      const titleMap = new Map<string, string>();
      if (auditIds.length) {
        try {
          const { data: audits } = await supabase
            .from("audits")
            .select("id, name, title")
            .in("id", auditIds);
          (audits ?? []).forEach(
            (a: { id: string; name?: string; title?: string }) => {
              titleMap.set(a.id, (a.title || a.name || a.id));
            },
          );
        } catch {
          // audits table might not exist yet; fallback to id below
        }
      }

      // 5) Fetch user names + departments
      const userMap = new Map<
        string,
        {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          department?: string;
        }
      >();
      if (userIds.length) {
        const { data: users, error: uErr } = await supabase
          .from("users")
          .select("auth_id, first_name, last_name, email, departments(name)")
          .in("auth_id", userIds);

        if (!uErr && users) {
          users.forEach(
            (u: {
              auth_id: string;
              first_name?: string | null;
              last_name?: string | null;
              email?: string | null;
              departments?: { name?: string }[] | { name?: string };
            }) => {
              const dep = Array.isArray(u.departments)
                ? u.departments[0]?.name
                : u.departments?.name;
              userMap.set(u.auth_id, {
                first_name: u.first_name,
                last_name: u.last_name,
                email: u.email,
                department: dep || "—",
              });
            },
          );
        }
      }

      // 6) Build enriched rows
      const enriched: EnrichedRow[] = base.map((b) => {
        // Get assignment info
        const assignment = assignmentMap.get(b.assignment_id);
        if (!assignment) {
          // Skip if we don't have assignment data
          return null;
        }

        const user = userMap.get(assignment.auth_id) || {};
        const name =
          `${(user.first_name || "").trim()} ${(user.last_name || "").trim()}`.trim() ||
          user.email ||
          assignment.auth_id;

        const auditId = assignment.audit_id;
        const auditTitle = titleMap.get(auditId) ?? auditId;

        const prettySubmitted = b.submitted_at
          ? new Date(b.submitted_at).toLocaleString()
          : "Not submitted";

        // Due date from assignment
        const dueIso = assignment.due_at ?? null;
        const prettyDue = dueIso
          ? new Date(dueIso).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
          : null;

        return {
          id: b.assignment_id, // Use assignment_id as the unique ID
          audit_title: auditTitle,
          user_name: name,
          department: user.department || "—",
          status: b.status || "in_progress",
          submitted_at: b.submitted_at,
          submitted_at_display: prettySubmitted,
          due_at_display: prettyDue,
        };
      }).filter((row): row is EnrichedRow => row !== null);

      if (!alive) return;
      setRows(enriched);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Filters & search
  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "All") {
      list = list.filter(
        (r) => (r.status || "").toLowerCase() === statusFilter,
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.user_name.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.audit_title.toLowerCase().includes(q),
      );
    }
    // recent first
    return [...list].sort((a, b) => {
      const A = a.submitted_at ? Date.parse(a.submitted_at) : 0;
      const B = b.submitted_at ? Date.parse(b.submitted_at) : 0;
      return B - A;
    });
  }, [rows, query, statusFilter]);

  // Status options from data
  const statusOptions = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(rows.map((r) => (r.status || "").toLowerCase())),
        ).filter(Boolean),
      ] as ("All" | "submitted" | "in_progress")[],
    [rows],
  );

  return (
    <NeonPanel
      className="submissions-tab-panel"
    >
      <h3 className="submissions-tab-title">Audit Submissions</h3>

      {/* Controls */}
      <div className="submissions-tab-controls">
        <div className="submissions-tab-search-wrapper">
          <FiSearch className="submissions-tab-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, department, or audit…"
            className="submissions-tab-search-input neon-input"
          />
        </div>

        <select
          className="submissions-tab-status-select neon-input"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as "All" | "submitted" | "in_progress",
            )
          }
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All statuses" : opt}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      {err && (
        <p className="submissions-tab-error-msg">Failed to load: {err}</p>
      )}

      {loading ? (
        <p className="submissions-tab-loading-msg">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="submissions-tab-empty-msg">No submissions yet.</p>
      ) : (
        <ul className="submissions-tab-list">
          {filtered.map((s) => (
            <li key={s.id} className="submissions-tab-list-item">
              <div className="submissions-tab-list-item-content">
                <p>
                  <strong>Submission ID:</strong> {s.id}
                </p>
                <p>
                  <strong>Audit:</strong> {s.audit_title}
                </p>
                <p>
                  <strong>User:</strong> {s.user_name}
                </p>
                <p>
                  <strong>Department:</strong> {s.department}
                </p>
                <p>
                  <strong>Status:</strong> {s.status || "in_progress"}
                </p>
                <p>
                  <strong>Submitted At:</strong> {s.submitted_at_display}
                </p>
                {s.due_at_display && (
                  <p>
                    <strong>Due:</strong> {s.due_at_display}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </NeonPanel>
  );
}
