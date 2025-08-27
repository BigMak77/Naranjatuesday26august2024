"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  FiArchive,
  FiEdit,
  FiUsers,
  FiTool,
  FiUmbrella,
  FiGrid,
  FiPlus,
} from "react-icons/fi";
import Link from "next/link";
import NeonIconButton from "@/components/ui/NeonIconButton";
import NeonDualListbox from "@/components/ui/NeonDualListbox";

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  is_archived?: boolean;
  level: number;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
}

const ROOT_DEPT_ID = "00000000-0000-0000-0000-000000000000";

type RolesByDept = Record<string, Role[]>;
type ExpandedMap = Record<string, boolean>;

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rolesByDept, setRolesByDept] = useState<RolesByDept>({});
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleEditTitle, setRoleEditTitle] = useState("");
  const [roleEditDeptId, setRoleEditDeptId] = useState("");
  const [roleEditArchived, setRoleEditArchived] = useState(false);
  const [deptEditName, setDeptEditName] = useState("");
  const [deptEditArchived, setDeptEditArchived] = useState(false);
  const [showModalFor, setShowModalFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: deptData }, { data: roleData }] = await Promise.all([
        supabase.from("departments").select("id, name, parent_id, is_archived, level"),
        supabase.from("roles").select("id, title, department_id"),
      ]);
      if (deptData) setDepartments(deptData);
      const grouped: RolesByDept = {};
      for (const role of roleData || []) {
        if (!grouped[role.department_id]) grouped[role.department_id] = [];
        grouped[role.department_id].push(role);
      }
      setRolesByDept(grouped);
    };
    fetchData();
  }, []);

  const toggleExpand = (deptId: string) => {
    setExpanded((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const setActiveAndExpand = (deptId: string, path: string[]) => {
    setActiveDeptId(deptId);
    // Expand the full path to the active department
    const expandedMap: ExpandedMap = {};
    path.forEach((_, idx) => {
      const ancestorId = departments.find((d) => d.name === path[idx])?.id;
      if (ancestorId) expandedMap[ancestorId] = true;
    });
    expandedMap[deptId] = true;
    setExpanded(expandedMap);
  };

  const handleDeptEditSave = async (deptId: string) => {
    const { error } = await supabase
      .from("departments")
      .update({ name: deptEditName, is_archived: deptEditArchived })
      .eq("id", deptId);
    if (!error) {
      setEditingDeptId(null);
      setDeptEditName("");
      setDeptEditArchived(false);
      const { data } = await supabase
        .from("departments")
        .select("id, name, parent_id, is_archived, level");
      if (data) setDepartments(data);
    }
  };

  const handleDeptArchive = async (deptId: string) => {
    const { error } = await supabase
      .from("departments")
      .update({ is_archived: true })
      .eq("id", deptId);
    if (!error) {
      setDepartments(
        departments.map((d) =>
          d.id === deptId ? { ...d, is_archived: true } : d,
        ),
      );
    }
  };

  // Helper: build tree from departments
  function buildTree(departments: Department[]) {
    const map: Record<string, Department[]> = {};
    departments.forEach((dept) => {
      const parent = dept.parent_id ?? 'root';
      if (!map[parent]) map[parent] = [];
      map[parent].push(dept);
    });
    return map;
  }

  // Helper: find department by id
  function findDept(id: string, departments: Department[]) {
    return departments.find((d) => d.id === id);
  }

  // Render tree recursively with joining lines
  function renderTree(parentId: string = 'root', level: number = 0) {
    const tree = buildTree(departments);
    const children = tree[parentId] || [];
    return (
      <div className="org-chart-branch" style={{ position: 'relative', marginLeft: level * 40 }}>
        {children.map((dept, idx) => {
          const isExpanded = expanded[dept.id] ?? true;
          return (
            <div key={dept.id} style={{ position: 'relative', marginBottom: 40 }}>
              {/* Joining line to parent */}
              {parentId !== 'root' && (
                <div
                  className="org-chart-join-line"
                  style={{
                    position: 'absolute',
                    left: -20,
                    top: 32,
                    width: 20,
                    height: 3,
                    background: 'var(--neon)',
                    borderRadius: 2,
                    opacity: 0.7,
                  }}
                />
              )}
              <div
                className={`org-chart-node neon-card org-chart-dept-card ${activeDeptId === dept.id ? 'neon-glow' : ''} ${dept.is_archived ? 'opacity-50 grayscale' : ''}`}
                style={{
                  position: 'relative',
                  transition: 'box-shadow .2s',
                  minWidth: 260,
                  minHeight: 80,
                  padding: '1.5rem 2rem',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  boxShadow: '0 0 24px var(--neon)',
                  border: '2px solid var(--neon)',
                  background: 'var(--panel)',
                  color: 'var(--neon)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
                onMouseEnter={() => setActiveDeptId(dept.id)}
                onMouseLeave={() => setActiveDeptId(null)}
              >
                <div className="org-chart-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <NeonIconButton
                    as="button"
                    variant={isExpanded ? 'back' : 'view'}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                    onClick={() => toggleExpand(dept.id)}
                  />
                  <span className="org-chart-title" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{dept.name}</span>
                  {dept.is_archived && <span className="org-chart-archived neon-badge">Archived</span>}
                  <NeonIconButton as="button" variant="edit" title="Edit Department" onClick={() => {
                    setEditingDeptId(dept.id);
                    setDeptEditName(dept.name);
                    setDeptEditArchived(!!dept.is_archived);
                    setNewParentId(dept.parent_id ?? 'root');
                  }} />
                  <NeonIconButton as="button" variant="archive" title="Archive Department" onClick={() => handleDeptArchive(dept.id)} />
                  <NeonIconButton as="button" variant="view" title="Show Roles" onClick={() => setShowModalFor(dept.id)}>
                    <FiGrid />
                  </NeonIconButton>
                </div>
                {/* Roles as subtle badges below department name */}
                <div className="org-chart-role-badges-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 4 }}>
                  {(rolesByDept[dept.id] || []).map((role) => (
                    <span key={role.id} className="org-chart-role-badge neon-badge" style={{ fontSize: '0.9rem', padding: '2px 10px', background: 'var(--panel)', color: 'var(--neon)', border: '1px solid var(--neon)', borderRadius: 12, opacity: 0.7 }}>
                      <FiUsers className="org-chart-role-icon" style={{ marginRight: 4, fontSize: '1rem' }} /> {role.title}
                    </span>
                  ))}
                  {!(rolesByDept[dept.id] || []).length && (
                    <span className="text-xs opacity-40">No roles</span>
                  )}
                </div>
                {editingDeptId === dept.id && (
                  <div className="org-chart-edit-popover neon-card" style={{ position: 'absolute', top: 60, right: 8, zIndex: 10, background: 'var(--panel)', boxShadow: '0 0 16px var(--neon)', padding: 16, borderRadius: 12 }}>
                    <input
                      type="text"
                      value={deptEditName}
                      onChange={(e) => setDeptEditName(e.target.value)}
                      className="neon-input"
                      placeholder="Department Name"
                    />
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={deptEditArchived}
                        onChange={(e) => setDeptEditArchived(e.target.checked)}
                      />
                      Archive
                    </label>
                    <label className="text-sm flex items-center gap-2 mt-2">
                      Move to:
                      <select
                        value={newParentId ?? 'root'}
                        onChange={(e) => setNewParentId(e.target.value)}
                        className="neon-input"
                        style={{ minWidth: 120 }}
                      >
                        <option value="root">Top Level</option>
                        {departments.filter(d => d.id !== dept.id).map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </label>
                    <div className="flex gap-2 mt-2">
                      <NeonIconButton as="button" variant="save" title="Save Department" onClick={() => handleDeptEditSaveWithMove(dept.id)} />
                      <NeonIconButton as="button" variant="close" title="Cancel" className="neon-btn-close" onClick={() => setEditingDeptId(null)} />
                    </div>
                  </div>
                )}
                {showModalFor === dept.id && (
                  <div className="org-chart-roles-modal neon-card" style={{ position: 'absolute', top: 60, left: 0, zIndex: 20, background: 'var(--panel)', boxShadow: '0 0 24px var(--neon)', padding: 20, borderRadius: 16, minWidth: 340 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--neon)' }}>Manage Roles for {dept.name}</span>
                      <NeonIconButton as="button" variant="cancel" title="Close" onClick={() => setShowModalFor(null)} />
                    </div>
                    <NeonDualListbox
                      items={Object.values(rolesByDept).flat().map(role => ({ id: role.id, label: role.title }))}
                      selected={(rolesByDept[dept.id] || []).map(role => role.id)}
                      onChange={async (selectedIds) => {
                        // Remove all roles from this dept, then add selected
                        const allRoleIds = (rolesByDept[dept.id] || []).map(r => r.id);
                        // Remove roles
                        for (const roleId of allRoleIds) {
                          await supabase.from('roles').update({ department_id: null }).eq('id', roleId);
                        }
                        // Add selected roles
                        for (const roleId of selectedIds) {
                          await supabase.from('roles').update({ department_id: dept.id }).eq('id', roleId);
                        }
                        // Refresh rolesByDept
                        const { data: roleData } = await supabase.from('roles').select('id, title, department_id');
                        const grouped: RolesByDept = {};
                        for (const role of roleData || []) {
                          if (!grouped[role.department_id]) grouped[role.department_id] = [];
                          grouped[role.department_id].push(role);
                        }
                        setRolesByDept(grouped);
                      }}
                      titleLeft="Available Roles"
                      titleRight="Assigned Roles"
                    />
                  </div>
                )}
                {/* Children */}
                {isExpanded && renderTree(dept.id, level + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Save department edit, including move to new parent
  async function handleDeptEditSaveWithMove(deptId: string) {
    const { error } = await supabase
      .from("departments")
      .update({ name: deptEditName, is_archived: deptEditArchived, parent_id: newParentId === 'root' ? null : newParentId })
      .eq("id", deptId);
    if (!error) {
      setEditingDeptId(null);
      setDeptEditName("");
      setDeptEditArchived(false);
      setNewParentId(null);
      const { data } = await supabase
        .from("departments")
        .select("id, name, parent_id, is_archived, level");
      if (data) setDepartments(data);
    }
  }

  return (
    <main className="org-chart-main neon-panel neon-form-padding">
      <section className="org-chart-section">
        <div className="org-chart-container">
          <h1 className="neon-form-title org-chart-page-title" style={{ marginBottom: '2rem', color: 'var(--neon)' }}>
            <FiUsers style={{ marginRight: 8, verticalAlign: 'middle' }} /> Organisation Chart
          </h1>
          <div className="org-chart-toolbar" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <NeonIconButton variant="add" icon={<FiPlus />} title="Add Department" />
            <Link href="/admin/roles/add" className="neon-btn neon-btn-orgchart" title="Add Role" aria-label="Add Role">
              <FiTool className="org-chart-toolbar-icon" />
            </Link>
          </div>
          {departments.length === 0 ? (
            <div className="org-chart-empty neon-panel neon-form-padding" style={{ textAlign: 'center', color: 'var(--neon)', fontSize: '1.1rem' }}>
              <FiUsers size={32} style={{ marginBottom: 8 }} />
              Loading organisation chart...
            </div>
          ) : (
            <div className="org-chart-tree" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {renderTree('root', 0)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
