'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function RoleProfileDetailPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<{ name: string; description?: string } | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const { data: profileData } = await supabase
        .from('role_profiles')
        .select()
        .eq('id', id)
        .single()
      setProfile(profileData)
    }
    fetchAll()
  }, [id])

  if (!profile) return <div className="text-center py-10 text-white">Loading...</div>

  return <div className="text-center py-10 text-white">Role profile viewer is not available.</div>
}
