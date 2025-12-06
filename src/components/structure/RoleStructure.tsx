"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import TextIconButton from "@/components/ui/TextIconButtons";
import OverlayDialog from "@/components/ui/OverlayDialog";
import DualPaneSelector from "@/components/ui/DualPaneSelector";
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Expose refresh function via window for parent components
  useEffect(() => {
    (window as any).refreshRoleStructure = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    return () => {
      delete (window as any).refreshRoleStructure;
    };
  }, []);

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
  }, [refreshTrigger]);

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
      {/* Buttons moved to parent FolderTabs toolbar */}
      <StructureTree nodes={tree} level={2} />
    </div>
  );
}

// Simple amend button and modal for selecting and linking departments
export function AmendDepartmentButton({ departments }: { departments: TreeNode[] }) {
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
      <TextIconButton
        variant="edit"
        icon={<FiGlobe />}
        label="Amend department structure"
        onClick={() => setOpen(true)}
      />
      <OverlayDialog
        open={open}
        onClose={() => setOpen(false)}
        width={400}
        showCloseButton={true}
      >
        <div style={{ padding: 24 }}>
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
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            <TextIconButton
              variant="submit"
              label="Submit changes"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}

// Add a new RoleAmendButton component for role move overlay
export function RoleAmendButton({ departments, roles }: { departments: Department[], roles: RoleRow[] }) {
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
      <TextIconButton
        variant="edit"
        icon={<FiTool />}
        label="Move role to new department"
        onClick={() => setOpen(true)}
      />
      <OverlayDialog
        open={open}
        onClose={() => setOpen(false)}
        width={400}
        showCloseButton={true}
      >
        <div style={{ padding: 24 }}>
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
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            <TextIconButton
              variant="submit"
              label="Submit changes"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}

// Add Department Button and Modal
export function AddDepartmentButton({ onAdded }: { onAdded?: () => void }) {
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
      <TextIconButton
        variant="add"
        label="Add new department"
        onClick={() => setOpen(true)}
      />
      <OverlayDialog
        open={open}
        onClose={() => setOpen(false)}
        width={400}
        showCloseButton={true}
      >
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>Add Department</div>
          <form onSubmit={handleSubmit}>
            <label style={{ color: "#fff", fontSize: 13 }}>Department name:</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12, padding: 6, borderRadius: 6, border: "1px solid #444", background: "#181824", color: "#fff" }} />
            <label style={{ color: "#fff", fontSize: 13 }}>Parent department (optional):</label>
            <select value={parentId || ""} onChange={e => setParentId(e.target.value || null)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }}>
              <option value="">-- None (top level) --</option>
              {departments.sort((a, b) => a.name.localeCompare(b.name)).map(d => <option key={d.id} value={d.id}>{d.name} [{d.level}]</option>)}
            </select>
            {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: "#00ff99", marginBottom: 8 }}>{success}</div>}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <TextIconButton
                variant="submit"
                label="Submit new department"
                disabled={loading}
                type="submit"
                style={{ opacity: loading ? 0.6 : 1 }}
              />
            </div>
          </form>
        </div>
      </OverlayDialog>
    </>
  );
}

