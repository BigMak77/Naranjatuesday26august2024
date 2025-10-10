"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";

/* ===========================
   Types
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
const CONTAINER_WIDTH = 1380;

const TrainingMatrix: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string; department_id?: string }[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setFatalError(null);

      try {
        const [
          usersRes,
          modulesRes,
          assignmentsRes,
          departmentsRes,
          rolesRes,
          documentsRes,
        ] = await Promise.all([
          supabase.from("users").select("auth_id, first_name, last_name, department_id, role_id"),
          supabase.from("modules").select("id, name").order("name", { ascending: true }),
          supabase.from("user_assignments").select("auth_id, item_id, item_type, completed_at"),
          supabase.from("departments").select("id, name").order("name", { ascending: true }),
          supabase.from("roles").select("id, title, department_id").order("title", { ascending: true }),
          supabase.from("documents").select("id, title").order("title", { ascending: true }),
        ]);

        if (usersRes.error) console.error("Users query failed:", usersRes.error);
        if (modulesRes.error) console.error("Modules query failed:", modulesRes.error);
        if (assignmentsRes.error) console.error("Assignments query failed:", assignmentsRes.error);
        if (departmentsRes.error) console.error("Departments query failed:", departmentsRes.error);
        if (rolesRes.error) console.error("Roles query failed:", rolesRes.error);
        if (documentsRes.error) console.error("Documents query failed:", documentsRes.error);

        if (!isMounted) return;

        if (modulesRes.error) {
          setFatalError("Failed to load modules. Check the 'modules' table/columns.");
        }

        const rawUsers = usersRes.data ?? [];
        const rawModules = modulesRes.data ?? [];
        const rawDocuments = documentsRes.data ?? [];
        const rawAssignments = assignmentsRes.data ?? [];
        const deptRows = departmentsRes.data ?? [];
        const roleRows = rolesRes.data ?? [];

        // Build safe users list with guaranteed unique, non-empty keys
        const userList: User[] = rawUsers.map((u: any, idx: number) => {
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
          console.warn(`TrainingMatrix: ${nullAuths} user(s) have null auth_id — using fallback keys.`);
        }

        // Modules with safe keys
        const moduleList: Module[] = rawModules.map((m: any, idx: number) => {
          const id = m.id ?? null;
          const _colKey = id ? `mod-${String(id)}` : `mod-col-${idx}`;
          return { id, title: m.name, _colKey };
        });

        const nullModuleIds = moduleList.filter((m) => !m.id).length;
        if (nullModuleIds > 0) {
          console.warn(`TrainingMatrix: ${nullModuleIds} module(s) have null id — using fallback keys and excluding from assignments.`);
        }

        // Documents with safe keys
        const documentList: Document[] = rawDocuments.map((d: any, idx: number) => {
          const id = d.id ?? null;
          const _colKey = id ? `doc-${String(id)}` : `doc-col-${idx}`;
          return { id, title: d.title, _colKey };
        });

        const nullDocumentIds = documentList.filter((d) => !d.id).length;
        if (nullDocumentIds > 0) {
          console.warn(`TrainingMatrix: ${nullDocumentIds} document(s) have null id — using fallback keys and excluding from assignments.`);
        }

        // Assignments as-is, but we’ll ignore ones that reference null ids in lookups
        const assignmentRows: Assignment[] = rawAssignments;

        setUsers(userList);
        setModules(moduleList);
        setDocuments(documentList);
        setAssignments(assignmentRows);
        setDepartments([
          { id: "", name: "All Departments" },
          ...deptRows
            .map((d: any) => ({ id: String(d.id ?? ""), name: String(d.name ?? "") }))
            .filter((d: any) => d.id !== "" && d.name),
        ]);
        setRoles([
          { id: "", title: "All Roles" },
          ...roleRows
            .map((r: any) => ({
              id: String(r.id ?? ""),
              title: String(r.title ?? ""),
              department_id: r.department_id ? String(r.department_id) : undefined,
            }))
            .filter((r: any) => r.id !== "" && r.title),
        ]);
      } catch (err: any) {
        console.error("Unexpected error loading matrix:", err);
        if (isMounted) setFatalError("Unexpected error loading data. See console for details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map (user, item) -> assignment, for both modules and documents
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) {
      if (!a.auth_id || !a.item_id) continue; // skip bad rows
      map.set(`${a.auth_id}|${a.item_id}|${a.item_type}`, a);
    }
    return map;
  }, [assignments]);

  // Filtering
  const filteredUsers = useMemo(() => {
    const nameQ = nameFilter.trim().toLowerCase();
    return users.filter((user) => {
      const matchesName = nameQ === "" || `${user.name}`.toLowerCase().includes(nameQ);
      const matchesDepartment = departmentFilter === "" || user.department === departmentFilter;
      const matchesRole = roleFilter === "" || user.role === roleFilter;
      return matchesName && matchesDepartment && matchesRole;
    });
  }, [users, nameFilter, departmentFilter, roleFilter]);

  // Combine modules and documents for columns
  const displayedItems: Array<{ id: string | null; title: string; _colKey: string; type: "module" | "document" }> = useMemo(() => {
    const visibleUserIds = new Set(filteredUsers.map((u) => u.auth_id).filter(Boolean) as string[]);
    // Modules
    const visibleModuleIds = new Set(
      assignments
        .filter((a) => a.item_type === "module" && !!a.auth_id && !!a.item_id && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id as string)
    );
    const moduleCols = modules.filter((m) => !!m.id && visibleModuleIds.has(m.id as string)).map((m) => ({ ...m, type: "module" as const }));
    // Documents
    const visibleDocumentIds = new Set(
      assignments
        .filter((a) => a.item_type === "document" && !!a.auth_id && !!a.item_id && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id as string)
    );
    const documentCols = documents.filter((d) => !!d.id && visibleDocumentIds.has(d.id as string)).map((d) => ({ ...d, type: "document" as const }));
    return [...moduleCols, ...documentCols];
  }, [modules, documents, assignments, filteredUsers]);

  const filteredRoles = useMemo(() => {
    if (roles.length === 0) return [];
    if (!departmentFilter) return roles;
    const head = roles[0]; // "All Roles"
    return head
      ? [head, ...roles.slice(1).filter((r) => r.department_id === departmentFilter)]
      : roles.slice(1).filter((r) => r.department_id === departmentFilter);
  }, [roles, departmentFilter]);

  const statusBg = (status: "complete" | "incomplete" | "unassigned") => {
    if (status === "unassigned") return "#ffffff";
    if (status === "complete") return "#27ae60";
    return "#e74c3c";
  };

  if (loading) return <NeonPanel>Loading...</NeonPanel>;
  if (fatalError) return <NeonPanel>{fatalError}</NeonPanel>;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", direction: "ltr" }}>
      <div
        style={{
          width: CONTAINER_WIDTH,
          minWidth: CONTAINER_WIDTH,
          maxWidth: CONTAINER_WIDTH,
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 10,
            fontWeight: 700,
            color: "#ffffff",
            fontSize: 24,
            letterSpacing: 0.5,
          }}
        >
          Training Matrix
        </h2>

        <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "flex-start" }}>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            {[{ id: "", name: "All Departments" }, ...departments]
              .filter((opt, idx, arr) => idx === 0 || (opt.id && opt.id !== ""))
              .map((opt, idx) => (
                <option
                  key={opt.id && opt.id !== "" ? `dept-${String(opt.id)}` : `dept-fallback-${idx}`}
                  value={opt.id ?? ""}
                >
                  {opt.name}
                </option>
              ))}
          </select>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {[...(filteredRoles.length ? filteredRoles : [{ id: "", title: "All Roles" }])]
              .filter((opt, idx) => idx === 0 || (opt.id && opt.id !== ""))
              .map((opt, idx) => (
                <option
                  key={opt.id && opt.id !== "" ? `role-${String(opt.id)}` : `role-fallback-${idx}`}
                  value={opt.id ?? ""}
                >
                  {opt.title}
                </option>
              ))}
          </select>

          <input
            type="text"
            placeholder="Filter by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", minWidth: 180 }}
          />

          <button
            style={{ padding: "6px 16px", borderRadius: 4, background: "#00e0ff", color: "#00313a", fontWeight: 700, border: "none", cursor: "pointer" }}
            onClick={() => {
              // Download CSV of visible matrix
              const rows: string[] = [];
              const header = ["User", ...displayedItems.map(item => item.title + (item.type === "document" ? " (Document)" : ""))];
              rows.push(header.join(","));
              filteredUsers.forEach(user => {
                const row = [user.name];
                displayedItems.forEach(item => {
                  const aKey = user.auth_id && item.id ? `${user.auth_id}|${item.id}|${item.type}` : null;
                  const a = aKey ? assignmentMap.get(aKey) : undefined;
                  let cellContent = "";
                  if (a) {
                    if (a.completed_at) {
                      const d = new Date(a.completed_at);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = String(d.getFullYear()).slice(-2);
                      cellContent = `${day}/${month}/${year}`;
                    } else {
                      cellContent = "NO";
                    }
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
              a.download = "training-matrix.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Download CSV
          </button>
        </div>

        <div
          style={{
            width: CONTAINER_WIDTH,
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            borderRadius: 6,
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              tableLayout: "fixed",
              width: "max-content",
              maxWidth: "none",
              direction: "ltr",
            }}
          >
            <colgroup>
              <col style={{ width: USER_COL_WIDTH, maxWidth: USER_COL_WIDTH }} />
              {displayedItems.map((item) => (
                <col key={item._colKey} style={{ width: COL_WIDTH, maxWidth: COL_WIDTH }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th
                  style={{
                    border: "0.5px solid rgb(255, 255, 255)",
                    padding: 1,
                    background: "#00e0ff",
                    color: "#00313a",
                    textAlign: "left",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  User
                </th>
                {displayedItems.map((item) => (
                  <th
                    key={`th-${item._colKey}`}
                    title={item.title}
                    style={{
                      border: "0.5px solid #00313a",
                      padding: 1,
                      background: item.type === "module" ? "#00e0ff" : "#ffb300",
                      color: "#00313a",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        gap: 2,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.2,
                        direction: "ltr",
                      }}
                    >
                      {item.title}
                      {item.type === "document" && <span style={{ fontSize: 12, color: "#666" }}>(Document)</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user, userIdx) => (
                <tr key={user._rowKey}>
                  <td style={{ border: "0.5px solid #00313a", padding: 1, fontWeight: 500, textAlign: "left" }}>
                    {user.name || `User ${userIdx + 1}`}
                  </td>
                  {displayedItems.map((item) => {
                    const aKey = user.auth_id && item.id ? `${user.auth_id}|${item.id}|${item.type}` : null;
                    const a = aKey ? assignmentMap.get(aKey) : undefined;

                    let cellContent = "";
                    let cellStatus: "complete" | "incomplete" | "unassigned" = "unassigned";

                    if (a) {
                      if (a.completed_at) {
                        const d = new Date(a.completed_at);
                        const day = String(d.getDate()).padStart(2, "0");
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const year = String(d.getFullYear()).slice(-2);
                        cellContent = `${day}/${month}/${year}`;
                        cellStatus = "complete";
                      } else {
                        cellContent = "NO";
                        cellStatus = "incomplete";
                      }
                    }

                    return (
                      <td
                        key={`cell-${user._rowKey}-${item._colKey}`}
                        style={{
                          border: "0.5px solid #00313a",
                          padding: 1,
                          background: statusBg(cellStatus),
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          direction: "ltr",
                          color: cellStatus === "unassigned" ? "#000" : "#fff",
                          fontWeight: cellStatus === "complete" ? 700 : 500,
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={1 + displayedItems.length}
                    style={{ border: "0.5px solid #00313a", padding: 16, textAlign: "center", color: "#fff", background: "#e74c3c" }}
                  >
                    No users match the selected filters.
                  </td>
                </tr>
              )}

              {filteredUsers.length > 0 && displayedItems.length === 0 && (
                <tr>
                  <td
                    colSpan={1}
                    style={{ border: "0.5px solid #00313a", padding: 16, textAlign: "left", color: "#00313a", background: "#f5f5f5" }}
                  >
                    No modules or documents with assignments for the current selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrainingMatrix;
