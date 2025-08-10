// filepath: src/components/manager/ManagerAccessGuard.tsx
'use client'
import { useUser } from '@/lib/useUser'
import React from 'react'

export default function ManagerAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()

  if (loading) return null

  if (!['Manager', 'Admin'].includes(String(user?.access_level))) {
    return (
      <div className="neon-panel neon-center-content">
        <div>
          <h1 className="neon-form-title">Access Denied</h1>
          <p className="neon-info">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
