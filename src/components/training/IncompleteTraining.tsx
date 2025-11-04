"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface IncompleteRecord {
  auth_id: string;
  first_name: string;
  last_name: string;
  department: string;
  department_id: string;
  role: string;
  module: string;
  document: string;
}

type Module = { id: string; name: string };
type Document = { id: string; title?: string };
type IncompleteRow = {
  auth_id: string;
  item_id: string;
  item_type: string;
  completed_at?: string;
  due_at?: string;
  users?: {
    first_name?: string;
    last_name?: string;
    department_id?: string;
    departments?: { name?: string; level?: number }[];
    role_id?: string;
    role?: { title?: string }[];
  };
};

interface DepartmentStats {
  id: string;
  name: string;
  level: number;
  totalAssignments: number;
  completedAssignments: number;
  complianceRate: number;
}

export default function IncompleteTraining() {
  const [data, setData] = useState<IncompleteRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedModule, setSelectedModule] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);

      // 1) Fetch all departments first
      const { data: allDepartments, error: deptErr } = await supabase
        .from("departments")
        .select("id, name, level")
        .eq("is_archived", false);

      if (!isMounted) return;
      if (deptErr) {
        setError(deptErr.message);
        setLoading(false);
        return;
      }

      // 2) All assignments with user info
      const { data: allAssignments, error: allErr } = await supabase
        .from("user_assignments")
        .select(
          `auth_id, item_id, item_type, completed_at, due_at, users:users!inner(first_name, last_name, department_id, departments(name, level), role_id, role:roles!users_role_id_fkey(title))`
        )
        .in("item_type", ["module", "document"]);

      if (!isMounted) return;
      if (allErr) {
        setError(allErr.message);
        setLoading(false);
        return;
      }

      // 4) Completed assignments
      const completed = (allAssignments ?? []).filter((a) => !!a.completed_at);
      // 5) Overdue assignments
      const overdue = (allAssignments ?? []).filter(
        (a) => a.due_at && !a.completed_at && new Date(a.due_at) < new Date()
      );

      setTotalAssignments(allAssignments?.length ?? 0);
      setTotalCompleted(completed.length);
      setTotalOverdue(overdue.length);

      // 6) Calculate compliance per user (users who completed ALL their assignments)
      const userAssignments = new Map<string, { total: number; completed: number; deptId: string | null }>();

      for (const assignment of allAssignments ?? []) {
        const user = Array.isArray(assignment.users) ? assignment.users[0] : assignment.users;
        const authId = assignment.auth_id;
        const deptId = user?.department_id || null;

        if (!userAssignments.has(authId)) {
          userAssignments.set(authId, { total: 0, completed: 0, deptId });
        }

        const userStats = userAssignments.get(authId)!;
        userStats.total++;
        if (assignment.completed_at) {
          userStats.completed++;
        }
      }

      // 7) Initialize department stats map - only for departments with assignments
      const deptMap = new Map<string, {
        name: string;
        level: number;
        totalUsers: number;
        usersCompleted: number;
        totalAssignments: number;
        completedAssignments: number;
      }>();

      // 8) Build department map from users who have assignments
      for (const [, userStats] of userAssignments.entries()) {
        if (!userStats.deptId) continue;

        // Find department info
        const dept = allDepartments?.find(d => d.id === userStats.deptId);
        if (!dept) continue;

        // Initialize department if not exists
        if (!deptMap.has(userStats.deptId)) {
          deptMap.set(userStats.deptId, {
            name: dept.name || "Unknown",
            level: dept.level || 0,
            totalUsers: 0,
            usersCompleted: 0,
            totalAssignments: 0,
            completedAssignments: 0
          });
        }

        const deptStats = deptMap.get(userStats.deptId)!;

        // Count unique users with assignments
        deptStats.totalUsers++;
        deptStats.totalAssignments += userStats.total;
        deptStats.completedAssignments += userStats.completed;

        // User completed ALL their training
        if (userStats.total > 0 && userStats.completed === userStats.total) {
          deptStats.usersCompleted++;
        }
      }

      const deptStatsArray: DepartmentStats[] = Array.from(deptMap.entries()).map(([id, stats]) => ({
        id,
        name: stats.name,
        level: stats.level,
        totalAssignments: stats.totalAssignments, // Total assignments in department
        completedAssignments: stats.completedAssignments, // Completed assignments in department
        complianceRate: stats.totalAssignments > 0
          ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
          : 0,
      }));

      // Sort by compliance rate descending
      deptStatsArray.sort((a, b) => {
        return b.complianceRate - a.complianceRate;
      });
      setDepartmentStats(deptStatsArray);

      // 5) Filter for incomplete assignments
      const incompleteRows = (allAssignments ?? []).filter((a) => !a.completed_at);

      // 6) Collect IDs for name lookups
      const moduleIds = Array.from(
        new Set(
          incompleteRows.filter((r) => r.item_type === "module").map((r) => r.item_id),
        ),
      );
      const documentIds = Array.from(
        new Set(
          incompleteRows.filter((r) => r.item_type === "document").map((r) => r.item_id),
        ),
      );

      // 7) Fetch module/document names
      const [modsRes, docsRes] = await Promise.all([
        moduleIds.length
          ? supabase.from("modules").select("id, name").in("id", moduleIds)
          : Promise.resolve({ data: [], error: null } as {
              data: Module[];
              error: null;
            }),
        documentIds.length
          ? supabase
              .from("documents")
              .select("id, title")
              .in("id", documentIds)
          : Promise.resolve({ data: [], error: null } as {
              data: Document[];
              error: null;
            }),
      ]);

      const modNameById = new Map<string, string>(
        (modsRes.data ?? []).map((m: Module) => [m.id, m.name]),
      );
      const docNameById = new Map<string, string>(
        (docsRes.data ?? []).map(
          (d: Document) => {
            // Use title as the display name
            const displayName = d.title || "";
            console.log(`Document mapping: ${d.id} -> "${displayName}"`);
            return [d.id, displayName] as [string, string];
          }
        ),
      );

      // 8) Normalize to UI rows
      const results: IncompleteRecord[] = (incompleteRows as IncompleteRow[]).map(
        (item) => {
          const user = Array.isArray(item.users)
            ? item.users[0]
            : (item.users ?? {});
          const dep = user?.departments
            ? Array.isArray(user.departments)
              ? user.departments[0]
              : user.departments
            : {};
          const role = user?.role ?? {};

          const isModule = item.item_type === "module";
          const moduleName = isModule
            ? (modNameById.get(item.item_id) ?? item.item_id)
            : "—";

          let documentName = "—";
          if (!isModule) {
            const docName = docNameById.get(item.item_id);
            if (!docName) {
              console.warn(`Document name not found for ID: ${item.item_id}`);
              documentName = `Unknown Document (${item.item_id.substring(0, 8)}...)`;
            } else {
              documentName = docName;
            }
          }

          return {
            auth_id: item.auth_id,
            first_name: user?.first_name ?? "",
            last_name: user?.last_name ?? "",
            department: dep?.name ?? "—",
            department_id: user?.department_id ?? "",
            role: role?.title ?? "—",
            module: moduleName,
            document: documentName,
          };
        },
      );

      setData(results);
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, []);

  const compliancePercent = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

  const top10Departments = useMemo(() => departmentStats.slice(0, 10), [departmentStats]);

  // Bottom 10: Only departments with incomplete training (compliance < 100%)
  const bottom10Departments = useMemo(() => {
    const departmentsWithIncomplete = departmentStats.filter(dept => dept.complianceRate < 100);
    return departmentsWithIncomplete.slice(-10).reverse();
  }, [departmentStats]);

  // Facets
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const r of data)
      if (r.department && r.department !== "—") set.add(r.department);
    return Array.from(set).sort();
  }, [data]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) if (r.role && r.role !== "—") set.add(r.role);
    return Array.from(set).sort();
  }, [data]);

  const allModules = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) if (r.module && r.module !== "—") set.add(r.module);
    return Array.from(set).sort();
  }, [data]);

  const rolesForCurrentDept = useMemo(() => {
    if (selectedDept === "All") return allRoles;
    const set = new Set<string>();
    for (const r of data) {
      if (r.department === selectedDept && r.role && r.role !== "—")
        set.add(r.role);
    }
    return Array.from(set).sort();
  }, [data, allRoles, selectedDept]);

  const filtered = useMemo(() => {
    let list = data;
    if (selectedDept !== "All")
      list = list.filter((r) => r.department === selectedDept);
    if (selectedRole !== "All")
      list = list.filter((r) => r.role === selectedRole);
    if (selectedModule !== "All")
      list = list.filter((r) => r.module === selectedModule);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.first_name.toLowerCase().includes(s) ||
          r.last_name.toLowerCase().includes(s),
      );
    }
    return list;
  }, [data, search, selectedDept, selectedRole, selectedModule]);

  const tableData = useMemo(
    () =>
      filtered.map((rec) => ({
        user: `${rec.first_name} ${rec.last_name}`.trim(),
        department: rec.department,
        role: rec.role,
        module: rec.module,
        document: rec.document,
      })),
    [filtered],
  );

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="page-main">
          {/* Compliance summary panel */}
          <div className="neon-panel" style={{ marginBottom: "2rem", background: "#0d3c47", color: "#fff", borderRadius: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.10)", padding: "2rem 2rem 1.5rem 2rem", display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#19e6d9" }}>Overall Compliance</h2>
              <ul style={{ margin: "1rem 0 0 0", fontSize: "1.08rem", fontWeight: 500, color: "#fff", listStyle: "none", padding: 0 }}>
                <li>Assigned modules: <strong>{totalAssignments}</strong></li>
                <li>Completed modules: <strong>{totalCompleted}</strong></li>
                <li>Overdue modules: <strong>{totalOverdue}</strong></li>
                <li>Compliance rate: <strong>{compliancePercent}%</strong></li>
              </ul>
            </div>
            <div style={{ flex: "0 0 120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Circular compliance percent visual */}
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#19e6d9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 8px #19e6d9" }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 700, color: "#0d3c47" }}>{compliancePercent}%</span>
              </div>
            </div>
          </div>

          {/* Top 10 and Bottom 10 Departments */}
          {!loading && departmentStats.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
              {/* Top 10 */}
              <div className="neon-panel" style={{ background: "#0d3c47", color: "#fff", borderRadius: "18px", padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", fontWeight: 600, color: "#19e6d9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FiTrendingUp size={20} /> Top 10 Departments
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {top10Departments.map((dept, index) => (
                    <div key={dept.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "rgba(25, 230, 217, 0.1)", borderRadius: "8px", borderLeft: `4px solid ${index < 3 ? "#22c55e" : "#19e6d9"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#19e6d9", minWidth: "1.5rem" }}>#{index + 1}</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{dept.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{dept.completedAssignments}/{dept.totalAssignments}</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#22c55e" }}>{dept.complianceRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 10 */}
              <div className="neon-panel" style={{ background: "#0d3c47", color: "#fff", borderRadius: "18px", padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", fontWeight: 600, color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FiTrendingDown size={20} /> Bottom 10 Departments
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {bottom10Departments.map((dept, index) => (
                    <div key={dept.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", borderLeft: `4px solid ${index < 3 ? "#ef4444" : "#f97316"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ef4444", minWidth: "1.5rem" }}>#{departmentStats.length - index}</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{dept.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{dept.completedAssignments}/{dept.totalAssignments}</span>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#ef4444" }}>{dept.complianceRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="neon-panel">
            <div className="neon-panel-content">
              {/* Filters */}
              <div className="neon-form-row">
                <div className="neon-form-group">
                  <CustomTooltip text="Search by user first name or last name">
                    <label className="neon-form-label">
                      Search Users
                    </label>
                  </CustomTooltip>
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="neon-input"
                  />
                </div>

                <div className="neon-form-group">
                  <CustomTooltip text="Filter by department to narrow down results">
                    <label className="neon-form-label">
                      Department
                    </label>
                  </CustomTooltip>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setSelectedRole("All");
                    }}
                    className="neon-input"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="neon-form-group">
                  <CustomTooltip text="Filter by role within selected department">
                    <label className="neon-form-label">
                      Role
                    </label>
                  </CustomTooltip>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Roles</option>
                    {rolesForCurrentDept.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="neon-form-group">
                  <CustomTooltip text="Filter by specific training module">
                    <label className="neon-form-label">
                      Module
                    </label>
                  </CustomTooltip>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Modules</option>
                    {allModules.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Errors / Loading / Table */}
              {error && (
                <p className="text-red-500 text-sm mt-2">
                  Failed to load incomplete training: {error}
                </p>
              )}

              {loading ? (
                <div className="neon-table-wrapper">
                  <div className="p-6 text-sm opacity-80">Loading…</div>
                </div>
              ) : (
                <div className="neon-table-wrapper">
                  <NeonTable
                    columns={[
                      { header: "User", accessor: "user" },
                      { header: "Department", accessor: "department" },
                      { header: "Role", accessor: "role" },
                      { header: "Module", accessor: "module" },
                      { header: "Document", accessor: "document" },
                    ]}
                    data={tableData}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
