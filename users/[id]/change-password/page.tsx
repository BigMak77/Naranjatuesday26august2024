'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { id } = useParams()
  const [authId, setAuthId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single()

      if (error || !data?.auth_id) {
        setError('Could not load user or auth ID.')
      } else {
        setAuthId(data.auth_id)
      }

      setLoading(false)
    }

    fetchUser()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authId) return setError('Missing auth ID.')

    setSubmitting(true)

    const res = await fetch('/api/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_id: authId, new_password: password }),
    })

    const result = await res.json()

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => router.push('/admin/users'), 1500)
    } else {
      setError(result.error || 'Failed to update password')
    }

    setSubmitting(false)
  }

  if (loading) return <p className="p-6">Loading...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <form onSubmit={handleSubmit} className="bg-teal-50 border border-teal-200 rounded-lg p-8 shadow max-w-md w-full">
        <h1 className="text-xl font-bold mb-4 text-teal-900">🔒 Change Password</h1>

        {success && (
          <p className="mb-4 text-green-700 font-medium">✅ Password updated successfully!</p>
        )}

        <label className="block mb-2 text-sm font-medium">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded mb-4"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded w-full"
        >
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </main>
  )
}
