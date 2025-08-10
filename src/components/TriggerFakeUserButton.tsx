'use client'

import { useState } from 'react'

export default function TriggerFakeUserButton() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleClick = async () => {
    setLoading(true)
    setResults(null)

    try {
      const res = await fetch('/api/register-fake-users', {
        method: 'POST'
      })

      const data = await res.json()
      setResults(data)
    } catch (err) {
      setResults({ error: 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? 'Creating Fake Users...' : 'Register Fake Users'}
      </button>

      {results && (
        <pre className="mt-4 p-4 bg-gray-100 text-sm overflow-x-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  )
}
