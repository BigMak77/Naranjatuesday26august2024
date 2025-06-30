'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  showBackButton?: boolean
  backHref?: string
}

export default function DashboardHeader({
  showBackButton = true,
  backHref = '/admin/dashboard',
}: DashboardHeaderProps) {
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setEmail(user.email ?? null)

        const fullName =
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'User'
        setName(fullName)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-gradient-to-r from-teal-100 to-teal-300 text-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Back Button */}
        <div>
          {showBackButton && (
            <Link
              href={backHref}
              className="text-sm font-medium text-teal-800 hover:underline"
            >
              ← Back to Dashboard
            </Link>
          )}
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4 text-sm">
          {name && (
            <span className="text-gray-700 whitespace-nowrap">
              Logged in as <strong>{name}</strong>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
