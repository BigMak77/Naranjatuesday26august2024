'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BehaviourIcon from '@/components/BehaviourIcon'
import type { ReactElement } from 'react'

interface Module {
  id: string
  name: string
}

interface Document {
  id: string
  title: string
  document_type: string
}

interface Behaviour {
  id: string
  name: string
  icon: string
}

export default function EditRoleProfilePage(): ReactElement {
  const { id } = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [allModules, setAllModules] = useState<Module[]>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [allBehaviours, setAllBehaviours] = useState<Behaviour[]>([])
  const [selectedBehaviourIds, setSelectedBehaviourIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: profile }, { data: modules }, { data: documents }, { data: behaviours }] = await Promise.all([
        supabase
          .from('role_profiles')
          .select(`
            id,
            name,
            description,
            role_profile_modules ( module_id ),
            role_profile_documents ( document_id ),
            role_profile_behaviours ( behaviour_id )
          `)
          .eq('id', id)
          .single(),
        supabase.from('modules').select('id, name'),
        supabase.from('documents').select('id, title, document_type'),
        supabase.from('behaviours').select('id, name, icon')
      ])

      if (profile) {
        setName(profile.name)
        setDescription(profile.description || '')
        setSelectedModuleIds(profile.role_profile_modules?.map((rm: any) => rm.module_id) || [])
        setSelectedDocumentIds(profile.role_profile_documents?.map((rd: any) => rd.document_id) || [])
        setSelectedBehaviourIds(profile.role_profile_behaviours?.map((rb: any) => rb.behaviour_id) || [])
      }
      setAllModules(modules || [])
      setAllDocuments(documents || [])
      setAllBehaviours(behaviours || [])
      setLoading(false)
    }

    if (id) fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await supabase.from('role_profiles').update({ name, description }).eq('id', id)

    await supabase.from('role_profile_modules').delete().eq('role_profile_id', id)
    await Promise.all(
      selectedModuleIds.map((module_id) =>
        supabase.from('role_profile_modules').insert({ role_profile_id: id, module_id })
      )
    )

    await supabase.from('role_profile_documents').delete().eq('role_profile_id', id)
    await Promise.all(
      selectedDocumentIds.map((document_id) =>
        supabase.from('role_profile_documents').insert({ role_profile_id: id, document_id })
      )
    )

    await supabase.from('role_profile_behaviours').delete().eq('role_profile_id', id)
    await Promise.all(
      selectedBehaviourIds.map((behaviour_id) =>
        supabase.from('role_profile_behaviours').insert({ role_profile_id: id, behaviour_id })
      )
    )

    router.push(`/admin/role-profiles/${id}`)
  }

  const toggleSelected = (id: string, selectedIds: string[], setSelected: (ids: string[]) => void) => {
    if (selectedIds.includes(id)) {
      setSelected(selectedIds.filter((i) => i !== id))
    } else {
      setSelected([...selectedIds, id])
    }
  }

  if (loading) return <p className="p-6">Loading...</p>

  const groupedDocuments = allDocuments.reduce<Record<string, Document[]>>((acc, doc) => {
    if (!acc[doc.document_type]) acc[doc.document_type] = []
    acc[doc.document_type].push(doc)
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-white text-teal-900 flex flex-col">
      <div className="max-w-5xl mx-auto py-10 px-6 flex-grow">
        <h1 className="text-2xl font-bold text-orange-600 mb-6">✏️ Edit Role Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              className="w-full border border-teal-300 rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              className="w-full border border-teal-300 rounded p-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <h2 className="font-semibold text-orange-600 mb-2">📦 Modules</h2>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-teal-300 rounded p-3 bg-teal-50">
              {allModules.map((mod) => (
                <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedModuleIds.includes(mod.id)}
                    onChange={() => toggleSelected(mod.id, selectedModuleIds, setSelectedModuleIds)}
                  />
                  {mod.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-orange-600 mb-2">📚 Documents</h2>
            {Object.entries(groupedDocuments).map(([type, docs]) => (
              <div key={type} className="mb-4">
                <h3 className="text-teal-700 font-medium mb-1">{type.replace('_', ' ').toUpperCase()}</h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-teal-300 rounded p-3 bg-teal-50">
                  {docs.map((doc) => (
                    <label key={doc.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDocumentIds.includes(doc.id)}
                        onChange={() => toggleSelected(doc.id, selectedDocumentIds, setSelectedDocumentIds)}
                      />
                      {doc.title}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-semibold text-orange-600 mb-2">🎯 Behaviours</h2>
            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto border border-teal-300 rounded p-3 bg-teal-50">
              {allBehaviours.map((b) => (
                <BehaviourIcon
                  key={b.id}
                  behaviour={b}
                  selected={selectedBehaviourIds.includes(b.id)}
                  onClick={() => toggleSelected(b.id, selectedBehaviourIds, setSelectedBehaviourIds)}
                  className="cursor-pointer"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  )
}
