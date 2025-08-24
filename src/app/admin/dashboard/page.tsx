'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import {
  FiUsers,
  FiFolder,
  FiPlusCircle,
  FiGrid,
  FiClipboard,
  FiPieChart,
  FiAlertTriangle,
  FiFileText,
  FiBookOpen,
  FiShield,
  FiActivity,
  FiSettings,
  FiHome,
  FiCheckCircle,
  FiBarChart2,
  FiDatabase,
} from 'react-icons/fi'
import NeonFeatureCard from '@/components/NeonFeatureCard'
import ContentHeader from '@/components/headersandfooters/ContentHeader'

import NeonPanel from '@/components/NeonPanel'

interface DashboardLink {
  href: string
  label: React.ReactNode
  className?: string
}

interface DashboardCard {
  icon: React.ReactNode
  title: string
  links: DashboardLink[]
}

// keep outside to avoid recreating every render
const iconSize = 16

const cards: DashboardCard[] = [
  {
    icon: <FiUsers size={20} />,
    title: 'People Management',
    links: [{ href: '/hr/people', label: <><FiUsers size={iconSize} /> View &amp; Manage Users</> }],
  },
  {
    icon: <FiFolder size={20} />,
    title: 'Module Management',
    links: [
      { href: '/admin/modules', label: <><FiFolder size={iconSize} /> View Modules</> },
      { href: '/admin/modules/add', label: <><FiPlusCircle size={iconSize} /> Add Module</> },
      { href: '/admin/modules/assign', label: <><FiGrid size={iconSize} /> Assign to Roles</> },
    ],
  },
  {
    icon: <FiPieChart size={20} />,
    title: 'Training Progress',
    links: [
      { href: '/admin/compliance', label: <><FiPieChart size={iconSize} /> Compliance Dashboard</> },
      { href: '/admin/incomplete', label: <><FiAlertTriangle size={iconSize} /> Incomplete Training</> },
    ],
  },
  {
    icon: <FiFileText size={20} />,
    title: 'Document Management',
    links: [
      { href: '/admin/documents', label: <><FiFileText size={iconSize} /> View Documents</> },
      { href: '/admin/documents/add', label: <><FiPlusCircle size={iconSize} /> Add Document</> },
      { href: '/admin/documents/versions', label: <><FiClipboard size={iconSize} /> View Versions</> },
    ],
  },
  {
    icon: <FiGrid size={20} />,
    title: 'Organisation Structure',
    links: [
      { href: '/admin/org-chart', label: <><FiGrid size={iconSize} /> Org Chart</> },
      { href: '/admin/roles/add', label: <><FiPlusCircle size={iconSize} /> Add Role</> },
    ],
  },
  {
    icon: <FiBookOpen size={20} />,
    title: 'Role Profile Builder',
    links: [
      { href: '/admin/role-profiles', label: <><FiBookOpen size={iconSize} /> View Profiles</> },
      { href: '/admin/role-profiles/add', label: <><FiPlusCircle size={iconSize} /> Create Profile</> },
      { href: '/admin/role-profiles/manage', label: <><FiSettings size={iconSize} /> Manage Profiles</> },
    ],
  },
  {
    icon: <FiShield size={20} />,
    title: 'Health & Safety',
    links: [
      { href: '/turkus/health-safety', label: <><FiShield size={iconSize} /> H&amp;S Home</> },
      { href: '/turkus/health-safety/policies', label: <><FiFileText size={iconSize} /> Policies</> },
      { href: '/turkus/health-safety/assessments', label: <><FiActivity size={iconSize} /> Risk Assessments</> },
      { href: '/turkus/health-safety/incidents', label: <><FiAlertTriangle size={iconSize} /> Incidents</> },
      { href: '/turkus/health-safety/resources', label: <><FiBookOpen size={iconSize} /> Resources</> },
    ],
  },
  {
    icon: <FiHome size={20} />,
    title: 'Turkus',
    links: [
      { href: '/turkus', label: <><FiHome size={iconSize} /> Turkus Home</> },
      { href: '/turkus/tasks/dashboard', label: <><FiBarChart2 size={iconSize} /> Dashboard</> },
      { href: '/turkus/tasks', label: <><FiGrid size={iconSize} /> Tasks</> },
      { href: '/turkus/reports', label: <><FiPieChart size={iconSize} /> Reports</> },
      { href: '/turkus/assignments', label: <><FiSettings size={iconSize} /> Assignments</> },
      { href: '/turkus/taskmanager', label: <><FiClipboard size={iconSize} /> Task Manager</> },
      { href: '/turkus/audit', label: <><FiDatabase size={iconSize} /> Audit</> },
      { href: '/turkus/documents', label: <><FiFileText size={iconSize} /> Document Manager</> },
      { href: '/turkus/issues', label: <><FiAlertTriangle size={iconSize} /> Issues</> },
    ],
  },
]

export default function DashboardPage() {
  const [avgCompliance, setAvgCompliance] = useState<number | null>(null)
  const [lowComplianceCount, setLowComplianceCount] = useState<number>(0)

  useEffect(() => {
    const fetchCompliance = async () => {
      const { data, error } = await supabase.from('user_compliance_dashboard').select('*')

      if (error) {
        console.error('Error fetching compliance:', error.message)
        return
      }

      let total = 0
      let percentSum = 0
      let low = 0

      data?.forEach((row: any) => {
        if (row.total_items > 0) {
          const p = (row.completed_items / row.total_items) * 100
          percentSum += p
          total++
          if (p < 70) low++
        }
      })

      setAvgCompliance(total ? Number((percentSum / total).toFixed(1)) : null)
      setLowComplianceCount(low)
    }

    fetchCompliance()
  }, [])

  return (
    <>
      <ContentHeader
        title="Admin Dashboard"
        description="Overview and quick access to all admin features, including people, modules, compliance, documents, and more."
      />

      <main className="global-content dashboard-panel">
        <NeonPanel>
          <section className="dashboard-overview neon-panel-border">
            <div className="overview-info">
              <p className="overview-title neon-header">
                <FiPieChart size={iconSize} />
              </p>
              <p className="overview-desc">Live summary of completion status</p>
            </div>

            <div className="overview-stats">
              <p className="overview-stat">
                <FiCheckCircle size={iconSize} /> <strong>Avg Compliance:</strong>{' '}
                {avgCompliance !== null ? `${avgCompliance}%` : 'Loading...'}
              </p>
              <p className="overview-stat">
                <FiAlertTriangle size={iconSize} className="icon-warning" />{' '}
                <strong>Users &lt; 70%:</strong> {lowComplianceCount}
              </p>
              <Link href="/admin/compliance" className="dashboard-btn neon-btn" aria-label="Open Compliance Dashboard">
                <FiPieChart size={iconSize} />
              </Link>
            </div>
          </section>
        </NeonPanel>

        <section className="dashboard-grid">
          {cards.map((card, idx) => {
            const firstLink = card.links[0]
            const firstText = typeof firstLink?.label === 'string' ? firstLink.label : ''

            return (
              <div key={idx} className="dashboard-card">
                <NeonFeatureCard
                  icon={card.icon}
                  title={card.title}
                  text={firstText}
                  href={firstLink?.href || '#'}
                >
                  <div className="dashboard-links">
                    {card.links.map((link, i) => (
                      <Link key={i} href={link.href} className="dashboard-link">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </NeonFeatureCard>
              </div>
            )
          })}
        </section>
      </main>
    </>
  )
}
