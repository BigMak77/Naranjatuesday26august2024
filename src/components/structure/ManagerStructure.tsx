"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

/* ===========================
   Types
=========================== */
type TreeNode = {
  id: string;        // normalized id
  name: string;
  children?: TreeNode[];
  roles?: { id: string; title: string }[];
};

interface StructureTreeProps {
  nodes: TreeNode[];
  level?: number;
  users: any[]; // added
}

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  is_archived?: boolean;
  level?: number; // made optional
}

/* ===========================
   Tree (centered children rows)
=========================== */
function StructureTree({ nodes, level = 2, users }: StructureTreeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function countPeople(node: TreeNode): number {
    // Count all users in this department (manager list below can be filtered separately)
    return users.filter((u) => u.department_id === node.id).length;
  }

  if (!nodes?.length) return null;

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setExpandedId(null);
    }
  };

  const vibrantBg = "#1e1e28";
  const mutedBg = "#244d4d";

  // Which node (if any) is expanded at this level?
  const expandedNode = nodes.find((n) => n.id === expandedId) || null;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column", // stack rows vertically
        alignItems: "center",
        gap: 24,
        marginBottom: 32,
        cursor: level === 2 ? "pointer" : undefined,
        width: "100%",
      }}
      onClick={level === 2 ? handleBackgroundClick : undefined}
    >
      {/* Row of sibling cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 24,
          justifyContent: "center",
          flexWrap: "wrap",
          width: "100%",
          paddingBottom: 4,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {nodes.map((node) => {
          const isExpanded = expandedId === node.id;
          // Highlight only the selected parent and its direct children (family)
          const isFamily =
            isExpanded ||
            (expandedId &&
              expandedNode?.children?.some((child) => child.id === node.id));
          // Muted if any node is expanded and this node is not in the family
          const isMuted = !!expandedId && !isFamily;

          // Managers list (for display when expanded)
          const managersInDept = users.filter((u) => {
            const inDept = u.department_id === node.id;
            const lvl =
              typeof u.access_level === "string"
                ? u.access_level.toLowerCase()
                : "";
            return inDept && (lvl.includes("manager") || lvl.includes("mgr"));
          });

          return (
            <CustomTooltip 
              key={node.id}
              text={`${node.name} department - ${countPeople(node)} total employees, ${managersInDept.length} managers. ${node.children?.length ? 'Click to expand and view managers and sub-departments.' : 'No sub-departments.'}`}
            >
              <div
                style={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  position: "relative",
                  opacity: isMuted ? 0.6 : 1,
                  filter: isMuted ? "grayscale(0.3)" : "none",
                  transition: "opacity 0.2s, filter 0.2s",
                }}
              >
                <div
                  onClick={() => {
                    const next = isExpanded ? null : node.id;
                    setExpandedId(next);
                  }}
                  style={{
                    cursor: node.children?.length ? "pointer" : "default",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background:
                      level === 2 ? (isMuted ? mutedBg : vibrantBg) : "#23232e",
                    border: isExpanded
                      ? "1.5px solid #00fff7"
                      : "1.5px solid #222",
                    color: "#fff",
                    fontWeight: 500,
                    transition: "background 0.2s, border 0.2s",
                    textAlign: "center",
                  }}
                >
                  {node.name}

                  {/* People count */}
                  <div
                    style={{
                      margin: "10px auto 0",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#00fff7",
                        color: "#1e1e28",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {countPeople(node)}
                    </div>
                  </div>

                  {node.children?.length ? (
                    <span style={{ float: "right", opacity: 0.7, fontSize: 18 }}>
                      {isExpanded ? "−" : "+"}
                    </span>
                  ) : null}
                </div>

                {/* Users inside the card when expanded */}
                {isExpanded && (
                  <div style={{ marginTop: 12, textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#00fff7",
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      Managers:
                    </div>
                    {managersInDept.length ? (
                      <ul style={{ paddingLeft: 16, margin: 0 }}>
                        {managersInDept.map((u) => (
                          <li
                            key={u.id}
                            style={{ color: "#fff", fontSize: 13, marginBottom: 6 }}
                          >
                            {`${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                              u.id}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: "#888", fontSize: 12, paddingLeft: 16 }}>
                        (No managers in this department)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CustomTooltip>
          );
        })}
      </div>

      {/* A single, centered children row for whichever node is expanded at this level */}
      {expandedNode?.children?.length ? (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <StructureTree
            nodes={expandedNode.children}
            level={level + 1}
            users={users}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ===========================
   Page component
=========================== */
export default function Structure() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [
        { data: deptData, error: deptError },
        { data: userData, error: userError },
      ] = await Promise.all([
        supabase.from("departments").select("id, name, parent_id, is_archived"),
        // include access_level so the "Managers" list works
        supabase
          .from("users")
          .select("id, first_name, last_name, email, department_id, access_level"),
      ]);

      if (!deptError && deptData) setDepartments(deptData as Department[]);
      if (!userError && userData) setUsers(userData as any[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const tree = useMemo(() => {
    // —— CONFIG ——
    const RAW_EXCLUDED_ID = "d8312dc8-b9ba-4d81-b9d3-8e1cb46bb858"; // match your actual root id

    // 1) Use IDs as-is (no normalization)
    const normalizedDepts = departments.map((d) => ({
      id: d.id,
      name: d.name,
      parent_id: d.parent_id,
      is_archived: !!d.is_archived, // treat as boolean
    }));

    // 2) Drop archived, remove the excluded node
    const visible = normalizedDepts.filter(
      (d) =>
        !d.is_archived &&
        d.id !== RAW_EXCLUDED_ID &&
        d.id !== undefined &&
        d.id !== null
    );

    // 3) Promote excluded's direct children: treat their parent as null
    const promoted = visible.map((d) =>
      d.parent_id === RAW_EXCLUDED_ID ? { ...d, parent_id: null } : d
    );

    // 4) Index by parent for quick assembly
    const byParent = new Map<string | null, typeof promoted>();
    for (const d of promoted) {
      const key = d.parent_id ?? null;
      const bucket = byParent.get(key);
      if (bucket) bucket.push(d);
      else byParent.set(key, [d]);
    }

    // 5) Recursive builder
    function build(parentId: string | null): TreeNode[] {
      const children = byParent.get(parentId) ?? [];
      return children
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({
          id: d.id,
          name: d.name,
          children: build(d.id),
        }));
    }

    // Start at root; the excluded node is gone; its kids (if any) appear at root.
    const result = build(null);
    if (result.length === 0) {
      // Debug: show a message if tree is empty
      // eslint-disable-next-line no-console
      console.warn(
        "Org chart tree is empty. Departments:",
        departments,
        "Visible:",
        visible,
        "Promoted:",
        promoted
      );
    }
    return result;
  }, [departments]);

  if (loading) return (
    <div className="neon-panel">
      <div className="text-center py-8 text-neon">Loading…</div>
    </div>
  );

  return (
    <div className="neon-panel" style={{ position: "relative" }}>
      {/* Description and Toggle Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
        justifyContent: 'flex-start'
      }}>
        <CustomTooltip text="Switch between Department view (showing roles and employees) and Manager view (showing management hierarchy)">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>Department</span>
            <button
              onClick={() => window.location.href = '/hr/structure/role-structure'}
              style={{
                width: 44,
                height: 24,
                background: '#22c55e',
                border: 'none',
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                right: 3,
                top: 3,
                width: 18,
                height: 18,
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.2s'
              }} />
            </button>
            <span style={{ fontSize: 12, color: '#fff', whiteSpace: 'nowrap' }}>Manager</span>
          </div>
        </CustomTooltip>
      </div>

      {/* Right-side button group: Assign, Change Manager */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          gap: 8,
        }}
      >
        <AssignManagerButton departments={departments} users={users} onAdded={() => {}} />
        <ChangeManagerButton departments={departments} users={users} />
      </div>

      <StructureTree nodes={tree} level={2} users={users} />
    </div>
  );
}

// Change Manager Button - allows changing a user's manager access level and department
function ChangeManagerButton({
  departments,
  users,
}: {
  departments: Department[];
  users: any[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [toDept, setToDept] = useState("");
  const [makeManager, setMakeManager] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Only non-archived departments
  const visibleDepts = departments.filter((d) => !d.is_archived);
  const deptNames = Array.from(new Set(visibleDepts.map((d) => d.name)));

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const user = users.find((u) => `${u.first_name} ${u.last_name}` === selectedUser);
    const dept = visibleDepts.find((d) => d.name === toDept);
    if (!user) {
      setError("Please select a user.");
      setLoading(false);
      return;
    }
    if (!dept) {
      setError("Please select a department.");
      setLoading(false);
      return;
    }

    // Update user's department and access level
    const updateData: any = { department_id: dept.id };
    if (makeManager) {
      // Set to manager access level if not already
      if (!user.access_level?.toLowerCase().includes("manager")) {
        updateData.access_level = "Manager";
      }
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(`Updated ${selectedUser} to ${makeManager ? 'manager in' : 'moved to'} '${toDept}'.`);
      setOpen(false);
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <CustomTooltip text="Change manager department">
        <button
          className="neon-btn"
          aria-label="Change manager department"
          onClick={() => setOpen(true)}
          type="button"
        >
          {/* Tool/Wrench Icon SVG */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 19.3l-6.1-6.1a7 7 0 0 1-7.2-1.7A7 7 0 0 1 2.5 7.1a7 7 0 0 1 7.1-7.1c1.7 0 3.3.6 4.6 1.7l-2.1 2.1a3 3 0 0 0-4.2 4.2l2.1 2.1a3 3 0 0 0 4.2-4.2l2.1-2.1A7 7 0 0 1 22 7.1a7 7 0 0 1-1.7 7.2 7 7 0 0 1-1.7 7.2z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </CustomTooltip>
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#0008",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "#23232e",
              padding: 24,
              borderRadius: 12,
              minWidth: 320,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>
              Change Manager Assignment
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#fff", fontSize: 13 }}>Select user:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ width: "100%", marginTop: 4, marginBottom: 8 }}
              >
                <option value="">-- Select --</option>
                {users.map((u) => {
                  const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
                  return (
                    <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <label style={{ color: "#fff", fontSize: 13 }}>
                Move to department:
              </label>
              <select
                value={toDept}
                onChange={(e) => setToDept(e.target.value)}
                style={{ width: "100%", marginTop: 4, marginBottom: 12 }}
              >
                <option value="">-- Select --</option>
                {deptNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <label style={{ color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={makeManager}
                  onChange={(e) => setMakeManager(e.target.checked)}
                />
                Set as manager
              </label>
            </div>
            {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                disabled={loading}
                className="neon-btn-confirm"
                style={{ opacity: loading ? 0.6 : 1 }}
                onClick={handleSubmit}
              >
                Submit
              </button>
              <button
                className="neon-btn-back"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Assign Manager Button - assigns a user as a manager to a department
function AssignManagerButton({
  departments,
  users,
  onAdded,
}: {
  departments: Department[];
  users: any[];
  onAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Only non-archived departments
  const visibleDepts = departments.filter((d) => !d.is_archived);

  // Filter users by selected department
  const usersInDept = departmentId
    ? users.filter((u) => u.department_id === departmentId)
    : [];

  // Reset selected user when department changes
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartmentId(e.target.value);
    setSelectedUserId(""); // Reset user selection
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!departmentId) {
      setError("Please select a department.");
      setLoading(false);
      return;
    }

    if (!selectedUserId) {
      setError("Please select a user.");
      setLoading(false);
      return;
    }

    // Update the user's access level to Manager (department already matches)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        access_level: "Manager"
      })
      .eq("id", selectedUserId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("Manager assigned successfully.");
      setOpen(false);
      setSelectedUserId("");
      setDepartmentId("");
      onAdded?.();
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <CustomTooltip text="Assign manager to department">
        <button
          className="neon-btn"
          aria-label="Assign manager to department"
          onClick={() => setOpen(true)}
          type="button"
        >
          {/* Neon Add Icon (plus in a circle) */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="10" stroke="#00fff7" strokeWidth="2" fill="#1e1e28" />
            <line x1="11" y1="6" x2="11" y2="16" stroke="#00fff7" strokeWidth="2" />
            <line x1="6" y1="11" x2="16" y2="11" stroke="#00fff7" strokeWidth="2" />
          </svg>
        </button>
      </CustomTooltip>
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#0008",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "#23232e",
              padding: 24,
              borderRadius: 12,
              minWidth: 320,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>
              Assign Manager
            </div>
            <form onSubmit={handleSubmit}>
              <label style={{ color: "#fff", fontSize: 13 }}>Department:</label>
              <select
                value={departmentId}
                onChange={handleDeptChange}
                style={{
                  width: "100%",
                  marginTop: 4,
                  marginBottom: 12,
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#181824",
                  color: "#fff",
                }}
              >
                <option value="">-- Select department --</option>
                {visibleDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <label style={{ color: "#fff", fontSize: 13 }}>Select user from department:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={!departmentId}
                style={{
                  width: "100%",
                  marginTop: 4,
                  marginBottom: 12,
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#181824",
                  color: "#fff",
                  opacity: !departmentId ? 0.5 : 1,
                  cursor: !departmentId ? "not-allowed" : "pointer",
                }}
              >
                <option value="">-- Select user --</option>
                {usersInDept.map((u) => {
                  const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
                  return (
                    <option key={u.id} value={u.id}>
                      {name}
                    </option>
                  );
                })}
              </select>

              {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
              {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  disabled={loading}
                  className="neon-btn-save"
                  type="submit"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  Assign
                </button>
                <button
                  className="neon-btn-back"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
