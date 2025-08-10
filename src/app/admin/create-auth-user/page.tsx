'use client'

import { useState } from 'react'
import NeonForm from '@/components/NeonForm'

export default function CreateAuthUserPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<null | string>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Creating user...')

    const res = await fetch('/api/create-auth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const result = await res.json()

    if (res.ok) {
      setStatus(`✅ Created user: ${result.user.email}`)
      setEmail('')
      setPassword('')
    } else {
      setStatus(`❌ Error: ${result.error}`)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Auth User</h1>
      <NeonForm title="Create Auth User" submitLabel="Create User" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {status && <p className="mt-4 text-sm">{status}</p>}
      </NeonForm>
    </div>
  )
}
