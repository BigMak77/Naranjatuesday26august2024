'use client'

import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'

export default function DashboardPage() {
  return (
    <>
      <LogoHeader />

      <div className="min-h-screen bg-teal-50 py-12 px-6 text-teal-900">
        <h1 className="text-3xl font-bold text-center mb-10">Dashboard</h1>

        <div className="grid gap-8 max-w-5xl mx-auto">
          {/* People Management */}
          <section className="bg-white rounded-xl shadow border border-teal-200">
            <div className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
              👥 People Management
            </div>
            <div className="p-4 space-y-2">
              <Link href="/admin/users" className="block text-teal-800 hover:underline">
                🧑‍💼 View & Manage Users
              </Link>
              <Link href="/admin/users/add" className="block text-teal-800 hover:underline">
                ➕ Add New User
              </Link>
            </div>
          </section>

          {/* Module Management */}
          <section className="bg-white rounded-xl shadow border border-teal-200">
            <div className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
              📦 Module Management
            </div>
            <div className="p-4 space-y-2">
              <Link href="/admin/modules" className="block text-teal-800 hover:underline">
                📂 View All Modules
              </Link>
              <Link href="/admin/modules/add" className="block text-teal-800 hover:underline">
                ➕ Add New Module
              </Link>
              <Link href="/admin/modules/assign" className="block text-teal-800 hover:underline">
                📌 Assign Modules to Roles
              </Link>
            </div>
          </section>

          {/* Training Progress */}
          <section className="bg-white rounded-xl shadow border border-teal-200">
            <div className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
              📊 Training Progress
            </div>
            <div className="p-4">
              <Link href="/admin/progress" className="block text-teal-800 hover:underline">
                📈 View Completion Dashboard
              </Link>
            </div>
          </section>

          {/* Documents Hub */}
          <section className="bg-white rounded-xl shadow border border-teal-200">
            <div className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
              📁 Document Management Hub
            </div>
            <div className="p-4 space-y-2">
              <Link href="/admin/documents" className="block text-teal-800 hover:underline">
                📄 View All Documents
              </Link>
              <Link href="/admin/documents/add" className="block text-teal-800 hover:underline">
                ➕ Add New Document
              </Link>
              <Link href="/admin/documents/versions" className="block text-teal-800 hover:underline">
                🕓 View Document Versions
              </Link>
            </div>
            <div className="px-4 pt-2 pb-4 text-sm text-gray-600">
              This section includes policies, safe systems of work, and work instructions — all managed in a single location.
            </div>
          </section>

          {/* Org Structure */}
          <section className="bg-white rounded-xl shadow border border-teal-200">
            <div className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
              🏢 Organisation Structure
            </div>
            <div className="p-4 space-y-2">
              <Link href="/admin/org-chart" className="block text-teal-800 hover:underline">
                🧭 View Org Chart
              </Link>
              <Link href="/admin/roles" className="block text-teal-800 hover:underline">
                🧱 Manage Roles
              </Link>
              <Link href="/admin/roles/add" className="block text-teal-800 hover:underline">
                ➕ Add New Role
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
