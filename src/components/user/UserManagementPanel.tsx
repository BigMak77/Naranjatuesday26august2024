import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
// Removed unused Dialog imports
import BehaviourSelector from '@/components/BehaviourSelector'
import NeonTable from '@/components/NeonTable'
import NeonIconButton from '@/components/ui/NeonIconButton'
import { FiSave, FiEdit, FiUserPlus, FiDownload, FiUpload, FiCheck, FiX } from 'react-icons/fi'
import { useUser } from '@/lib/useUser'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  department_id?: string
  role_id?: string
  access_level?: string
  phone?: string
  created_at?: string
  department_name?: string
  role_title?: string
  status?: string
  nationality?: string
  document_path?: string
  role_profile_id?: string
  is_archived?: boolean
  last_updated_at?: string

  is_anonymous?: boolean
  auth_id?: string
  start_date?: string
  is_first_aid?: boolean
  avatar_url?: string
  is_trainer?: boolean
  shift_id?: string
  shift_name?: string
  role_profile_name?: string
}

export default function UserManagementPanel() {
  useUser();
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; title: string; department_id: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [behaviours, setBehaviours] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAddMode, setIsAddMode] = useState(false)
  const [shiftPatterns, setShiftPatterns] = useState<{ id: string; name: string }[]>([])
  const [roleProfiles, setRoleProfiles] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        // Fetch users and join shift_patterns for shift name
        const [{ data: u }, { data: d }, { data: r }, { data: s }, { data: rp }] = await Promise.all([
          supabase
            .from('users')
            .select('*, shift_id, role_profile_id'),
          supabase.from('departments').select('id, name'),
          supabase.from('roles').select('id, title, department_id'),
          supabase.from('shift_patterns').select('id, name'),
          supabase.from('role_profiles').select('id, name'),
        ])
        // Map shift name and role profile name into user object
        const usersWithNames = (u || []).map(user => ({
          ...user,
          shift_name: s?.find(sp => sp.id === user.shift_id)?.name || '',
          shift_id: user.shift_id || '',
          role_profile_name: rp?.find(rp => rp.id === user.role_profile_id)?.name || '',
        }))
        setUsers(usersWithNames)
        setDepartments(d || [])
        setRoles(r || [])
        setShiftPatterns(s || [])
        setRoleProfiles(rp || [])
      } catch {
        // Optionally set error state here
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedUser(null)
    setBehaviours([])
    setIsAddMode(false)
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    if (isAddMode) {
      // Add new user
      const { error: userErr, data: newUser } = await supabase
        .from('users')
        .insert({
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          email: selectedUser.email,
          department_id: selectedUser.department_id,
          role_id: selectedUser.role_id,
          access_level: selectedUser.access_level,
          phone: selectedUser.phone,
          shift_id: selectedUser.shift_id,
          role_profile_id: selectedUser.role_profile_id,
        })
        .select()
        .single()
      if (userErr) {
        console.error('Failed to add user:', userErr)
        setSaving(false)
        return
      }
      if (behaviours.length > 0 && newUser?.id) {
        await supabase.from('user_behaviours').insert(
          behaviours.map((b) => ({ auth_id: newUser.id, behaviour_id: b }))
        )
      }
      setUsers([...users, newUser])
    } else {
      // Edit existing user
      const { error: userErr } = await supabase
        .from('users')
        .update({
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          email: selectedUser.email,
          department_id: selectedUser.department_id,
          role_id: selectedUser.role_id,
          access_level: selectedUser.access_level,
          phone: selectedUser.phone,
          shift_id: selectedUser.shift_id,
          role_profile_id: selectedUser.role_profile_id,
        })
        .eq('id', selectedUser.id)
      if (userErr) {
        console.error('Failed to update user:', userErr)
        setSaving(false)
        return
      }
      await supabase.from('user_behaviours').delete().eq('auth_id', selectedUser.id)
      if (behaviours.length > 0) {
        await supabase.from('user_behaviours').insert(
          behaviours.map((b) => ({ auth_id: selectedUser.id, behaviour_id: b }))
        )
      }
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u))
    }
    setSaving(false)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      handleCloseDialog()
    }, 1000)
  }

  // CSV Export handler
  const handleExportUsers = () => {
    if (!users.length) return;
    const csvRows = users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      department_id: u.department_id || '',
      role_id: u.role_id || '',
      access_level: u.access_level || '',
      phone: u.phone || ''
    }));
    const csv = [
      'id,email,first_name,last_name,department_id,role_id,access_level,phone',
      ...csvRows.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CSV Upload handler
  const handleImportUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(',');
      const usersToImport = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').replace(/^"|"$/g, '').replace(/""/g, '"'); });
        return obj;
      });
      await supabase.from('users').upsert(usersToImport, { onConflict: 'id' });
      const { data: u } = await supabase.from('users').select('id, email, first_name, last_name, department_id, role_id, access_level, phone');
      setUsers(u || []);
    };
    reader.readAsText(file);
  };

  if (loading) return <p className="neon-loading">Loading users...</p>

  return (
    <>
      <div className="neon-table-panel">
        <div className="neon-table-scroll">
          <NeonTable
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Department', accessor: 'department_name' },
              { header: 'Role', accessor: 'role_title' },
              { header: 'Status', accessor: 'status' },
              { header: 'Access', accessor: 'access_level' },
              { header: 'Role Profile', accessor: 'role_profile_name' }, // show name, not ID
              { header: 'Shift', accessor: 'shift_name' },
              { header: 'Email', accessor: 'email' },
              { header: 'Start Date', accessor: 'start_date' },
              { header: 'First Aid', accessor: 'is_first_aid' },
              { header: 'Trainer', accessor: 'is_trainer' },
            ]}
            data={users.map((user) => {
              const department = departments.find(d => d.id === user.department_id);
              const role = roles.find(r => r.id === user.role_id);
              return {
                id: user.id,
                name: (
                  <button
                    className="neon-link neon-btn-reset"
                    style={{ background: 'none', border: 'none', color: 'var(--neon)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                    onClick={() => {
                      setSelectedUser(user)
                      setIsAddMode(false)
                      setDialogOpen(true)
                    }}
                  >
                    {`${user.first_name || ''} ${user.last_name || ''}`.trim() || '—'}
                  </button>
                ),
                department_name: department ? department.name : '—',
                role_title: role ? role.title : '—',
                status: user.status || '—',
                access_level: user.access_level,
                role_profile_name: user.role_profile_name || '—',
                shift_name: user.shift_name || '—',
                email: user.email,
                start_date: user.start_date || '—',
                is_first_aid: user.is_first_aid ? <FiCheck color="#39ff14" /> : <FiX color="#ea1c1c" />, 
                is_trainer: user.is_trainer ? <FiCheck color="#39ff14" /> : <FiX color="#ea1c1c" />, 
                actions: (
                  <NeonIconButton
                    icon={<FiEdit />} title="Edit User" variant="edit"
                    onClick={() => {
                      setSelectedUser(user)
                      setIsAddMode(false)
                      setDialogOpen(true)
                    }}
                  />
                ),
              }
            })}
            toolbar={
              <>
                <NeonIconButton
                  icon={<FiUserPlus />} title="Add User" variant="add"
                  onClick={() => {
                    setSelectedUser({ id: '', email: '', first_name: '', last_name: '', department_id: '', role_id: '', access_level: 'User', phone: '' })
                    setBehaviours([])
                    setIsAddMode(true)
                    setDialogOpen(true)
                  }}
                />
                <NeonIconButton
                  icon={<FiDownload />} title="Download Users CSV" variant="download"
                  onClick={handleExportUsers}
                />
                <label style={{ display: 'inline-block' }}>
                  <NeonIconButton
                    icon={<FiUpload />} title="Upload Users CSV" variant="upload" as="button"
                    onClick={() => {}}
                  />
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportUsers} />
                </label>
              </>
            }
          />
        </div>
      </div>
      {/* Dialog overlays on top of all content by rendering directly in the tree */}
      {dialogOpen && (
        <div className="ui-dialog-overlay">
          <div className="ui-dialog-content max-w-4xl">
            <div className="neon-form-title" style={{marginBottom: '1.25rem'}}>
              {isAddMode ? 'Add User' : 'Edit User'}
            </div>
            {selectedUser && (
              <div className="neon-form-grid neon-form-padding" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem', rowGap: '2rem', alignItems: 'start' }}>
                {/* id (read-only) */}
                <div>
                  <label className="neon-label">ID</label>
                  <input className="neon-input" value={selectedUser.id || ''} readOnly placeholder="ID" />
                </div>
                {/* created_at (read-only) */}
                <div>
                  <label className="neon-label">Created At</label>
                  <input className="neon-input" value={selectedUser.created_at || ''} readOnly placeholder="Created At" />
                </div>
                {/* first_name */}
                <div>
                  <label className="neon-label">First Name</label>
                  <input className="neon-input" value={selectedUser.first_name || ''} onChange={e => setSelectedUser({ ...selectedUser, first_name: e.target.value })} placeholder="First Name" />
                </div>
                {/* last_name */}
                <div>
                  <label className="neon-label">Last Name</label>
                  <input className="neon-input" value={selectedUser.last_name || ''} onChange={e => setSelectedUser({ ...selectedUser, last_name: e.target.value })} placeholder="Last Name" />
                </div>
                {/* department_id */}
                <div>
                  <label className="neon-label">Department</label>
                  <select className="neon-input" value={selectedUser.department_id || ''} onChange={e => setSelectedUser({ ...selectedUser, department_id: e.target.value, role_id: '' })}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {/* role_id */}
                <div>
                  <label className="neon-label">Role</label>
                  <select className="neon-input" value={selectedUser.role_id || ''} onChange={e => setSelectedUser({ ...selectedUser, role_id: e.target.value })}>
                    <option value="">Select Role</option>
                    {roles.filter(r => r.department_id === selectedUser.department_id).map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
                {/* status */}
                <div>
                  <label className="neon-label">Status</label>
                  <select className="neon-input" value={selectedUser.status || ''} onChange={e => setSelectedUser({ ...selectedUser, status: e.target.value })}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
                {/* nationality */}
                <div>
                  <label className="neon-label">Nationality</label>
                  <input className="neon-input" value={selectedUser.nationality || ''} onChange={e => setSelectedUser({ ...selectedUser, nationality: e.target.value })} placeholder="Nationality" />
                </div>
                {/* document_path */}
                <div>
                  <label className="neon-label">Document Path</label>
                  <input className="neon-input" value={selectedUser.document_path || ''} onChange={e => setSelectedUser({ ...selectedUser, document_path: e.target.value })} placeholder="Document Path" />
                </div>
                {/* access_level */}
                <div>
                  <label className="neon-label">Access Level</label>
                  <select className="neon-input" value={selectedUser.access_level || ''} onChange={e => setSelectedUser({ ...selectedUser, access_level: e.target.value })}>
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                {/* role_profile_id */}
                <div>
                  <label className="neon-label">Role Profile ID</label>
                  <input className="neon-input" value={selectedUser.role_profile_id || ''} onChange={e => setSelectedUser({ ...selectedUser, role_profile_id: e.target.value })} placeholder="Role Profile ID" />
                </div>
                {/* is_archived */}
                <div>
                  <label className="neon-label">Archived</label>
                  <select className="neon-input" value={selectedUser.is_archived ? 'true' : 'false'} onChange={e => setSelectedUser({ ...selectedUser, is_archived: e.target.value === 'true' })}>
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                </div>
                {/* last_updated_at (read-only) */}
                <div>
                  <label className="neon-label">Last Updated At</label>
                  <input className="neon-input" value={selectedUser.last_updated_at || ''} readOnly placeholder="Last Updated At" />
                </div>
                {/* shift (editable) */}
                <div>
                  <label className="neon-label">Shift</label>
                  <select
                    className="neon-input"
                    value={selectedUser.shift_id || ''}
                    onChange={e => {
                      const selectedPattern = shiftPatterns?.find(s => s.id === e.target.value)
                      setSelectedUser({
                        ...selectedUser,
                        shift_id: e.target.value,
                        shift_name: selectedPattern ? selectedPattern.name : ''
                      })
                    }}
                  >
                    <option value="">Select Shift</option>
                    {shiftPatterns?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {/* email */}
                <div>
                  <label className="neon-label">Email</label>
                  <input className="neon-input" value={selectedUser.email || ''} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} placeholder="Email" />
                </div>
                {/* phone */}
                <div>
                  <label className="neon-label">Phone</label>
                  <input className="neon-input" value={selectedUser.phone || ''} onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })} placeholder="Phone" />
                </div>
                {/* is_anonymous */}
                <div>
                  <label className="neon-label">Anonymous</label>
                  <select className="neon-input" value={selectedUser.is_anonymous ? 'true' : 'false'} onChange={e => setSelectedUser({ ...selectedUser, is_anonymous: e.target.value === 'true' })}>
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                </div>
                {/* auth_id (read-only) */}
                <div>
                  <label className="neon-label">Auth ID</label>
                  <input className="neon-input" value={selectedUser.auth_id || ''} readOnly placeholder="Auth ID" />
                </div>
                {/* department_name (read-only) */}
                <div>
                  <label className="neon-label">Department Name</label>
                  <input className="neon-input" value={selectedUser.department_name || ''} readOnly placeholder="Department Name" />
                </div>
                {/* role_title (read-only) */}
                <div>
                  <label className="neon-label">Role Title</label>
                  <input className="neon-input" value={selectedUser.role_title || ''} readOnly placeholder="Role Title" />
                </div>
                {/* start_date */}
                <div>
                  <label className="neon-label">Start Date</label>
                  <input className="neon-input" type="date" value={selectedUser.start_date || ''} onChange={e => setSelectedUser({ ...selectedUser, start_date: e.target.value })} placeholder="Start Date" />
                </div>
                {/* is_first_aid */}
                <div>
                  <label className="neon-label">First Aid</label>
                  <select className="neon-input" value={selectedUser.is_first_aid === true ? 'YES' : 'NO'} onChange={e => setSelectedUser({ ...selectedUser, is_first_aid: e.target.value === 'YES' })}>
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </div>
                {/* avatar_url */}
                <div>
                  <label className="neon-label">Avatar URL</label>
                  <input className="neon-input" value={selectedUser.avatar_url || ''} onChange={e => setSelectedUser({ ...selectedUser, avatar_url: e.target.value })} placeholder="Avatar URL" />
                </div>
                {/* is_trainer */}
                <div>
                  <label className="neon-label">Trainer</label>
                  <select className="neon-input" value={selectedUser.is_trainer === true ? 'yes' : 'no'} onChange={e => setSelectedUser({ ...selectedUser, is_trainer: e.target.value === 'yes' })}>
                    <option value="no">no</option>
                    <option value="yes">yes</option>
                  </select>
                </div>
                {/* role_profile_id (editable dropdown) */}
                <div>
                  <label className="neon-label">Role Profile</label>
                  <select
                    className="neon-input"
                    value={selectedUser.role_profile_id || ''}
                    onChange={e => {
                      const selectedProfile = roleProfiles.find(rp => rp.id === e.target.value)
                      setSelectedUser({
                        ...selectedUser,
                        role_profile_id: e.target.value,
                        role_profile_name: selectedProfile ? selectedProfile.name : ''
                      })
                    }}
                  >
                    <option value="">Select Role Profile</option>
                    {roleProfiles.map(rp => (
                      <option key={rp.id} value={rp.id}>{rp.name}</option>
                    ))}
                  </select>
                </div>
                {/* BehaviourSelector */}
                <div className="neon-behaviour-inline md:col-span-3 lg:col-span-3" style={{ gridColumn: 'span 3', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <label className="neon-label">Behaviours</label>
                  <BehaviourSelector selected={behaviours} onChange={setBehaviours} max={5} />
                </div>
                {showSuccess && <p className="neon-success md:col-span-3 lg:col-span-3" style={{ gridColumn: 'span 3', marginTop: '0.5rem' }}>✅ User saved successfully!</p>}
              </div>
            )}
            <div className="neon-panel-actions" style={{display:'flex',gap:'1rem',justifyContent:'flex-end',marginTop:'2rem'}}>
              <NeonIconButton
                variant="save"
                icon={<FiSave />}
                title={saving ? 'Saving...' : 'Save Changes'}
                onClick={handleSave}
                disabled={saving}
              />
              <button className="neon-btn neon-btn-danger" onClick={handleCloseDialog}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
