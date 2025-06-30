'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function ManageModulesPanel() {
  const [expanded, setExpanded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('role_title')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching role:', error.message)
        return
      }

      setIsAdmin(data?.role_title?.toLowerCase() === 'admin')
    }

    checkRole()
  }, [])

  if (!isAdmin) return null

  return (
    <div className="border border-teal-300 rounded-xl bg-white shadow max-w-lg mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center px-6 py-4 bg-teal-600 text-white font-semibold rounded-t-xl hover:bg-teal-700 transition"
      >
        <span>📦 Manage Modules</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-4 bg-teal-50 space-y-3 rounded-b-xl">
          <Link href="/admin/modules/add" className="block text-teal-800 hover:underline">
            ➕ Add Module
          </Link>
          <Link href="/admin/modules/edit" className="block text-teal-800 hover:underline">
            ✏️ Edit Module
          </Link>
          <Link href="/admin/modules/delete" className="block text-teal-800 hover:underline">
            ❌ Delete Module
          </Link>
        </div>
      )}
    </div>
  )
}
