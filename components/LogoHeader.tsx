'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LogoHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setIsLoggedIn(!!data.session?.user)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="bg-gradient-to-r from-teal-50 to-teal-900 shadow-sm border-b-4 border-orange-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
  <div className="mr-2 w-[160px] h-[200px] relative">
    <Image
      src="/logo1.png"
      alt="Naranja logo"
      fill
      className="object-contain"
      priority
    />
  </div>
</Link>

        {/* Auth Button */}
        {isLoggedIn && (
          <Link
            href="/admin/dashboard"
            className="text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition shadow"
          >
            👤 Go to Dashboard
          </Link>
        )}
      </div>
    </header>
  )
}
