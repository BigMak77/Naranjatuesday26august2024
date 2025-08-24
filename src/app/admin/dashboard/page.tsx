'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import {
  FiUsers,
  FiPlus,
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
  FiLayers,
  FiUserCheck,
  FiClock
} from 'react-icons/fi'
import NeonFeatureCard from '@/components/NeonFeatureCard'

interface DashboardLink {
  href: string
  label: React.ReactNode
  className?: string
}

interface DashboardCard {
  title: React.ReactNode
  links: DashboardLink[]
}

export default function DashboardPage() {
  const [avgCompliance, setAvgCompliance] = useState<number | null>(null)
  const [lowComplianceCount, setLowComplianceCount] = useState<number>(0)

  useEffect(() => {
    const fetchCompliance = async () => {
      const { data, error } = await supabase.from('user_compliance_dashboard').select('*')
      if (error) return

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

  const iconSize = 18

  const cards: DashboardCard[] = [
    {
      title: <><FiUsers size={20} /> People</>,
      links: [
        { href: '/hr/people', label: <><FiUsers size={iconSize} /> People</> },
      ],
    },
    {
      title: <><FiLayers size={20} /> Modules</>,
      links: [
        { href: '/admin/modules', label: <><FiLayers size={iconSize} /> Modules</> },
        { href: '/admin/modules/add', label: <><FiPlus size={iconSize} /> Add Module</> },
        { href: '/admin/modules/assign', label: <><FiUserCheck size={iconSize} /> Assign Module</> },
      ],
    },
    {
      title: <><FiShield size={20} /> Compliance</>,
      links: [
        { href: '/admin/compliance', label: <><FiShield size={iconSize} /> Compliance</> },
        { href: '/admin/incomplete', label: <><FiAlertTriangle size={iconSize} /> Incomplete</> },
      ],
    },
    {
      title: <><FiFileText size={20} /> Documents</>,
      links: [
        { href: '/admin/documents', label: <><FiFileText size={iconSize} /> Documents</> },
        { href: '/admin/documents/add', label: <><FiPlus size={iconSize} /> Add Document</> },
        { href: '/admin/documents/versions', label: <><FiClock size={iconSize} /> Versions</> },
      ],
    },
    {
      title: <><FiUsers size={20} /> Org Chart</>,
      links: [
        { href: '/admin/org-chart', label: <><FiUsers size={iconSize} /> Org Chart</> },
        { href: '/admin/roles/add', label: <><FiPlus size={iconSize} /> Add Role</> },
      ],
    },
    {
      title: <><FiUserCheck size={20} /> Role Profiles</>,
      links: [
        { href: '/admin/role-profiles', label: <><FiUserCheck size={iconSize} /> Role Profiles</> },
        { href: '/admin/role-profiles/add', label: <><FiPlus size={iconSize} /> Add Profile</> },
        { href: '/admin/role-profiles/manage', label: <><FiSettings size={iconSize} /> Manage Profiles</> },
      ],
    },
    {
      title: <><FiShield size={iconSize} /> Health & Safety</>,
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

  return (
    <>
      <main className="dashboard-panel">
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
            <Link
              href="/admin/compliance"
              className="dashboard-btn"
            >
              <FiPieChart size={iconSize} /> View Full →
            </Link>
          </div>
        </section>

        <section className="dashboard-grid">
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
