'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  department: string
  job_level: string
  role_title: string
  status: string
}

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) {
        setError('Could not load users')
      } else {
        setUsers(data as User[])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', user.id)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      )
    } else {
      alert('Failed to update status.')
    }
  }

  const departments = [...new Set(users.map((u) => u.department).filter(Boolean))]

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.first_name, user.last_name, user.email]
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    const matchesDept = filterDept ? user.department === filterDept : true
    const matchesStatus = filterStatus ? user.status === filterStatus : true
    return matchesSearch && matchesDept && matchesStatus
  })

  if (loading) return <p className="p-6">Loading users...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <>
      <LogoHeader />

      <div className="p-6 max-w-7xl mx-auto mt-4">
        <h1 className="text-3xl font-bold text-orange-600 mb-6">👥 Manage Users</h1>

        {/* Filters */}
        <div className="bg-teal-900 p-4 rounded-xl shadow border border-teal-300 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border bg-white text-teal-900 border-teal-900 p-2 rounded w-full sm:w-64"
            />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="border bg-white text-teal-900 border-teal-900 p-2 rounded"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
                <th className="p-3 border-b">Job Level</th>
                <th className="p-3 border-b">Role</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="text-teal-900 hover:bg-orange-300">
                  <td className="p-3 border-b">{user.first_name} {user.last_name}</td>
                  <td className="p-3 border-b">{user.email}</td>
                  <td className="p-3 border-b">{user.department}</td>
                  <td className="p-3 border-b">{user.job_level}</td>
                  <td className="p-3 border-b">{user.role_title}</td>
                  <td className="p-3 border-b capitalize text-teal-800">{user.status}</td>
                  <td className="p-3 border-b space-x-2">
                    <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:underline">View</Link>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
