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

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!authId) return <div className="p-8 text-center text-red-600">You must be logged in to view your training dashboard.</div>

  return (
    <main className="min-h-screen bg-[#012f34] text-[#b2f1ec] px-0 py-0">
      <div className="pt-1 pb-2">
        {/* <UserProfileCard authId={authId} /> */}
      </div>
      <div className="pt-2 pb-2">
        <UserTrainingDashboard authId={authId} />
      </div>
      <div className="pt-2 pb-8">
        <UserTrainingRequest userId={authId} />
      </div>
    </main>
  )
}