'use client'

import { useState } from 'react'

export default function TriggerFakeUserButton() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, unknown> | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setResults(null)

    try {
      const res = await fetch('/api/register-fake-users', {
        method: 'POST'
      })

      const data = await res.json()
      setResults(data)
    } catch {
      setResults({ error: 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="trigger-fake-user-root">
      <button
        onClick={handleClick}
        disabled={loading}
        className="trigger-fake-user-btn"
      >
        {loading ? 'Creating Fake Users...' : 'Register Fake Users'}
      </button>

      {results && (
        <pre className="trigger-fake-user-results">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  )
}
