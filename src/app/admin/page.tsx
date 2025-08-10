'use client'

import UserManagementPanel from '@/components/user/UserManagementPanel'

export default function AdminDashboard() {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold text-teal-900">Welcome to the Admin Dashboard</h1>
      <p className="mt-2 text-gray-700 mb-6">Manage users, roles, departments, and more.</p>

      <UserManagementPanel />
    </div>
  )
}
