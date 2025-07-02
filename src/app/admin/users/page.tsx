'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  department: { id: string; name: string } | null
  role: { id: string; title: string } | null
  role_profile?: { id: string; name: string } | null
}

interface RoleProfile {
  id: string
  name: string
}

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          status,
          department:departments(id, name),
          role:roles(id, title),
          role_profile:role_profiles(id, name)
        `)

      const { data: rpData, error: rpError } = await supabase
        .from('role_profiles')
        .select('id, name')

      if (usersError || rpError) {
        setError('Failed to load data.')
        console.error(usersError || rpError)
        setLoading(false)
        return
      }

      setUsers((usersData as any[]).map((u) => ({
        ...u,
        department: Array.isArray(u.department) ? u.department[0] || null : u.department,
        role: Array.isArray(u.role) ? u.role[0] || null : u.role,
        role_profile: Array.isArray(u.role_profile) ? u.role_profile[0] || null : u.role_profile,
      })))
      setRoleProfiles(rpData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', user.id)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      )
    } else {
      alert('Failed to update user status.')
    }
  }

  const handleAssignProfile = async (userId: string, roleProfileId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role_profile_id: roleProfileId })
      .eq('id', userId)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role_profile: roleProfiles.find((rp) => rp.id === roleProfileId) || null }
            : u
        )
      )
    } else {
      alert('Failed to assign role profile.')
    }
  }

  const departments = [...new Set(users.map((u) => u.department?.name).filter(Boolean))]

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.first_name, user.last_name, user.email]
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    const matchesDept = filterDept ? user.department?.name === filterDept : true
    const matchesStatus = filterStatus ? user.status === filterStatus : true
    return matchesSearch && matchesDept && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const displayedUsers = filteredUsers.slice(startIdx, startIdx + itemsPerPage)

  if (loading) return <p className="p-6">Loading users...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <div className="p-6 max-w-7xl mx-auto mt-4 flex-grow">
        <h1 className="text-3xl font-bold text-orange-600 mb-6">👥 Manage Users</h1>

        {/* Filters */}
        <div className="bg-teal-900 p-4 rounded-xl shadow border border-teal-300 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="border bg-white text-teal-900 border-teal-900 p-2 rounded w-full sm:w-64"
            />
            <select
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value)
                setCurrentPage(1)
              }}
              className="border bg-white text-teal-900 border-teal-900 p-2 rounded"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="border bg-white text-teal-900 border-teal-900 p-2 rounded"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border bg-white rounded-xl shadow">
            <thead className="bg-teal-900 text-white font-semibold">
              <tr>
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Email</th>
                <th className="p-3 border-b">Department</th>
                <th className="p-3 border-b">Role</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Role Profile</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length > 0 ? (
                displayedUsers.map((user) => (
                  <tr key={user.id} className="text-teal-900 hover:bg-orange-100">
                    <td className="p-3 border-b">{user.first_name} {user.last_name}</td>
                    <td className="p-3 border-b">{user.email}</td>
                    <td className="p-3 border-b">{user.department?.name || '—'}</td>
                    <td className="p-3 border-b">{user.role?.title || '—'}</td>
                    <td className="p-3 border-b capitalize text-teal-800">{user.status}</td>
                    <td className="p-3 border-b">
                      <select
                        value={user.role_profile?.id || ''}
                        onChange={(e) => handleAssignProfile(user.id, e.target.value)}
                        className="border border-teal-400 bg-white text-teal-900 p-1 rounded"
                      >
                        <option value="">—</option>
                        {roleProfiles.map((rp) => (
                          <option key={rp.id} value={rp.id}>
                            {rp.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 border-b space-x-2">
                      <Link href={`/admin/users/${user.id}/edit`} className="text-green-600 hover:underline">Edit</Link>
                      <button
                        onClick={() => toggleStatus(user)}
                        className={`text-sm font-medium ${
                          user.status === 'active' ? 'text-red-600' : 'text-green-600'
                        } hover:underline`}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border-b text-gray-500" colSpan={7}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-4 text-sm text-teal-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-1 border rounded bg-white hover:bg-teal-50 disabled:opacity-50"
            >
              ← Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-1 border rounded bg-white hover:bg-teal-50 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
