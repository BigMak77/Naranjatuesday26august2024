"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'

export default function ModuleViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [module, setModule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModule = async () => {
      const { data, error } = await supabase.from('modules').select('*').eq('id', id).single()
      if (error || !data) {
        setError('Module not found')
        setLoading(false)
        return
      }
      setModule(data)
      setLoading(false)
    }
    if (id) fetchModule()
  }, [id])

  if (loading) return <p className="p-6">Loading module...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <NeonPanel className="mt-4">
        {/* No explicit color classes, use global/neon theme only */}
        <h1 className="text-3xl font-bold mb-4">{module.name}</h1>
        <p className="mb-2 text-lg">{module.description}</p>
        <div className="mb-2">Version: <span className="font-semibold">{module.version}</span></div>
        <div className="mb-2">Status: <span className="font-semibold">{module.is_archived ? 'Archived' : 'Active'}</span></div>
        <div className="mb-2">Group ID: <span className="font-mono">{module.group_id}</span></div>
        <div className="mb-2">Learning Objectives: <span>{module.learning_objectives || '—'}</span></div>
        <div className="mb-2">Estimated Duration: <span>{module.estimated_duration || '—'}</span></div>
        <div className="mb-2">Delivery Format: <span>{module.delivery_format || '—'}</span></div>
        <div className="mb-2">Target Audience: <span>{module.target_audience || '—'}</span></div>
        <div className="mb-2">Prerequisites: <span>{(module.prerequisites && module.prerequisites.length > 0) ? module.prerequisites.join(', ') : '—'}</span></div>
        <div className="mb-2">Tags: <span>{(module.tags && module.tags.length > 0) ? module.tags.join(', ') : '—'}</span></div>
        <div className="mb-2">Created At: <span>{module.created_at ? new Date(module.created_at).toLocaleString() : '—'}</span></div>
        <div className="mb-2">Updated At: <span>{module.updated_at ? new Date(module.updated_at).toLocaleString() : '—'}</span></div>
        <button onClick={() => router.push(`/admin/modules/edit/${module.id}`)} className="mt-6 px-4 py-2 rounded font-semibold shadow transition">Edit Module</button>
        <button onClick={() => router.push('/admin/modules')} className="mt-2 ml-4 px-4 py-2 rounded font-semibold shadow transition">Cancel</button>
      </NeonPanel>
    </div>
  )
}
