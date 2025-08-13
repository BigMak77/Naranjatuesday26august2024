"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import UserTrainingDashboard from '@/components/training/UserTrainingDashboard'
import UserTrainingRequest from '@/components/user/UserTrainingRequest'

export default function UserDashboardPage() {
  const [authId, setAuthId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setAuthId(data.user?.id || null)
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="neon-loading">Loading...</div>
  if (!authId) return <div className="error-message">You must be logged in to view your training dashboard.</div>

  return (
    <div className="after-hero">
      <div className="page-content">
        <main className="page-main">
          {/* <UserProfileCard authId={authId} /> */}
          <UserTrainingDashboard authId={authId} />
          <UserTrainingRequest userId={authId} />
        </main>
      </div>
    </div>
  )
}