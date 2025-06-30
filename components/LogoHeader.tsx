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
    <header className="bg-gradient-to-r from-teal-50 to-teal-900 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo1.png"
            alt="Naranja logo"
            width={180}
            height={60}
            className="object-contain"
          />
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
