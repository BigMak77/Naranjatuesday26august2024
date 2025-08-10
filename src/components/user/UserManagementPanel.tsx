import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import BehaviourSelector from '@/components/BehaviourSelector'
import { useRouter } from 'next/navigation'
import NeonTable from '@/components/NeonTable'
import NeonIconButton from '@/components/ui/NeonIconButton'
import { FiSave, FiEdit } from 'react-icons/fi'

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
  const [filterDept, setFilterDept] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
  const sortDir: 'asc' | 'desc' = 'asc'
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

  const filteredUsers = users.filter(user => {
    const matchesDept = filterDept ? user.department_id === filterDept : true
    const matchesRole = filterRole ? user.role_id === filterRole : true
    const matchesSearch =
      search.trim() === '' ||
      (user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(search.toLowerCase()))
    return matchesDept && matchesRole && matchesSearch
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = (a as User)['first_name'] || ''
    let valB = (b as User)['first_name'] || ''
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()
    if (valA < valB) return sortDir === 'asc' ? -1 : 1
    if (valA > valB) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  // Removed unused handleSort function to fix compile error

  if (loading) return <p className="p-6">Loading users...</p>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="neon-form-title mb-6">User Management</h1>
      <div className="neon-tab-bar mb-8 flex gap-4">
        <button
          className={`neon-tab-btn${activeTab === 'list' ? ' active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          All Users
        </button>
        <button
          className={`neon-tab-btn${activeTab === 'add' ? ' active' : ''}`}
          onClick={() => router.push('/admin/users/add')}
        >
          Add User
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setFilterRole('') }} className="neon-input w-auto">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="neon-input w-auto">
              <option value="">All Roles</option>
              {roles.filter(r => !filterDept || r.department_id === filterDept).map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            <div className="neon-search-bar-wrapper" style={{flex: 1, minWidth: 220}}>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="neon-input neon-input-search"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded shadow-glow bg-panel">
            <NeonTable
              columns={[
                { header: 'First', accessor: 'first_name' },
                { header: 'Last', accessor: 'last_name' },
                { header: 'Department', accessor: 'department' },
                { header: 'Role', accessor: 'role' },
                { header: 'Email', accessor: 'email' },
                { header: 'Actions', accessor: 'actions' },
              ]}
              data={sortedUsers.map((user) => ({
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
                    onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                  />
                ),
              }))}
            />
          </div>
        </>
      )}

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
