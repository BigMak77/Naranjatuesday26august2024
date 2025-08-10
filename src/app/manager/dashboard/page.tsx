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
    <main className="min-h-screen flex items-center justify-center bg-[#011f24] text-white">
      <div className="w-full max-w-4xl px-4 md:px-8 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <FiBarChart2 className="text-[#40E0D0] text-3xl drop-shadow-[0_0_6px_#40E0D0]" />
          <h1 className="text-3xl font-bold text-white">Manager Dashboard</h1>
        </div>

        {/* Neon Dashboard Cards */}
        <div className="mb-8">
          <NeonDashboard />
        </div>

        {/* Team Widget */}
        <div className="w-32 h-32 mb-12 rounded-full bg-[#014f4f] border-4 border-[#40E0D0] flex items-center justify-center shadow-inner mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#40E0D0]">{users.length}</p>
            <p className="text-sm text-white">Team Members</p>
          </div>
        </div>

        {/* Team Table */}
        <div className="bg-[#014f4f] p-6 rounded-xl shadow border border-[#40E0D0]">
          <div className="flex items-center gap-2 mb-4">
            <FiUsers className="text-[#40E0D0]" />
            <h2 className="text-2xl font-semibold text-white">Team Members</h2>
          </div>

          {loading ? (
            <p className="text-white">Loading...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-white">No team members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-[#025b5b] text-[#40E0D0]">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Department</th>
                    <th className="px-4 py-2 text-left">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-[#027575] hover:bg-[#025050] transition">
                      <td className="px-4 py-2">{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-2">
                        <span className="bg-[#40E0D0] text-[#013737] px-2 py-1 rounded text-xs font-semibold">
                          {u.department?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold
                          ${u.role?.title === 'Manager'
                            ? 'bg-[#FF8C42] text-[#013737]'
                            : u.role?.title === 'Operator'
                            ? 'bg-[#40E0D0] text-[#013737]'
                            : 'bg-gray-500 text-white'}
                        `}>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {cards.map((card, i) => (
        <NeonFeatureCard
          key={i}
          icon={card.icon}
          title={card.title}
          text={card.text}
          href={card.href}
          bgColor="#0c1f24"
          borderColor="#40E0D0"
          textColor="#b2f1ec"
          linkColor="#40E0D0"
          glowColor="#40E0D0"
        />
      ))}
    </div>
  )
}
