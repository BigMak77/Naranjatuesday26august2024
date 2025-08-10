'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import HeroHeader from '@/components/HeroHeader'
import * as FiIcons from 'react-icons/fi'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'

export default function RoleProfileDetailPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [behaviours, setBehaviours] = useState<any[]>([])

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

      setModules(modData || [])
      setDocuments(docData || [])
      setBehaviours(behData || [])
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
    <div className="role-profile-page px-6 py-10 max-w-5xl mx-auto">
      <HeroHeader
        title={profile?.name || 'Loading Role Profile...'}
        subtitle={profile?.description || ''}
      />

      {/* Modules Section */}
      <div className="section mt-10">
        <h2 className="text-neon text-xl font-semibold mb-3">Modules</h2>
        {modules.length === 0 ? (
          <p className="text-muted">No modules assigned.</p>
        ) : (
          <ul className="list-disc pl-6 text-white space-y-1 text-sm">
            {modules.map((m) => (
              <li key={m.module_id}>{m.modules?.name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Documents Section */}
      <div className="section mt-10">
        <h2 className="text-neon text-xl font-semibold mb-3">Documents</h2>
        {Object.entries(groupedDocs).length === 0 ? (
          <p className="text-muted">No documents assigned.</p>
        ) : (
          Object.entries(groupedDocs).map(([type, titles]) => (
            <div key={type} className="mb-4">
              <p className="text-orange-400 font-semibold capitalize mb-1">
                {type.replace(/_/g, ' ')}
              </p>
              <ul className="list-disc pl-6 text-white space-y-1 text-sm">
                {(titles as string[]).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Behaviours Section */}
      <div className="section mt-10">
        <h2 className="text-neon text-xl font-semibold mb-3">Behaviours</h2>
        {behaviours.length === 0 ? (
          <p className="text-muted">No behaviours assigned.</p>
        ) : (
          <TooltipProvider>
            <div className="flex flex-wrap gap-4 mt-2">
              {behaviours.map((b) => {
                const Icon =
                  FiIcons[b.behaviours?.icon as keyof typeof FiIcons] || FiIcons.FiHelpCircle

                return (
                  <Tooltip key={b.behaviour_id}>
                    <TooltipTrigger asChild>
                      <div
                        className="btn-neon btn-small px-3 py-2 text-center rounded cursor-pointer"
                        title={b.behaviours?.name}
                      >
                        <Icon className="text-2xl" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="neon-tooltip text-sm">
                        {b.behaviours?.description || 'No description'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
