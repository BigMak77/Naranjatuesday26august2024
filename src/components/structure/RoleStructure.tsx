"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus, FiTool, FiGlobe } from "react-icons/fi";

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
}

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  is_archived?: boolean;
  level: number; // <-- Add level property
}

interface RoleRow {
  id: string;
  title: string;
  department_id: string | null;
}

/* ===========================
   Tree (centered children rows)
=========================== */
function StructureTree({ nodes, level = 2 }: StructureTreeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  function countPeople(node: TreeNode): number {
    let count = node.roles ? node.roles.length : 0;
    if (node.children?.length) {
      for (const c of node.children) count += countPeople(c);
    }
    return count;
  }

  if (!nodes?.length) return null;

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setExpandedId(null);
      setHighlightedId(null);
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
          flexWrap: "nowrap",
          width: "100%",
          overflowX: "auto", // keep row centered even with many siblings
          paddingBottom: 4,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {nodes.map((node) => {
          const isExpanded = expandedId === node.id;
          // Highlight only the selected parent and its direct children (family)
          const isFamily = isExpanded || (expandedId && expandedNode?.children?.some(child => child.id === node.id));
          // Muted if any node is expanded and this node is not in the family
          const isMuted = !!expandedId && !isFamily;

          return (
            <div
              key={node.id}
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
                  setHighlightedId(next);
                }}
                style={{
                  cursor: node.children?.length ? "pointer" : "default",
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: level === 2 ? (isMuted ? mutedBg : vibrantBg) : "#23232e",
                  border: isExpanded ? "1.5px solid #00fff7" : "1.5px solid #222",
                  color: "#fff",
                  fontWeight: 500,
                  transition: "background 0.2s, border 0.2s",
                  textAlign: "center",
                }}
              >
                {node.name}

                {/* People count */}
                <div style={{ margin: "10px auto 0", display: "flex", justifyContent: "center" }}>
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
                      boxShadow: "0 0 4px #00fff7aa",
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

              {/* Roles inside the card when expanded */}
              {isExpanded && (
                <div style={{ marginTop: 12, textAlign: "left" }}>
                  <div style={{ fontSize: 12, color: "#00fff7", marginBottom: 4, fontWeight: 600 }}>
                    Roles:
                  </div>
                  {node.roles?.length ? (
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {node.roles.map((role, idx) => (
                        <RoleWithUsers
                          key={role.id}
                          roleId={role.id}
                          roleTitle={role.title}
                          departmentId={node.id}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: "#888", fontSize: 12, paddingLeft: 16 }}>(No roles at this level)</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* A single, centered children row for whichever node is expanded at this level */}
      {expandedNode?.children?.length ? (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <StructureTree nodes={expandedNode.children} level={level + 1} />
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
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: deptData, error: deptError }, { data: roleData, error: roleError }] = await Promise.all([
        supabase.from("departments").select("id, name, parent_id, is_archived"),
        supabase.from("roles").select("id, title, department_id"),
      ]);

      if (!deptError && deptData) setDepartments(deptData as Department[]);
      if (!roleError && roleData) setRoles(roleData as RoleRow[]);
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
    const visible = normalizedDepts.filter((d) => !d.is_archived && d.id !== RAW_EXCLUDED_ID && d.id !== undefined && d.id !== null);

    // 3) Promote excluded's direct children: treat their parent as null
    const promoted = visible.map((d) => (d.parent_id === RAW_EXCLUDED_ID ? { ...d, parent_id: null } : d));

    // 4) Index by parent for quick assembly
    const byParent = new Map<string | null, typeof promoted>();
    for (const d of promoted) {
      const key = d.parent_id ?? null;
      const bucket = byParent.get(key);
      if (bucket) bucket.push(d);
      else byParent.set(key, [d]);
    }

    // 5) Map roles -> department (use department_id as-is)
    const rolesByDept = new Map<string, { id: string; title: string }[]>();
    for (const r of roles) {
      const depId = r.department_id;
      if (!depId) continue;
      if (!rolesByDept.has(depId)) rolesByDept.set(depId, []);
      rolesByDept.get(depId)!.push({ id: r.id, title: r.title });
    }

    // 6) Recursive builder
    function build(parentId: string | null): TreeNode[] {
      const children = byParent.get(parentId) ?? [];
      return children
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({
          id: d.id,
          name: d.name,
          children: build(d.id),
          roles: rolesByDept.get(d.id) || [],
        }));
    }

    // Start at root; the excluded node is gone; its kids (if any) appear at root.
    const result = build(null);
    if (result.length === 0) {
      // Debug: show a message if tree is empty
      // eslint-disable-next-line no-console
      console.warn('Org chart tree is empty. Departments:', departments, 'Visible:', visible, 'Promoted:', promoted);
    }
    return result;
  }, [departments, roles]);

  if (loading) return (
    <div className="neon-panel">
      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--neon)' }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      {/* Right-side button group: Add, Amend, Move Role */}
      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10, display: "flex", flexDirection: "row", gap: 8, marginBottom: "1rem" }}>
        <AddDepartmentButton onAdded={() => {}} />
        <AddRoleButton departments={departments} onAdded={() => {}} />
        <AmendDepartmentButton departments={tree} />
        <RoleAmendButton departments={departments} roles={roles} />
      </div>

      <div style={{ paddingTop: "3rem" }}>
        <StructureTree nodes={tree} level={2} />
      </div>
    </div>
  );
}

