import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAddMode, setIsAddMode] = useState(false)
  const [shiftPatterns, setShiftPatterns] = useState<{ id: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setIsAddMode(false)
  }

  const allowedAccessLevels = ['User', 'Manager', 'Admin']
  const cleanUserFields = (user: User): User => ({
    ...user,
    department_id: user.department_id || undefined,
    role_id: user.role_id || undefined,
    shift_id: user.shift_id || undefined,
    role_profile_id: user.role_profile_id || undefined,
    access_level: allowedAccessLevels.includes((user.access_level || '').trim()) ? (user.access_level || '').trim() : 'User',
  })

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    const cleanedUser = cleanUserFields(selectedUser)
    if (isAddMode) {
      // Add new user
      const { error: userErr, data: newUser } = await supabase
        .from('users')
        .insert({
          first_name: cleanedUser.first_name,
          last_name: cleanedUser.last_name,
          email: cleanedUser.email,
          department_id: cleanedUser.department_id,
          role_id: cleanedUser.role_id,
          access_level: cleanedUser.access_level,
          phone: cleanedUser.phone,
          shift_id: cleanedUser.shift_id,
          role_profile_id: cleanedUser.role_profile_id,
        })
        .select()
        .single()
      if (userErr) {
        console.error('Failed to add user:', userErr)
        setSaving(false)
        return
      }
      setUsers([...users, newUser])
    } else {
      // Edit existing user
      const { error: userErr } = await supabase
        .from('users')
        .update({
          first_name: cleanedUser.first_name,
          last_name: cleanedUser.last_name,
          email: cleanedUser.email,
          department_id: cleanedUser.department_id,
          role_id: cleanedUser.role_id,
          access_level: cleanedUser.access_level,
          phone: cleanedUser.phone,
          shift_id: cleanedUser.shift_id,
          role_profile_id: cleanedUser.role_profile_id,
        })
        .eq('id', cleanedUser.id)
      if (userErr) {
        console.error('Failed to update user:', userErr)
        setSaving(false)
        return
      }
      setUsers(users.map(u => u.id === cleanedUser.id ? { ...u, ...cleanedUser } : u))
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
  const handleImportUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    // Use csv-parse for robust parsing
    let usersToImport: Record<string, unknown>[] = [];
    try {
      const csvParse = (await import('csv-parse/sync')).parse;
      usersToImport = csvParse(text, { columns: true, skip_empty_lines: true });
      // Convert booleans and clean up fields
      usersToImport = usersToImport.map(u => ({
        ...u,
        is_first_aid: u.is_first_aid === 'true' || u.is_first_aid === true,
        is_trainer: u.is_trainer === 'true' || u.is_trainer === true,
      }));
    } catch (err) {
      console.error('CSV parse error:', err);
      return;
    }
    await supabase.from('users').upsert(usersToImport, { onConflict: 'id' });
    const { data: u } = await supabase.from('users').select('*');
    setUsers(u || []);
  };

  const userTableColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department_name' },
    { header: 'Role', accessor: 'role_title' },
    { header: 'Access', accessor: 'access_level' },
    { header: 'Role Profile', accessor: 'role_profile_name' },
    { header: 'Shift', accessor: 'shift_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Start Date', accessor: 'start_date' },
    { header: 'First Aid', accessor: 'is_first_aid' },
    { header: 'Trainer', accessor: 'is_trainer' },
  ];

  if (loading) return <p className="neon-loading">Loading users...</p>

  return (
    <>
      <div className="neon-table-panel">
        <div className="neon-table-scroll">
          <NeonTable
            columns={userTableColumns}
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
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleImportUsers}
                  />
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
                {/* email */}
                <div>
                  <label className="neon-label">Email</label>
                  <input className="neon-input" value={selectedUser.email || ''} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} placeholder="Email" />
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
                {/* access_level */}
                <div>
                  <label className="neon-label">Access Level</label>
                  <select className="neon-input" value={selectedUser.access_level || ''} onChange={e => setSelectedUser({ ...selectedUser, access_level: e.target.value })}>
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                {/* phone */}
                <div>
                  <label className="neon-label">Phone</label>
                  <input className="neon-input" value={selectedUser.phone || ''} onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })} placeholder="Phone" />
                </div>
                {/* nationality */}
                <div>
                  <label className="neon-label">Nationality</label>
                  <input className="neon-input" value={selectedUser.nationality || ''} onChange={e => setSelectedUser({ ...selectedUser, nationality: e.target.value })} placeholder="Nationality" />
                </div>
                {/* is_first_aid */}
                <div>
                  <label className="neon-label">First Aid</label>
                  <select className="neon-input" value={selectedUser.is_first_aid ? 'true' : 'false'} onChange={e => setSelectedUser({ ...selectedUser, is_first_aid: e.target.value === 'true' })}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {/* is_trainer */}
                <div>
                  <label className="neon-label">Trainer</label>
                  <select className="neon-input" value={selectedUser.is_trainer ? 'true' : 'false'} onChange={e => setSelectedUser({ ...selectedUser, is_trainer: e.target.value === 'true' })}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {/* shift_id */}
                <div>
                  <label className="neon-label">Shift</label>
                  <select className="neon-input" value={selectedUser.shift_id || ''} onChange={e => {
                    const selectedPattern = shiftPatterns?.find(s => s.id === e.target.value)
                    setSelectedUser({
                      ...selectedUser,
                      shift_id: e.target.value,
                      shift_name: selectedPattern ? selectedPattern.name : ''
                    })
                  }}>
                    <option value="">Select Shift</option>
                    {shiftPatterns?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {/* start_date */}
                <div>
                  <label className="neon-label">Start Date</label>
                  <input className="neon-input" type="date" value={selectedUser.start_date || ''} onChange={e => setSelectedUser({ ...selectedUser, start_date: e.target.value })} placeholder="Start Date" />
                </div>
                {showSuccess && (
                  <div className="md:col-span-3 lg:col-span-3" style={{ gridColumn: 'span 3', marginTop: '0.5rem' }}>
                    <p className="neon-success">✅ User saved successfully!</p>
                  </div>
                )}
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
