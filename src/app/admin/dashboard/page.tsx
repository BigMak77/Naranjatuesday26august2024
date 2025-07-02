'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '@/lib/supabaseClient'

interface ComplianceSummary {
  user_id: string
  user_name: string
  department: string
  total_items: number
  completed_items: number
  overdue: number
  due_soon: number
}

interface DashboardLink {
  href: string
  label: string
  className?: string
}

interface DashboardCard {
  title: string
  bg?: string
  note?: string
  links: DashboardLink[]
}

export default function DashboardPage() {
  const [complianceData, setComplianceData] = useState<ComplianceSummary[]>([])
  const [avgCompliance, setAvgCompliance] = useState<number | null>(null)
  const [lowComplianceCount, setLowComplianceCount] = useState<number>(0)

  useEffect(() => {
    const fetchCompliance = async () => {
      const { data, error } = await supabase.from('user_compliance_dashboard').select('*')
      if (error) {
        console.error('Failed to fetch compliance summary:', error)
        return
      }

      setComplianceData(data)

      let totalUsers = 0
      let totalPercent = 0
      let lowCount = 0

      data.forEach((row) => {
        if (row.total_items > 0) {
          const percent = (row.completed_items / row.total_items) * 100
          totalPercent += percent
          totalUsers += 1
          if (percent < 70) lowCount += 1
        }
      })

      setAvgCompliance(totalUsers > 0 ? Number((totalPercent / totalUsers).toFixed(1)) : null)
      setLowComplianceCount(lowCount)
    }

    fetchCompliance()
  }, [])

  const cards: DashboardCard[] = [
    {
      title: '👥 People Management',
      links: [
        { href: '/admin/users', label: '🧑‍💼 View & Manage Users' },
        { href: '/admin/users/add', label: '➕ Add New User' },
      ],
    },
    {
      title: '📦 Module Management',
      links: [
        { href: '/admin/modules', label: '📂 View All Modules' },
        { href: '/admin/modules/add', label: '➕ Add New Module' },
        { href: '/admin/modules/assign', label: '📌 Assign Modules to Roles' },
      ],
    },
    {
      title: '📈 Training Progress',
      links: [
        { href: '/admin/compliance', label: '📊 View Compliance Dashboard' },
        { href: '/admin/incomplete', label: '🚨 View Incomplete Training', className: 'text-red-700 font-semibold' },
      ],
      note: 'Track completions, overdue training, and untrained users.',
    },
    {
      title: '📁 Document Management',
      links: [
        { href: '/admin/documents', label: '📄 View All Documents' },
        { href: '/admin/documents/add', label: '➕ Add New Document' },
        { href: '/admin/documents/versions', label: '🕓 View Document Versions' },
      ],
    },
    {
      title: '🏢 Organisation Structure',
      links: [
        { href: '/admin/org-chart', label: '🧭 View Org Chart' },
        { href: '/admin/roles/add', label: '➕ Add New Role' },
      ],
    },
    {
      title: '🧩 Role Profile Builder',
      bg: 'bg-orange-600',
      links: [
        { href: '/admin/role-profiles', label: '📋 View All Role Profiles' },
        { href: '/admin/role-profiles/add', label: '➕ Create New Role Profile' },
        { href: '/admin/role-profiles/manage', label: '🛠 Manage Role-to-Training Assignments' },
      ],
    },
  ]

  return (
    <>
      <Head>
        <title>Admin Dashboard | Naranja</title>
      </Head>

      <section className="py-12 px-6 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-center mb-10 text-white">📊 Admin Dashboard</h1>

        {/* Compliance Overview Bar */}
        <div className="compliance-overview rounded-xl p-5 mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow bg-orange-100 border border-orange-300 text-orange-800">
          <div>
            <p className="text-lg font-semibold">Compliance Overview</p>
            <p className="text-sm">Live summary of completion status across all users</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
            <p>
              ✅ <strong>Avg Compliance:</strong>{' '}
              {avgCompliance !== null ? `${avgCompliance}%` : 'Loading...'}
            </p>
            <p>
              ⚠️ <strong>Users &lt; 70%:</strong> {lowComplianceCount}
            </p>
            <Link href="/admin/compliance" className="btn btn-primary mt-2 sm:mt-0">
              View Full Dashboard →
            </Link>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {cards.map((card, idx) => (
            <section
              key={idx}
              className={`card ${card.bg ?? 'bg-teal-600'}`}
            >
              <header className="card-header">{card.title}</header>
              <nav className="p-5 space-y-2">
                {card.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block hover:underline ${link.className ?? ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
                {card.note && (
                  <p className="text-sm text-gray-600 mt-1">{card.note}</p>
                )}
              </nav>
            </section>
          ))}
        </div>
      </section>
    </>
  )
}
