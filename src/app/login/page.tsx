'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#011f24] text-[#40E0D0]">
      {/* 🔲 Animated Background Image */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror' }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/unpeeledoranges.jpg"
          alt="Background"
          fill
          className="object-cover brightness-25"
          priority
        />
        {/* Remove white overlay for neon look */}
      </motion.div>

      {/* 🔙 Back to Home */}
      <div className="relative z-10 w-full max-w-md px-4 -mt-10 mb-4 self-start">
        <Link
          href="/"
          className="text-sm text-[#40E0D0] hover:text-orange-300 font-medium transition"
        >
          ← Back to Home
        </Link>
      </div>

      {/* 🔳 Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full bg-[#011f24] bg-opacity-95 shadow-xl rounded-2xl p-8 border border-[#40E0D0] backdrop-blur"
      >
        <h1 className="text-3xl font-bold text-[#40E0D0] mb-6 text-center">NARANJA Login</h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#40E0D0] mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full border border-[#40E0D0] bg-transparent text-[#40E0D0] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40E0D0] placeholder:text-[#40E0D0]/60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#40E0D0] mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="********"
              className="w-full border border-[#40E0D0] bg-transparent text-[#40E0D0] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40E0D0] placeholder:text-[#40E0D0]/60"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#40E0D0] text-[#011f24] font-semibold py-3 rounded-lg hover:bg-orange-400 transition shadow-glow"
          >
            Log In
          </button>

          {error && <p className="text-orange-400 text-sm mt-2 text-center">{error}</p>}
        </form>
      </motion.div>
    </div>
  )
}
