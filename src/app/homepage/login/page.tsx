'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="login-page-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #013b3b 0%, #40E0D0 100%)', position: 'relative' }}>
      <div className="login-form-wrapper" style={{ width: '100%', maxWidth: 400, margin: '0 auto', zIndex: 2 }}>
        <div className="login-form-panel" style={{ background: 'var(--panel)', border: '2px solid var(--accent)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-neon)', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="login-title" style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>NARANJA Login</h1>
          <p style={{ color: 'var(--neon)', marginBottom: '2rem', textAlign: 'center', fontSize: '1.1rem' }}>Sign in to your account</p>
          <form onSubmit={handleLogin} className="login-form" style={{ width: '100%' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="login-label" style={{ color: 'var(--neon)', fontWeight: 600, marginBottom: '.5rem', display: 'block' }}>Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="login-input"
                style={{ width: '100%', background: 'var(--field)', color: 'var(--text)', border: '1.5px solid var(--neon)', borderRadius: 'var(--r-sm)', padding: '.75rem 1rem', fontSize: '1rem', marginBottom: '.5rem' }}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="login-label" style={{ color: 'var(--neon)', fontWeight: 600, marginBottom: '.5rem', display: 'block' }}>Password</label>
              <input
                type="password"
                required
                placeholder="********"
                className="login-input"
                style={{ width: '100%', background: 'var(--field)', color: 'var(--text)', border: '1.5px solid var(--neon)', borderRadius: 'var(--r-sm)', padding: '.75rem 1rem', fontSize: '1rem', marginBottom: '.5rem' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="neon-btn neon-btn-login login-submit-btn"
              data-variant="login"
              style={{ width: '100%', padding: '.85rem 0', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '1.08rem', marginTop: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .18s,color .18s, box-shadow .18s, transform .08s' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={{marginRight: '0.5em'}}>Logging in...</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="3" y1="12" x2="15" y2="12"></line></svg>
                </>
              ) : (
                <>
                  <span style={{marginRight: '0.5em'}}>Log In</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="3" y1="12" x2="15" y2="12"></line></svg>
                </>
              )}
            </button>
            {error && <p className="login-error-msg" style={{ color: '#ff4d4f', fontWeight: 600, textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
          </form>
          <Link href="/" className="login-back-link" style={{ marginTop: '2rem', color: 'var(--neon)', textDecoration: 'underline', fontWeight: 600, fontSize: '1rem', transition: 'color .18s' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
