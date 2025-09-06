"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import { FiSearch, FiUsers, FiLayers, FiBookOpen, FiPlus } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";
import MainHeader from "@/components/ui/MainHeader";

interface IncompleteRecord {
  auth_id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  module: string;
  document: string;
}

type Module = { id: string; name: string };
type Document = { id: string; title?: string; name?: string };
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
    departments?: { name?: string }[];
    role_id?: string;
    role?: { title?: string }[];
  };
};

export default function IncompleteTrainingPage() {
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

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);

      // 1) All assignments
      const { data: allAssignments, error: allErr } = await supabase
        .from("user_assignments")
        .select(
          `auth_id, item_id, item_type, completed_at, due_at, users:users!inner(first_name, last_name, department_id, departments(name), role_id, role:roles!users_role_id_fkey(title))`
        )
        .in("item_type", ["module", "document"]);

      if (!isMounted) return;
      if (allErr) {
        setError(allErr.message);
        setLoading(false);
        return;
      }

      // 2) Completed assignments
      const completed = (allAssignments ?? []).filter((a) => !!a.completed_at);
      // 3) Overdue assignments (if due_at exists and is past today and not completed)
      const overdue = (allAssignments ?? []).filter(
        (a) => a.due_at && !a.completed_at && new Date(a.due_at) < new Date()
      );

      setTotalAssignments(allAssignments?.length ?? 0);
      setTotalCompleted(completed.length);
      setTotalOverdue(overdue.length);

      // 4) Filter for incomplete assignments for table
      const incompleteRows = (allAssignments ?? []).filter((a) => !a.completed_at);

      // 5) Collect IDs for name lookups
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

      // 6) Fetch module/document names
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
              .select("id, title, name")
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
          (d: Document) =>
            [
              d.id,
              typeof d.title === "string"
                ? d.title
                : typeof d.name === "string"
                  ? d.name
                  : "",
            ] as [string, string],
        ),
      );

      // 7) Normalize to UI rows
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
          const documentName = !isModule
            ? (docNameById.get(item.item_id) ?? item.item_id)
            : "—";

          return {
            auth_id: item.auth_id,
            first_name: user?.first_name ?? "",
            last_name: user?.last_name ?? "",
            department: dep?.name ?? "—",
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
        <MainHeader
          title="Incomplete Training Assignments"
          subtitle="View and filter users with incomplete modules and documents"
        />
        <main className="page-main">
          {/* Compliance summary panel */}
          <div className="neon-panel" style={{ marginBottom: "2rem", background: "#0d3c47", color: "#fff", borderRadius: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.10)", padding: "2rem 2rem 1.5rem 2rem", display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#19e6d9" }}>Overall Compliance</h2>
              <ul style={{ margin: "1rem 0 0 0", fontSize: "1.08rem", fontWeight: 500, color: "#fff" }}>
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
          <div className="neon-panel">
            <div className="neon-panel-content">
              {/* Filters */}
              <div className="neon-form-row">
                <div className="neon-form-group">
                  <FiSearch className="neon-form-icon" />
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="neon-input"
                  />
                </div>

                <div className="neon-form-group">
                  <FiUsers className="neon-form-icon" />
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
                  <FiLayers className="neon-form-icon" />
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
                  <FiBookOpen className="neon-form-icon" />
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
              <NeonIconButton variant="add" icon={<FiPlus />} title="Add" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
