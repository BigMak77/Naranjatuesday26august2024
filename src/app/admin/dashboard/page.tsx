'use client'

import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'
import Head from 'next/head'

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Admin Dashboard | Naranja</title>
      </Head>

      <LogoHeader />

      <main className="min-h-screen bg-teal-50 text-teal-900 pb-20">
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12 text-teal-900">📊 Admin Dashboard</h1>

          <div className="grid gap-10">

            {/* 👥 People Management */}
            <section className="bg-white rounded-xl shadow border border-teal-200">
              <header className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
                👥 People Management
              </header>
              <nav className="p-5 space-y-2">
                <Link href="/admin/users" className="block hover:underline text-teal-800">🧑‍💼 View & Manage Users</Link>
                <Link href="/admin/users/add" className="block hover:underline text-teal-800">➕ Add New User</Link>
              </nav>
            </section>

            {/* 📦 Module Management */}
            <section className="bg-white rounded-xl shadow border border-teal-200">
              <header className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
                📦 Module Management
              </header>
              <nav className="p-5 space-y-2">
                <Link href="/admin/modules" className="block hover:underline text-teal-800">📂 View All Modules</Link>
                <Link href="/admin/modules/add" className="block hover:underline text-teal-800">➕ Add New Module</Link>
                <Link href="/admin/modules/assign" className="block hover:underline text-teal-800">📌 Assign Modules to Roles</Link>
              </nav>
            </section>

            {/* 📈 Training Progress */}
            <section className="bg-white rounded-xl shadow border border-teal-200">
              <header className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
                📈 Training Progress
              </header>
              <nav className="p-5">
                <Link href="/admin/progress" className="block hover:underline text-teal-800">📊 View Completion Dashboard</Link>
              </nav>
            </section>

            {/* 📁 Document Management */}
            <section className="bg-white rounded-xl shadow border border-teal-200">
              <header className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
                📁 Document Management
              </header>
              <nav className="p-5 space-y-2">
                <Link href="/admin/documents" className="block hover:underline text-teal-800">📄 View All Documents</Link>
                <Link href="/admin/documents/add" className="block hover:underline text-teal-800">➕ Add New Document</Link>
                <Link href="/admin/documents/versions" className="block hover:underline text-teal-800">🕓 View Document Versions</Link>
              </nav>
            </section>

            {/* 🏢 Organisation Structure */}
            <section className="bg-white rounded-xl shadow border border-teal-200">
              <header className="bg-teal-600 text-white font-semibold px-6 py-4 rounded-t-xl">
                🏢 Organisation Structure
              </header>
              <nav className="p-5 space-y-2">
                <Link href="/admin/org-chart" className="block hover:underline text-teal-800">🧭 View Org Chart</Link>
                <Link href="/admin/roles/add" className="block hover:underline text-teal-800">➕ Add New Role</Link>
              </nav>
            </section>

            {/* 🧩 Role Profile Builder */}
            <section className="bg-white rounded-xl shadow border border-teal-200">
              <header className="bg-orange-600 text-white font-semibold px-6 py-4 rounded-t-xl">
                🧩 Role Profile Builder
              </header>
              <nav className="p-5 space-y-2">
                <Link href="/admin/role-profiles" className="block hover:underline text-teal-800">📋 View All Role Profiles</Link>
                <Link href="/admin/role-profiles/add" className="block hover:underline text-teal-800">➕ Create New Role Profile</Link>
                <Link href="/admin/role-profiles/manage" className="block hover:underline text-teal-800">🛠 Manage Role-to-Training Assignments</Link>
              </nav>
            </section>

          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
