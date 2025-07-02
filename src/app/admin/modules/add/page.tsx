'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface ModuleGroup {
  id: string
  name: string
}

export default function AddModulePage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupId, setGroupId] = useState('')
  const [groups, setGroups] = useState<ModuleGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase.from('modules_groups').select('id, name')
      if (error) {
        console.error('Error fetching groups:', error)
      } else {
        setGroups(data || [])
      }
    }

    fetchGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!name.trim() || !description.trim() || !groupId) {
      setError('All fields are required.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('modules').insert({
      name: name.trim(),
      description: description.trim(),
      version: 1,
      group_id: groupId,
    })

    if (insertError) {
      setError(`Failed to add module: ${insertError.message}`)
      setLoading(false)
    } else {
      router.push('/admin/modules')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <section className="max-w-3xl mx-auto w-full p-6 mt-6">
        <div className="bg-white rounded-xl shadow border border-teal-200 p-6">
          <h1 className="text-3xl font-bold text-teal-800 mb-6">➕ Add Training Module</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">Module Group</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                className="w-full border border-teal-300 rounded px-3 py-2 text-teal-900 bg-white"
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700">Module Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-teal-300 rounded px-3 py-2 text-teal-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full border border-teal-300 rounded px-3 py-2 text-teal-900 bg-white"
                rows={5}
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2 rounded transition ${
                loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {loading ? 'Saving...' : 'Save Module'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
