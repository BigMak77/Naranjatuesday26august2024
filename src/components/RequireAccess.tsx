'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/useUser'

type AccessLevel = 'Admin' | 'Manager' | 'User' | 'HR'

interface Props {
  allowedRoles: AccessLevel | AccessLevel[]
  children: React.ReactNode
}

export default function RequireAccess({ allowedRoles, children }: Props) {
  const router = useRouter()
  const { user, loading } = useUser()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return router.push('/login')
    const allowedLevels = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    // Normalize both sides to lowercase for comparison
    const userLevel = (user?.access_level ?? '').toLowerCase();
    const allowedNormalized = allowedLevels.map(l => l.toLowerCase());
    if (user && allowedNormalized.includes(userLevel)) {
      setAllowed(true);
    } else {
      setAllowed(false);
      // Redirect based on user role
      if (userLevel === "admin") {
        router.push("/admin/dashboard");
      } else if (userLevel === "manager") {
        router.push("/manager/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    }
  }, [allowedRoles, user, loading, router])

  if (allowed === null) return <p className="p-10 text-center">Checking access...</p>
  if (!allowed) return null

  return <>{children}</>
}
