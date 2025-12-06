"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import NeonPanel from "@/components/NeonPanel";
import TextIconButton from "@/components/ui/TextIconButtons";

/* ===========================
   MyTeamComplianceMatrix - Shows training compliance matrix for manager's team only
   Uses the EXACT same logic as TrainingMatrix.tsx but filtered to manager's department
=========================== */
type User = { auth_id: string | null; name: string; department: string; role: string; _rowKey: string };
type Module = { id: string | null; title: string; _colKey: string };
type Document = { id: string | null; title: string; _colKey: string };
type Assignment = {
  auth_id: string | null;
  item_id: string | null;
  item_type: "module" | "document" | string;
  completed_at: string | null;
};


const COL_WIDTH = 75;
const USER_COL_WIDTH = 120;

export default function MyTeamComplianceMatrix() {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!user || !user.department_id) return;
    
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setFatalError(null);

      try {
        const [
          usersRes,
          modulesRes,
          assignmentsRes,
          documentsRes,
        ] = await Promise.all([
          supabase.from("users").select("auth_id, first_name, last_name, department_id, role_id"),
          supabase.from("modules").select("id, name").order("name", { ascending: true }),
          supabase.from("user_assignments").select("auth_id, item_id, item_type, completed_at"),
          supabase.from("documents").select("id, title").order("title", { ascending: true }),
        ]);

        if (usersRes.error) console.error("Users query failed:", usersRes.error);
        if (modulesRes.error) console.error("Modules query failed:", modulesRes.error);
        if (assignmentsRes.error) console.error("Assignments query failed:", assignmentsRes.error);
        if (documentsRes.error) console.error("Documents query failed:", documentsRes.error);

        if (!isMounted) return;

        if (modulesRes.error) {
          setFatalError("Failed to load modules. Check the 'modules' table/columns.");
        }

        const rawUsers = usersRes.data ?? [];
        const rawModules = modulesRes.data ?? [];
        const rawDocuments = documentsRes.data ?? [];
        const rawAssignments = assignmentsRes.data ?? [];

        // Build safe users list with guaranteed unique, non-empty keys - FILTERED to manager's department
        const userList: User[] = rawUsers
          .filter((u: any) => u.department_id === user?.department_id) // FILTER HERE
          .map((u: any, idx: number) => {
            const authId = u.auth_id ?? null;
            // Prefer auth_id; if null, create a deterministic fallback key
            const fallback = `user-row-${idx}-${u.first_name ?? ""}-${u.last_name ?? ""}`.trim();
            const _rowKey = authId ? `user-${String(authId)}` : fallback || `user-row-${idx}`;
            return {
              auth_id: authId,
              name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
              department: u.department_id || "",
              role: u.role_id || "",
              _rowKey,
            };
          });

        // Warn if any null auth_ids so you can clean data later
        const nullAuths = userList.filter((u) => !u.auth_id).length;
        if (nullAuths > 0) {
          console.warn(`MyTeamComplianceMatrix: ${nullAuths} user(s) have null auth_id — using fallback keys.`);
        }

        // Modules with safe keys
        const moduleList: Module[] = rawModules.map((m: any, idx: number) => {
          const id = m.id ?? null;
          const _colKey = id ? `mod-${String(id)}` : `mod-col-${idx}`;
          return { id, title: m.name, _colKey };
        });

        const nullModuleIds = moduleList.filter((m) => !m.id).length;
        if (nullModuleIds > 0) {
          console.warn(`MyTeamComplianceMatrix: ${nullModuleIds} module(s) have null id — using fallback keys and excluding from assignments.`);
        }

        // Documents with safe keys
        const documentList: Document[] = rawDocuments.map((d: any, idx: number) => {
          const id = d.id ?? null;
          const _colKey = id ? `doc-${String(id)}` : `doc-col-${idx}`;
          return { id, title: d.title, _colKey };
        });

        const nullDocumentIds = documentList.filter((d) => !d.id).length;
        if (nullDocumentIds > 0) {
          console.warn(`MyTeamComplianceMatrix: ${nullDocumentIds} document(s) have null id — using fallback keys and excluding from assignments.`);
        }

        // Assignments as-is, but we'll ignore ones that reference null ids in lookups
        const assignmentRows: Assignment[] = rawAssignments;

        setUsers(userList);
        setModules(moduleList);
        setDocuments(documentList);
        setAssignments(assignmentRows);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error("Unexpected error loading matrix:", err);
        if (isMounted) setFatalError("Unexpected error loading data. See console for details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Map (user, item) -> assignment, for both modules and documents
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) {
      if (!a.auth_id || !a.item_id) continue; // skip bad rows
      map.set(`${a.auth_id}|${a.item_id}|${a.item_type}`, a);
    }
    return map;
  }, [assignments]);

  // Historical completions are now in user_assignments - no separate map needed

  // Combine modules and documents for columns, including historical completions
  const displayedItems: Array<{ id: string | null; title: string; _colKey: string; type: "module" | "document" }> = useMemo(() => {
    const visibleUserIds = new Set(users.map((u) => u.auth_id).filter(Boolean) as string[]);
    
    // Get items from current assignments
    const currentModuleIds = new Set(
      assignments
        .filter((a) => a.item_type === "module" && !!a.auth_id && !!a.item_id && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id as string)
    );
    
    const currentDocumentIds = new Set(
      assignments
        .filter((a) => a.item_type === "document" && !!a.auth_id && !!a.item_id && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id as string)
    );

    // All completions (current and historical) are in user_assignments
    const relevantModules = modules
      .filter((m) => m.id && currentModuleIds.has(m.id))
      .map((m) => ({ ...m, type: "module" as const }));

    const relevantDocuments = documents
      .filter((d) => d.id && currentDocumentIds.has(d.id))
      .map((d) => ({ ...d, type: "document" as const }));

    const combined = [...relevantModules, ...relevantDocuments];
    return combined.sort((a, b) => a.title.localeCompare(b.title));
  }, [users, assignments, modules, documents]);

  if (loading) {
    return (
      <NeonPanel>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading team compliance matrix...</p>
        </div>
      </NeonPanel>
    );
  }

  if (fatalError) {
    return (
      <NeonPanel>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--error)" }}>Error: {fatalError}</p>
        </div>
      </NeonPanel>
    );
  }

  if (users.length === 0) {
    return (
      <NeonPanel>
        <h2>My Team Compliance</h2>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>No team members found in your department.</p>
        </div>
      </NeonPanel>
    );
  }

  return (
    <NeonPanel>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 className="neon-heading">My Team Compliance Matrix</h2>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <TextIconButton
              variant="refresh"
              label="Refresh Data"
              onClick={() => window.location.reload()}
            />
            <TextIconButton
              variant="download"
              label="Download CSV"
              onClick={() => {
                // Download CSV of team compliance matrix with historical completions
                const rows: string[] = [];
                const header = ["User", ...displayedItems.map(item => item.title + (item.type === "document" ? " (Document)" : ""))];
                rows.push(header.join(","));
                users.forEach(user => {
                  const row = [user.name];
                  displayedItems.forEach(item => {
                    const aKey = user.auth_id && item.id ? `${user.auth_id}|${item.id}|${item.type}` : null;
                    const a = aKey ? assignmentMap.get(aKey) : undefined;
                    
                    let cellContent = "";
                    if (a && a.completed_at) {
                      const d = new Date(a.completed_at);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = String(d.getFullYear()).slice(-2);
                      cellContent = `${day}/${month}/${year}`;
                    } else if (a && !a.completed_at) {
                      cellContent = "NO";
                    }
                    row.push(cellContent);
                  });
                  rows.push(row.join(","));
                });
                const csv = rows.join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "team-compliance-matrix-with-history.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            />
          </div>
        </div>
        
        {lastUpdated && (
          <p style={{ fontSize: 12, color: "var(--text-white)", opacity: 0.7, margin: 0 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Legend for completion status */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-white)", opacity: 0.7, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, background: "var(--status-success)", borderRadius: 2 }}></div>
            <span>Completed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, background: "var(--status-info)", borderRadius: 2 }}></div>
            <span>Historical Completion</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, background: "var(--status-danger)", borderRadius: 2 }}></div>
            <span>Incomplete</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, background: "var(--text-white)", border: "1px solid var(--border)", borderRadius: 2 }}></div>
            <span>Not Assigned</span>
          </div>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "calc(100vh - 300px)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          position: "relative",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: 11,
            width: "100%",
            minWidth: USER_COL_WIDTH + displayedItems.length * COL_WIDTH,
          }}
        >
          <thead>
            <tr style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "var(--panel)" }}>
              <th
                style={{
                  width: USER_COL_WIDTH,
                  minWidth: USER_COL_WIDTH,
                  textAlign: "left",
                  padding: "6px 4px",
                  borderBottom: "2px solid var(--border)",
                  borderRight: "1px solid var(--border)",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "var(--panel)",
                  zIndex: 21,
                  fontWeight: "bold",
                  color: "var(--text-white)",
                }}
              >
                User
              </th>
              {displayedItems.map((item) => (
                <th
                  key={item._colKey}
                  style={{
                    width: COL_WIDTH,
                    minWidth: COL_WIDTH,
                    maxWidth: COL_WIDTH,
                    textAlign: "center",
                    padding: "6px 2px",
                    borderBottom: "2px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    backgroundColor: "var(--panel)",
                    color: "var(--text-white)",
                    fontWeight: "bold",
                    verticalAlign: "bottom",
                    height: 120,
                  }}
                >
                  <div
                    style={{
                      transform: "rotate(-45deg)",
                      whiteSpace: "nowrap",
                      fontSize: 10,
                      transformOrigin: "center center",
                      maxWidth: COL_WIDTH - 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                    {item.type === "document" ? " (D)" : ""}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._rowKey}>
                <td
                  style={{
                    width: USER_COL_WIDTH,
                    minWidth: USER_COL_WIDTH,
                    padding: "4px",
                    borderBottom: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    position: "sticky",
                    left: 0,
                    backgroundColor: "var(--field)",
                    zIndex: 10,
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: 11, color: "var(--text-white)" }}>
                    {user.name || "(No Name)"}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-white)", opacity: 0.7, marginTop: 2 }}>
                    {user.role}
                  </div>
                </td>
                {displayedItems.map((item) => {
                  const aKey = user.auth_id && item.id ? `${user.auth_id}|${item.id}|${item.type}` : null;
                  const a = aKey ? assignmentMap.get(aKey) : undefined;

                  let bgColor = "var(--text-white)";
                  let textColor = "var(--panel)";
                  let cellText = "";

                  if (a && a.completed_at) {
                    // Assignment completed
                    bgColor = "var(--status-success)";
                    textColor = "var(--text-white)";
                    const d = new Date(a.completed_at);
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const year = String(d.getFullYear()).slice(-2);
                    cellText = `${day}/${month}/${year}`;
                  } else if (a && !a.completed_at) {
                    // Assignment incomplete
                    bgColor = "var(--status-danger)";
                    textColor = "var(--text-white)";
                    cellText = "NO";
                  }
                  // else: no assignment → empty cell (white background)

                  return (
                    <td
                      key={item._colKey}
                      style={{
                        width: COL_WIDTH,
                        minWidth: COL_WIDTH,
                        maxWidth: COL_WIDTH,
                        textAlign: "center",
                        padding: "2px",
                        borderBottom: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                        backgroundColor: bgColor,
                        color: textColor,
                        fontSize: 9,
                        fontWeight: cellText ? "bold" : "normal",
                        overflow: "hidden",
                      }}
                    >
                      {cellText}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-white)", opacity: 0.7 }}>
        <p>
          Showing compliance status for {users.length} team member{users.length === 1 ? '' : 's'} 
          across {displayedItems.length} training item{displayedItems.length === 1 ? '' : 's'}
        </p>
      </div>
    </NeonPanel>
  );
}
