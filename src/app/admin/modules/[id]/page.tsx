"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  is_archived: boolean;
  group_id: string;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export default function ModuleViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [module, setModule] = useState<Module | null>(null)
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

  if (loading) return <p className="neon-loading">Loading module...</p>
  if (error) return <p className="neon-error">{error}</p>
  if (!module) return null;

  return (
    <div className="admin-module-view-container">
      <NeonPanel className="admin-module-panel">
        <h1 className="admin-module-title">{module.name}</h1>
        <p className="admin-module-description">{module.description}</p>
        <div className="admin-module-meta">Version: <span className="admin-module-meta-value">{module.version}</span></div>
        <div className="admin-module-meta">Status: <span className="admin-module-meta-value">{module.is_archived ? 'Archived' : 'Active'}</span></div>
        <div className="admin-module-meta">Group ID: <span className="admin-module-meta-mono">{module.group_id}</span></div>
        <div className="admin-module-meta">Learning Objectives: <span>{module.learning_objectives || '—'}</span></div>
        <div className="admin-module-meta">Estimated Duration: <span>{module.estimated_duration || '—'}</span></div>
        <div className="admin-module-meta">Delivery Format: <span>{module.delivery_format || '—'}</span></div>
        <div className="admin-module-meta">Target Audience: <span>{module.target_audience || '—'}</span></div>
        <div className="admin-module-meta">Prerequisites: <span>{(module.prerequisites && module.prerequisites.length > 0) ? module.prerequisites.join(', ') : '—'}</span></div>
        <div className="admin-module-meta">Tags: <span>{(module.tags && module.tags.length > 0) ? module.tags.join(', ') : '—'}</span></div>
        <div className="admin-module-meta">Created At: <span>{module.created_at ? new Date(module.created_at).toLocaleString() : '—'}</span></div>
        <div className="admin-module-meta">Updated At: <span>{module.updated_at ? new Date(module.updated_at).toLocaleString() : '—'}</span></div>
        <button onClick={() => router.push(`/admin/modules/edit/${module.id}`)} className="neon-btn neon-btn-edit" data-variant="edit">Edit Module</button>
        <button onClick={() => router.push('/admin/modules')} className="neon-btn neon-btn-cancel ml-4" data-variant="cancel">Cancel</button>
        <button onClick={() => router.push(`/admin/modules/archive/${module.id}`)} className="neon-btn neon-btn-archive ml-4" data-variant="archive">Archive</button>
      </NeonPanel>
    </div>
  )
}