// Add Role Button and Modal
export function AddRoleButton({ departments, onAdded }: { departments: Department[]; onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'create' | 'confirm' | 'assign'>('create');
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [createdRoleId, setCreatedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modules, setModules] = useState<{ value: string; label: string }[]>([]);
  const [documents, setDocuments] = useState<{ value: string; label: string }[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [assignmentStep, setAssignmentStep] = useState<'modules' | 'documents'>('modules');

  // Only non-archived departments
  const visibleDepts = departments.filter(d => !d.is_archived);

  // Fetch modules and documents when needed
  useEffect(() => {
    if (stage === 'assign') {
      async function fetchTrainingContent() {
        const { data: modulesData } = await supabase.from("modules").select("id, name");
        const { data: documentsData } = await supabase.from("documents").select("id, title");
        setModules(
          (modulesData || [])
            .map((m: any) => ({ value: m.id, label: m.name }))
            .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
        );
        setDocuments(
          (documentsData || [])
            .map((d: any) => ({ value: d.id, label: d.title }))
            .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
        );
      }
      fetchTrainingContent();
    }
  }, [stage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    const { data, error: insertError } = await supabase
      .from("roles")
      .insert({ title: title.trim(), department_id: departmentId })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      setCreatedRoleId(data.id);
      setLoading(false);
      setStage('confirm');
    }
  }

  async function handleSaveTraining() {
    setLoading(true);
    setError(null);

    // Clear existing assignments (shouldn't be any, but just in case)
    await supabase.from("role_assignments").delete().eq("role_id", createdRoleId);

    // Insert new assignments
    if (selectedModules.length > 0 || selectedDocuments.length > 0) {
      const moduleRows = selectedModules.map((item_id: string) => ({
        role_id: createdRoleId,
        item_id,
        module_id: item_id,
        document_id: null,
        type: "module"
      }));
      const documentRows = selectedDocuments.map((item_id: string) => ({
        role_id: createdRoleId,
        item_id,
        module_id: null,
        document_id: item_id,
        type: "document"
      }));
      const allRows = [...moduleRows, ...documentRows];
      const { error: assignmentError } = await supabase.from("role_assignments").insert(allRows);

      if (assignmentError) {
        setError(assignmentError.message);
        setLoading(false);
        return;
      }
    }

    // Sync training for users with this role
    const { data: users } = await supabase.from("users").select("auth_id").eq("role_id", createdRoleId);
    const authIds = (users || []).map((u: any) => u.auth_id);
    if (authIds.length > 0) {
      await fetch("/api/sync-training-from-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: createdRoleId, auth_ids: authIds }),
      });
    }

    setLoading(false);
    handleClose();
    onAdded?.();
  }

  function handleClose() {
    setOpen(false);
    setStage('create');
    setTitle("");
    setDepartmentId("");
    setCreatedRoleId("");
    setError(null);
    setSelectedModules([]);
    setSelectedDocuments([]);
    setAssignmentStep('modules');
  }

  function handleNoTraining() {
    handleClose();
    onAdded?.();
  }

  return (
    <>
      <TextIconButton
        variant="add"
        label="Add new role"
        onClick={() => setOpen(true)}
      />
      <OverlayDialog
        open={open}
        onClose={handleClose}
        width={stage === 'assign' ? 1000 : 400}
        showCloseButton={true}
      >
        <div style={{ padding: 24 }}>
          {/* Stage 1: Create Role */}
          {stage === 'create' && (
            <>
              <div style={{ fontWeight: 600, color: "#fff", marginBottom: 12 }}>Add New Role</div>
              <form onSubmit={handleSubmit}>
                <label style={{ color: "#fff", fontSize: 13, display: "block", marginBottom: 4 }}>Role Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: "100%", marginBottom: 12, padding: 6, borderRadius: 6, border: "1px solid #444", background: "#181824", color: "#fff" }}
                  required
                  disabled={loading}
                />
                <label style={{ color: "#fff", fontSize: 13, display: "block", marginBottom: 4 }}>Department</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  style={{ width: "100%", marginBottom: 12, padding: 6, borderRadius: 6, border: "1px solid #444", background: "#181824", color: "#fff" }}
                  required
                  disabled={loading}
                >
                  <option value="">-- Select Department --</option>
                  {visibleDepts.sort((a, b) => a.name.localeCompare(b.name)).map(d => <option key={d.id} value={d.id}>{d.name} [{d.level}]</option>)}
                </select>
                {error && <div style={{ color: "#ff4444", marginBottom: 8 }}>{error}</div>}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <TextIconButton
                    variant="submit"
                    label="Submit new role"
                    disabled={loading}
                    type="submit"
                    style={{ opacity: loading ? 0.6 : 1 }}
                  />
                </div>
              </form>
            </>
          )}

          {/* Stage 2: Confirm Training Assignment */}
          {stage === 'confirm' && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "350px",
              padding: "40px 24px"
            }}>
              {/* Success Icon */}
              <div style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "#00cc99",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28
              }}>
                <div style={{
                  fontSize: 60,
                  color: "#1e1e28",
                  fontWeight: 900,
                  lineHeight: 1
                }}>
                  ✓
                </div>
              </div>

              {/* Success Message */}
              <div style={{
                textAlign: "center",
                marginBottom: 36
              }}>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#00cc99",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>
                  Role Created Successfully!
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 20
                }}>
                  {title}
                </div>
                <p style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: 1.6
                }}>
                  Would you like to assign training to this role now?
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                <TextIconButton
                  variant="submit"
                  label="Yes, assign training"
                  onClick={() => setStage('assign')}
                />
                <TextIconButton
                  variant="secondary"
                  label="No, finish"
                  onClick={handleNoTraining}
                />
              </div>
            </div>
          )}

          {/* Stage 3: Assign Training */}
          {stage === 'assign' && (
            <>
              <div style={{ fontWeight: 600, color: "#fff", marginBottom: 16 }}>
                {assignmentStep === 'modules' ? 'Step 1: Select Modules' : 'Step 2: Select Documents'} for {title}
              </div>

              {assignmentStep === 'modules' && (
                <>
                  <DualPaneSelector
                    availableOptions={modules}
                    selectedValues={selectedModules}
                    onSelectionChange={setSelectedModules}
                    availableTitle="Available Modules"
                    selectedTitle="Assigned Modules"
                    searchPlaceholder="Search modules..."
                  />
                  {error && <div style={{ color: "#ff4444", marginTop: 8 }}>{error}</div>}
                  <div style={{ marginTop: 16, display: "flex", gap: "12px", justifyContent: "space-between" }}>
                    <TextIconButton
                      variant="back"
                      label="Go Back"
                      onClick={() => setStage('confirm')}
                    />
                    <TextIconButton
                      variant="next"
                      label="Next Step"
                      onClick={() => setAssignmentStep('documents')}
                    />
                  </div>
                </>
              )}

              {assignmentStep === 'documents' && (
                <>
                  <DualPaneSelector
                    availableOptions={documents}
                    selectedValues={selectedDocuments}
                    onSelectionChange={setSelectedDocuments}
                    availableTitle="Available Documents"
                    selectedTitle="Assigned Documents"
                    searchPlaceholder="Search documents..."
                  />
                  {error && <div style={{ color: "#ff4444", marginTop: 8 }}>{error}</div>}
                  <div style={{ marginTop: 16, display: "flex", gap: "12px", justifyContent: "space-between" }}>
                    <TextIconButton
                      variant="back"
                      label="Go Back"
                      onClick={() => setAssignmentStep('modules')}
                    />
                    <TextIconButton
                      variant="save"
                      label="Save Assignments"
                      onClick={handleSaveTraining}
                      disabled={loading}
                      style={{ opacity: loading ? 0.6 : 1 }}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </OverlayDialog>
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
      <OverlayDialog
        open={showUsers}
        onClose={() => setShowUsers(false)}
        width={400}
        showCloseButton={true}
        zIndexOverlay={2147483647}
        zIndexContent={2147483648}
      >
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, color: "#00fff7", marginBottom: 12, fontSize: 16 }}>
            Users for: <span style={{ color: "#fff" }}>{roleTitle}</span>
          </div>
          {loading ? (
            <div style={{ color: "#00fff7" }}>Loading users…</div>
          ) : error ? (
            <div style={{ color: "#ff4444" }}>{error}</div>
          ) : users && users.length === 0 ? (
            <div style={{ color: "#888" }}>(No users found)</div>
          ) : Array.isArray(users) && users.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", maxHeight: "50vh", overflowY: "auto" }}>
              {users.map((u) => (
                <li key={u.id} style={{ color: "#fff", fontSize: 13, marginBottom: 6 }}>
                  {`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || u.id}
                  {u.email ? <span style={{ color: '#00fff7', fontSize: 12 }}> ({u.email})</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </OverlayDialog>
    </>
  );
}
