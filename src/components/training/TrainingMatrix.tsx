import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";

type User = { id: string; name: string; department: string; role: string };
type Module = { id: string; title: string };
type Assignment = {
  auth_id: string;
  item_id: string;
  item_type: "module" | string;
  completed_at: string | null;
};

const COL_WIDTH = 75;      // fixed per-module column width
const USER_COL_WIDTH = 120;
const CONTAINER_WIDTH = 1380; // always use 1380px

const TrainingMatrix: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string; department_id?: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Users
      const { data: userRows } = await supabase
        .from("users")
        .select("auth_id, first_name, last_name, department_id, role_id");

      // Modules (stable deterministic order)
      const { data: moduleRows } = await supabase
        .from("modules")
        .select("id, name")
        .order("name", { ascending: true });

      // Assignments
      const { data: assignmentRows } = await supabase
        .from("user_assignments")
        .select("auth_id, item_id, item_type, completed_at");

      // Departments / Roles
      const { data: departmentRows } = await supabase
        .from("departments")
        .select("id, name")
        .order("name", { ascending: true });

      const { data: roleRows } = await supabase
        .from("roles")
        .select("id, title, department_id") // fetch department_id for roles
        .order("title", { ascending: true });

      const userList: User[] = (userRows || []).map((u) => ({
        id: u.auth_id,
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
        department: u.department_id || "",
        role: u.role_id || "",
      }));

      const moduleList: Module[] = (moduleRows || []).map((m) => ({
        id: m.id,
        title: m.name,
      }));

      setUsers(userList);
      setModules(moduleList);
      setAssignments((assignmentRows as Assignment[]) || []);
      setDepartments([
        { id: "", name: "All Departments" },
        ...(departmentRows || [])
          .map((d) => ({ id: d.id, name: d.name }))
          .filter((d) => d.name),
      ]);
      setRoles([
        { id: "", title: "All Roles" },
        ...((roleRows || [])
          .map((r) => ({ id: r.id, title: r.title, department_id: r.department_id }))
          .filter((r) => r.title)),
      ]);

      setLoading(false);
    }

    fetchData();
  }, []);

  // Fast lookup for user+module assignment
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) {
      if (a.item_type !== "module") continue;
      map.set(`${a.auth_id}|${a.item_id}`, a);
    }
    return map;
  }, [assignments]);

  // Filtered users (compute BEFORE displayedModules so columns react to filters)
  const filteredUsers = useMemo(() => {
    const nameQ = nameFilter.trim().toLowerCase();
    return users.filter((user) => {
      const matchesName = nameQ === "" || `${user.name}`.toLowerCase().includes(nameQ);
      const matchesDepartment = departmentFilter === "" || user.department === departmentFilter;
      const matchesRole = roleFilter === "" || user.role === roleFilter;
      return matchesName && matchesDepartment && matchesRole;
    });
  }, [users, nameFilter, departmentFilter, roleFilter]);

  /**
   * Only include modules that have at least one assignment for any of the *filtered* users.
   * Prevents empty columns after applying filters while keeping the original module order.
   */
  const displayedModules: Module[] = useMemo(() => {
    if (!modules.length || !filteredUsers.length) return [];
    const visibleUserIds = new Set(filteredUsers.map((u) => u.id));
    const visibleModuleIds = new Set(
      assignments
        .filter((a) => a.item_type === "module" && visibleUserIds.has(a.auth_id))
        .map((a) => a.item_id)
    );
    return modules.filter((m) => visibleModuleIds.has(m.id));
  }, [modules, assignments, filteredUsers]);

  // Filter roles based on selected department
  const filteredRoles = useMemo(() => {
    if (!departmentFilter) return roles;
    return [roles[0], ...roles.slice(1).filter((r) => r.department_id === departmentFilter)];
  }, [roles, departmentFilter]);

  const statusColor = (status: "complete" | "incomplete") =>
    status === "complete" ? "#27ae60" : "#e74c3c";

  if (loading) return <NeonPanel>Loading...</NeonPanel>;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", direction: "ltr" }}>
      {/* Fixed-width container: always 1380px */}
      <div
        style={{
          width: CONTAINER_WIDTH,
          minWidth: CONTAINER_WIDTH,
          maxWidth: CONTAINER_WIDTH,
          boxSizing: "border-box",
        }}
      >
        {/* Header above filters */}
        <h2 style={{ margin: 0, marginBottom: 10, fontWeight: 700, color: '#fffff', fontSize: 24, letterSpacing: 0.5 }}>
          Training Matrix
        </h2>
        {/* Filters */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "left" }}>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            {departments.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {filteredRoles.map((opt) => (
              <option key={opt.id} value={opt.id}>
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
        </div>

        {/* Scroll container — fixed 1380px wide; scrolls L→R if table is wider */}
        <div
          style={{
            width: CONTAINER_WIDTH,
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            borderRadius: 6,
            // optional: show a subtle bottom border to frame the area
            // border: "1px solid #eee",
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              tableLayout: "fixed",
              width: "max-content", // size to content; does not stretch container
              maxWidth: "none",
              direction: "ltr",
            }}
          >
            <colgroup>
              <col style={{ width: USER_COL_WIDTH, maxWidth: USER_COL_WIDTH }} />
              {displayedModules.map((mod) => (
                <col key={mod.id} style={{ width: COL_WIDTH, maxWidth: COL_WIDTH }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th
                  style={{
                    border: "0.5px solid #00313a",
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
                {displayedModules.map((mod) => (
                  <th
                    key={mod.id}
                    title={mod.title}
                    style={{
                      border: "0.5px solid #00313a",
                      padding: 1,
                      background: "#00e0ff",
                      color: "#00313a",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {/* Header wraps on multiple lines, L→R */}
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
                      {mod.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ border: "0.5px solid #00313a", padding: 1, fontWeight: 500, textAlign: "left" }}>
                    {user.name}
                  </td>
                  {displayedModules.map((mod) => {
                    const a = assignmentMap.get(`${user.id}|${mod.id}`);
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
                        key={mod.id}
                        style={{
                          border: "0.5px solid #00313a",
                          padding: 1,
                          background:
                            cellStatus === "unassigned"
                              ? "#fff"
                              : statusColor(cellStatus === "complete" ? "complete" : "incomplete"),
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          direction: "ltr",
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
                    colSpan={1 + displayedModules.length}
                    style={{ border: "0.5px solid #00313a", padding: 16, textAlign: "center", color: "#fff" }}
                  >
                    No users match the selected filters.
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