// Simple amend button and modal for selecting and linking departments
function AmendDepartmentButton({ departments }: { departments: TreeNode[] }) {
  const [open, setOpen] = useState(false);
  const [fromDept, setFromDept] = useState("");
  const [toDept, setToDept] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Flatten all departments for select options
  function flatten(nodes: TreeNode[]): { id: string; name: string }[] {
    let arr: { id: string; name: string }[] = [];
    for (const n of nodes) {
      arr.push({ id: n.id, name: n.name });
      if (n.children) arr = arr.concat(flatten(n.children));
    }
    return arr;
  }
  const allDepts = flatten(departments);
  const allNames = Array.from(new Set(allDepts.map(d => d.name)));

  async function updateDescendantLevels(deptId: string, newLevel: number) {
    // Recursively update all descendants' levels in the DB
    // 1. Find all children
    const { data: children, error } = await supabase
      .from("departments")
      .select("id")
      .eq("parent_id", deptId);
    if (error || !children) return;
    for (const child of children) {
      await supabase.from("departments").update({ level: newLevel + 1 }).eq("id", child.id);
      await updateDescendantLevels(child.id, newLevel + 1);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    // Find ids for selected names
    const from = allDepts.find(d => d.name === fromDept);
    const to = allDepts.find(d => d.name === toDept);
    if (!from || !to) {
      setError("Please select both departments.");
      setLoading(false);
      return;
    }
    // Get new parent's level
    let parentLevel = 1;
    const { data: parentDept, error: parentError } = await supabase
      .from("departments")
      .select("level")
      .eq("id", to.id)
      .single();
    if (!parentError && parentDept && parentDept.level) {
      parentLevel = parentDept.level;
    }
    // Update the parent_id and level of the 'from' department
    const { error: updateError } = await supabase
      .from("departments")
      .update({ parent_id: to.id, level: parentLevel + 1 })
      .eq("id", from.id);
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    // Recursively update all descendants' levels
    await updateDescendantLevels(from.id, parentLevel + 1);
    setSuccess(`Linked '${fromDept}' to new parent '${toDept}'.`);
    setOpen(false);
    window.location.reload();
    setLoading(false);
  }

  return (
    <>
      <NeonIconButton
        variant="edit"
        icon={<FiGlobe />}
        title="Amend department structure"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div style={{ background: "#23232e", padding: 24, borderRadius: 12, minWidth: 320, position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>Amend Department Link</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#fff", fontSize: 13 }}>Select department:</label>
              <select value={fromDept} onChange={e => setFromDept(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 8 }}>
                <option value="">-- Select --</option>
                {allNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <label style={{ color: "#fff", fontSize: 13 }}>Link to new parent:</label>
              <select value={toDept} onChange={e => setToDept(e.target.value)} style={{ width: "100%", marginTop: 4 }}>
                <option value="">-- Select --</option>
                {allNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <NeonIconButton
                variant="submit"
                title="Submit changes"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
                onClick={handleSubmit}
              />
              <NeonIconButton
                variant="cancel"
                title="Cancel"
                onClick={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add a new RoleAmendButton component for role move overlay
function RoleAmendButton({ departments, roles }: { departments: Department[], roles: RoleRow[] }) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [toDept, setToDept] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Only non-archived departments
  const visibleDepts = departments.filter(d => !d.is_archived);
  const deptNames = Array.from(new Set(visibleDepts.map(d => d.name)));
  const roleTitles = Array.from(new Set(roles.map(r => r.title)));

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const role = roles.find(r => r.title === selectedRole);
    const dept = visibleDepts.find(d => d.name === toDept);
    if (!role || !dept) {
      setError("Please select both a role and a department.");
      setLoading(false);
      return;
    }
    // Update the department_id of the selected role
    const { error: updateError } = await supabase
      .from("roles")
      .update({ department_id: dept.id })
      .eq("id", role.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(`Moved role '${selectedRole}' to '${toDept}'.`);
      setOpen(false);
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <NeonIconButton
        variant="edit"
        icon={<FiTool />}
        title="Move role to new department"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div style={{ background: "#23232e", padding: 24, borderRadius: 12, minWidth: 320, position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>Move Role to Department</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#fff", fontSize: 13 }}>Select role:</label>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 8 }}>
                <option value="">-- Select --</option>
                {roleTitles.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
              <label style={{ color: "#fff", fontSize: 13 }}>Move to department:</label>
              <select value={toDept} onChange={e => setToDept(e.target.value)} style={{ width: "100%", marginTop: 4 }}>
                <option value="">-- Select --</option>
                {deptNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <NeonIconButton
                variant="submit"
                title="Submit changes"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
                onClick={handleSubmit}
              />
              <NeonIconButton
                variant="cancel"
                title="Cancel"
                onClick={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add Department Button and Modal
function AddDepartmentButton({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("departments").select("id, name, parent_id, level").then(({ data }) => {
        setDepartments(data || []);
      });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (!name.trim()) {
      setError("Department name is required.");
      setLoading(false);
      return;
    }
    let level = 2;
    if (parentId) {
      // Fetch parent department's level
      const { data: parent, error: parentError } = await supabase
        .from("departments")
        .select("level")
        .eq("id", parentId)
        .single();
      if (parentError) {
        setError("Failed to fetch parent department level.");
        setLoading(false);
        return;
      }
      level = (parent?.level ?? 1) + 1;
    }
    const { error: insertError } = await supabase
      .from("departments")
      .insert({ name: name.trim(), parent_id: parentId, is_archived: false, level });
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Department added.");
      setOpen(false);
      setName("");
      setParentId(null);
      onAdded?.();
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <NeonIconButton
        variant="add"
        title="Add department"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div style={{ background: "#23232e", padding: 24, borderRadius: 12, minWidth: 320, position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>Add Department</div>
            <form onSubmit={handleSubmit}>
              <label style={{ color: "#fff", fontSize: 13 }}>Department name:</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12, padding: 6, borderRadius: 6, border: "1px solid #444", background: "#181824", color: "#fff" }} />
              <label style={{ color: "#fff", fontSize: 13 }}>Parent department (optional):</label>
              <select value={parentId || ""} onChange={e => setParentId(e.target.value || null)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }}>
                <option value="">-- None (top level) --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
              {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <NeonIconButton
                  variant="add"
                  title="Add department"
                  disabled={loading}
                  type="submit"
                  style={{ opacity: loading ? 0.6 : 1 }}
                />
                <NeonIconButton
                  variant="cancel"
                  title="Cancel"
                  onClick={() => setOpen(false)}
                  type="button"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Add Role Button and Modal
function AddRoleButton({ departments, onAdded }: { departments: Department[]; onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Only non-archived departments
  const visibleDepts = departments.filter(d => !d.is_archived);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (!title.trim()) {
      setError("Role title is required.");
      setLoading(false);
      return;
    }
    if (!departmentId) {
      setError("Please select a department.");
      setLoading(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("roles")
      .insert({ title: title.trim(), department_id: departmentId });
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Role added.");
      setOpen(false);
      setTitle("");
      setDepartmentId("");
      onAdded?.();
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <NeonIconButton
        variant="add"
        title="Add role"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div style={{ background: "#23232e", padding: 24, borderRadius: 12, minWidth: 320, position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>Add Role</div>
            <form onSubmit={handleSubmit}>
              <label style={{ color: "#fff", fontSize: 13 }}>Role title:</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12, padding: 6, borderRadius: 6, border: "1px solid #444", background: "#181824", color: "#fff" }} />
              <label style={{ color: "#fff", fontSize: 13 }}>Department:</label>
              <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }}>
                <option value="">-- Select department --</option>
                {visibleDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
              {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <NeonIconButton
                  variant="add"
                  title="Add role"
                  disabled={loading}
                  type="submit"
                  style={{ opacity: loading ? 0.6 : 1 }}
                />
                <NeonIconButton
                  variant="cancel"
                  title="Cancel"
                  onClick={() => setOpen(false)}
                  type="button"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// RoleWithUsers component
function RoleWithUsers({ roleId, roleTitle, departmentId }: { roleId: string; roleTitle: string; departmentId: string }) {
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (showUsers) {
      setShowUsers(false);
      return;
    }
    setLoading(true);
    setError(null);
    setShowUsers(true);
    // Fetch users for this role and department
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("role_id", roleId)
        .eq("department_id", departmentId);
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <li
        style={{
          color: "#fff",
          fontSize: 12,
          marginBottom: 2,
          cursor: "pointer",
          textDecoration: "underline dotted #00fff7",
          position: "relative",
        }}
        onClick={handleClick}
      >
        {roleTitle}
      </li>
      {showUsers && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#0008",
            zIndex: 2147483647,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowUsers(false)}
        >
          <div
            style={{
              background: "#23232e",
              color: "#00fff7",
              borderRadius: 10,
              padding: 24,
              minWidth: 280,
              maxWidth: 400,
              maxHeight: "60vh",
              overflowY: "auto",
              boxShadow: "0 2px 32px #000c, 0 0 0 2px #00fff7aa",
              position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, color: "#00fff7", marginBottom: 12, fontSize: 16 }}>
              Users for: <span style={{ color: "#fff" }}>{roleTitle}</span>
            </div>
            {loading ? (
              <div>Loading users…</div>
            ) : error ? (
              <div style={{ color: "#ff4444" }}>{error}</div>
            ) : users && users.length === 0 ? (
              <div style={{ color: "#888" }}>(No users found)</div>
            ) : Array.isArray(users) && users.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {users.map((u) => (
                  <li key={u.id} style={{ color: "#fff", fontSize: 13, marginBottom: 6 }}>
                    {`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || u.id}
                    {u.email ? <span style={{ color: '#00fff7', fontSize: 12 }}> ({u.email})</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <NeonIconButton
                variant="close"
                title="Close"
                onClick={() => setShowUsers(false)}
                type="button"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
