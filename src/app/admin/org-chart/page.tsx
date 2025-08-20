/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiArchive, FiChevronDown, FiChevronRight, FiEdit, FiPlus, FiUsers, FiTool, FiUmbrella } from 'react-icons/fi'
import Link from 'next/link'
import NeonPanel from '@/components/NeonPanel'
import NeonIconButton from '@/components/ui/NeonIconButton'

interface Department {
  id: string
  name: string
  parent_id: string | null
  is_archived?: boolean
}

interface Role {
  id: string
  title: string
  department_id: string
}

const ROOT_DEPT_ID = '00000000-0000-0000-0000-000000000000'

type RolesByDept = Record<string, Role[]>
type ExpandedMap = Record<string, boolean>

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [rolesByDept, setRolesByDept] = useState<RolesByDept>({})
  const [expanded, setExpanded] = useState<ExpandedMap>({})
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null)
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
  const [newParentId, setNewParentId] = useState<string | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [roleEditTitle, setRoleEditTitle] = useState('')
  const [roleEditDeptId, setRoleEditDeptId] = useState('')
  const [roleEditArchived, setRoleEditArchived] = useState(false)
  const [deptEditName, setDeptEditName] = useState('')
  const [deptEditArchived, setDeptEditArchived] = useState(false)
  const [showModalFor, setShowModalFor] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: deptData }, { data: roleData }] = await Promise.all([
        supabase.from('departments').select('id, name, parent_id, is_archived'),
        supabase.from('roles').select('id, title, department_id')
      ])

      console.log('Fetched departments:', deptData)
      if (deptData) setDepartments(deptData)

      const grouped: RolesByDept = {}
      for (const role of roleData || []) {
        if (!grouped[role.department_id]) grouped[role.department_id] = []
        grouped[role.department_id].push(role)
      }
      setRolesByDept(grouped)
    }

    fetchData()
    // Remove console.log for production
  }, [])

  const toggleExpand = (deptId: string) => {
    setExpanded(prev => ({ ...prev, [deptId]: !prev[deptId] }))
  }

  const setActiveAndExpand = (deptId: string, path: string[]) => {
    setActiveDeptId(deptId)
    // Expand the full path to the active department
    const expandedMap: ExpandedMap = {}
    path.forEach((_, idx) => {
      const ancestorId = departments.find(d => d.name === path[idx])?.id
      if (ancestorId) expandedMap[ancestorId] = true
    })
    expandedMap[deptId] = true
    setExpanded(expandedMap)
  }

  const buildTree = (items: Department[]) => {
    const tree: Record<string, Department[]> = {}
    for (const dept of items) {
      const parentKey = dept.parent_id === null ? 'root' : dept.parent_id
      if (!tree[parentKey]) tree[parentKey] = []
      tree[parentKey].push(dept)
    }
    return tree
  }

  const getDescendants = (deptId: string, tree: Record<string, Department[]>, visited = new Set<string>()) => {
    const children = tree[deptId] || []
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id)
        getDescendants(child.id, tree, visited)
      }
    }
    return visited
  }

  const handleDeptEditSave = async (deptId: string) => {
    const { error } = await supabase.from('departments').update({ name: deptEditName, is_archived: deptEditArchived }).eq('id', deptId)
    if (!error) {
      setEditingDeptId(null)
      setDeptEditName('')
      setDeptEditArchived(false)
      const { data } = await supabase.from('departments').select('id, name, parent_id, is_archived')
      if (data) setDepartments(data)
    }
  }

  const handleDeptArchive = async (deptId: string) => {
    const { error } = await supabase.from('departments').update({ is_archived: true }).eq('id', deptId)
    if (!error) {
      setDepartments(departments.map(d => d.id === deptId ? { ...d, is_archived: true } : d))
    }
  }

  const tree = buildTree(departments)
  console.log('Org chart tree keys:', Object.keys(tree))
  console.log('Org chart tree:', tree)

  const renderBranch = (parentId: string, level = 0, path: string[] = []) => {
    const children = tree[parentId] || []
    if (children.length === 0) {
      return <div className="text-gray-500 text-xs ml-4">No departments found for key: {parentId}. Available keys: {Object.keys(tree).join(', ')}</div>
    }
    return children.map((dept) => (
      <DeptNode key={dept.id} dept={dept} level={level} path={path} />
    ))
  }

  const DeptNode = ({ dept, level, path }: { dept: Department; level: number; path: string[] }) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const currentPath = [...path, dept.name]
    const descendants = getDescendants(dept.id, tree)

    const handleExpand = () => {
      // Optionally, you can keep the logic for future use, but currently expandDirection is not used.
      setActiveAndExpand(dept.id, currentPath)
    }
    return (
      <NeonPanel
        className={
          [
            'org-chart-panel',
            activeDeptId === dept.id ? 'neon-glow z-50' : 'z-10',
            dept.is_archived ? 'opacity-50 grayscale' : ''
          ].filter(Boolean).join(' ')
        }
      >
        <div
          ref={cardRef}
          className="org-chart-header"
          onClick={handleExpand}
        >
          <div className="org-chart-header-main">
            {expanded[dept.id] ? <FiChevronDown className="org-chart-chevron" /> : <FiChevronRight className="org-chart-chevron" />}
            <h2 className="neon-form-title org-chart-title">{dept.name}</h2>
            {dept.is_archived && <span className="org-chart-archived">Archived</span>}
          </div>
          <div className="org-chart-header-actions">
            <span className="org-chart-path">{currentPath.join(' › ')}</span>
            <NeonIconButton
              as="button"
              variant="edit"
              icon={<FiEdit className="org-chart-action-icon" />}
              title="Edit Department"
              onClick={(e) => {
                e.stopPropagation()
                setEditingDeptId(dept.id)
                setDeptEditName(dept.name)
              }}
              className="org-chart-btn ml-2"
            />
            {!dept.is_archived && (
              <NeonIconButton
                as="button"
                variant="archive"
                icon={<FiArchive className="org-chart-action-icon" />}
                title="Archive Department"
                onClick={e => {
                  e.stopPropagation();
                  handleDeptArchive(dept.id)
                }}
                className="org-chart-btn ml-2"
              />
            )}
          </div>
        </div>
        {expanded[dept.id] && (
          <div className="org-chart-roles">
            <span className="org-chart-roles-label">Associated roles to this department:</span>
            <div className="org-chart-roles-list">
              {(rolesByDept[dept.id] || []).map((role) => (
                <div key={role.id} className="org-chart-role-item">
                  {editingRoleId === role.id ? (
                    <form
                      className="org-chart-role-edit-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await supabase.from('roles').update({ title: roleEditTitle, department_id: roleEditDeptId }).eq('id', role.id)
                        setEditingRoleId(null)
                        setRoleEditTitle('')
                        setRoleEditDeptId('')
                        // Refetch roles and update rolesByDept
                        const { data: roleData } = await supabase.from('roles').select('id, title, department_id')
                        const grouped: RolesByDept = {}
                        for (const r of roleData || []) {
                          if (!grouped[r.department_id]) grouped[r.department_id] = []
                          grouped[r.department_id].push(r)
                        }
                        setRolesByDept(grouped)
                      }}
                    >
                      <input
                        type="text"
                        value={roleEditTitle}
                        onChange={e => setRoleEditTitle(e.target.value)}
                        className="neon-input"
                        placeholder="Role Title"
                      />
                      <select
                        value={roleEditDeptId}
                        onChange={e => setRoleEditDeptId(e.target.value)}
                        className="neon-input"
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="neon-btn neon-btn-save org-chart-btn"
                        data-variant="save"
                      >
                        <span style={{marginRight: '0.5em'}}>Save</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoleId(null)
                          setRoleEditTitle('')
                          setRoleEditDeptId('')
                        }}
                        className="neon-btn neon-btn-danger org-chart-btn"
                        data-variant="close"
                      >
                        <span style={{marginRight: '0.5em'}}>Cancel</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </form>
                  ) : (
                    <span
                      className="org-chart-role-badge"
                      onClick={() => {
                        setEditingRoleId(role.id)
                        setRoleEditTitle(role.title)
                        setRoleEditDeptId(role.department_id)
                      }}
                      title="Edit Role"
                    >
                      <FiUsers className="org-chart-role-icon" /> {role.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="org-chart-actions">
              <Link href={`/admin/departments/add?parent_id=${dept.id}`} className="neon-btn neon-btn-add org-chart-btn">
                <FiUmbrella className="org-chart-toolbar-icon" />
              </Link>
              <NeonIconButton
                as="button"
                variant="refresh"
                icon={<FiChevronRight className="org-chart-toolbar-icon" />}
                title="Change Parent Department"
                onClick={() => {
                  setShowModalFor(dept.id)
                  setNewParentId(null)
                }}
                className="neon-btn neon-btn-orgchart org-chart-btn ml-2"
              />
              <Link href={`/admin/roles/add?department_id=${dept.id}`} className="neon-btn neon-btn-orgchart org-chart-btn">
                <FiTool className="org-chart-toolbar-icon" />
              </Link>
            </div>
            {showModalFor === dept.id && (
              <NeonPanel className="org-chart-modal-panel">
                <label className="org-chart-modal-label">Select New Parent Department:</label>
                <select
                  value={newParentId ?? ''}
                  onChange={e => setNewParentId(e.target.value === '' ? null : e.target.value)}
                  className="neon-input"
                >
                  <option value="">No Parent (Top Level)</option>
                  {departments.filter(d => d.id !== dept.id).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div className="org-chart-modal-actions">
                  <button
                    onClick={async () => {
                      const parentUUID = newParentId === '' ? null : newParentId;
                      const { error } = await supabase.rpc('update_department_parent', {
                        dept_to_move: dept.id,
                        new_parent: parentUUID
                      });
                      if (error) {
                        alert('Error: ' + error.message);
                      } else {
                        const { data: updatedDepartments } = await supabase.from('departments').select('id, name, parent_id, is_archived');
                        if (updatedDepartments) setDepartments(updatedDepartments);
                        setShowModalFor(null);
                        setNewParentId(null);
                      }
                    }}
                    className="neon-btn neon-btn-submit"
                  >Save</button>
                  <button
                    onClick={() => setShowModalFor(null)}
                    className="neon-btn neon-btn-back"
                  >Cancel</button>
                </div>
              </NeonPanel>
            )}
            {editingDeptId === dept.id && (
              <div className="org-chart-edit-panel">
                <input
                  type="text"
                  value={deptEditName}
                  onChange={e => setDeptEditName(e.target.value)}
                  className="neon-input"
                  placeholder="Department Name"
                />
                <label className="org-chart-edit-label">
                  <input type="checkbox" checked={deptEditArchived} onChange={e => setDeptEditArchived(e.target.checked)} /> Archive
                </label>
                <button
                  onClick={() => handleDeptEditSave(dept.id)}
                  className="neon-btn neon-btn-save"
                  data-variant="save"
                >
                  <span style={{marginRight: '0.5em'}}>Save</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                </button>
                <button
                  onClick={() => setEditingDeptId(null)}
                  className="neon-btn neon-btn-danger"
                  data-variant="close"
                >
                  <span style={{marginRight: '0.5em'}}>Cancel</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {!dept.is_archived && (
                  <button
                    onClick={() => handleDeptArchive(dept.id)}
                    className="neon-btn neon-btn-archive"
                    data-variant="archive"
                  >
                    <span style={{marginRight: '0.5em'}}>Archive Department</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-archive"><rect x="3" y="3" width="18" height="4" rx="1" ry="1"></rect><path d="M21 7v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"></path><line x1="12" y1="11" x2="12" y2="17"></line></svg>
                  </button>
                )}
              </div>
            )}
            {renderBranch(dept.id, level + 1, currentPath)}
          </div>
        )}
      </NeonPanel>
    )
  }

  return (
    <>
      <main className="org-chart-main">
        <section className="org-chart-section">
          <div className="org-chart-container">
            <h1 className="neon-form-title org-chart-page-title">Organisation Chart</h1>
            <div className="org-chart-toolbar">
              <Link
                href="/admin/departments/add"
                className="neon-btn neon-btn-orgchart"
              >
                <FiUmbrella className="org-chart-toolbar-icon" />
              </Link>
              <Link
                href="/admin/roles/add"
                className="neon-btn neon-btn-orgchart"
              >
                <FiTool className="org-chart-toolbar-icon" />
              </Link>
            </div>
            {departments.length === 0 ? (
              <p className="org-chart-empty">Loading organisation chart...</p>
            ) : (
              renderBranch('root')
            )}
          </div>
        </section>
      </main>
    </>
  );
}