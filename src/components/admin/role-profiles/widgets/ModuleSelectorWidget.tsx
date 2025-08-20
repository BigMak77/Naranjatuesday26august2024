// components/role-profiles/widgets/ModuleSelectorWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'
import { FiSearch } from 'react-icons/fi'

type Module = {
  id: string
  title: string
  description?: string
  version?: string
}

type Props = {
  selectedModules: string[]
  onChange: (ids: string[]) => void
}

export default function ModuleSelectorWidget({ selectedModules, onChange }: Props) {
  const [modules, setModules] = useState<Module[]>([])
  const [showModules, setShowModules] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase.from('modules').select('id, name, description, version')
      if (error) console.error('Error fetching modules:', error)
      else setModules(data.map((m: { id: string; name: string; description?: string; version?: string }) => ({ id: m.id, title: m.name, description: m.description, version: m.version })))
    }
    fetchModules()
  }, [])

  const filtered = modules.filter(mod =>
    mod.title.toLowerCase().includes(search.toLowerCase()) ||
    (mod.description && mod.description.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleSelection = (id: string) => {
    if (selectedModules.includes(id)) {
      onChange(selectedModules.filter(mid => mid !== id))
    } else {
      onChange([...selectedModules, id])
    }
  }

  return (
    <NeonPanel>
      <button
        type="button"
        className="neon-btn neon-section-toggle"
        data-tooltip={showModules ? 'Hide Modules' : 'Show Modules'}
        onClick={() => setShowModules(v => !v)}
        aria-label={showModules ? 'Hide Modules' : 'Show Modules'}
      >
        {showModules
          ? <svg className="neon-icon" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          : <svg className="neon-icon" viewBox="0 0 24 24"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
        }
      </button>
      {showModules && (
        <div className="neon-flex-col gap-4">
          <div className="neon-flex gap-2 mb-2">
            <FiSearch className="neon-icon" />
            <input
              type="text"
              placeholder="Search modules by name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="neon-input"
            />
          </div>
          <div className="neon-grid">
            {filtered.map(mod => (
              <label key={mod.id} className="neon-checkbox-label neon-feature-card">
                <input
                  type="checkbox"
                  checked={selectedModules.includes(mod.id)}
                  onChange={() => toggleSelection(mod.id)}
                  className="neon-checkbox"
                />
                <div>
                  <div className="font-bold neon-feature-card-title">{mod.title}</div>
                  {mod.description && <div className="neon-feature-card-text">{mod.description}</div>}
                  {mod.version && <div className="neon-feature-card-meta">Version: {mod.version}</div>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </NeonPanel>
  )
}
