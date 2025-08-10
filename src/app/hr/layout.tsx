"use client"

// Server component layout (no 'use client')
import RequireAccess from '@/components/RequireAccess'

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div>
        {/* Removed UserProfileCard */}
      </div>
      <RequireAccess allowedRoles={['HR', 'Admin']}>
        {children}
      </RequireAccess>
    </>
  )
}
