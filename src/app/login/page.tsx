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
    <div className="login-page-root">
      {/* 🔲 Animated Background Image */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror' }}
        className="login-bg-animated"
      >
        <Image
          src="/unpeeledoranges.jpg"
          alt="Background"
          fill
          className="login-bg-image"
          priority
        />
        {/* Remove white overlay for neon look */}
      </motion.div>

      {/* 🔙 Back to Home */}
      <div className="login-back-link-wrapper">
        <Link
          href="/"
          className="login-back-link"
        >
          ← Back to Home
        </Link>
      </div>

      {/* 🔳 Login Form */}
      <div className="login-form-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="login-form-panel"
        >
          <h1 className="login-title">NARANJA Login</h1>

          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label className="login-label">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="login-label">Password</label>
              <input
                type="password"
                required
                placeholder="********"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="login-submit-btn"
            >
              Log In
            </button>

            {error && <p className="login-error-msg">{error}</p>}
          </form>
        </motion.div>
      </div>
    </div>
  )
}
