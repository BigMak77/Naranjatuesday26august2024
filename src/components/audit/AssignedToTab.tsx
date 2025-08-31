// components/AssignedToTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import {
  FiSearch,
  FiChevronDown,
  FiCheckCircle,
  FiXCircle,
  FiMail,
} from "react-icons/fi";

type Row = {
  assignment_id: string;
  template_title: string;
  assigned_to_name: string;
  department_name: string;
  scheduled_for: string | null; // display value (localised)
  scheduled_for_sort: number; // unix ms for sorting
  submission_status: "Completed" | "In Progress" | "Not Started";
};

export default function AssignedToTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    | "assigned_to_name"
    | "department_name"
    | "template_title"
    | "scheduled_for"
    | "submission_status"
  >("scheduled_for");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // 1) Load audit assignments from the single sink
      const { data: ua, error: uaErr } = await supabase
        .from("user_assignments")
        .select(
          `
          id,
          auth_id,
          item_id,
          assigned_at,
          due_at,
          opened_at,
          completed_at,
          users:users!inner(
            first_name,
            last_name,
            departments(name)
          )
        `,
        )
        .eq("item_type", "audit")
        .order("due_at", { ascending: false });

      if (!alive) return;

      if (uaErr) {
        console.error("user_assignments load error:", uaErr);
        setRows([]);
        setLoading(false);
        return;
      }

      // 2) Map base rows
      const base = (ua ?? []).map((r) => {
        const u = Array.isArray(r.users) ? r.users[0] : (r.users ?? {});
        const dep = u?.departments
          ? Array.isArray(u.departments)
            ? u.departments[0]
            : u.departments
          : {};
        const name =
          `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "(no name)";

        const dueIso = r.due_at as string | null;
        const dueMs = dueIso ? Date.parse(dueIso) : 0;
        const dueDisplay = dueIso
          ? new Date(dueIso).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null;

        return {
          assignment_id: r.id as string,
          audit_id: r.item_id as string,
          assigned_to_name: name,
          department_name:
            typeof dep === "object" && dep !== null && "name" in dep
              ? (dep.name as string)
              : "—",
          scheduled_for: dueDisplay,
          scheduled_for_sort: isNaN(dueMs) ? 0 : dueMs,
          completed_at: r.completed_at as string | null,
          opened_at: r.opened_at as string | null,
        };
      });

      // 3) Try to get audit names (if audits table exists)
      const titleByAudit = new Map<string, string>();
      try {
        const auditIds = Array.from(new Set(base.map((b) => b.audit_id)));
        if (auditIds.length) {
          const { data: audits } = await supabase
            .from("audits")
            .select("id, name, title")
            .in("id", auditIds);
          if (audits) {
            audits.forEach((a) => {
              titleByAudit.set(a.id, (a.name || a.title || a.id) as string);
            });
          }
        }
      } catch {
        // audits table might not exist yet; fall back to id
      }

      // 4) Try to get submissions (if audit_submissions exists)
      const subByAssign = new Map<
        string,
        { status: string | null; submitted_at: string | null }
      >();
      try {
        const assignmentIds = base.map((b) => b.assignment_id);
        if (assignmentIds.length) {
          const { data: subs } = await supabase
            .from("audit_submissions")
            .select("assignment_id, status, submitted_at")
            .in("assignment_id", assignmentIds);
          (subs ?? []).forEach((s) => {
            if (s.assignment_id)
              subByAssign.set(s.assignment_id, {
                status: s.status,
                submitted_at: s.submitted_at,
              });
          });
        }
      } catch {
        // audit_submissions table might not exist yet; treat as no submissions
      }

      // 5) Build final rows with status + title
      const finalRows: Row[] = base.map((b) => {
        const sub = subByAssign.get(b.assignment_id);
        const completed = Boolean(b.completed_at || sub?.submitted_at);
        const inProgress =
          !completed && (Boolean(b.opened_at) || sub?.status === "in_progress");

        const status: Row["submission_status"] = completed
          ? "Completed"
          : inProgress
            ? "In Progress"
            : "Not Started";

        return {
          assignment_id: b.assignment_id,
          template_title: titleByAudit.get(b.audit_id) ?? b.audit_id, // fallback to id if audits table not present
          assigned_to_name: b.assigned_to_name,
          department_name: b.department_name,
          scheduled_for: b.scheduled_for,
          scheduled_for_sort: b.scheduled_for_sort,
          submission_status: status,
        };
      });

      if (!alive) return;
      setRows(finalRows);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Filter, search
  const filtered = useMemo(() => {
    let list = rows;
    if (filterStatus)
      list = list.filter((r) => r.submission_status === filterStatus);
    if (filterDept) list = list.filter((r) => r.department_name === filterDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.assigned_to_name || "").toLowerCase().includes(q) ||
          (r.department_name || "").toLowerCase().includes(q) ||
          (r.template_title || "").toLowerCase().includes(q),
      );
    }
    // Sort (special case for date)
    const sorted = [...list].sort((a, b) => {
      if (sortBy === "scheduled_for") {
        const A = a.scheduled_for_sort;
        const B = b.scheduled_for_sort;
        return sortDir === "asc" ? A - B : B - A;
      }
      const A = (a[sortBy] || "");
      const B = (b[sortBy] || "");
      return sortDir === "asc" ? A.localeCompare(B) : B.localeCompare(A);
    });
    return sorted;
  }, [rows, search, filterStatus, filterDept, sortBy, sortDir]);

  // Unique options
  const statusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.submission_status))).filter(
        Boolean,
      ) as string[],
    [rows],
  );
  const deptOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.department_name))).filter(
        Boolean,
      ),
    [rows],
  );

  async function sendReminderEmail(assignmentId: string, assignedTo: string) {
    // Hook up to your API or Postgres function when ready
    // e.g. await fetch(`/api/remind-audit?assignmentId=${assignmentId}`, { method: 'POST' })
    alert(`Reminder queued for ${assignedTo}`);
  }

  return (
    <NeonPanel className="neon-panel-audit space-y-4">
      <h3 className="neon-section-title">Assigned Audits</h3>

      {/* Controls */}
      <div className="neon-flex neon-flex-wrap gap-4 items-center mb-4">
        <div className="neon-relative">
          <FiSearch className="neon-icon-search" />
          <div className="neon-search-bar-wrapper">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, department, or template..."
              className="neon-input neon-input-search"
            />
          </div>
        </div>

        <div className="neon-flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="neon-input"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="neon-input"
          >
            <option value="">All Departments</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="neon-table-wrapper">
        <table className="neon-table min-w-full table-fixed">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead className="neon-table-head">
            <tr>
              {[
                { header: "Title", accessor: "template_title" },
                { header: "Assigned To", accessor: "assigned_to_name" },
                { header: "Department", accessor: "department_name" },
                { header: "Scheduled For", accessor: "scheduled_for" },
                { header: "Status", accessor: "submission_status" },
              ].map((col) => (
                <th
                  key={col.accessor}
                  className="neon-table-th cursor-pointer select-none"
                  onClick={() => {
                    if (sortBy === col.accessor) {
                      setSortDir(sortDir === "asc" ? "desc" : "asc");
                    }
                    setSortBy(col.accessor as typeof sortBy);
                  }}
                >
                  {col.header}
                  {sortBy === col.accessor && (
                    <FiChevronDown
                      className={`neon-table-sort ${sortDir === "asc" ? "rotate-180" : ""}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="neon-table-info">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="neon-table-info">
                  No assigned audits found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.assignment_id} className="neon-table-row">
                  <td className="neon-table-cell">{row.template_title}</td>
                  <td className="neon-table-cell">{row.assigned_to_name}</td>
                  <td className="neon-table-cell">{row.department_name}</td>
                  <td className="neon-table-cell">
                    {row.scheduled_for ?? "—"}
                  </td>
                  <td className="neon-table-cell">
                    {row.submission_status === "Completed" ? (
                      <FiCheckCircle
                        className="neon-status-complete neon-table-status-icon"
                        title="Completed"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <FiXCircle
                          className="neon-status-incomplete neon-table-status-icon"
                          title={row.submission_status}
                        />
                        <button
                          type="button"
                          title={`Remind ${row.assigned_to_name}`}
                          className="inline-flex items-center opacity-80 hover:opacity-100"
                          onClick={() =>
                            sendReminderEmail(
                              row.assignment_id,
                              row.assigned_to_name,
                            )
                          }
                        >
                          <FiMail className="neon-table-remind-icon" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </NeonPanel>
  );
}
