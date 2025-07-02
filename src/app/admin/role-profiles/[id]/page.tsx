'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BehaviourIcon from '@/components/BehaviourIcon'
import { FiFileText, FiTool, FiAlertTriangle } from 'react-icons/fi'
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

export default function RoleProfileDetailPage(): ReactElement {
  const { id } = useParams()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [modules, setModules] = useState<Module[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [behaviours, setBehaviours] = useState<Behaviour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('role_profiles')
        .select(`
          id,
          name,
          description,
          role_profile_modules ( modules ( id, name ) ),
          role_profile_documents ( documents ( id, title, document_type ) ),
          role_profile_behaviours ( behaviours ( id, name, icon ) )
        `)
        .eq('id', id)
        .single()

      if (data) {
        setName(data.name)
        setDescription(data.description || '')
        setModules((data.role_profile_modules || []).map((rm: any) => rm.modules).filter(Boolean))
        setDocuments((data.role_profile_documents || []).map((rd: any) => rd.documents).filter(Boolean))
        setBehaviours((data.role_profile_behaviours || []).map((rb: any) => rb.behaviours).filter(Boolean))
      }
      setLoading(false)
    }

    if (id) fetchProfile()
  }, [id])

  if (loading) return <p className="p-6">Loading profile...</p>

  const groupedDocuments = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    if (!acc[doc.document_type]) acc[doc.document_type] = []
    acc[doc.document_type].push(doc)
    return acc
  }, {})

  const documentIcons: Record<string, ReactElement> = {
    policy: <FiFileText className="inline-block text-lg text-teal-700 mr-1" />,
    work_instruction: <FiTool className="inline-block text-lg text-teal-700 mr-1" />,
    ssow: <FiAlertTriangle className="inline-block text-lg text-teal-700 mr-1" />
  }

  return (
    <main className="min-h-screen bg-white text-teal-900">
      <div className="max-w-7xl mx-auto py-10 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">{name}</h1>
          <p className="text-gray-700 text-sm">{description || 'No description provided.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-2">📦 Modules</h2>
            {modules.length === 0 ? (
              <p className="text-sm text-gray-500">No modules assigned</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {modules.map((mod) => (
                  <li key={mod.id}>{mod.name}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-2">📚 Documents</h2>
            {Object.entries(groupedDocuments).length === 0 ? (
              <p className="text-sm text-gray-500">No documents assigned</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedDocuments).map(([type, docs]) => (
                  <div key={type}>
                    <h3 className="font-semibold text-teal-700 mb-1 flex items-center gap-1">
                      {documentIcons[type]} {type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <ul className="list-disc list-inside ml-2">
                      {docs.map((doc) => (
                        <li key={doc.id}>{doc.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-2">🎯 Behaviours</h2>
            {behaviours.length === 0 ? (
              <p className="text-sm text-gray-500">No behaviours assigned</p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {behaviours.map((b) => (
                  <li key={b.id}>
                    <BehaviourIcon behaviour={b} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
