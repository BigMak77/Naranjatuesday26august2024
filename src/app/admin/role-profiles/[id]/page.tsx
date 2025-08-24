'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'
import Modal from '@/components/modal' // <- import as Component (capitalized)

type Profile = { name: string; description?: string | null }
type ModuleRow = { module_id: string; modules?: { name?: string | null } | null }
type DocumentRow = { document_id: string; documents?: { name?: string | null; document_type?: string | null } | null }
type BehaviourRow = { behaviour_id: string; behaviours?: { name?: string | null; description?: string | null; icon?: string | null } | null }

// Document type for role profile documents
interface RoleProfileDocument {
  document_id: string;
  title?: string | null;
  document_type?: string | null;
}

export default function RoleProfileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const idParam = params?.id
  const profileId = Array.isArray(idParam) ? idParam[0] : idParam

  const [profile, setProfile] = useState<Profile | null>(null)
  const [modules, setModules] = useState<Array<{ module_id: string; name?: string | null }>>([])
  const [documents, setDocuments] = useState<RoleProfileDocument[]>([])
  const [behaviours, setBehaviours] = useState<Array<{ behaviour_id: string; name?: string | null; description?: string | null; icon?: string | null }>>([])
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchAll = async () => {
      if (!profileId) return

      // Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('role_profiles')
        .select('name, description')
        .eq('id', profileId)
        .single()

      if (!isMounted) return

      if (profileErr) {
        setError(profileErr.message)
        setProfile(null)
        return
      }

      setProfile(profileData as Profile)
      setError(null)

      // Modules
      const { data: moduleData } = await supabase
        .from('role_profile_modules')
        .select('module_id, modules(name)')
        .eq('role_profile_id', profileId)

      if (!isMounted) return
      setModules(
        (moduleData as ModuleRow[] | null)?.map((m) => ({
          module_id: m.module_id,
          name: m.modules?.name ?? m.module_id,
        })) ?? []
      )

      // Documents
      const { data: documentData } = await supabase
        .from('role_profile_documents')
        .select('document_id, documents(name, document_type)')
        .eq('role_profile_id', profileId)

      if (!isMounted) return
      setDocuments(
        (documentData as DocumentRow[] | null)?.map((d) => ({
          document_id: d.document_id,
          title: d.documents?.name ?? d.document_id,
          document_type: d.documents?.document_type ?? null,
        })) ?? []
      )

      // Behaviours
      const { data: behaviourData } = await supabase
        .from('role_profile_behaviours')
        .select('behaviour_id, behaviours(name, description, icon)')
        .eq('role_profile_id', profileId)

      if (!isMounted) return
      setBehaviours(
        (behaviourData as BehaviourRow[] | null)?.map((b) => ({
          behaviour_id: b.behaviour_id,
          name: b.behaviours?.name ?? b.behaviour_id,
          description: b.behaviours?.description ?? null,
          icon: b.behaviours?.icon ?? null,
        })) ?? []
      )
    }

    fetchAll()
    return () => {
      isMounted = false
    }
  }, [profileId])

  // Always render the Modal component; control visibility with `open`
  return (
    <Modal open={open} onClose={() => {
      setOpen(false)
      router.push('/admin/role-profiles')
    }}>
      <NeonPanel className="neon-panel-lg">
        {error && <div className="text-center py-10 text-red-500">Error: {error}</div>}

        {!profile ? (
          <div className="text-center py-10 text-white">Loading...</div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
            <p className="text-lg mb-4">{profile.description || 'No description provided.'}</p>

            <div className="mb-6">
              <h3 className="neon-form-title mb-2">Modules</h3>
              <ul className="neon-listbox">
                {modules.length === 0 ? (
                  <li className="neon-listbox-item">None</li>
                ) : (
                  modules.map((m) => (
                    <li key={m.module_id} className="neon-listbox-item">
                      {m.name || <span className="text-xs text-gray-400">{m.module_id}</span>}
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="neon-form-title mb-2">Documents</h3>
              <ul className="neon-listbox">
                {documents.length === 0 ? (
                  <li className="neon-listbox-item">None</li>
                ) : (
                  documents.map((d) => (
                    <li key={d.document_id} className="neon-listbox-item">
                      {d.title || <span className="text-xs text-gray-400">{d.document_id}</span>} ({d.document_type || '-'})
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="neon-form-title mb-2">Behaviours</h3>
              <ul className="neon-listbox">
                {behaviours.length === 0 ? (
                  <li className="neon-listbox-item">None</li>
                ) : (
                  behaviours.map((b) => (
                    <li key={b.behaviour_id} className="neon-listbox-item">
                      {b.icon && <span className="mr-2">{b.icon}</span>}
                      {b.name || <span className="text-xs text-gray-400">{b.behaviour_id}</span>}
                      {b.description && <span className="ml-2 text-xs text-gray-400">{b.description}</span>}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>
        )}
      </NeonPanel>
    </Modal>
  )
}
