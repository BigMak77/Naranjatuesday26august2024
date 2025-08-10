'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

type AccessLevel = 'Admin' | 'Manager' | 'User' | 'HR'

interface Props {
  allowedRoles: AccessLevel | AccessLevel[]
  children: React.ReactNode
}

export default function RequireAccess({ allowedRoles, children }: Props) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data: session } = await supabase.auth.getUser()
      const authId = session?.user?.id
      if (!authId) return router.push('/login')

      const { data: user } = await supabase
        .from('users')
        .select('access_level')
        .eq('auth_id', authId)
        .single()

      const allowedLevels = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

      if (user && allowedLevels.includes(user.access_level)) {
        setAllowed(true)
      } else {
        setAllowed(false)
        router.push('/dashboard')
      }
    }

    check()
  }, [allowedRoles, router])

  if (allowed === null) return <p className="p-10 text-center">Checking access...</p>
  if (!allowed) return null

  return <>{children}</>
}
