'use client'

import { useEffect, useState } from 'react'
import { getChildDepartments } from '@/lib/getChildDepartments'
import { useUser } from '@/lib/useUser'
import { supabase } from '@/lib/supabase-client'
import {
  FiUsers,
  FiClipboard,
  FiAlertCircle,
  FiActivity,
  FiBarChart2,
  FiShield
} from 'react-icons/fi'
import NeonFeatureCard from '@/components/NeonFeatureCard'

export default function ManagerDashboard() {
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const visibleDepartments = await getChildDepartments(user.department_id)

        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, department:departments(name), role:roles(title)')
          .in('department_id', visibleDepartments)
          .gt('access_level', user.access_level)

        if (error) throw error
        setUsers(data || [])
      } catch (err: any) {
        console.error(err)
        setError('Failed to load users.')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user])

  return (
    <main className="after-hero">
      <div className="page-content">
        <div className="manager-dashboard-header">
          <FiBarChart2 className="manager-dashboard-header-icon" />
          <h1 className="manager-dashboard-title">Manager Dashboard</h1>
        </div>
        <div className="manager-dashboard-cards">
          <NeonDashboard />
        </div>
        <div className="manager-dashboard-team-widget">
          <div className="manager-dashboard-team-widget-content">
            <p className="manager-dashboard-team-count">{users.length}</p>
            <p className="manager-dashboard-team-label">Team Members</p>
          </div>
        </div>
        <div className="manager-dashboard-team-table-wrapper">
          <div className="manager-dashboard-team-table-header">
            <FiUsers className="manager-dashboard-team-table-icon" />
            <h2 className="manager-dashboard-team-table-title">Team Members</h2>
          </div>
          {loading ? (
            <p className="manager-dashboard-loading">Loading...</p>
          ) : error ? (
            <p className="manager-dashboard-error">{error}</p>
          ) : users.length === 0 ? (
            <p className="manager-dashboard-no-users">No team members found.</p>
          ) : (
            <div className="manager-dashboard-table-scroll">
              <table className="manager-dashboard-table">
                <thead className="manager-dashboard-table-head">
                  <tr>
                    <th className="manager-dashboard-table-th">Name</th>
                    <th className="manager-dashboard-table-th">Department</th>
                    <th className="manager-dashboard-table-th">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="manager-dashboard-table-row">
                      <td className="manager-dashboard-table-td">{u.first_name} {u.last_name}</td>
                      <td className="manager-dashboard-table-td">
                        <span className="manager-dashboard-department-badge">
                          {u.department?.name || '—'}
                        </span>
                      </td>
                      <td className="manager-dashboard-table-td">
                        <span className={`manager-dashboard-role-badge manager-dashboard-role-badge-${(u.role?.title || '').toLowerCase()}`.trim()}>
                          {u.role?.title || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const NeonDashboard = () => {
  const cards = [
    {
      title: 'My Tasks',
      text: 'Check upcoming tasks and track completions.',
      icon: <FiClipboard />,
      href: '/manager/tasks',
    },
    {
      title: 'My Issues',
      text: 'View raised issues and follow up on resolutions.',
      icon: <FiAlertCircle />,
      href: '/manager/issues',
    },
    {
      title: 'Team Compliance',
      text: 'Monitor training and compliance status.',
      icon: <FiBarChart2 />,
      href: '/manager/compliance',
    },
    {
      title: 'Health & Safety',
      text: 'Resources and reports for safety.',
      icon: <FiShield />,
      href: '/manager/health-safety',
    },
  ]

  return (
    <div className="manager-dashboard-cards-grid">
      {cards.map((card, i) => (
        <NeonFeatureCard
          key={i}
          icon={card.icon}
          title={card.title}
          text={card.text}
          href={card.href}
        />
      ))}
    </div>
  )
}
