'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'
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

    if (!name || !description || !groupId) {
      setError('All fields are required.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('modules').insert({
      name,
      description,
      version: 1,
      group_id: groupId,
    })

    if (insertError) {
      setError(`Failed to add module: ${insertError.message}`)
      setLoading(false)
    } else {
      router.push('/admin/modules') // redirect to module list
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      <div className="p-6 max-w-3xl mx-auto w-full mt-6">
        <div className="bg-white rounded-xl shadow border border-teal-200 p-6">
          <h1 className="text-3xl font-bold text-teal-800 mb-6">➕ Add Training Module</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-semibold mb-1">Module Group</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                className="w-full border border-teal-300 p-2 rounded"
              >
                <option value="">Select a group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Module Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-teal-300 p-2 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full border border-teal-300 p-2 rounded"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2 rounded ${
                loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {loading ? 'Saving...' : 'Save Module'}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
