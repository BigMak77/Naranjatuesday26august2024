import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import BehaviourSelector from '@/components/BehaviourSelector'
import { useRouter } from 'next/navigation'
import NeonTable from '@/components/NeonTable'
import NeonIconButton from '@/components/ui/NeonIconButton'
import { FiSave, FiEdit, FiUserPlus, FiDownload, FiUpload } from 'react-icons/fi'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  department_id?: string
  role_id?: string
  access_level?: string
  phone?: string
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; title: string; department_id: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [behaviours, setBehaviours] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  // Removed unused filterDept, setFilterDept, filterRole, setFilterRole, search, setSearch state
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const [{ data: u }, { data: d }, { data: r }] = await Promise.all([
        supabase.from('users').select('id, email, first_name, last_name, department_id, role_id, access_level, phone'),
        supabase.from('departments').select('id, name'),
        supabase.from('roles').select('id, title, department_id'),
      ])
      setUsers(u || [])
      setDepartments(d || [])
      setRoles(r || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedUser(null)
    setBehaviours([])
  }

  const handleSave = async () => {
    if (!selectedUser) return

    setSaving(true)

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
      // Upsert users (you may want to adjust this logic for your schema)
      await supabase.from('users').upsert(usersToImport, { onConflict: 'id' });
      // Refresh users
      const { data: u } = await supabase.from('users').select('id, email, first_name, last_name, department_id, role_id, access_level, phone');
      setUsers(u || []);
    };
    reader.readAsText(file);
  };

  // Removed unused handleSort function to fix compile error

  if (loading) return <p className="neon-loading">Loading users...</p>

  return (
    <div>
      {/* 2rem space above the toolbar */}
      <div style={{ height: '2rem' }} />
      {/* Toolbar above table */}
      <div className="neon-table-toolbar">
        <NeonIconButton
          icon={<FiUserPlus />}
          title="Add User"
          variant="add"
          onClick={() => router.push('/hr/people/add')}
        />
        <NeonIconButton
          icon={<FiDownload />}
          title="Download Users CSV"
          variant="download"
          onClick={handleExportUsers}
        />
        <label style={{ display: 'inline-block' }}>
          <NeonIconButton
            icon={<FiUpload />}
            title="Upload Users CSV"
            variant="upload"
            as="button"
            onClick={() => {}}
          />
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImportUsers}
          />
        </label>
      </div>
      <div>
        <NeonTable
          columns={[
            { header: 'First', accessor: 'first_name' },
            { header: 'Last', accessor: 'last_name' },
            { header: 'Department', accessor: 'department' },
            { header: 'Role', accessor: 'role' },
            { header: 'Email', accessor: 'email' },
            { header: 'Actions', accessor: 'actions' },
          ]}
          data={users
            .map((user) => ({
              first_name: user.first_name,
              last_name: user.last_name,
              department: user.department_id ? departments.find(d => d.id === user.department_id)?.name || '—' : '—',
              role: user.role_id ? roles.find(r => r.id === user.role_id)?.title || '—' : '—',
              email: user.email,
              actions: (
                <NeonIconButton
                  icon={<FiEdit />}
                  title="Edit User"
                  variant="edit"
                  onClick={() => router.push(`/hr/people/${user.id}/edit`)}
                />
              ),
            }))}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : handleCloseDialog()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input className="neon-input" value={selectedUser.first_name || ''} onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })} placeholder="First Name" />
              <input className="neon-input" value={selectedUser.last_name || ''} onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })} placeholder="Last Name" />
              <input className="neon-input" value={selectedUser.email || ''} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} placeholder="Email" />
              <select className="neon-input" value={selectedUser.department_id || ''} onChange={(e) => setSelectedUser({ ...selectedUser, department_id: e.target.value, role_id: '' })}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="neon-input" value={selectedUser.role_id || ''} onChange={(e) => setSelectedUser({ ...selectedUser, role_id: e.target.value })}>
                <option value="">Select Role</option>
                {roles.filter(r => r.department_id === selectedUser.department_id).map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
              <select className="neon-input" value={selectedUser.access_level || ''} onChange={(e) => setSelectedUser({ ...selectedUser, access_level: e.target.value })}>
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
              <input className="neon-input" value={selectedUser.phone || ''} onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })} placeholder="Phone" />
              <div className="md:col-span-2 lg:col-span-3">
                <BehaviourSelector selected={behaviours} onChange={setBehaviours} max={5} />
              </div>
              {showSuccess && <p className="neon-success md:col-span-2 lg:col-span-3">✅ User saved successfully!</p>}
            </div>
          )}
          <DialogFooter className="mt-4">
            <NeonIconButton
              variant="save"
              icon={<FiSave />}
              title={saving ? 'Saving...' : 'Save Changes'}
              onClick={handleSave}
              disabled={saving}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
