'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface RoleProfile {
  id: string
  name: string
  description: string | null
}

export default function RoleProfileDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [profile, setProfile] = useState<RoleProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('role_profiles')
        .select('id, name, description')
        .eq('id', id)
        .single()

      if (error) {
        setError('Failed to load profile')
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [id])

  return (
    <main className="min-h-screen bg-white text-teal-900">
      <LogoHeader />
      <div className="max-w-3xl mx-auto py-10 px-6">
        {loading ? (
          <p className="text-gray-600">Loading profile...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : profile ? (
          <>
            <h1 className="text-3xl font-bold text-orange-600 mb-4">{profile.name}</h1>
            <p className="text-gray-700">{profile.description || 'No description provided.'}</p>
          </>
        ) : (
          <p>No profile found.</p>
        )}
      </div>
      <Footer />
    </main>
  )
}
