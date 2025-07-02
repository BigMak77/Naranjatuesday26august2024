'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface RoleProfile {
  id: string
  name: string
  description: string | null
}

export default function RoleProfilesPage() {
  const [profiles, setProfiles] = useState<RoleProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('role_profiles')
        .select('id, name, description')

      if (error) {
        setError('Failed to load role profiles.')
      } else if (data) {
        setProfiles(data)
      }

      setLoading(false)
    }

    fetchProfiles()
  }, [])

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this role profile? This cannot be undone.')
    if (!confirm) return

    const { error } = await supabase
      .from('role_profiles')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete role profile.')
    } else {
      setProfiles(prev => prev.filter(profile => profile.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-teal-50 text-teal-900">
      <LogoHeader />
      <div className="max-w-5xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8 text-orange-600">📋 Role Profiles</h1>

        <div className="mb-6">
          <Link
            href="/admin/role-profiles/add"
            className="bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700"
          >
            ➕ Add New Profile
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <ul className="space-y-4">
            {profiles.map((profile) => (
              <li key={profile.id} className="bg-white border border-teal-200 p-4 rounded shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-teal-900">{profile.name}</h2>
                    <p className="text-sm text-gray-600">{profile.description || 'No description provided'}</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Link href={`/admin/role-profiles/${profile.id}`} className="text-blue-600 hover:underline">View</Link>
                    <Link href={`/admin/role-profiles/${profile.id}/edit`} className="text-green-600 hover:underline">Edit</Link>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </main>
  )
}
