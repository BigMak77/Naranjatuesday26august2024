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
  FiDatabase
} from 'react-icons/fi'
import NeonFeatureCard from '@/components/NeonFeatureCard'


interface DashboardLink {
  href: string
  label: React.ReactNode
  className?: string
}

interface DashboardCard {
  title: React.ReactNode // <-- FIXED: allow JSX
  links: DashboardLink[]
}

export default function DashboardPage() {
  // Removed unused complianceData state
  const [avgCompliance, setAvgCompliance] = useState<number | null>(null)
  const [lowComplianceCount, setLowComplianceCount] = useState<number>(0)

  useEffect(() => {
    const fetchCompliance = async () => {
      const { data, error } = await supabase.from('user_compliance_dashboard').select('*')
      if (error) return
      // Removed setComplianceData as complianceData is unused

      let total = 0, percent = 0, low = 0
      data?.forEach(row => {
        if (row.total_items > 0) {
          const p = (row.completed_items / row.total_items) * 100
          percent += p
          total++
          if (p < 70) low++
        }
      })
      setAvgCompliance(total ? Number((percent / total).toFixed(1)) : null)
      setLowComplianceCount(low)
    }
    fetchCompliance()
  }, [])

  const iconSize = 16

  // Dashboard cards config
  const cards: DashboardCard[] = [
    {
      title: <><FiUsers size={20} /> People Management</>,
      links: [
        { href: '/hr/people', label: <><FiUsers size={iconSize} /> View & Manage Users</> },
      ],
    },
    {
      title: <><FiFolder size={20} /> Module Management</>,
      links: [
        { href: '/admin/modules', label: <><FiFolder size={iconSize} /> View Modules</> },
        { href: '/admin/modules/add', label: <><FiPlusCircle size={iconSize} /> Add Module</> },
        { href: '/admin/modules/assign', label: <><FiGrid size={iconSize} /> Assign to Roles</> },
      ],
    },
    {
      title: <><FiPieChart size={20} /> Training Progress</>,
      links: [
        { href: '/admin/compliance', label: <><FiPieChart size={iconSize} /> Compliance Dashboard</> },
        {
          href: '/admin/incomplete',
          label: <><FiAlertTriangle size={iconSize} /> Incomplete Training</>,
        },
      ],
    },
    {
      title: <><FiFileText size={20} /> Document Management</>,
      links: [
        { href: '/admin/documents', label: <><FiFileText size={iconSize} /> View Documents</> },
        { href: '/admin/documents/add', label: <><FiPlusCircle size={iconSize} /> Add Document</> },
        { href: '/admin/documents/versions', label: <><FiClipboard size={iconSize} /> View Versions</> },
      ],
    },
    {
      title: <><FiGrid size={20} /> Organisation Structure</>,
      links: [
        { href: '/admin/org-chart', label: <><FiGrid size={iconSize} /> Org Chart</> },
        { href: '/admin/roles/add', label: <><FiPlusCircle size={iconSize} /> Add Role</> },
      ],
    },
    {
      title: <><FiBookOpen size={20} /> Role Profile Builder</>,
      links: [
        { href: '/admin/role-profiles', label: <><FiBookOpen size={iconSize} /> View Profiles</> },
        { href: '/admin/role-profiles/add', label: <><FiPlusCircle size={iconSize} /> Create Profile</> },
        { href: '/admin/role-profiles/manage', label: <><FiSettings size={iconSize} /> Manage Assignments</> },
      ],
    },
    {
      title: <><FiShield size={20} /> Health & Safety</>,
      links: [
        { href: '/turkus/health-safety', label: <><FiShield size={iconSize} /> H&S Home</> },
        { href: '/turkus/health-safety/policies', label: <><FiFileText size={iconSize} /> Policies</> },
        { href: '/turkus/health-safety/assessments', label: <><FiActivity size={iconSize} /> Risk Assessments</> },
        { href: '/turkus/health-safety/incidents', label: <><FiAlertTriangle size={iconSize} /> Incidents</> },
        { href: '/turkus/health-safety/resources', label: <><FiBookOpen size={iconSize} /> Resources</> },
      ],
    },
    {
      title: <><FiHome size={20} /> Turkus</>,
      links: [
        { href: '/turkus', label: <><FiHome size={iconSize} /> Turkus Home</> },
        { href: '/tasks/dashboard', label: <><FiBarChart2 size={iconSize} /> Dashboard</> },
        { href: '/tasks', label: <><FiGrid size={iconSize} /> Tasks</> },
        { href: '/turkus/reports', label: <><FiPieChart size={iconSize} /> Reports</> },
        { href: '/turkus/assignments', label: <><FiSettings size={iconSize} /> Assignments</> },
        { href: '/turkus/taskmanager', label: <><FiClipboard size={iconSize} /> Task Manager</> },
        { href: '/turkus/audit', label: <><FiDatabase size={iconSize} /> Audit</> },
        { href: '/turkus/documents', label: <><FiFileText size={iconSize} /> Document Manager</> },
        { href: '/turkus/issues', label: <><FiAlertTriangle size={iconSize} /> Issues</> },
      ],
    },
  ]

  return (
    <>
      <main>
        <section className="dashboard-grid">
          {/* Compliance Feature Card with embedded compliance overview */}
          <div className="dashboard-card">
            <NeonFeatureCard
              icon={<FiPieChart size={24} color="#ffa500" aria-label="Compliance" />}
              title="Compliance Dashboard"
              text="Track and manage training compliance across your organization."
              href="/admin/compliance"
              className="neon-feature-card neon-feature-card-compliance"
            >
              {/* Compliance Overview Section embedded here */}
              <section className="dashboard-overview">
                <div className="overview-info">
                  <p className="overview-title">
                    <FiPieChart size={iconSize} /> Compliance Overview
                  </p>
                  <p className="overview-desc">Live summary of completion status</p>
                </div>
                <div className="overview-stats">
                  <p className="overview-stat">
                    <FiCheckCircle size={iconSize} /> <strong>Avg Compliance:</strong> {avgCompliance ?? 'Loading...'}%
                  </p>
                  <p className="overview-stat">
                    <FiAlertTriangle size={iconSize} className="icon-warning" /> <strong>Users &lt; 70%:</strong> {lowComplianceCount}
                  </p>
                </div>
              </section>
              <div className="dashboard-links">
                <Link href="/admin/compliance" className="dashboard-link">
                  <FiPieChart size={16} color="#ffa500" aria-label="Compliance" /> View Compliance Overview
                </Link>
                <Link href="/admin/incomplete" className="dashboard-link">
                  <FiAlertTriangle size={16} color="#ffa500" aria-label="Incomplete" /> Incomplete Training
                </Link>
              </div>
            </NeonFeatureCard>
          </div>
          {cards.map((card, idx) => {
            let icon = <FiActivity />
            let title = 'Feature'
            if (React.isValidElement(card.title)) {
              const element = card.title as React.ReactElement<{ children?: React.ReactNode }>
              const children = element.props?.children
              if (Array.isArray(children)) {
                icon = children[0] || <FiActivity />
                title = typeof children[1] === 'string' ? children[1] : 'Feature'
              } else {
                title = typeof children === 'string' ? children : 'Feature'
              }
            } else if (typeof card.title === 'string') {
              title = card.title
            }
            const firstLabel = typeof card.links[0]?.label === 'string' ? card.links[0].label : ''
            return (
              <div key={idx} className="dashboard-card">
                <NeonFeatureCard
                  icon={icon}
                  title={title}
                  text={firstLabel}
                  href={card.links[0]?.href || '#'}
                >
                  <div className="dashboard-links">
                    {card.links.map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        className="dashboard-link"
                      >
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
