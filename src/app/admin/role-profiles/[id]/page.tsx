'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import * as FiIcons from 'react-icons/fi'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'

type RoleProfile = {
  id: string
  name: string
  description?: string
  // Add other fields as needed
}

export default function RoleProfileDetailPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<RoleProfile | null>(null)
  type ModuleItem = {
    module_id: string
    modules?: {
      name?: string
    }
  }
  const [modules, setModules] = useState<ModuleItem[]>([])
  type DocumentItem = {
    document_id: string
    documents?: {
      title?: string
      document_type?: string
    }
  }
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  type BehaviourItem = {
    behaviour_id: string
    behaviours?: {
      name?: string
      description?: string
      icon?: string
    }
  }
  const [behaviours, setBehaviours] = useState<BehaviourItem[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const { data: profileData } = await supabase
        .from('role_profiles')
        .select()
        .eq('id', id)
        .single()
      setProfile(profileData)

      const { data: modData } = await supabase
        .from('role_profile_modules')
        .select('module_id, modules(name)')
        .eq('role_profile_id', id)

      const { data: docData } = await supabase
        .from('role_profile_documents')
        .select('document_id, documents(title, document_type)') // ✅ FIXED HERE
        .eq('role_profile_id', id)

      const { data: behData } = await supabase
        .from('role_profile_behaviours')
        .select('behaviour_id, behaviours(name, description, icon)')
        .eq('role_profile_id', id)

      setModules(Array.isArray(modData) ? modData.map(m => ({
        module_id: m.module_id,
        modules: Array.isArray(m.modules) ? m.modules[0] : m.modules
      })) : [])
      setDocuments(Array.isArray(docData) ? docData.map(d => ({
        document_id: d.document_id,
        documents: Array.isArray(d.documents) ? d.documents[0] : d.documents
      })) : [])
      setBehaviours(Array.isArray(behData) ? behData.map(b => ({
        behaviour_id: b.behaviour_id,
        behaviours: Array.isArray(b.behaviours) ? b.behaviours[0] : b.behaviours
      })) : [])
    }

    fetchAll()
  }, [id])

  const groupedDocs = documents.reduce((acc, d) => {
    const type = d.documents?.document_type || 'other'
    acc[type] = acc[type] || []
    acc[type].push(d.documents?.title || '[Untitled]') // ✅ FIXED HERE
    return acc
  }, {} as Record<string, string[]>)

  return (
    <div className="after-hero">
      <div className="page-content">
        <main className="page-main">
          <h1 className="page-title">
            {profile?.name || 'Loading Role Profile...'}
          </h1>
          <p className="info-message">
            {profile?.description || ''}
          </p>

          {/* Modules Section */}
          <section className="neon-panel mt-4">
            <h2 className="neon-form-title">Modules</h2>
            {modules.length === 0 ? (
              <p className="info-message">No modules assigned.</p>
            ) : (
              <ul className="task-list">
                {modules.map((m) => (
                  <li key={m.module_id} className="task-list-item">{m.modules?.name}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Documents Section */}
          <section className="neon-panel mt-4">
            <h2 className="neon-form-title">Documents</h2>
            {Object.entries(groupedDocs).length === 0 ? (
              <p className="info-message">No documents assigned.</p>
            ) : (
              Object.entries(groupedDocs).map(([type, titles]) => (
                <div key={type} className="mb-4">
                  <p className="neon-form-title" style={{fontSize: '1.1rem', color: 'var(--accent)'}}>
                    {type.replace(/_/g, ' ')}
                  </p>
                  <ul className="task-list">
                    {(titles as string[]).map((t, i) => (
                      <li key={i} className="task-list-item">{t}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          {/* Behaviours Section */}
          <section className="neon-panel mt-4">
            <h2 className="neon-form-title">Behaviours</h2>
            {behaviours.length === 0 ? (
              <p className="info-message">No behaviours assigned.</p>
            ) : (
              <TooltipProvider>
                <div className="neon-panel-actions" style={{flexWrap: 'wrap', gap: '1rem', marginTop: '1rem'}}>
                  {behaviours.map((b) => {
                    const Icon =
                      FiIcons[b.behaviours?.icon as keyof typeof FiIcons] || FiIcons.FiHelpCircle

                    return (
                      <Tooltip key={b.behaviour_id}>
                        <TooltipTrigger asChild>
                          <div
                            className="neon-btn neon-btn-secondary"
                            title={b.behaviours?.name}
                            style={{padding: '0.5rem 1rem', minWidth: 'unset'}}
                          >
                            <Icon style={{fontSize: '1.5rem'}} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="neon-tooltip info-message" style={{margin: 0}}>
                            {b.behaviours?.description || 'No description'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </TooltipProvider>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
