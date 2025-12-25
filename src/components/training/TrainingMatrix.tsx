"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import TextIconButton from "@/components/ui/TextIconButtons";

/* ===========================
   Enhanced TrainingMatrix with Historical Completion Support
   This version preserves training completion history across role changes
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

interface TrainingMatrixProps {
  filterByDepartmentId?: string; // Optional: auto-filter by department (for managers)
}

const TrainingMatrix: React.FC<TrainingMatrixProps> = ({ filterByDepartmentId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<{ role_id: string; item_id: string; type: string }[]>([]);
  const [departmentAssignments, setDepartmentAssignments] = useState<{ department_id: string; item_id: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  // If filterByDepartmentId is provided, use it as the default filter
  const [departmentFilter, setDepartmentFilter] = useState(filterByDepartmentId || "");
  const [roleFilter, setRoleFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string; department_id?: string }[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Update department filter if prop changes
  useEffect(() => {
    if (filterByDepartmentId) {
      setDepartmentFilter(filterByDepartmentId);
    }
  }, [filterByDepartmentId]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    // Helper to fetch all rows from a table (bypassing 1000 row limit)
    async function fetchAllRows<T>(
      tableName: string,
      selectQuery: string,
      orderBy?: { column: string; ascending: boolean }
    ): Promise<{ data: T[] | null; error: any }> {
      const allData: T[] = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        let query = supabase
          .from(tableName)
          .select(selectQuery)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }

        const { data, error } = await query;

        if (error) {
          return { data: null, error };
        }

        if (!data || data.length === 0) break;

        allData.push(...(data as T[]));

        if (data.length < pageSize) break;
        page++;
      }

      return { data: allData, error: null };
    }

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
          roleAssignmentsRes,
          departmentAssignmentsRes,
        ] = await Promise.all([
          // Only fetch active users (not leavers)
          supabase.from("users").select("auth_id, first_name, last_name, department_id, role_id").eq("is_leaver", false).order("first_name"),
          fetchAllRows("modules", "id, name", { column: "name", ascending: true }),
          fetchAllRows("user_assignments", "auth_id, item_id, item_type, completed_at"),
          fetchAllRows("departments", "id, name", { column: "name", ascending: true }),
          fetchAllRows("roles", "id, title, department_id", { column: "title", ascending: true }),
          fetchAllRows("documents", "id, title", { column: "title", ascending: true }),
          fetchAllRows("role_assignments", "role_id, item_id, type"),
          fetchAllRows("department_assignments", "department_id, item_id, type"),
        ]);

        if (usersRes.error) console.error("Users query failed:", usersRes.error);
        if (modulesRes.error) console.error("Modules query failed:", modulesRes.error);
        if (assignmentsRes.error) console.error("Assignments query failed:", assignmentsRes.error);
        if (departmentsRes.error) console.error("Departments query failed:", departmentsRes.error);
        if (rolesRes.error) console.error("Roles query failed:", rolesRes.error);
        if (documentsRes.error) console.error("Documents query failed:", documentsRes.error);
        if (roleAssignmentsRes.error) console.error("Role assignments query failed:", roleAssignmentsRes.error);
        if (departmentAssignmentsRes.error) console.error("Department assignments query failed:", departmentAssignmentsRes.error);

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
        const rawRoleAssignments = roleAssignmentsRes.data ?? [];
        const rawDepartmentAssignments = departmentAssignmentsRes.data ?? [];

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

        // Assignments as-is, but we'll ignore ones that reference null ids in lookups
        const assignmentRows: Assignment[] = rawAssignments as Assignment[];

        setUsers(userList);
        setModules(moduleList);
        setDocuments(documentList);
        setAssignments(assignmentRows);
        setRoleAssignments(rawRoleAssignments as { role_id: string; item_id: string; type: string }[]);
        setDepartmentAssignments(rawDepartmentAssignments as { department_id: string; item_id: string; type: string }[]);
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
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error("Unexpected error loading matrix:", err);
        if (isMounted) setFatalError("Unexpected error loading data. See console for details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Initial fetch
    fetchData();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      intervalId = setInterval(() => {
        if (isMounted) {
          fetchData();
        }
      }, refreshInterval * 1000);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, refreshTrigger]);

  // Map (user, item) -> assignment, for both modules and documents
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) {
      if (!a.auth_id || !a.item_id) continue; // skip bad rows
      map.set(`${a.auth_id}|${a.item_id}|${a.item_type}`, a);
    }
    return map;
  }, [assignments]);

  // Note: Historical completions are now stored in user_assignments table
  // No separate historical completions map needed

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

  // Combine modules and documents for columns, including all assignments (user, role, and department)
  const displayedItems: Array<{ id: string | null; title: string; _colKey: string; type: "module" | "document" }> = useMemo(() => {
    const visibleUserIds = new Set(filteredUsers.map((u) => u.auth_id).filter(Boolean) as string[]);
    const visibleRoleIds = new Set(filteredUsers.map((u) => u.role).filter(Boolean) as string[]);
    const visibleDepartmentIds = new Set(filteredUsers.map((u) => u.department).filter(Boolean) as string[]);

    // Get items from user assignments
    const userModuleIds = new Set(
      assignments
        .filter((a) => a.item_type === "module" && !!a.auth_id && !!a.item_id && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id as string)
    );
    const userDocumentIds = new Set(
      assignments
        .filter((a) => a.item_type === "document" && !!a.auth_id && !!a.item_id && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id as string)
    );

    // Get items from role assignments
    const roleModuleIds = new Set(
      roleAssignments
        .filter((a) => a.type === "module" && !!a.role_id && !!a.item_id && visibleRoleIds.has(a.role_id))
        .map((a) => a.item_id as string)
    );
    const roleDocumentIds = new Set(
      roleAssignments
        .filter((a) => a.type === "document" && !!a.role_id && !!a.item_id && visibleRoleIds.has(a.role_id))
        .map((a) => a.item_id as string)
    );

    // Get items from department assignments
    const deptModuleIds = new Set(
      departmentAssignments
        .filter((a) => a.type === "module" && !!a.department_id && !!a.item_id && visibleDepartmentIds.has(a.department_id))
        .map((a) => a.item_id as string)
    );
    const deptDocumentIds = new Set(
      departmentAssignments
        .filter((a) => a.type === "document" && !!a.department_id && !!a.item_id && visibleDepartmentIds.has(a.department_id))
        .map((a) => a.item_id as string)
    );

    // Combine all module and document IDs
    const allModuleIds = new Set([...userModuleIds, ...roleModuleIds, ...deptModuleIds]);
    const allDocumentIds = new Set([...userDocumentIds, ...roleDocumentIds, ...deptDocumentIds]);

    const moduleCols = modules.filter((m) => !!m.id && allModuleIds.has(m.id as string)).map((m) => ({ ...m, type: "module" as const }));
    const documentCols = documents.filter((d) => !!d.id && allDocumentIds.has(d.id as string)).map((d) => ({ ...d, type: "document" as const }));

    return [...moduleCols, ...documentCols];
  }, [modules, documents, assignments, roleAssignments, departmentAssignments, filteredUsers]);

  const filteredRoles = useMemo(() => {
    if (roles.length === 0) return [];
    if (!departmentFilter) return roles;
    const head = roles[0]; // "All Roles"
    return head
      ? [head, ...roles.slice(1).filter((r) => r.department_id === departmentFilter)]
      : roles.slice(1).filter((r) => r.department_id === departmentFilter);
  }, [roles, departmentFilter]);

  const statusBg = (status: "complete" | "incomplete" | "unassigned" | "historical") => {
    if (status === "unassigned") return "#ffffff";
    if (status === "complete") return "#27ae60";
    if (status === "historical") return "#95a5a6"; // Grey for historical
    return "#e74c3c";
  };

  const statusColor = (status: "complete" | "incomplete" | "unassigned" | "historical") => {
    if (status === "unassigned") return "#000";
    if (status === "historical") return "#2c3e50"; // Dark text for historical
    return "#fff";
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

        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", height: "36px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #ccc", fontSize: 12, minWidth: 120, maxWidth: 140, height: "32px" }}
            >
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

            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #ccc", fontSize: 12, minWidth: 120, maxWidth: 140, height: "32px" }}
            >
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
              style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #ccc", fontSize: 12, minWidth: 140, maxWidth: 160, height: "32px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", height: "32px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 12, whiteSpace: "nowrap", height: "32px", margin: 0, padding: 0 }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ margin: 0, padding: 0 }}
              />
              Auto-refresh
            </label>

            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid #ccc", fontSize: 11, minWidth: 50, height: "28px", margin: 0 }}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}

            <div style={{ display: "flex", gap: 6, alignItems: "center", height: "32px" }}>
              <TextIconButton
                variant="refresh"
                label="Refresh Now"
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="training-matrix-btn"
              />

              <TextIconButton
                variant="download"
                label="Download CSV"
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
              a.download = "training-matrix-with-history.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="training-matrix-btn"
          />
            </div>
          </div>
        </div>

        {/* Legend for completion status */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#ccc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 12, background: "#27ae60", borderRadius: 2 }}></div>
              <span>Completed (Current Role)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 12, background: "#95a5a6", borderRadius: 2 }}></div>
              <span>Historical Completion (H prefix)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 12, background: "#e74c3c", borderRadius: 2 }}></div>
              <span>Incomplete</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 12, background: "#ffffff", border: "1px solid #ccc", borderRadius: 2 }}></div>
              <span>Not Assigned</span>
            </div>
          </div>
        </div>

        <div
          style={{
            width: CONTAINER_WIDTH,
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            borderRadius: 6,
            border: "3px solid #ff8c00",
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

                    // All completions (current and historical) are in user_assignments
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
                          color: statusColor(cellStatus),
                          fontWeight: cellStatus === "complete" ? 700 : 500,
                          fontStyle: "normal",
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