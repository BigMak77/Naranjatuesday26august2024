'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

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

export default function AddRoleProfilePage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [modules, setModules] = useState<Module[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [behaviours, setBehaviours] = useState<Behaviour[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([])
  const [selectedWIs, setSelectedWIs] = useState<string[]>([])
  const [selectedSSoWs, setSelectedSSoWs] = useState<string[]>([])
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])

  const [search, setSearch] = useState({
    modules: '',
    policies: '',
    wis: '',
    ssows: '',
    behaviours: ''
  })

  const [expanded, setExpanded] = useState({
    modules: false,
    policies: false,
    wis: false,
    ssows: false,
    behaviours: false
  })

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: moduleData }, { data: docData }, { data: behData }] = await Promise.all([
        supabase.from('modules').select('id, name'),
        supabase.from('documents').select('id, title, document_type'),
        supabase.from('behaviours').select('id, name, icon')
      ])

      setModules(moduleData || [])
      setDocuments(docData || [])
      setBehaviours(behData || [])
      setLoading(false)
    }

    fetchAll()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!name.trim()) {
      setError('Please provide a profile name.')
      setSubmitting(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('role_profiles')
      .insert({ name, description })
      .select()
      .single()

    if (profileError || !profile) {
      setError('Failed to create role profile')
      setSubmitting(false)
      return
    }

    const role_profile_id = profile.id

    const insertMany = async (table: string, field: string, values: string[]) => {
      if (values.length === 0) return
      const rows = values.map(id => ({ role_profile_id, [field]: id }))
      await supabase.from(table).insert(rows)
    }

    const allDocuments = [...selectedPolicies, ...selectedWIs, ...selectedSSoWs]
    const uniqueDocuments = [...new Set(allDocuments)]

    await Promise.all([
      insertMany('role_profile_modules', 'module_id', selectedModules),
      insertMany('role_profile_documents', 'document_id', uniqueDocuments),
      insertMany('role_profile_behaviours', 'behaviour_id', selectedBehaviours)
    ])

    router.replace('/admin/role-profiles')
  }

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const Section = ({
    label,
    items,
    selected,
    onSelect,
    type,
    searchKey
  }: {
    label: string
    items: { id: string; title: string }[]
    selected: string[]
    onSelect: (v: string[]) => void
    type: keyof typeof expanded
    searchKey: keyof typeof search
  }) => {
    const filtered = items.filter(item =>
      item.title.toLowerCase().includes(search[searchKey].toLowerCase())
    )

    return (
      <div className="border rounded-md p-4 bg-white">
        <button
          type="button"
          onClick={() => toggleSection(type)}
          className="text-left w-full text-lg font-semibold text-teal-800"
        >
          {expanded[type] ? '🔽' : '➕'} Add {label}
        </button>
        {expanded[type] && (
          <>
            <input
              type="text"
              value={search[searchKey]}
              onChange={(e) => setSearch({ ...search, [searchKey]: e.target.value })}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full border border-teal-300 p-2 rounded-md my-3 text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((item) => (
                <label key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() =>
                      selected.includes(item.id)
                        ? onSelect(selected.filter(id => id !== item.id))
                        : onSelect([...selected, item.id])
                    }
                  />
                  <span>{item.title}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-teal-50 text-teal-900 px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white border border-teal-200 shadow-md rounded-xl p-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-6">📋 Create Role Profile</h1>

          {error && <p className="text-red-600 mb-4">{error}</p>}
          {loading ? (
            <p className="text-gray-600 text-sm">Loading data...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Profile Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Profile Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-teal-300 p-3 rounded-md bg-white text-teal-900"
                  placeholder="Optional description of this role profile"
                />
              </div>

              <Section
                label="Modules"
                items={modules.map(m => ({ id: m.id, title: m.name }))}
                selected={selectedModules}
                onSelect={setSelectedModules}
                type="modules"
                searchKey="modules"
              />

              <Section
                label="Policies"
                items={documents.filter(d => d.document_type === 'policy')}
                selected={selectedPolicies}
                onSelect={setSelectedPolicies}
                type="policies"
                searchKey="policies"
              />

              <Section
                label="Work Instructions"
                items={documents.filter(d => d.document_type === 'work_instruction')}
                selected={selectedWIs}
                onSelect={setSelectedWIs}
                type="wis"
                searchKey="wis"
              />

              <Section
                label="Safe Systems of Work"
                items={documents.filter(d => d.document_type === 'ssow')}
                selected={selectedSSoWs}
                onSelect={setSelectedSSoWs}
                type="ssows"
                searchKey="ssows"
              />

              <div className="border rounded-md p-4 bg-white">
                <button
                  type="button"
                  onClick={() => toggleSection('behaviours')}
                  className="text-left w-full text-lg font-semibold text-teal-800"
                >
                  {expanded.behaviours ? '🔽' : '➕'} Add Key Behaviours
                </button>

                {expanded.behaviours && (
                  <>
                    <input
                      type="text"
                      value={search.behaviours}
                      onChange={(e) => setSearch({ ...search, behaviours: e.target.value })}
                      placeholder="Search behaviours..."
                      className="w-full border border-teal-300 p-2 rounded-md my-3 text-sm"
                    />
                    <div className="flex flex-wrap gap-3">
                      {behaviours
                        .filter(b => b.name.toLowerCase().includes(search.behaviours.toLowerCase()))
                        .map((b) => {
                          const isSelected = selectedBehaviours.includes(b.id)
                          return (
                            <label
                              key={b.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded border ${
                                isSelected
                                  ? 'bg-orange-100 border-orange-500'
                                  : 'border-teal-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (!isSelected && selectedBehaviours.length >= 5) return
                                  setSelectedBehaviours(
                                    isSelected
                                      ? selectedBehaviours.filter(id => id !== b.id)
                                      : [...selectedBehaviours, b.id]
                                  )
                                }}
                              />
                              <span>{b.name}</span>
                            </label>
                          )
                        })}
                    </div>
                    {selectedBehaviours.length >= 5 && (
                      <p className="text-sm text-orange-500 mt-2">
                        Maximum of 5 behaviours can be selected.
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-700 text-white font-semibold py-3 px-6 rounded-md hover:bg-teal-800 transition"
              >
                {submitting ? 'Saving...' : 'Create Role Profile'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
