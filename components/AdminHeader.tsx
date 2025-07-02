'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Menu } from '@headlessui/react'
import { ChevronDownIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      setIsLoggedIn(!!user)
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
      } else {
        setUserName(null)
      }
    }
    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession()
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-gradient-to-r from-teal-50 to-teal-900 shadow-sm border-b-4 border-orange-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
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

        {/* Right side: user dropdown or login */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex justify-center items-center text-white font-medium bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md shadow">
                👤 {userName} <ChevronDownIcon className="w-4 h-4 ml-2" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/admin/dashboard"
                        className={`block px-4 py-2 text-sm ${
                          active ? 'bg-orange-100 text-orange-800' : 'text-gray-900'
                        }`}
                      >
                        🏠 Dashboard
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/admin/users"
                        className={`block px-4 py-2 text-sm ${
                          active ? 'bg-orange-100 text-orange-800' : 'text-gray-900'
                        }`}
                      >
                        👤 Users
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/admin/modules"
                        className={`block px-4 py-2 text-sm ${
                          active ? 'bg-orange-100 text-orange-800' : 'text-gray-900'
                        }`}
                      >
                        📦 Modules
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          active ? 'bg-red-100 text-red-800' : 'text-red-600'
                        }`}
                      >
                        🔒 Log Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition shadow"
            >
              🔐 Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
