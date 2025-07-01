'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface Item {
  id: string
  title: string
}

interface Behaviour {
  id: string
  name: string
  icon: string
}

export default function EditRoleProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const profileId = Array.isArray(id) ? id[0] : id

  const [title, setTitle] = useState('')
  const [modules, setModules] = useState<Item[]>([])
  const [documents, setDocuments] = useState<Item[]>([])
  const [behaviours, setBehaviours] = useState<Behaviour[]>([])

  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([])
  const [selectedWIs, setSelectedWIs] = useState<string[]>([])
  const [selectedSSOWs, setSelectedSSOWs] = useState<string[]>([])
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])

  const [search, setSearch] = useState({
    modules: '',
    policies: '',
    wis: '',
    ssows: '',
    behaviours: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [
        { data: profile },
        { data: allModules },
        { data: allDocs },
        { data: allBehaviours },
        { data: modLinks },
        { data: docLinks },
        { data: behaviourLinks }
      ] = await Promise.all([
        supabase.from('role_profiles').select('id, name').eq('id', profileId).single(),
        supabase.from('modules').select('id, name'),
        supabase.from('documents').select('id, title, document_type'),
        supabase.from('behaviours').select('id, name, icon'),
        supabase.from('role_profile_modules').select('module_id').eq('role_profile_id', profileId),
        supabase.from('role_profile_documents').select('document_id, documents(document_type)').eq('role_profile_id', profileId),
        supabase.from('role_profile_behaviours').select('behaviour_id').eq('role_profile_id', profileId),
      ])

      if (!profile) return setError('Profile not found')

      setTitle(profile.name || '')
      setModules(allModules || [])
      setDocuments(allDocs || [])
      setBehaviours(allBehaviours || [])

      setSelectedModules(modLinks?.map(m => m.module_id) || [])
      setSelectedBehaviours(behaviourLinks?.map(b => b.behaviour_id) || [])

      setSelectedPolicies(
        docLinks?.filter(d => d.documents?.document_type === 'policy').map(d => d.document_id) || []
      )
      setSelectedWIs(
        docLinks?.filter(d => d.documents?.document_type === 'work_instruction').map(d => d.document_id) || []
      )
      setSelectedSSOWs(
        docLinks?.filter(d => d.documents?.document_type === 'ssow').map(d => d.document_id) || []
      )

      setLoading(false)
    }

    if (profileId) fetchAll()
  }, [profileId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error: updateError } = await supabase
      .from('role_profiles')
      .update({ name: title })
      .eq('id', profileId)

    if (updateError) {
      setError('Failed to update profile name')
      return
    }

    const removeAndInsert = async (table: string, idField: string, values: string[]) => {
      await supabase.from(table).delete().eq('role_profile_id', profileId)
      if (values.length > 0) {
        const inserts = values.map(id => ({ role_profile_id: profileId, [idField]: id }))
        await supabase.from(table).insert(inserts)
      }
    }

    await Promise.all([
      removeAndInsert('role_profile_modules', 'module_id', selectedModules),
      removeAndInsert('role_profile_documents', 'document_id', [
        ...selectedPolicies,
        ...selectedWIs,
        ...selectedSSOWs,
      ]),
      removeAndInsert('role_profile_behaviours', 'behaviour_id', selectedBehaviours),
    ])

    router.push('/admin/role-profiles')
  }

  const CheckboxGroup = ({
    label,
    items,
    selected,
    setSelected,
    searchKey,
  }: {
    label: string
    items: Item[]
    selected: string[]
    setSelected: (val: string[]) => void
    searchKey: keyof typeof search
  }) => {
    const filtered = items.filter((i) =>
      i.title.toLowerCase().includes(search[searchKey].toLowerCase())
    )

    return (
      <div className="bg-white border border-teal-200 rounded-lg p-4">
        <h3
          onClick={() =>
            setSearch((prev) => ({ ...prev, [searchKey]: prev[searchKey] ? '' : '' }))
          }
          className="text-lg font-semibold text-teal-800 mb-2 cursor-pointer"
        >
          ➕ {label}
        </h3>
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}`}
          value={search[searchKey]}
          onChange={(e) =>
            setSearch((prev) => ({ ...prev, [searchKey]: e.target.value }))
          }
          className="w-full border border-teal-300 p-2 rounded-md mb-3 text-sm"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() =>
                  setSelected(
                    selected.includes(item.id)
                      ? selected.filter((id) => id !== item.id)
                      : [...selected, item.id]
                  )
                }
              />
              <span>{item.title}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  const filteredDocs = (type: string) =>
    documents.filter((d) => d.document_type === type)

  if (loading) return <p className="p-6">Loading...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  return (
    <>
      <LogoHeader />
      <main className="min-h-screen bg-teal-50 text-teal-900 px-6 py-10">
        <div className="max-w-4xl mx-auto bg-white border border-teal-300 p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold text-orange-600 mb-6">✏️ Edit Role Profile</h1>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
              />
            </div>

            <CheckboxGroup
              label="Modules"
              items={modules}
              selected={selectedModules}
              setSelected={setSelectedModules}
              searchKey="modules"
            />
            <CheckboxGroup
              label="Policies"
              items={filteredDocs('policy')}
              selected={selectedPolicies}
              setSelected={setSelectedPolicies}
              searchKey="policies"
            />
            <CheckboxGroup
              label="Work Instructions"
              items={filteredDocs('work_instruction')}
              selected={selectedWIs}
              setSelected={setSelectedWIs}
              searchKey="wis"
            />
            <CheckboxGroup
              label="Safe Systems of Work"
              items={filteredDocs('ssow')}
              selected={selectedSSOWs}
              setSelected={setSelectedSSOWs}
              searchKey="ssows"
            />
            <CheckboxGroup
              label="Behaviours"
              items={behaviours.map(({ id, name }) => ({ id, title: name }))}
              selected={selectedBehaviours}
              setSelected={setSelectedBehaviours}
              searchKey="behaviours"
            />

            <button
              type="submit"
              className="bg-teal-700 text-white font-semibold py-3 px-6 rounded-md hover:bg-teal-800 transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
